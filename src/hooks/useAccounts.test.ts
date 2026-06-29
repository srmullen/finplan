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

import { useAccounts } from "./useAccounts";
import type { Account } from "../engine/types";

const account: Account = {
	id: "acc-1",
	name: "Checking",
	type: "checking",
	owner: "Sean",
	seedBalance: 1000,
	seedDate: "2024-01-01",
	rate: 0,
	amortizing: false,
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

describe("useAccounts — refresh", () => {
	it("loads accounts on mount", async () => {
		mockGet.mockResolvedValue([account]);
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		expect(result.current.accounts).toEqual([account]);
		expect(result.current.error).toBeNull();
	});

	it("sets error when refresh fails with an Error", async () => {
		const err = new Error("Network error");
		mockGet.mockRejectedValue(err);
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		expect(result.current.error).toBe(err);
	});

	it("wraps non-Error thrown during refresh", async () => {
		mockGet.mockRejectedValue("string error");
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("string error");
	});
});

describe("useAccounts — addAccount", () => {
	it("posts and refreshes on success", async () => {
		mockGet.mockResolvedValue([account]);
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		await act(async () => {
			await result.current.addAccount(account);
		});
		expect(mockPost).toHaveBeenCalledWith("/api/accounts", account);
		expect(mockGet).toHaveBeenCalledTimes(2);
	});

	it("sets error and does not refresh when post fails with an Error", async () => {
		const err = new Error("Post failed");
		mockPost.mockRejectedValue(err);
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.addAccount(account);
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during addAccount", async () => {
		mockPost.mockRejectedValue("oops");
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		await act(async () => {
			await result.current.addAccount(account);
		});
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("oops");
	});
});

describe("useAccounts — updateAccount", () => {
	it("puts and refreshes on success", async () => {
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		await act(async () => {
			await result.current.updateAccount(account);
		});
		expect(mockPut).toHaveBeenCalledWith(`/api/accounts/${account.id}`, account);
	});

	it("sets error and does not refresh when put fails with an Error", async () => {
		const err = new Error("Put failed");
		mockPut.mockRejectedValue(err);
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.updateAccount(account);
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during updateAccount", async () => {
		mockPut.mockRejectedValue(42);
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		await act(async () => {
			await result.current.updateAccount(account);
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});

describe("useAccounts — deleteAccount", () => {
	it("deletes and refreshes on success", async () => {
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteAccount("acc-1");
		});
		expect(mockDel).toHaveBeenCalledWith("/api/accounts/acc-1");
	});

	it("sets error and does not refresh when delete fails with an Error", async () => {
		const err = new Error("Delete failed");
		mockDel.mockRejectedValue(err);
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		const callsBefore = mockGet.mock.calls.length;
		await act(async () => {
			await result.current.deleteAccount("acc-1");
		});
		expect(result.current.error).toBe(err);
		expect(mockGet.mock.calls.length).toBe(callsBefore);
	});

	it("wraps non-Error thrown during deleteAccount", async () => {
		mockDel.mockRejectedValue({ code: 500 });
		const { result } = renderHook(() => useAccounts());
		await act(async () => {});
		await act(async () => {
			await result.current.deleteAccount("acc-1");
		});
		expect(result.current.error).toBeInstanceOf(Error);
	});
});
