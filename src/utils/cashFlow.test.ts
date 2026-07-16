import { expect, it } from "vitest";
import type { Account, ExternalParty, Schedule } from "../engine/types";
import {
	classifyScheduleDirection,
	computeCashFlowTotals,
	computeHorizonCashFlowTotals,
	isFlowVisible,
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

it("includes a once schedule later in the current month, even though it hasn't started yet", () => {
	// Per ADR-0020: a schedule belongs to a month once its start date falls
	// within it, regardless of whether that exact day has passed yet.
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
	).toEqual({ totalIn: 500, totalOut: 0 });
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

// --- ADR-0020: month-level start/end eligibility ---

it("includes a schedule whose start date falls later in the current month", () => {
	const income: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "monthly",
		startDate: "2026-07-28",
		amount: 500,
	};
	expect(
		computeCashFlowTotals([income], accounts, externalParties, today),
	).toEqual({ totalIn: 500, totalOut: 0 });
});

it("includes a schedule ending partway through the current month if it already fired before ending", () => {
	const income: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "monthly",
		startDate: "2024-01-01",
		endDate: "2026-07-05",
		amount: 300,
	};
	// fires on the 1st of every month, including 2026-07-01, before the 07-05 end date
	expect(
		computeCashFlowTotals([income], accounts, externalParties, today),
	).toEqual({ totalIn: 300, totalOut: 0 });
});

it("excludes a schedule ending partway through the current month if it never fires before ending", () => {
	const income: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "monthly",
		startDate: "2024-01-20",
		endDate: "2026-07-03",
		amount: 300,
	};
	// fires on the 20th of every month; ends 07-03, before its next July occurrence
	expect(
		computeCashFlowTotals([income], accounts, externalParties, today),
	).toEqual({ totalIn: 0, totalOut: 0 });
});

it("excludes a schedule ending on the last day of the current month if it never fires before ending", () => {
	// Boundary case: endDate on the month's last day is still "ending this
	// month," so the firing check must apply rather than short-circuiting.
	const quarterly: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "quarterly",
		startDate: "2020-02-01", // fires Feb/May/Aug/Nov
		endDate: "2026-07-31",
		amount: 300,
	};
	expect(
		computeCashFlowTotals([quarterly], accounts, externalParties, today),
	).toEqual({ totalIn: 0, totalOut: 0 });
});

it("includes a schedule that both starts and ends within the current month, if it fires in between", () => {
	const income: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "once",
		startDate: "2026-07-10",
		endDate: "2026-07-20",
		amount: 400,
	};
	expect(
		computeCashFlowTotals([income], accounts, externalParties, today),
	).toEqual({ totalIn: 400, totalOut: 0 });
});

it("keeps an ongoing annual schedule smoothed every month, not just the month it fires", () => {
	// Regression guard: an annual schedule only fires in one specific month
	// (here, March), but with no imminent start/end this month, it must still
	// count at its smoothed monthly-equivalent every other month too.
	const insurance: Schedule = {
		...base,
		sourceId: "acc-checking",
		destinationId: "party-employer",
		frequency: "annually",
		startDate: "2020-03-15",
		amount: 1200,
	};
	expect(
		computeCashFlowTotals([insurance], accounts, externalParties, today),
	).toEqual({ totalIn: 0, totalOut: 100 });
});

// --- isFlowVisible ---

it("treats every flow as visible when no visibleAccountIds filter is given", () => {
	expect(isFlowVisible(base, accounts)).toBe(true);
});

it("treats a flow with no Account endpoints as visible regardless of the filter", () => {
	const partyToParty: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "party-employer",
	};
	expect(
		isFlowVisible(partyToParty, accounts, new Set(["acc-checking"])),
	).toBe(true);
});

it("is visible when the source Account is in the visible set", () => {
	expect(isFlowVisible(base, accounts, new Set(["acc-checking"]))).toBe(true);
});

it("is visible when the destination Account is in the visible set", () => {
	expect(isFlowVisible(base, accounts, new Set(["acc-savings"]))).toBe(true);
});

it("is visible when only one of two Account endpoints is in the visible set", () => {
	// mirrors AC: a visible checking account paying a hidden credit card still counts
	const payment: Schedule = { ...base, destinationId: "acc-cc" };
	expect(isFlowVisible(payment, accounts, new Set(["acc-checking"]))).toBe(
		true,
	);
});

