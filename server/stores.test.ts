import Database from "better-sqlite3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSQLiteStores } from "./stores";

function createTestDb(): Database.Database {
	const db = new Database(":memory:");
	db.exec(`
    CREATE TABLE accounts (
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
	db.exec(`
    CREATE TABLE external_parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);
	db.exec(`
    CREATE TABLE schedules (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      destination_id TEXT NOT NULL,
      amount REAL NOT NULL,
      estimated INTEGER NOT NULL DEFAULT 0,
      frequency TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      terminate_at_zero INTEGER NOT NULL DEFAULT 0
    )
  `);
	db.exec(`
    CREATE TABLE adjustments (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      date TEXT NOT NULL,
      actual_balance REAL NOT NULL
    )
  `);
	db.exec(`
    CREATE TABLE scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      schedule_overrides TEXT,
      additional_schedules TEXT,
      additional_accounts TEXT
    )
  `);
	return db;
}

let db: Database.Database;
let stores: ReturnType<typeof createSQLiteStores>;

beforeEach(() => {
	db = createTestDb();
	stores = createSQLiteStores(db);
});

describe("accounts store", () => {
	const account = {
		id: "a1",
		name: "Checking",
		type: "checking" as const,
		owner: "Sean",
		seedBalance: 1000,
		seedDate: "2024-01-01",
		rate: 0,
		amortizing: false,
	};

	it("list returns empty array initially", () => {
		expect(stores.accounts.list()).toEqual([]);
	});

	it("create and list", () => {
		stores.accounts.create(account);
		expect(stores.accounts.list()).toHaveLength(1);
		expect(stores.accounts.list()[0]).toMatchObject({ id: "a1" });
	});

	it("converts amortizing integer 1 to boolean true", () => {
		db.prepare(
			"INSERT INTO accounts (id, name, type, owner, seed_balance, seed_date, rate, amortizing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		).run("a2", "Loan", "loan", "Sean", -1000, "2024-01-01", 0.05, 1);
		expect(stores.accounts.list()[0]?.amortizing).toBe(true);
	});

	it("converts amortizing integer 0 to boolean false", () => {
		stores.accounts.create(account);
		expect(stores.accounts.list()[0]?.amortizing).toBe(false);
	});

	it("omits institution when empty string", () => {
		stores.accounts.create(account);
		expect(stores.accounts.list()[0]?.institution).toBeUndefined();
	});

	it("preserves institution when set", () => {
		stores.accounts.create({ ...account, institution: "Chase" });
		expect(stores.accounts.list()[0]?.institution).toBe("Chase");
	});

	it("get returns account by id", () => {
		stores.accounts.create(account);
		expect(stores.accounts.get("a1")).toMatchObject({ id: "a1" });
	});

	it("get returns null when not found", () => {
		expect(stores.accounts.get("missing")).toBeNull();
	});

	it("update modifies the account", () => {
		stores.accounts.create(account);
		stores.accounts.update({ ...account, name: "Updated" });
		expect(stores.accounts.get("a1")?.name).toBe("Updated");
	});

	it("remove deletes the account", () => {
		stores.accounts.create(account);
		stores.accounts.remove("a1");
		expect(stores.accounts.list()).toHaveLength(0);
	});
});

describe("external parties store", () => {
	const party = { id: "p1", name: "Employer" };

	it("list returns empty array initially", () => {
		expect(stores.parties.list()).toEqual([]);
	});

	it("create and list", () => {
		stores.parties.create(party);
		expect(stores.parties.list()).toHaveLength(1);
	});

	it("get returns party by id", () => {
		stores.parties.create(party);
		expect(stores.parties.get("p1")).toMatchObject({ id: "p1" });
	});

	it("get returns null when not found", () => {
		expect(stores.parties.get("missing")).toBeNull();
	});

	it("update modifies the party", () => {
		stores.parties.create(party);
		stores.parties.update({ ...party, name: "Updated" });
		expect(stores.parties.get("p1")?.name).toBe("Updated");
	});

	it("remove deletes the party", () => {
		stores.parties.create(party);
		stores.parties.remove("p1");
		expect(stores.parties.list()).toHaveLength(0);
	});
});

describe("schedules store", () => {
	const schedule = {
		id: "s1",
		sourceId: "p1",
		destinationId: "a1",
		amount: 500,
		estimated: false,
		frequency: "monthly" as const,
		startDate: "2024-01-01",
		terminateAtZero: false,
	};

	it("list returns empty array initially", () => {
		expect(stores.schedules.list()).toEqual([]);
	});

	it("create and list", () => {
		stores.schedules.create(schedule);
		expect(stores.schedules.list()).toHaveLength(1);
	});

	it("includes endDate when present", () => {
		stores.schedules.create({ ...schedule, endDate: "2024-12-31" });
		expect(stores.schedules.list()[0]?.endDate).toBe("2024-12-31");
	});

	it("omits endDate when null in db", () => {
		stores.schedules.create(schedule);
		expect(stores.schedules.list()[0]?.endDate).toBeUndefined();
	});

	it("converts estimated integer 0 to boolean false", () => {
		stores.schedules.create(schedule);
		expect(stores.schedules.list()[0]?.estimated).toBe(false);
	});

	it("converts estimated integer 1 to boolean true", () => {
		stores.schedules.create({ ...schedule, estimated: true });
		expect(stores.schedules.list()[0]?.estimated).toBe(true);
	});

	it("get returns schedule by id", () => {
		stores.schedules.create(schedule);
		expect(stores.schedules.get("s1")).toMatchObject({ id: "s1" });
	});

	it("get returns null when not found", () => {
		expect(stores.schedules.get("missing")).toBeNull();
	});

	it("update modifies the schedule", () => {
		stores.schedules.create(schedule);
		stores.schedules.update({ ...schedule, amount: 999 });
		expect(stores.schedules.get("s1")?.amount).toBe(999);
	});

	it("remove deletes the schedule", () => {
		stores.schedules.create(schedule);
		stores.schedules.remove("s1");
		expect(stores.schedules.list()).toHaveLength(0);
	});
});

describe("adjustments store", () => {
	const adjustment = {
		id: "adj1",
		accountId: "a1",
		date: "2024-01-15",
		actualBalance: 2000,
	};

	it("list returns empty array initially", () => {
		expect(stores.adjustments.list()).toEqual([]);
	});

	it("create and list", () => {
		stores.adjustments.create(adjustment);
		expect(stores.adjustments.list()).toHaveLength(1);
	});

	it("maps account_id to accountId", () => {
		stores.adjustments.create(adjustment);
		expect(stores.adjustments.list()[0]?.accountId).toBe("a1");
	});

	it("remove deletes the adjustment", () => {
		stores.adjustments.create(adjustment);
		stores.adjustments.remove("adj1");
		expect(stores.adjustments.list()).toHaveLength(0);
	});
});

describe("scenarios store", () => {
	const scenario = {
		id: "sc1",
		name: "Test",
		scheduleOverrides: [],
		additionalSchedules: [],
		additionalAccounts: [],
	};

	it("list returns empty array initially", () => {
		expect(stores.scenarios.list()).toEqual([]);
	});

	it("create and list", () => {
		stores.scenarios.create(scenario);
		expect(stores.scenarios.list()).toHaveLength(1);
	});

	it("parses JSON columns correctly", () => {
		stores.scenarios.create(scenario);
		const s = stores.scenarios.list()[0];
		expect(s?.scheduleOverrides).toEqual([]);
		expect(s?.additionalSchedules).toEqual([]);
		expect(s?.additionalAccounts).toEqual([]);
	});

	it("returns [] for null column values in safeParseArray", () => {
		db.prepare(
			"INSERT INTO scenarios (id, name, schedule_overrides, additional_schedules, additional_accounts) VALUES (?, ?, ?, ?, ?)",
		).run("sc2", "Null Test", null, null, null);
		const s = stores.scenarios.get("sc2");
		expect(s?.scheduleOverrides).toEqual([]);
	});

	it("returns [] for empty string column values in safeParseArray", () => {
		db.prepare(
			"INSERT INTO scenarios (id, name, schedule_overrides, additional_schedules, additional_accounts) VALUES (?, ?, ?, ?, ?)",
		).run("sc3", "Empty Test", "", "", "");
		const s = stores.scenarios.get("sc3");
		expect(s?.scheduleOverrides).toEqual([]);
	});

	it("returns [] when JSON parses to a non-array in safeParseArray", () => {
		db.prepare(
			"INSERT INTO scenarios (id, name, schedule_overrides, additional_schedules, additional_accounts) VALUES (?, ?, ?, ?, ?)",
		).run("sc4", "Obj Test", '{"key":"value"}', "[]", "[]");
		expect(stores.scenarios.get("sc4")?.scheduleOverrides).toEqual([]);
	});

	it("returns [] and warns when JSON is invalid in safeParseArray", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		db.prepare(
			"INSERT INTO scenarios (id, name, schedule_overrides, additional_schedules, additional_accounts) VALUES (?, ?, ?, ?, ?)",
		).run("sc5", "Bad JSON", "invalid-json", "[]", "[]");
		expect(stores.scenarios.get("sc5")?.scheduleOverrides).toEqual([]);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it("get returns scenario by id", () => {
		stores.scenarios.create(scenario);
		expect(stores.scenarios.get("sc1")).toMatchObject({ id: "sc1" });
	});

	it("get returns null when not found", () => {
		expect(stores.scenarios.get("missing")).toBeNull();
	});

	it("update modifies the scenario", () => {
		stores.scenarios.create(scenario);
		stores.scenarios.update({ ...scenario, name: "Updated" });
		expect(stores.scenarios.get("sc1")?.name).toBe("Updated");
	});

	it("remove deletes the scenario", () => {
		stores.scenarios.create(scenario);
		stores.scenarios.remove("sc1");
		expect(stores.scenarios.list()).toHaveLength(0);
	});
});
