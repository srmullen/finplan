import { describe, expect, it } from "vitest";
import { project } from "./projection";
import type { Account, ProjectionInput, Schedule } from "./types";

const checking: Account = {
	id: "checking",
	name: "Checking",
	type: "checking",
	owner: "Sean",
	seedBalance: 1000,
	seedDate: "2024-01-01",
	rate: 0,
	amortizing: false,
};

function makeInput(overrides: Partial<ProjectionInput> = {}): ProjectionInput {
	return {
		accounts: [checking],
		externalParties: [],
		schedules: [],
		adjustments: [],
		startDate: "2024-01-01",
		endDate: "2024-03-31",
		...overrides,
	};
}

describe("project — basic balance", () => {
	it("returns the seed balance on the start date with no schedules", () => {
		const result = project(makeInput());
		expect(result.checking![0]).toEqual({
			date: "2024-01-01",
			balance: 1000,
		});
	});

	it("produces one entry per day across the date range", () => {
		const result = project(
			makeInput({ startDate: "2024-01-01", endDate: "2024-01-05" }),
		);
		expect(result.checking!.map((p) => p.date)).toEqual([
			"2024-01-01",
			"2024-01-02",
			"2024-01-03",
			"2024-01-04",
			"2024-01-05",
		]);
	});
});

describe("project — Schedule frequencies", () => {
	it("monthly schedule fires once a month on the start day", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 500,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-15",
			terminateAtZero: false,
		};
		const result = project(makeInput({ schedules: [schedule] }));
		const series = result.checking!;
		const jan15 = series.find((p) => p.date === "2024-01-15")!;
		const jan14 = series.find((p) => p.date === "2024-01-14")!;
		const feb15 = series.find((p) => p.date === "2024-02-15")!;
		const feb14 = series.find((p) => p.date === "2024-02-14")!;
		expect(jan15.balance - jan14.balance).toBe(500);
		expect(feb15.balance - feb14.balance).toBe(500);
	});

	it("one-time schedule fires exactly once on the specified date", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 2000,
			estimated: false,
			frequency: "once",
			startDate: "2024-02-10",
			terminateAtZero: false,
		};
		const result = project(makeInput({ schedules: [schedule] }));
		const series = result.checking!;
		const feb10 = series.find((p) => p.date === "2024-02-10")!;
		const feb9 = series.find((p) => p.date === "2024-02-09")!;
		const feb11 = series.find((p) => p.date === "2024-02-11")!;
		expect(feb10.balance - feb9.balance).toBe(2000);
		expect(feb11.balance - feb10.balance).toBe(0);
	});

	it("biweekly schedule produces 26 occurrences in a full year", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 100,
			estimated: false,
			frequency: "biweekly",
			startDate: "2024-01-05",
			terminateAtZero: false,
		};
		const result = project(
			makeInput({
				schedules: [schedule],
				startDate: "2024-01-01",
				endDate: "2024-12-31",
			}),
		);
		const last = result.checking!.at(-1)!;
		expect(last.balance).toBe(1000 + 26 * 100);
	});

	it("semi-monthly schedule produces 24 occurrences in a full year", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 100,
			estimated: false,
			frequency: "semi-monthly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		};
		const result = project(
			makeInput({
				schedules: [schedule],
				startDate: "2024-01-01",
				endDate: "2024-12-31",
			}),
		);
		const last = result.checking!.at(-1)!;
		expect(last.balance).toBe(1000 + 24 * 100);
	});

	it("weekly schedule fires every 7 days", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 100,
			estimated: false,
			frequency: "weekly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		};
		// Jan 1 to Jan 28 = exactly 4 weekly firings (Jan 1, 8, 15, 22)
		const result = project(
			makeInput({
				schedules: [schedule],
				startDate: "2024-01-01",
				endDate: "2024-01-28",
			}),
		);
		const last = result.checking!.at(-1)!;
		expect(last.balance).toBe(1000 + 4 * 100);
	});

	it("quarterly schedule fires 4 times in a year", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 300,
			estimated: false,
			frequency: "quarterly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		};
		const result = project(
			makeInput({
				schedules: [schedule],
				startDate: "2024-01-01",
				endDate: "2024-12-31",
			}),
		);
		const last = result.checking!.at(-1)!;
		expect(last.balance).toBe(1000 + 4 * 300);
	});

	it("annually schedule does not fire when projection year is before schedule start year", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 1000,
			estimated: false,
			frequency: "annually",
			startDate: "2025-06-01",
			terminateAtZero: false,
		};
		const result = project({
			accounts: [checking],
			externalParties: [],
			schedules: [schedule],
			adjustments: [],
			startDate: "2024-01-01",
			endDate: "2024-12-31",
		});
		const last = result.checking!.at(-1)!;
		expect(last.balance).toBe(1000);
	});

	it("annually schedule fires once in a year", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 1000,
			estimated: false,
			frequency: "annually",
			startDate: "2024-06-01",
			terminateAtZero: false,
		};
		const result = project(
			makeInput({
				schedules: [schedule],
				startDate: "2024-01-01",
				endDate: "2024-12-31",
			}),
		);
		const last = result.checking!.at(-1)!;
		expect(last.balance).toBe(1000 + 1000);
	});

	it("outbound schedule reduces the source account balance", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "checking",
			destinationId: "external",
			amount: 200,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-15",
			terminateAtZero: false,
		};
		const result = project(makeInput({ schedules: [schedule] }));
		const last = result.checking!.at(-1)!;
		expect(last.balance).toBe(1000 - 3 * 200);
	});

	it("schedule does not fire after its end date", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 500,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-01",
			endDate: "2024-01-31",
			terminateAtZero: false,
		};
		const result = project(makeInput({ schedules: [schedule] }));
		const last = result.checking!.at(-1)!;
		// only the Jan firing; no Feb or Mar
		expect(last.balance).toBe(1000 + 500);
	});
});

