import { expect, it } from "vitest";
import type { Account, ExternalParty, Schedule } from "../engine/types";
import {
	classifyScheduleDirection,
	computeCashFlowTotals,
	monthlyEquivalentAmount,
} from "./cashFlow";

const today = "2026-07-13";

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

const creditCard: Account = {
	...checking,
	id: "acc-cc",
	type: "credit_card",
};

const loan: Account = { ...checking, id: "acc-loan", type: "loan" };

const employer: ExternalParty = { id: "party-employer", name: "Employer" };
const accounts = [checking, savings, creditCard, loan];
const externalParties = [employer];

const base: Schedule = {
	id: "s-1",
	sourceId: "acc-checking",
	destinationId: "acc-savings",
	amount: 100,
	estimated: false,
	frequency: "monthly",
	startDate: "2024-01-01",
	terminateAtZero: false,
};

// --- classifyScheduleDirection ---

it("classifies destination ExternalParty as out", () => {
	const s: Schedule = { ...base, destinationId: "party-employer" };
	expect(classifyScheduleDirection(s, accounts, externalParties)).toBe("out");
});

it("classifies destination credit_card account as out regardless of source", () => {
	const s: Schedule = { ...base, destinationId: "acc-cc" };
	expect(classifyScheduleDirection(s, accounts, externalParties)).toBe("out");
});

it("classifies destination loan account as out regardless of source", () => {
	const s: Schedule = { ...base, destinationId: "acc-loan" };
	expect(classifyScheduleDirection(s, accounts, externalParties)).toBe("out");
});

it("classifies source ExternalParty into a regular account as in", () => {
	const s: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
	};
	expect(classifyScheduleDirection(s, accounts, externalParties)).toBe("in");
});

it("classifies a transfer between two non-loan/credit-card accounts as neither", () => {
	expect(classifyScheduleDirection(base, accounts, externalParties)).toBe(
		"neither",
	);
});

it("classifies source ExternalParty into a credit_card destination as out (out takes priority)", () => {
	const s: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-cc",
	};
	expect(classifyScheduleDirection(s, accounts, externalParties)).toBe("out");
});

// --- monthlyEquivalentAmount ---

it("returns full amount for monthly frequency", () => {
	expect(monthlyEquivalentAmount({ ...base, amount: 100 }, today)).toBe(100);
});

it("normalizes weekly to monthly-equivalent", () => {
	expect(
		monthlyEquivalentAmount({ ...base, frequency: "weekly", amount: 100 }, today),
	).toBeCloseTo((100 * 52) / 12);
});

it("normalizes biweekly to monthly-equivalent", () => {
	expect(
		monthlyEquivalentAmount(
			{ ...base, frequency: "biweekly", amount: 100 },
			today,
		),
	).toBeCloseTo((100 * 26) / 12);
});

it("normalizes semi-monthly to monthly-equivalent", () => {
	expect(
		monthlyEquivalentAmount(
			{ ...base, frequency: "semi-monthly", amount: 100 },
			today,
		),
	).toBe(200);
});

it("normalizes quarterly to monthly-equivalent", () => {
	expect(
		monthlyEquivalentAmount(
			{ ...base, frequency: "quarterly", amount: 300 },
			today,
		),
	).toBeCloseTo(100);
});

it("normalizes annually to monthly-equivalent", () => {
	expect(
		monthlyEquivalentAmount(
			{ ...base, frequency: "annually", amount: 1200 },
			today,
		),
	).toBeCloseTo(100);
});

it("counts a once schedule whose start date falls in the current calendar month", () => {
	expect(
		monthlyEquivalentAmount(
			{ ...base, frequency: "once", startDate: "2026-07-01", amount: 500 },
			today,
		),
	).toBe(500);
});

it("excludes a once schedule whose start date falls outside the current calendar month", () => {
	expect(
		monthlyEquivalentAmount(
			{ ...base, frequency: "once", startDate: "2026-06-01", amount: 500 },
			today,
		),
	).toBe(0);
});

it("excludes a once schedule later in the current month that hasn't started yet, since it hasn't started", () => {
	// The general active-schedule filter (startDate <= today) applies even to
	// `once` schedules, on top of the current-calendar-month check.
	const notYetStarted: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "once",
		startDate: "2026-07-20",
		amount: 500,
	};
	expect(
		computeCashFlowTotals(
			[notYetStarted],
			accounts,
			externalParties,
			today,
		),
	).toEqual({ totalIn: 0, totalOut: 0 });
});

// --- computeCashFlowTotals ---

it("sums Total In and Total Out across active schedules, ignoring neither", () => {
	const income: Schedule = {
		...base,
		id: "s-income",
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "monthly",
		amount: 3000,
	};
	const debtPayment: Schedule = {
		...base,
		id: "s-debt",
		sourceId: "acc-checking",
		destinationId: "acc-cc",
		frequency: "monthly",
		amount: 200,
	};
	const internalTransfer: Schedule = { ...base, id: "s-internal" };

	const totals = computeCashFlowTotals(
		[income, debtPayment, internalTransfer],
		accounts,
		externalParties,
		today,
	);

	expect(totals).toEqual({ totalIn: 3000, totalOut: 200 });
});

it("excludes a schedule that has not started yet", () => {
	const future: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		startDate: "2099-01-01",
	};
	expect(
		computeCashFlowTotals([future], accounts, externalParties, today),
	).toEqual({ totalIn: 0, totalOut: 0 });
});

it("excludes a schedule that has already ended", () => {
	const ended: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		endDate: "2026-01-01",
	};
	expect(
		computeCashFlowTotals([ended], accounts, externalParties, today),
	).toEqual({ totalIn: 0, totalOut: 0 });
});

it("includes a currently-active schedule with an end date in the future", () => {
	const active: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		endDate: "2099-01-01",
	};
	expect(
		computeCashFlowTotals([active], accounts, externalParties, today),
	).toEqual({ totalIn: 100, totalOut: 0 });
});

it("returns zero totals for an empty schedule list", () => {
	expect(computeCashFlowTotals([], accounts, externalParties, today)).toEqual({
		totalIn: 0,
		totalOut: 0,
	});
});
