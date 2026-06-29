// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGet, mockPost, mockDel } = vi.hoisted(() => ({
	mockGet: vi.fn(),
	mockPost: vi.fn(),
	mockDel: vi.fn(),
}));

vi.mock("@src/api/client", () => ({
	get: mockGet,
	post: mockPost,
	del: mockDel,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import type { Adjustment } from "../engine/types";
import { useAdjustments } from "./useAdjustments";

const adjustment: Adjustment = {
	id: "adj-1",
	accountId: "acc-1",
	date: "2024-01-15",
	actualBalance: 2000,
};

beforeEach(() => {
	vi.clearAllMocks();
	mockGet.mockResolvedValue([]);
	mockPost.mockResolvedValue({});
	mockDel.mockResolvedValue({});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("useAdjustments — refresh", () => {
	it("loads adjustments on mount", async () => {
		mockGet.mockResolvedValue([adjustment]);
		const { result } = renderHook(() => useAdjustments());
		await act(async () => {});
		expect(result.current.adjustments).toEqual([adjustment]);
		expect(result.current.error).toBeNull();
	});

	it("sets error when refresh fails with an Error", async () => {
		const err = new Error("Network");
		mockGet.mockRejectedValue(err);
		const { result } = renderHook(() => useAdjustments());
		await act(async () => {});
		expect(result.current.error).toBe(err);
	});

	it("wraps non-Error thrown during refresh", async () => {
		mockGet.mockRejectedValue("fail");
		const { result } = renderHook(() => useAdjustments());
		await act(async () => {});
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("fail");
	});
});

describe("useAdjustments — addAdjustment", () => {
	it("posts and refreshes on success", async () => {
		const { result } = renderHook(() => useAdjustments());
		await act(async () => {});
		await act(async () => {
			await result.current.addAdjustment(adjustment);
		});
		expect(mockPost).toHaveBeenCalledWith("/api/adjustments", adjustment);
	});

	it("sets error and does not refresh when post fails with an Error", async () => {
		const err = new Error("Post failed");
		mockPost.mockRejectedValue(err);
		const { result } = renderHook(() => useAdjustments());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.addAdjustment(adjustment);
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during addAdjustment", async () => {
		mockPost.mockRejectedValue("oops");
		const { result } = renderHook(() => useAdjustments());
		await act(async () => {});
		await act(async () => {
			await result.current.addAdjustment(adjustment);
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});

describe("useAdjustments — deleteAdjustment", () => {
	it("deletes and refreshes on success", async () => {
		const { result } = renderHook(() => useAdjustments());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteAdjustment("adj-1");
		});
		expect(mockDel).toHaveBeenCalledWith("/api/adjustments/adj-1");
	});

	it("sets error and does not refresh when delete fails with an Error", async () => {
		const err = new Error("Delete failed");
		mockDel.mockRejectedValue(err);
		const { result } = renderHook(() => useAdjustments());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.deleteAdjustment("adj-1");
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during deleteAdjustment", async () => {
		mockDel.mockRejectedValue(0);
		const { result } = renderHook(() => useAdjustments());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteAdjustment("adj-1");
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});
