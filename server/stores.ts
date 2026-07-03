import type Database from "better-sqlite3";
import type {
	Account,
	Adjustment,
	ExternalParty,
	Scenario,
	Schedule,
	ScheduleGroup,
} from "../src/engine/types";
import type {
	AccountStore,
	AdjustmentStore,
	ExternalPartyStore,
	ScenarioStore,
	ScheduleGroupStore,
	ScheduleStore,
	Stores,
} from "./index";

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

function rowToParty(row: Record<string, unknown>): ExternalParty {
	return { id: row.id as string, name: row.name as string };
}

function rowToSchedule(row: Record<string, unknown>): Schedule {
	return {
		id: row.id as string,
		sourceId: row.source_id as string,
		destinationId: row.destination_id as string,
		amount: row.amount as number,
		estimated: Boolean(row.estimated),
		frequency: row.frequency as Schedule["frequency"],
		startDate: row.start_date as string,
		...(row.end_date ? { endDate: row.end_date as string } : {}),
		terminateAtZero: Boolean(row.terminate_at_zero),
		...(row.group_id ? { groupId: row.group_id as string } : {}),
	};
}

function rowToScheduleGroup(row: Record<string, unknown>): ScheduleGroup {
	return { id: row.id as string, name: row.name as string };
}

function rowToAdjustment(row: Record<string, unknown>): Adjustment {
	return {
		id: row.id as string,
		accountId: row.account_id as string,
		date: row.date as string,
		actualBalance: row.actual_balance as number,
	};
}

function safeParseArray(value: unknown, column: string): unknown[] {
	if (value == null || value === "") return [];
	try {
		const parsed = JSON.parse(value as string);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		console.warn(
			`rowToScenario: invalid JSON in column "${column}", falling back to []`,
		);
		return [];
	}
}

function rowToScenario(row: Record<string, unknown>): Scenario {
	return {
		id: row.id as string,
		name: row.name as string,
		scheduleOverrides: safeParseArray(
			row.schedule_overrides,
			"schedule_overrides",
		) as Scenario["scheduleOverrides"],
		additionalSchedules: safeParseArray(
			row.additional_schedules,
			"additional_schedules",
		) as Scenario["additionalSchedules"],
		additionalAccounts: safeParseArray(
			row.additional_accounts,
			"additional_accounts",
		) as Scenario["additionalAccounts"],
	};
}

