// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGet, mockPost, mockPut, mockDel } = vi.hoisted(() => ({
	mockGet: vi.fn(),
	mockPost: vi.fn(),
	mockPut: vi.fn(),
	mockDel: vi.fn(),
}));

vi.mock("@src/api/client", () => ({
	get: mockGet,
	post: mockPost,
	put: mockPut,
	del: mockDel,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { useSchedules } from "./useSchedules";
import type { Schedule } from "../engine/types";

const schedule: Schedule = {
	id: "s1",
	sourceId: "party-1",
	destinationId: "acc-1",
	amount: 500,
	estimated: false,
	frequency: "monthly",
	startDate: "2024-01-01",
	terminateAtZero: false,
};

beforeEach(() => {
	vi.clearAllMocks();
	mockGet.mockResolvedValue([]);
	mockPost.mockResolvedValue({});
	mockPut.mockResolvedValue({});
	mockDel.mockResolvedValue({});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("useSchedules — refresh", () => {
	it("loads schedules on mount", async () => {
		mockGet.mockResolvedValue([schedule]);
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		expect(result.current.schedules).toEqual([schedule]);
		expect(result.current.error).toBeNull();
	});

	it("sets error when refresh fails with an Error", async () => {
		const err = new Error("Network");
		mockGet.mockRejectedValue(err);
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		expect(result.current.error).toBe(err);
	});

	it("wraps non-Error thrown during refresh", async () => {
		mockGet.mockRejectedValue("boom");
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("boom");
	});
});

describe("useSchedules — addSchedule", () => {
	it("posts and refreshes on success", async () => {
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		await act(async () => {
			await result.current.addSchedule(schedule);
		});
		expect(mockPost).toHaveBeenCalledWith("/api/schedules", schedule);
	});

	it("sets error and does not refresh when post fails with an Error", async () => {
		const err = new Error("Post failed");
		mockPost.mockRejectedValue(err);
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.addSchedule(schedule);
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during addSchedule", async () => {
		mockPost.mockRejectedValue("oops");
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		await act(async () => {
			await result.current.addSchedule(schedule);
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});

describe("useSchedules — updateSchedule", () => {
	it("puts and refreshes on success", async () => {
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		await act(async () => {
			await result.current.updateSchedule(schedule);
		});
		expect(mockPut).toHaveBeenCalledWith(`/api/schedules/${schedule.id}`, schedule);
	});

	it("sets error and does not refresh when put fails with an Error", async () => {
		const err = new Error("Put failed");
		mockPut.mockRejectedValue(err);
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.updateSchedule(schedule);
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during updateSchedule", async () => {
		mockPut.mockRejectedValue(null);
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		await act(async () => {
			await result.current.updateSchedule(schedule);
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});

describe("useSchedules — deleteSchedule", () => {
	it("deletes and refreshes on success", async () => {
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteSchedule("s1");
		});
		expect(mockDel).toHaveBeenCalledWith("/api/schedules/s1");
	});

	it("sets error and does not refresh when delete fails with an Error", async () => {
		const err = new Error("Delete failed");
		mockDel.mockRejectedValue(err);
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.deleteSchedule("s1");
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during deleteSchedule", async () => {
		mockDel.mockRejectedValue(undefined);
		const { result } = renderHook(() => useSchedules());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteSchedule("s1");
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});