describe("project — Rate compounding", () => {
	it("a positive rate compounds the balance daily", () => {
		const ira: Account = {
			id: "ira",
			name: "IRA",
			type: "investment",
			owner: "Sean",
			seedBalance: 10000,
			seedDate: "2024-01-01",
			rate: 0.08,
			amortizing: false,
		};
		const result = project({
			accounts: [ira],
			externalParties: [],
			schedules: [],
			adjustments: [],
			startDate: "2024-01-01",
			endDate: "2024-12-31",
		});
		const last = result.ira!.at(-1)!;
		// 2024 is a leap year: 366 days, 365 compounding steps (first day is seed)
		const expected = 10000 * (1 + 0.08 / 365) ** 365;
		expect(last.balance).toBeCloseTo(expected, 0);
	});

	it("a positive rate on a negative balance compounds the debt daily (credit card interest)", () => {
		const card: Account = {
			id: "card",
			name: "Credit Card",
			type: "credit_card",
			owner: "Sean",
			seedBalance: -2000,
			seedDate: "2024-01-01",
			rate: 0.24,
			amortizing: false,
		};
		const result = project({
			accounts: [card],
			externalParties: [],
			schedules: [],
			adjustments: [],
			startDate: "2024-01-01",
			endDate: "2024-12-31",
		});
		const last = result.card!.at(-1)!;
		// balance should become more negative (owe more)
		expect(last.balance).toBeLessThan(-2000);
	});

	it("a positive-balance account with a negative rate shrinks over time", () => {
		const savings: Account = {
			id: "savings",
			name: "Savings",
			type: "savings",
			owner: "Sean",
			seedBalance: 1000,
			seedDate: "2024-01-01",
			rate: -0.05,
			amortizing: false,
		};
		const result = project({
			accounts: [savings],
			externalParties: [],
			schedules: [],
			adjustments: [],
			startDate: "2024-01-01",
			endDate: "2024-12-31",
		});
		const last = result.savings!.at(-1)!;
		expect(last.balance).toBeLessThan(1000);
	});
});

