import { serve } from "@hono/node-server";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { project } from "../src/engine/projection";
import type {
	Account,
	Adjustment,
	ExternalParty,
	Scenario,
	Schedule,
} from "../src/engine/types";
import db from "./db";

const app = new Hono();
const API_KEY = process.env.FINPLAN_API_KEY ?? "";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use("*", cors({ origin: CORS_ORIGIN }));

if (!API_KEY) {
	console.error("Error: FINPLAN_API_KEY is not set. Refusing to start.");
	process.exit(1);
}

app.get("/api/health", (c) => c.json({ ok: true }));

app.use("/api/*", async (c, next) => {
	const auth = c.req.header("Authorization");
	if (!auth || auth !== `Bearer ${API_KEY}`) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});

// --- Accounts ---

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

app.get("/api/accounts", (c) => {
	const rows = db.prepare("SELECT * FROM accounts").all() as Record<
		string,
		unknown
	>[];
	return c.json(rows.map(rowToAccount));
});

app.post("/api/accounts", async (c) => {
	const body = await c.req.json<Account>();
	db.prepare(
		"INSERT INTO accounts (id, name, type, owner, institution, seed_balance, seed_date, rate, amortizing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
	).run(
		body.id,
		body.name,
		body.type,
		body.owner,
		body.institution ?? "",
		body.seedBalance,
		body.seedDate,
		body.rate,
		body.amortizing ? 1 : 0,
	);
	return c.json(body, 201);
});

app.get("/api/accounts/:id", (c) => {
	const row = db
		.prepare("SELECT * FROM accounts WHERE id = ?")
		.get(c.req.param("id")) as Record<string, unknown> | null;
	if (!row) return c.json({ error: "Not found" }, 404);
	return c.json(rowToAccount(row));
});

app.put("/api/accounts/:id", async (c) => {
	const body = await c.req.json<Account>();
	if (body.id !== c.req.param("id"))
		return c.json({ error: "ID mismatch" }, 400);
	db.prepare(
		"UPDATE accounts SET name = ?, type = ?, owner = ?, institution = ?, seed_balance = ?, seed_date = ?, rate = ?, amortizing = ? WHERE id = ?",
	).run(
		body.name,
		body.type,
		body.owner,
		body.institution ?? "",
		body.seedBalance,
		body.seedDate,
		body.rate,
		body.amortizing ? 1 : 0,
		c.req.param("id"),
	);
	return c.json(body);
});

app.delete("/api/accounts/:id", (c) => {
	db.prepare("DELETE FROM accounts WHERE id = ?").run(c.req.param("id"));
	return c.body(null, 204);
});

// --- External Parties ---

function rowToParty(row: Record<string, unknown>): ExternalParty {
	return { id: row.id as string, name: row.name as string };
}

app.get("/api/external-parties", (c) => {
	const rows = db.prepare("SELECT * FROM external_parties").all() as Record<
		string,
		unknown
	>[];
	return c.json(rows.map(rowToParty));
});

app.post("/api/external-parties", async (c) => {
	const body = await c.req.json<ExternalParty>();
	db.prepare("INSERT INTO external_parties (id, name) VALUES (?, ?)").run(
		body.id,
		body.name,
	);
	return c.json(body, 201);
});

app.get("/api/external-parties/:id", (c) => {
	const row = db
		.prepare("SELECT * FROM external_parties WHERE id = ?")
		.get(c.req.param("id")) as Record<string, unknown> | null;
	if (!row) return c.json({ error: "Not found" }, 404);
	return c.json(rowToParty(row));
});

app.put("/api/external-parties/:id", async (c) => {
	const body = await c.req.json<ExternalParty>();
	if (body.id !== c.req.param("id"))
		return c.json({ error: "ID mismatch" }, 400);
	db.prepare("UPDATE external_parties SET name = ? WHERE id = ?").run(
		body.name,
		c.req.param("id"),
	);
	return c.json(body);
});

app.delete("/api/external-parties/:id", (c) => {
	db.prepare("DELETE FROM external_parties WHERE id = ?").run(
		c.req.param("id"),
	);
	return c.body(null, 204);
});

// --- Schedules ---

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
	};
}

app.get("/api/schedules", (c) => {
	const rows = db.prepare("SELECT * FROM schedules").all() as Record<
		string,
		unknown
	>[];
	return c.json(rows.map(rowToSchedule));
});

app.post("/api/schedules", async (c) => {
	const body = await c.req.json<Schedule>();
	db.prepare(
		"INSERT INTO schedules (id, source_id, destination_id, amount, estimated, frequency, start_date, end_date, terminate_at_zero) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
	).run(
		body.id,
		body.sourceId,
		body.destinationId,
		body.amount,
		body.estimated ? 1 : 0,
		body.frequency,
		body.startDate,
		body.endDate ?? null,
		body.terminateAtZero ? 1 : 0,
	);
	return c.json(body, 201);
});

app.get("/api/schedules/:id", (c) => {
	const row = db
		.prepare("SELECT * FROM schedules WHERE id = ?")
		.get(c.req.param("id")) as Record<string, unknown> | null;
	if (!row) return c.json({ error: "Not found" }, 404);
	return c.json(rowToSchedule(row));
});

