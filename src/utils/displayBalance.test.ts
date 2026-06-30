import { expect, it } from "vitest";
import { displayBalance } from "./displayBalance";
import type { Account } from "../engine/types";

const base: Account = {
	id: "1",
	name: "Test",
	type: "checking",
	owner: "owner",
	seedBalance: 0,
	seedDate: "2026-01-01",
	rate: 0,
	amortizing: false,
};

it("returns balance unchanged for non-amortizing account", () => {
	expect(displayBalance({ ...base, amortizing: false }, 500)).toBe(500);
});

it("negates positive balance for amortizing account", () => {
	expect(displayBalance({ ...base, amortizing: true }, 500)).toBe(-500);
});

it("negates negative balance for amortizing account", () => {
	expect(displayBalance({ ...base, amortizing: true }, -200)).toBe(200);
});
