import type { Account } from "../engine/types";

export function computeNetWorth(
	accounts: Account[],
	balanceById: (accountId: string) => number,
	visibleAccountIds?: Set<string>,
): number {
	let total = 0;
	for (const account of accounts) {
		if (visibleAccountIds && !visibleAccountIds.has(account.id)) continue;
		total += balanceById(account.id);
	}
	return total;
}