app.put("/api/schedules/:id", async (c) => {
	const body = await c.req.json<Schedule>();
	if (body.id !== c.req.param("id"))
		return c.json({ error: "ID mismatch" }, 400);
	db.prepare(
		"UPDATE schedules SET source_id = ?, destination_id = ?, amount = ?, estimated = ?, frequency = ?, start_date = ?, end_date = ?, terminate_at_zero = ? WHERE id = ?",
	).run(
		body.sourceId,
		body.destinationId,
		body.amount,
		body.estimated ? 1 : 0,
		body.frequency,
		body.startDate,
		body.endDate ?? null,
		body.terminateAtZero ? 1 : 0,
		c.req.param("id"),
	);
	return c.json(body);
});

app.delete("/api/schedules/:id", (c) => {
	db.prepare("DELETE FROM schedules WHERE id = ?").run(c.req.param("id"));
	return c.body(null, 204);
});

// --- Adjustments ---

function rowToAdjustment(row: Record<string, unknown>): Adjustment {
	return {
		id: row.id as string,
		accountId: row.account_id as string,
		date: row.date as string,
		actualBalance: row.actual_balance as number,
	};
}

app.get("/api/adjustments", (c) => {
	const rows = db.prepare("SELECT * FROM adjustments").all() as Record<
		string,
		unknown
	>[];
	return c.json(rows.map(rowToAdjustment));
});

app.post("/api/adjustments", async (c) => {
	const body = await c.req.json<Adjustment>();
	db.prepare(
		"INSERT INTO adjustments (id, account_id, date, actual_balance) VALUES (?, ?, ?, ?)",
	).run(body.id, body.accountId, body.date, body.actualBalance);
	return c.json(body, 201);
});

app.delete("/api/adjustments/:id", (c) => {
	db.prepare("DELETE FROM adjustments WHERE id = ?").run(c.req.param("id"));
	return c.body(null, 204);
});

// --- Scenarios ---

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

app.get("/api/scenarios", (c) => {
	const rows = db.prepare("SELECT * FROM scenarios").all() as Record<
		string,
		unknown
	>[];
	return c.json(rows.map(rowToScenario));
});

app.post("/api/scenarios", async (c) => {
	const body = await c.req.json<Scenario>();
	db.prepare(
		"INSERT INTO scenarios (id, name, schedule_overrides, additional_schedules, additional_accounts) VALUES (?, ?, ?, ?, ?)",
	).run(
		body.id,
		body.name,
		JSON.stringify(body.scheduleOverrides),
		JSON.stringify(body.additionalSchedules),
		JSON.stringify(body.additionalAccounts),
	);
	return c.json(body, 201);
});

app.get("/api/scenarios/:id", (c) => {
	const row = db
		.prepare("SELECT * FROM scenarios WHERE id = ?")
		.get(c.req.param("id")) as Record<string, unknown> | null;
	if (!row) return c.json({ error: "Not found" }, 404);
	return c.json(rowToScenario(row));
});

app.put("/api/scenarios/:id", async (c) => {
	const body = await c.req.json<Scenario>();
	if (body.id !== c.req.param("id"))
		return c.json({ error: "ID mismatch" }, 400);
	db.prepare(
		"UPDATE scenarios SET name = ?, schedule_overrides = ?, additional_schedules = ?, additional_accounts = ? WHERE id = ?",
	).run(
		body.name,
		JSON.stringify(body.scheduleOverrides),
		JSON.stringify(body.additionalSchedules),
		JSON.stringify(body.additionalAccounts),
		c.req.param("id"),
	);
	return c.json(body);
});

app.delete("/api/scenarios/:id", (c) => {
	db.prepare("DELETE FROM scenarios WHERE id = ?").run(c.req.param("id"));
	return c.body(null, 204);
});

// --- Projection ---

app.get("/api/projection", async (c) => {
	const startDate = c.req.query("startDate");
	const endDate = c.req.query("endDate");
	if (!startDate || !endDate) {
		return c.json({ error: "startDate and endDate are required" }, 400);
	}

	const accounts = (
		db.prepare("SELECT * FROM accounts").all() as Record<string, unknown>[]
	).map(rowToAccount);
	const externalParties = (
		db.prepare("SELECT * FROM external_parties").all() as Record<
			string,
			unknown
		>[]
	).map(rowToParty);
	const schedules = (
		db.prepare("SELECT * FROM schedules").all() as Record<string, unknown>[]
	).map(rowToSchedule);
	const adjustments = (
		db.prepare("SELECT * FROM adjustments").all() as Record<string, unknown>[]
	).map(rowToAdjustment);

	const scenarioId = c.req.query("scenarioId");
	let scenario: Scenario | undefined;
	if (scenarioId) {
		const row = db
			.prepare("SELECT * FROM scenarios WHERE id = ?")
			.get(scenarioId) as Record<string, unknown> | null;
		if (!row) return c.json({ error: "Not found" }, 404);
		scenario = rowToScenario(row);
	}

	const noAdj = c.req.query("noAdj") === "1";
	const result = project({
		accounts,
		externalParties,
		schedules,
		adjustments: noAdj ? [] : adjustments,
		scenario,
		startDate,
		endDate,
	});
	return c.json(result);
});

// --- Static files (production) ---

app.get("*", (c) => {
	const distDir = "./dist";
	const filePath = `${distDir}${c.req.path}`;

	if (existsSync(filePath)) {
		return new Response(readFileSync(filePath));
	}

	if (existsSync(`${distDir}/index.html`)) {
		return new Response(readFileSync(`${distDir}/index.html`));
	}

	return c.text("Not found", 404);
});

export default { fetch: app.fetch };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) });
}
