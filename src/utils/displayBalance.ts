import type { Account } from "../engine/types";

export function displayBalance(account: Account, balance: number): number {
	return account.amortizing ? -balance : balance;
}
