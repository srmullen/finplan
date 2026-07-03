// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGet, mockPost } = vi.hoisted(() => ({
	mockGet: vi.fn(),
	mockPost: vi.fn(),
}));

vi.mock("@src/api/client", () => ({
	get: mockGet,
	post: mockPost,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { toast } from "sonner";
import type { Schedule, ScheduleGroup } from "../engine/types";
import { useScheduleGroups } from "./useScheduleGroups";

const scheduleGroup: ScheduleGroup = {
	id: "g1",
	name: "Mortgage",
};

const memberSchedules: Schedule[] = [
	{
		id: "s1",
		sourceId: "acc-1",
		destinationId: "loan-1",
		amount: 1500,
		estimated: false,
		frequency: "monthly",
		startDate: "2024-01-01",
		terminateAtZero: false,
		groupId: "g1",
	},
	{
		id: "s2",
		sourceId: "acc-1",
		destinationId: "party-1",
		amount: 500,
		estimated: false,
		frequency: "monthly",
		startDate: "2024-01-01",
		terminateAtZero: false,
		groupId: "g1",
	},
];

beforeEach(() => {
	vi.clearAllMocks();
	mockGet.mockResolvedValue([]);
	mockPost.mockResolvedValue(undefined);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("useScheduleGroups — refresh", () => {
	it("loads schedule groups on mount", async () => {
		mockGet.mockResolvedValue([scheduleGroup]);
		const { result } = renderHook(() => useScheduleGroups());
		await act(async () => {});
		expect(result.current.scheduleGroups).toEqual([scheduleGroup]);
		expect(result.current.error).toBeNull();
	});

	it("sets error when refresh fails with an Error", async () => {
		const err = new Error("Network");
		mockGet.mockRejectedValue(err);
		const { result } = renderHook(() => useScheduleGroups());
		await act(async () => {});
		expect(result.current.error).toBe(err);
	});

	it("wraps non-Error thrown during refresh", async () => {
		mockGet.mockRejectedValue("boom");
		const { result } = renderHook(() => useScheduleGroups());
		await act(async () => {});
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("boom");
	});
});

describe("useScheduleGroups — addGroup", () => {
	it("posts the group and refreshes the list on success", async () => {
		mockGet.mockResolvedValueOnce([]).mockResolvedValueOnce([scheduleGroup]);
		const { result } = renderHook(() => useScheduleGroups());
		await act(async () => {});
		await act(async () => {
			await result.current.addGroup({
				group: scheduleGroup,
				schedules: memberSchedules,
			});
		});
		expect(mockPost).toHaveBeenCalledWith("/api/schedule-groups", {
			group: scheduleGroup,
			schedules: memberSchedules,
		});
		expect(result.current.scheduleGroups).toEqual([scheduleGroup]);
	});

	it("sets error and shows a toast when the request fails, without refreshing", async () => {
		const err = new Error("400: mismatched source accounts");
		mockPost.mockRejectedValue(err);
		const { result } = renderHook(() => useScheduleGroups());
		await act(async () => {});
		mockGet.mockClear();
		await act(async () => {
			await result.current.addGroup({
				group: scheduleGroup,
				schedules: memberSchedules,
			});
		});
		expect(result.current.error).toBe(err);
		expect(toast.error).toHaveBeenCalledWith(
			`Failed to add payment group: ${err.message}`,
		);
		expect(mockGet).not.toHaveBeenCalled();
	});

	it("wraps non-Error thrown during addGroup", async () => {
		mockPost.mockRejectedValue("boom");
		const { result } = renderHook(() => useScheduleGroups());
		await act(async () => {});
		await act(async () => {
			await result.current.addGroup({
				group: scheduleGroup,
				schedules: memberSchedules,
			});
		});
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("boom");
	});
});
