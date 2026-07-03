// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGet } = vi.hoisted(() => ({
	mockGet: vi.fn(),
}));

vi.mock("@src/api/client", () => ({
	get: mockGet,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import type { ScheduleGroup } from "../engine/types";
import { useScheduleGroups } from "./useScheduleGroups";

const scheduleGroup: ScheduleGroup = {
	id: "g1",
	name: "Mortgage",
};

beforeEach(() => {
	vi.clearAllMocks();
	mockGet.mockResolvedValue([]);
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
