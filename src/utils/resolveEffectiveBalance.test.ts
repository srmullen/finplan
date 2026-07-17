import { expect, it } from "vitest";
import type { Account, Adjustment } from "../engine/types";
import { resolveEffectiveBalance } from "./resolveEffectiveBalance";

const checking: Account = {
	id: "acc-checking",
	name: "Checking",
	type: "checking",
	owner: "Sean",
	seedBalance: 1000,
	seedDate: "2024-01-01",
	rate: 0,
	amortizing: false,
};

it("falls back to seedBalance/seedDate when no adjustments exist", () => {
	expect(resolveEffectiveBalance(checking, [], "2026-07-17")).toEqual({
		balance: 1000,
		date: "2024-01-01",
	});
});

it("uses a qualifying adjustment's balance and date", () => {
	const adjustments: Adjustment[] = [
		{ id: "a1", accountId: "acc-checking", date: "2026-01-01", actualBalance: 2500 },
	];
	expect(resolveEffectiveBalance(checking, adjustments, "2026-07-17")).toEqual(
		{ balance: 2500, date: "2026-01-01" },
	);
});

it("uses the most recent of multiple qualifying adjustments", () => {
	const adjustments: Adjustment[] = [
		{ id: "a1", accountId: "acc-checking", date: "2026-01-01", actualBalance: 2500 },
		{ id: "a2", accountId: "acc-checking", date: "2026-05-01", actualBalance: 3000 },
		{ id: "a3", accountId: "acc-checking", date: "2026-03-01", actualBalance: 2800 },
	];
	expect(resolveEffectiveBalance(checking, adjustments, "2026-07-17")).toEqual(
		{ balance: 3000, date: "2026-05-01" },
	);
});

it("ignores an adjustment dated after asOfDate", () => {
	const adjustments: Adjustment[] = [
		{ id: "a1", accountId: "acc-checking", date: "2026-12-01", actualBalance: 9999 },
	];
	expect(resolveEffectiveBalance(checking, adjustments, "2026-07-17")).toEqual(
		{ balance: 1000, date: "2024-01-01" },
	);
});

it("ignores adjustments belonging to a different account", () => {
	const adjustments: Adjustment[] = [
		{ id: "a1", accountId: "acc-other", date: "2026-01-01", actualBalance: 9999 },
	];
	expect(resolveEffectiveBalance(checking, adjustments, "2026-07-17")).toEqual(
		{ balance: 1000, date: "2024-01-01" },
	);
});
