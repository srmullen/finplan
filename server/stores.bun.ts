import type { Account } from "../src/engine/types";
import type { AccountStore } from "./index";

// biome-ignore lint/suspicious/noExplicitAny: bun:sqlite returns untyped rows
type BunDatabase = { exec(sql: string): void; prepare(sql: string): any };

function rowToAccount(row: Record<string, unknown>): Account {
	return {
		id: row.id as string,
		name: row.name as string,
		type: row.type as Account["type"],
		owner: row.owner as string,
		institution: (row.institution as string) || undefined,
		seedBalance: row.seed_balance as number,
		seedDate: row.seed_date as string,
		rate: row.rate as number,
		amortizing: Boolean(row.amortizing),
	};
}

export function initAccountSchema(db: BunDatabase): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      owner TEXT NOT NULL,
      institution TEXT NOT NULL DEFAULT '',
      seed_balance REAL NOT NULL DEFAULT 0,
      seed_date TEXT NOT NULL,
      rate REAL NOT NULL DEFAULT 0,
      amortizing INTEGER NOT NULL DEFAULT 0
    )
  `);
}

export function createBunAccountStore(db: BunDatabase): AccountStore {
	return {
		list: () =>
			(
				db.prepare("SELECT * FROM accounts").all() as Record<string, unknown>[]
			).map(rowToAccount),

		get: (id) => {
			const row = db
				.prepare("SELECT * FROM accounts WHERE id = ?")
				.get(id) as Record<string, unknown> | null;
			return row ? rowToAccount(row) : null;
		},

		create: (account) => {
			db.prepare(
				"INSERT INTO accounts (id, name, type, owner, institution, seed_balance, seed_date, rate, amortizing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
			).run(
				account.id,
				account.name,
				account.type,
				account.owner,
				account.institution ?? "",
				account.seedBalance,
				account.seedDate,
				account.rate,
				account.amortizing ? 1 : 0,
			);
		},

		update: (account) => {
			db.prepare(
				"UPDATE accounts SET name = ?, type = ?, owner = ?, institution = ?, seed_balance = ?, seed_date = ?, rate = ?, amortizing = ? WHERE id = ?",
			).run(
				account.name,
				account.type,
				account.owner,
				account.institution ?? "",
				account.seedBalance,
				account.seedDate,
				account.rate,
				account.amortizing ? 1 : 0,
				account.id,
			);
		},

		remove: (id) => {
			db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
		},
	};
}