it("is not visible when neither Account endpoint is in the visible set", () => {
	expect(isFlowVisible(base, accounts, new Set(["acc-cc"]))).toBe(false);
});

it("is not visible when the visible set is empty", () => {
	expect(isFlowVisible(base, accounts, new Set())).toBe(false);
});

// --- computeCashFlowTotals with visibleAccountIds ---

it("excludes a flow from totals when neither endpoint is visible", () => {
	const income: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
	};
	expect(
		computeCashFlowTotals(
			[income],
			accounts,
			externalParties,
			today,
			new Set(["acc-savings"]),
		),
	).toEqual({ totalIn: 0, totalOut: 0 });
});

it("includes a flow in totals when one of two endpoints is visible", () => {
	const debtPayment: Schedule = { ...base, destinationId: "acc-cc" };
	expect(
		computeCashFlowTotals(
			[debtPayment],
			accounts,
			externalParties,
			today,
			new Set(["acc-checking"]),
		),
	).toEqual({ totalIn: 0, totalOut: 100 });
});

// --- computeHorizonCashFlowTotals ---

it("sums nominal amounts across occurrences of a monthly schedule within the horizon", () => {
	const income: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "monthly",
		amount: 1000,
		startDate: "2026-01-01",
	};
	const totals = computeHorizonCashFlowTotals(
		[income],
		accounts,
		externalParties,
		"2026-01-01",
		"2026-03-01",
	);
	// fires on 2026-01-01, 2026-02-01, 2026-03-01
	expect(totals).toEqual({ totalIn: 3000, totalOut: 0 });
});

it("excludes occurrences that fall outside the horizon window", () => {
	const income: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "monthly",
		amount: 1000,
		startDate: "2026-06-01",
	};
	const totals = computeHorizonCashFlowTotals(
		[income],
		accounts,
		externalParties,
		"2026-01-01",
		"2026-03-01",
	);
	expect(totals).toEqual({ totalIn: 0, totalOut: 0 });
});

it("classifies a debt payment as Out within the horizon", () => {
	const debtPayment: Schedule = {
		...base,
		destinationId: "acc-cc",
		frequency: "monthly",
		amount: 200,
		startDate: "2026-01-01",
	};
	const totals = computeHorizonCashFlowTotals(
		[debtPayment],
		accounts,
		externalParties,
		"2026-01-01",
		"2026-01-01",
	);
	expect(totals).toEqual({ totalIn: 0, totalOut: 200 });
});

it("excludes an internal transfer classified as neither", () => {
	const internalTransfer: Schedule = {
		...base,
		frequency: "monthly",
		startDate: "2026-01-01",
	};
	const totals = computeHorizonCashFlowTotals(
		[internalTransfer],
		accounts,
		externalParties,
		"2026-01-01",
		"2026-01-01",
	);
	expect(totals).toEqual({ totalIn: 0, totalOut: 0 });
});

it("respects the visibility filter, excluding flows where neither endpoint is visible", () => {
	const debtPayment: Schedule = {
		...base,
		destinationId: "acc-cc",
		frequency: "monthly",
		amount: 200,
		startDate: "2026-01-01",
	};
	const totals = computeHorizonCashFlowTotals(
		[debtPayment],
		accounts,
		externalParties,
		"2026-01-01",
		"2026-01-01",
		new Set(["acc-savings"]),
	);
	expect(totals).toEqual({ totalIn: 0, totalOut: 0 });
});

it("counts a once schedule firing exactly on its start date within the horizon", () => {
	const gift: Schedule = {
		...base,
		sourceId: "party-employer",
		destinationId: "acc-checking",
		frequency: "once",
		amount: 500,
		startDate: "2026-02-15",
	};
	const totals = computeHorizonCashFlowTotals(
		[gift],
		accounts,
		externalParties,
		"2026-01-01",
		"2026-03-01",
	);
	expect(totals).toEqual({ totalIn: 500, totalOut: 0 });
});

it("returns zero totals for an empty schedule list over a horizon", () => {
	expect(
		computeHorizonCashFlowTotals(
			[],
			accounts,
			externalParties,
			"2026-01-01",
			"2026-12-31",
		),
	).toEqual({ totalIn: 0, totalOut: 0 });
});
