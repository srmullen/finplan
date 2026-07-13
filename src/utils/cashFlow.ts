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

function isScheduleActive(schedule: Schedule, today: string): boolean {
	if (schedule.startDate > today) return false;
	if (schedule.endDate && schedule.endDate < today) return false;
	return true;
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
): CashFlowTotals {
	let totalIn = 0;
	let totalOut = 0;

	for (const schedule of schedules) {
		if (!isScheduleActive(schedule, today)) continue;

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