describe("project — amortizing account termination", () => {
	it("stops inbound schedules once balance reaches zero", () => {
		const loan: Account = {
			id: "loan",
			name: "Car Loan",
			type: "loan",
			owner: "Sean",
			seedBalance: -600,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: true,
		};
		const payment: Schedule = {
			id: "pay",
			sourceId: "checking",
			destinationId: "loan",
			amount: 200,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-15",
			terminateAtZero: true,
		};
		const result = project({
			accounts: [checking, loan],
			externalParties: [],
			schedules: [payment],
			adjustments: [],
			startDate: "2024-01-01",
			endDate: "2024-12-31",
		});
		const loanLast = result.loan!.at(-1)!;
		expect(loanLast.balance).toBe(0);
		// checking loses exactly 3 payments (600/200)
		const checkLast = result.checking!.at(-1)!;
		expect(checkLast.balance).toBe(1000 - 3 * 200);
	});
});

describe("project — Adjustments", () => {
	it("uses the most recent pre-startDate adjustment as the opening balance", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 100,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-02-01",
			terminateAtZero: false,
		};
		const result = project({
			accounts: [checking],
			externalParties: [],
			schedules: [schedule],
			adjustments: [
				{
					id: "a1",
					accountId: "checking",
					date: "2024-01-10",
					actualBalance: 2500,
				},
			],
			startDate: "2024-01-15",
			endDate: "2024-03-31",
		});
		const series = result.checking!;
		expect(series[0]!.balance).toBe(2500);
		const mar31 = series.find((p) => p.date === "2024-03-31")!;
		expect(mar31.balance).toBe(2500 + 2 * 100);
	});

	it("reseeds account balance from the most recent adjustment on its date", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 100,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-02-01",
			terminateAtZero: false,
		};
		const result = project({
			accounts: [checking],
			externalParties: [],
			schedules: [schedule],
			adjustments: [
				{
					id: "a1",
					accountId: "checking",
					date: "2024-01-15",
					actualBalance: 2000,
				},
			],
			startDate: "2024-01-01",
			endDate: "2024-03-31",
		});
		const series = result.checking!;
		const jan14 = series.find((p) => p.date === "2024-01-14")!;
		expect(jan14.balance).toBe(1000);
		const jan15 = series.find((p) => p.date === "2024-01-15")!;
		expect(jan15.balance).toBe(2000);
		const mar31 = series.find((p) => p.date === "2024-03-31")!;
		expect(mar31.balance).toBe(2000 + 2 * 100);
	});
});

describe("project — Adjustments (sort comparator)", () => {
	it("uses the most recent of multiple pre-startDate adjustments", () => {
		const result = project({
			accounts: [checking],
			externalParties: [],
			schedules: [],
			adjustments: [
				{
					id: "a1",
					accountId: "checking",
					date: "2024-01-05",
					actualBalance: 1500,
				},
				{
					id: "a2",
					accountId: "checking",
					date: "2024-01-10",
					actualBalance: 2000,
				},
			],
			startDate: "2024-01-15",
			endDate: "2024-01-15",
		});
		// 2024-01-10 is more recent → 2000 should be the opening balance
		expect(result.checking![0]!.balance).toBe(2000);
	});
});

describe("project — amortizing termination with external source", () => {
	it("caps the final payment when source is external (not tracked)", () => {
		const loan: Account = {
			id: "loan",
			name: "Car Loan",
			type: "loan",
			owner: "Sean",
			seedBalance: -300,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: true,
		};
		const payment: Schedule = {
			id: "pay",
			sourceId: "external-party",
			destinationId: "loan",
			amount: 200,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-15",
			terminateAtZero: true,
		};
		const result = project({
			accounts: [loan],
			externalParties: [],
			schedules: [payment],
			adjustments: [],
			startDate: "2024-01-01",
			endDate: "2024-12-31",
		});
		const loanLast = result.loan!.at(-1)!;
		expect(loanLast.balance).toBe(0);
	});
});

