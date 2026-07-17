import { expect, it } from "vitest";
import type { Account } from "../engine/types";
import { computeNetWorth } from "./netWorth";

const checking: Account = {
	id: "acc-checking",
	name: "Checking",
	type: "checking",
	owner: "Sean",
	seedBalance: 0,
	seedDate: "2024-01-01",
	rate: 0,
	amortizing: false,
};

const savings: Account = { ...checking, id: "acc-savings", type: "savings" };

const loan: Account = {
	...checking,
	id: "acc-loan",
	type: "loan",
	amortizing: true,
};

it("returns 0 for an empty account list", () => {
	expect(computeNetWorth([], () => 0)).toBe(0);
});

it("sums raw signed balances across accounts", () => {
	const balances: Record<string, number> = {
		"acc-checking": 1000,
		"acc-savings": 500,
	};
	expect(
		computeNetWorth([checking, savings], (id) => balances[id]!),
	).toBe(1500);
});

it("sums an amortizing account's raw negative balance, not its displayed positive flip", () => {
	const balances: Record<string, number> = {
		"acc-checking": 1000,
		"acc-loan": -20000,
	};
	expect(computeNetWorth([checking, loan], (id) => balances[id]!)).toBe(
		-19000,
	);
});

it("excludes accounts not present in the optional visibility filter", () => {
	const balances: Record<string, number> = {
		"acc-checking": 1000,
		"acc-savings": 500,
	};
	const visible = new Set(["acc-checking"]);
	expect(
		computeNetWorth([checking, savings], (id) => balances[id]!, visible),
	).toBe(1000);
});
