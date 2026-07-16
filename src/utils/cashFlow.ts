import { addDays, parseDate, scheduleFiresOn } from "../engine/projection";
import type { Account, ExternalParty, Schedule } from "../engine/types";

export type CashFlowDirection = "in" | "out" | "neither";

export interface CashFlowTotals {
	totalIn: number;
	totalOut: number;
}

const MONTHLY_MULTIPLIER: Record<
	Exclude<Schedule["frequency"], "once">,
	number
> = {
	weekly: 52 / 12,
	biweekly: 26 / 12,
	"semi-monthly": 2,
	monthly: 1,
	quarterly: 1 / 3,
	annually: 1 / 12,
};

function monthBounds(today: string): { monthStart: Date; monthEnd: Date } {
	const [year, month] = today.split("-").map(Number) as [number, number];
	return {
		monthStart: new Date(Date.UTC(year, month - 1, 1)),
		monthEnd: new Date(Date.UTC(year, month, 0)),
	};
}

function isActiveThisMonth(schedule: Schedule, today: string): boolean {
	const { monthStart, monthEnd } = monthBounds(today);
	const start = parseDate(schedule.startDate);
	if (start > monthEnd) return false;

	if (!schedule.endDate) return true;

	const end = parseDate(schedule.endDate);
	if (end < monthStart) return false;
	if (end > monthEnd) return true;

	// Ends partway through this month: only counts if it actually fires at
	// least once between the start of its activity this month and its end date.
	let d = start > monthStart ? start : monthStart;
	while (d <= end) {
		if (scheduleFiresOn(schedule, d)) return true;
		d = addDays(d, 1);
	}
	return false;
}

export function classifyScheduleDirection(
	schedule: Schedule,
	accounts: Account[],
	externalParties: ExternalParty[],
): CashFlowDirection {
	const destAccount = accounts.find((a) => a.id === schedule.destinationId);
	const destIsExternal = externalParties.some(
		(p) => p.id === schedule.destinationId,
	);
	const destIsDebtAccount =
		destAccount?.type === "loan" || destAccount?.type === "credit_card";

	if (destIsExternal || destIsDebtAccount) return "out";

	const sourceIsExternal = externalParties.some(
		(p) => p.id === schedule.sourceId,
	);
	if (sourceIsExternal) return "in";

	return "neither";
}

export function isFlowVisible(
	schedule: Schedule,
	accounts: Account[],
	visibleAccountIds?: Set<string>,
): boolean {
	if (!visibleAccountIds) return true;

	const sourceIsAccount = accounts.some((a) => a.id === schedule.sourceId);
	const destIsAccount = accounts.some((a) => a.id === schedule.destinationId);
	if (!sourceIsAccount && !destIsAccount) return true;

	return (
		(sourceIsAccount && visibleAccountIds.has(schedule.sourceId)) ||
		(destIsAccount && visibleAccountIds.has(schedule.destinationId))
	);
}

export function monthlyEquivalentAmount(
	schedule: Schedule,
	today: string,
): number {
	if (schedule.frequency === "once") {
		return schedule.startDate.slice(0, 7) === today.slice(0, 7)
			? schedule.amount
			: 0;
	}
	return schedule.amount * MONTHLY_MULTIPLIER[schedule.frequency];
}

export function computeCashFlowTotals(
	schedules: Schedule[],
	accounts: Account[],
	externalParties: ExternalParty[],
	today: string,
	visibleAccountIds?: Set<string>,
): CashFlowTotals {
	let totalIn = 0;
	let totalOut = 0;

	for (const schedule of schedules) {
		if (!isActiveThisMonth(schedule, today)) continue;
		if (!isFlowVisible(schedule, accounts, visibleAccountIds)) continue;

		const direction = classifyScheduleDirection(
			schedule,
			accounts,
			externalParties,
		);
		if (direction === "neither") continue;

		const amount = monthlyEquivalentAmount(schedule, today);
		if (direction === "in") totalIn += amount;
		else totalOut += amount;
	}

	return { totalIn, totalOut };
}

export function computeHorizonCashFlowTotals(
	schedules: Schedule[],
	accounts: Account[],
	externalParties: ExternalParty[],
	startDate: string,
	endDate: string,
	visibleAccountIds?: Set<string>,
): CashFlowTotals {
	let totalIn = 0;
	let totalOut = 0;

	const end = parseDate(endDate);
	let current = parseDate(startDate);

	while (current <= end) {
		for (const schedule of schedules) {
			if (!scheduleFiresOn(schedule, current)) continue;
			if (!isFlowVisible(schedule, accounts, visibleAccountIds)) continue;

			const direction = classifyScheduleDirection(
				schedule,
				accounts,
				externalParties,
			);
			if (direction === "neither") continue;

			if (direction === "in") totalIn += schedule.amount;
			else totalOut += schedule.amount;
		}
		current = addDays(current, 1);
	}

	return { totalIn, totalOut };
}