export function createSQLiteStores(db: Database.Database): Stores {
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
	try {
		db.exec(
			"ALTER TABLE accounts ADD COLUMN institution TEXT NOT NULL DEFAULT ''",
		);
	} catch {
		// column already exists
	}
	db.exec(`
    CREATE TABLE IF NOT EXISTS external_parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);
	db.exec(`
    CREATE TABLE IF NOT EXISTS schedule_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);
	db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      destination_id TEXT NOT NULL,
      amount REAL NOT NULL,
      estimated INTEGER NOT NULL DEFAULT 0,
      frequency TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      terminate_at_zero INTEGER NOT NULL DEFAULT 0,
      group_id TEXT
    )
  `);
	try {
		db.exec("ALTER TABLE schedules ADD COLUMN group_id TEXT");
	} catch {
		// column already exists
	}
	db.exec(`
    CREATE TABLE IF NOT EXISTS adjustments (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      date TEXT NOT NULL,
      actual_balance REAL NOT NULL
    )
  `);
	db.exec(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      schedule_overrides TEXT NOT NULL DEFAULT '[]',
      additional_schedules TEXT NOT NULL DEFAULT '[]',
      additional_accounts TEXT NOT NULL DEFAULT '[]'
    )
  `);

	const accounts: AccountStore = {
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

	const parties: ExternalPartyStore = {
		list: () =>
			(
				db.prepare("SELECT * FROM external_parties").all() as Record<
					string,
					unknown
				>[]
			).map(rowToParty),
		get: (id) => {
			const row = db
				.prepare("SELECT * FROM external_parties WHERE id = ?")
				.get(id) as Record<string, unknown> | null;
			return row ? rowToParty(row) : null;
		},
		create: (party) => {
			db.prepare("INSERT INTO external_parties (id, name) VALUES (?, ?)").run(
				party.id,
				party.name,
			);
		},
		update: (party) => {
			db.prepare("UPDATE external_parties SET name = ? WHERE id = ?").run(
				party.name,
				party.id,
			);
		},
		remove: (id) => {
			db.prepare("DELETE FROM external_parties WHERE id = ?").run(id);
		},
	};

	const schedules: ScheduleStore = {
		list: () =>
			(
				db.prepare("SELECT * FROM schedules").all() as Record<string, unknown>[]
			).map(rowToSchedule),
		get: (id) => {
			const row = db
				.prepare("SELECT * FROM schedules WHERE id = ?")
				.get(id) as Record<string, unknown> | null;
			return row ? rowToSchedule(row) : null;
		},
		create: (schedule) => {
			db.prepare(
				"INSERT INTO schedules (id, source_id, destination_id, amount, estimated, frequency, start_date, end_date, terminate_at_zero, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			).run(
				schedule.id,
				schedule.sourceId,
				schedule.destinationId,
				schedule.amount,
				schedule.estimated ? 1 : 0,
				schedule.frequency,
				schedule.startDate,
				schedule.endDate ?? null,
				schedule.terminateAtZero ? 1 : 0,
				schedule.groupId ?? null,
			);
		},
		update: (schedule) => {
			db.prepare(
				"UPDATE schedules SET source_id = ?, destination_id = ?, amount = ?, estimated = ?, frequency = ?, start_date = ?, end_date = ?, terminate_at_zero = ?, group_id = ? WHERE id = ?",
			).run(
				schedule.sourceId,
				schedule.destinationId,
				schedule.amount,
				schedule.estimated ? 1 : 0,
				schedule.frequency,
				schedule.startDate,
				schedule.endDate ?? null,
				schedule.terminateAtZero ? 1 : 0,
				schedule.groupId ?? null,
				schedule.id,
			);
		},
		remove: (id) => {
			db.prepare("DELETE FROM schedules WHERE id = ?").run(id);
		},
	};

	const scheduleGroups: ScheduleGroupStore = {
		list: () =>
			(
				db.prepare("SELECT * FROM schedule_groups").all() as Record<
					string,
					unknown
				>[]
			).map(rowToScheduleGroup),
		get: (id) => {
			const row = db
				.prepare("SELECT * FROM schedule_groups WHERE id = ?")
				.get(id) as Record<string, unknown> | null;
			return row ? rowToScheduleGroup(row) : null;
		},
		createWithMembers: db.transaction(
			(group: ScheduleGroup, memberSchedules: Schedule[]) => {
				db.prepare("INSERT INTO schedule_groups (id, name) VALUES (?, ?)").run(
					group.id,
					group.name,
				);
				for (const schedule of memberSchedules) {
					schedules.create(schedule);
				}
			},
		),
	};

	const adjustments: AdjustmentStore = {
		list: () =>
			(
				db.prepare("SELECT * FROM adjustments").all() as Record<
					string,
					unknown
				>[]
			).map(rowToAdjustment),
		create: (adjustment) => {
			db.prepare(
				"INSERT INTO adjustments (id, account_id, date, actual_balance) VALUES (?, ?, ?, ?)",
			).run(
				adjustment.id,
				adjustment.accountId,
				adjustment.date,
				adjustment.actualBalance,
			);
		},
		remove: (id) => {
			db.prepare("DELETE FROM adjustments WHERE id = ?").run(id);
		},
	};

	const scenarios: ScenarioStore = {
		list: () =>
			(
				db.prepare("SELECT * FROM scenarios").all() as Record<string, unknown>[]
			).map(rowToScenario),
		get: (id) => {
			const row = db
				.prepare("SELECT * FROM scenarios WHERE id = ?")
				.get(id) as Record<string, unknown> | null;
			return row ? rowToScenario(row) : null;
		},
		create: (scenario) => {
			db.prepare(
				"INSERT INTO scenarios (id, name, schedule_overrides, additional_schedules, additional_accounts) VALUES (?, ?, ?, ?, ?)",
			).run(
				scenario.id,
				scenario.name,
				JSON.stringify(scenario.scheduleOverrides),
				JSON.stringify(scenario.additionalSchedules),
				JSON.stringify(scenario.additionalAccounts),
			);
		},
		update: (scenario) => {
			db.prepare(
				"UPDATE scenarios SET name = ?, schedule_overrides = ?, additional_schedules = ?, additional_accounts = ? WHERE id = ?",
			).run(
				scenario.name,
				JSON.stringify(scenario.scheduleOverrides),
				JSON.stringify(scenario.additionalSchedules),
				JSON.stringify(scenario.additionalAccounts),
				scenario.id,
			);
		},
		remove: (id) => {
			db.prepare("DELETE FROM scenarios WHERE id = ?").run(id);
		},
	};

	return {
		accounts,
		parties,
		schedules,
		scheduleGroups,
		adjustments,
		scenarios,
	};
}
