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

import { useExternalParties } from "./useExternalParties";
import type { ExternalParty } from "../engine/types";

const party: ExternalParty = { id: "party-1", name: "Employer" };

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

describe("useExternalParties — refresh", () => {
	it("loads external parties on mount", async () => {
		mockGet.mockResolvedValue([party]);
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		expect(result.current.externalParties).toEqual([party]);
		expect(result.current.error).toBeNull();
	});

	it("sets error when refresh fails with an Error", async () => {
		const err = new Error("Network");
		mockGet.mockRejectedValue(err);
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		expect(result.current.error).toBe(err);
	});

	it("wraps non-Error thrown during refresh", async () => {
		mockGet.mockRejectedValue("fail");
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("fail");
	});
});

describe("useExternalParties — addParty", () => {
	it("posts and refreshes on success", async () => {
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		await act(async () => {
			await result.current.addParty(party);
		});
		expect(mockPost).toHaveBeenCalledWith("/api/external-parties", party);
	});

	it("sets error and does not refresh when post fails with an Error", async () => {
		const err = new Error("Post failed");
		mockPost.mockRejectedValue(err);
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.addParty(party);
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during addParty", async () => {
		mockPost.mockRejectedValue("oops");
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		await act(async () => {
			await result.current.addParty(party);
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});

describe("useExternalParties — updateParty", () => {
	it("puts and refreshes on success", async () => {
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		await act(async () => {
			await result.current.updateParty(party);
		});
		expect(mockPut).toHaveBeenCalledWith(`/api/external-parties/${party.id}`, party);
	});

	it("sets error and does not refresh when put fails with an Error", async () => {
		const err = new Error("Put failed");
		mockPut.mockRejectedValue(err);
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.updateParty(party);
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during updateParty", async () => {
		mockPut.mockRejectedValue(null);
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		await act(async () => {
			await result.current.updateParty(party);
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});

describe("useExternalParties — deleteParty", () => {
	it("deletes and refreshes on success", async () => {
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteParty("party-1");
		});
		expect(mockDel).toHaveBeenCalledWith("/api/external-parties/party-1");
	});

	it("sets error and does not refresh when delete fails with an Error", async () => {
		const err = new Error("Delete failed");
		mockDel.mockRejectedValue(err);
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.deleteParty("party-1");
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during deleteParty", async () => {
		mockDel.mockRejectedValue(undefined);
		const { result } = renderHook(() => useExternalParties());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteParty("party-1");
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});