describe("project — Scenario overrides", () => {
	it("a scenario override changes a schedule amount vs the baseline", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 500,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		};
		const baseline = project(makeInput({ schedules: [schedule] }));
		const scenario = project(
			makeInput({
				schedules: [schedule],
				scenario: {
					id: "sc1",
					name: "Higher income",
					scheduleOverrides: [{ scheduleId: "s1", amount: 1000 }],
					additionalSchedules: [],
					additionalAccounts: [],
				},
			}),
		);
		const baselineLast = baseline.checking!.at(-1)!;
		const scenarioLast = scenario.checking!.at(-1)!;
		expect(scenarioLast.balance).toBeGreaterThan(baselineLast.balance);
	});

	it("non-overridden schedules pass through unchanged alongside overridden ones", () => {
		const s1: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 500,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		};
		const s2: Schedule = {
			id: "s2",
			sourceId: "external",
			destinationId: "checking",
			amount: 100,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		};
		const result = project(
			makeInput({
				schedules: [s1, s2],
				scenario: {
					id: "sc1",
					name: "Override s1 only",
					scheduleOverrides: [{ scheduleId: "s1", amount: 1000 }],
					additionalSchedules: [],
					additionalAccounts: [],
				},
			}),
		);
		const last = result.checking!.at(-1)!;
		// s1 overridden to 1000 + s2 unchanged at 100 = 3300 per 3 months
		expect(last.balance).toBe(1000 + 3 * (1000 + 100));
	});

	it("a scenario override with endDate limits the schedule duration", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 500,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		};
		const result = project(
			makeInput({
				schedules: [schedule],
				scenario: {
					id: "sc1",
					name: "Short income",
					scheduleOverrides: [{ scheduleId: "s1", endDate: "2024-01-31" }],
					additionalSchedules: [],
					additionalAccounts: [],
				},
				endDate: "2024-03-31",
			}),
		);
		const last = result.checking!.at(-1)!;
		// Only one payment fires before the endDate override cuts off
		expect(last.balance).toBe(1000 + 500);
	});

	it("a paused schedule is excluded from the scenario projection", () => {
		const schedule: Schedule = {
			id: "s1",
			sourceId: "external",
			destinationId: "checking",
			amount: 500,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		};
		const result = project(
			makeInput({
				schedules: [schedule],
				scenario: {
					id: "sc1",
					name: "No income",
					scheduleOverrides: [{ scheduleId: "s1", paused: true }],
					additionalSchedules: [],
					additionalAccounts: [],
				},
			}),
		);
		const last = result.checking!.at(-1)!;
		expect(last.balance).toBe(1000);
	});

	it("a scenario override with terminateAtZero changes the schedule's terminate flag", () => {
		const loan: Account = {
			id: "loan",
			name: "Car Loan",
			type: "loan",
			owner: "Sean",
			seedBalance: -600,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: true,
		};
		const schedule: Schedule = {
			id: "s1",
			sourceId: "checking",
			destinationId: "loan",
			amount: 200,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-15",
			terminateAtZero: false,
		};
		const result = project({
			accounts: [checking, loan],
			externalParties: [],
			schedules: [schedule],
			adjustments: [],
			startDate: "2024-01-01",
			endDate: "2024-12-31",
			scenario: {
				id: "sc1",
				name: "Early payoff",
				scheduleOverrides: [{ scheduleId: "s1", terminateAtZero: true }],
				additionalSchedules: [],
				additionalAccounts: [],
			},
		});
		const loanLast = result.loan!.at(-1)!;
		expect(loanLast.balance).toBe(0);
	});

	it("an additional scenario account appears in the projection results", () => {
		const newAccount: Account = {
			id: "new",
			name: "New Savings",
			type: "savings",
			owner: "Joint",
			seedBalance: 500,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: false,
		};
		const result = project(
			makeInput({
				scenario: {
					id: "sc1",
					name: "Open new account",
					scheduleOverrides: [],
					additionalSchedules: [],
					additionalAccounts: [newAccount],
				},
				startDate: "2024-01-01",
				endDate: "2024-01-31",
			}),
		);
		expect(result.new).toBeDefined();
		expect(result.new![0]!.balance).toBe(500);
	});
});
