import type { Account, Adjustment } from "../engine/types";

export interface EffectiveBalance {
	balance: number;
	date: string;
}

export function resolveEffectiveBalance(
	account: Account,
	adjustments: Adjustment[],
	asOfDate: string,
): EffectiveBalance {
	const latest = adjustments
		.filter((adj) => adj.accountId === account.id && adj.date <= asOfDate)
		.sort((a, b) => b.date.localeCompare(a.date))[0];

	if (latest) return { balance: latest.actualBalance, date: latest.date };
	return { balance: account.seedBalance, date: account.seedDate };
}
