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

import { useScenarios } from "./useScenarios";
import type { Scenario } from "../engine/types";

const scenario: Scenario = {
	id: "sc-1",
	name: "Test Scenario",
	scheduleOverrides: [],
	additionalSchedules: [],
	additionalAccounts: [],
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

describe("useScenarios — refresh", () => {
	it("loads scenarios on mount", async () => {
		mockGet.mockResolvedValue([scenario]);
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		expect(result.current.scenarios).toEqual([scenario]);
		expect(result.current.error).toBeNull();
	});

	it("sets error when refresh fails with an Error", async () => {
		const err = new Error("Network");
		mockGet.mockRejectedValue(err);
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		expect(result.current.error).toBe(err);
	});

	it("wraps non-Error thrown during refresh", async () => {
		mockGet.mockRejectedValue("fail");
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("fail");
	});
});

describe("useScenarios — addScenario", () => {
	it("posts and refreshes on success", async () => {
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		await act(async () => {
			await result.current.addScenario(scenario);
		});
		expect(mockPost).toHaveBeenCalledWith("/api/scenarios", scenario);
	});

	it("sets error and does not refresh when post fails with an Error", async () => {
		const err = new Error("Post failed");
		mockPost.mockRejectedValue(err);
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.addScenario(scenario);
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during addScenario", async () => {
		mockPost.mockRejectedValue("oops");
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		await act(async () => {
			await result.current.addScenario(scenario);
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});

describe("useScenarios — updateScenario", () => {
	it("puts and refreshes on success", async () => {
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		await act(async () => {
			await result.current.updateScenario(scenario);
		});
		expect(mockPut).toHaveBeenCalledWith(`/api/scenarios/${scenario.id}`, scenario);
	});

	it("sets error and does not refresh when put fails with an Error", async () => {
		const err = new Error("Put failed");
		mockPut.mockRejectedValue(err);
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.updateScenario(scenario);
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during updateScenario", async () => {
		mockPut.mockRejectedValue(false);
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		await act(async () => {
			await result.current.updateScenario(scenario);
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});

describe("useScenarios — deleteScenario", () => {
	it("deletes and refreshes on success", async () => {
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteScenario("sc-1");
		});
		expect(mockDel).toHaveBeenCalledWith("/api/scenarios/sc-1");
	});

	it("sets error and does not refresh when delete fails with an Error", async () => {
		const err = new Error("Delete failed");
		mockDel.mockRejectedValue(err);
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.deleteScenario("sc-1");
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during deleteScenario", async () => {
		mockDel.mockRejectedValue(null);
		const { result } = renderHook(() => useScenarios());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteScenario("sc-1");
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});
