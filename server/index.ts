import { existsSync, readFileSync } from "node:fs";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { project } from "../src/engine/projection";
import type {
	Account,
	Adjustment,
	ExternalParty,
	Scenario,
	Schedule,
	ScheduleGroup,
} from "../src/engine/types";

export interface AccountStore {
	list(): Account[];
	get(id: string): Account | null;
	create(account: Account): void;
	update(account: Account): void;
	remove(id: string): void;
}

export interface ExternalPartyStore {
	list(): ExternalParty[];
	get(id: string): ExternalParty | null;
	create(party: ExternalParty): void;
	update(party: ExternalParty): void;
	remove(id: string): void;
}

export interface ScheduleStore {
	list(): Schedule[];
	get(id: string): Schedule | null;
	create(schedule: Schedule): void;
	update(schedule: Schedule): void;
	remove(id: string): void;
}

export interface ScheduleGroupStore {
	list(): ScheduleGroup[];
	get(id: string): ScheduleGroup | null;
}

export interface AdjustmentStore {
	list(): Adjustment[];
	create(adjustment: Adjustment): void;
	remove(id: string): void;
}

export interface ScenarioStore {
	list(): Scenario[];
	get(id: string): Scenario | null;
	create(scenario: Scenario): void;
	update(scenario: Scenario): void;
	remove(id: string): void;
}

export interface Stores {
	accounts: AccountStore;
	schedules: ScheduleStore;
	scheduleGroups: ScheduleGroupStore;
	parties: ExternalPartyStore;
	scenarios: ScenarioStore;
	adjustments: AdjustmentStore;
}

export function createApp(stores: Stores, apiKey: string): Hono {
	const app = new Hono();
	const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

	app.use("*", cors({ origin: corsOrigin }));

	app.get("/api/health", (c) => c.json({ ok: true }));

	app.use("/api/*", async (c, next) => {
		const auth = c.req.header("Authorization");
		if (!auth || auth !== `Bearer ${apiKey}`) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		await next();
	});

	// --- Accounts ---

	app.get("/api/accounts", (c) => c.json(stores.accounts.list()));

	app.post("/api/accounts", async (c) => {
		const body = await c.req.json<Account>();
		stores.accounts.create(body);
		return c.json(body, 201);
	});

	app.get("/api/accounts/:id", (c) => {
		const account = stores.accounts.get(c.req.param("id"));
		if (!account) return c.json({ error: "Not found" }, 404);
		return c.json(account);
	});

	app.put("/api/accounts/:id", async (c) => {
		const body = await c.req.json<Account>();
		if (body.id !== c.req.param("id"))
			return c.json({ error: "ID mismatch" }, 400);
		stores.accounts.update(body);
		return c.json(body);
	});

	app.delete("/api/accounts/:id", (c) => {
		stores.accounts.remove(c.req.param("id"));
		return c.body(null, 204);
	});

	// --- External Parties ---

	app.get("/api/external-parties", (c) => c.json(stores.parties.list()));

	app.post("/api/external-parties", async (c) => {
		const body = await c.req.json<ExternalParty>();
		stores.parties.create(body);
		return c.json(body, 201);
	});

	app.get("/api/external-parties/:id", (c) => {
		const party = stores.parties.get(c.req.param("id"));
		if (!party) return c.json({ error: "Not found" }, 404);
		return c.json(party);
	});

	app.put("/api/external-parties/:id", async (c) => {
		const body = await c.req.json<ExternalParty>();
		if (body.id !== c.req.param("id"))
			return c.json({ error: "ID mismatch" }, 400);
		stores.parties.update(body);
		return c.json(body);
	});

	app.delete("/api/external-parties/:id", (c) => {
		stores.parties.remove(c.req.param("id"));
		return c.body(null, 204);
	});

	// --- Schedules ---

	app.get("/api/schedules", (c) => c.json(stores.schedules.list()));

	app.post("/api/schedules", async (c) => {
		const body = await c.req.json<Schedule>();
		stores.schedules.create(body);
		return c.json(body, 201);
	});

	app.get("/api/schedules/:id", (c) => {
		const schedule = stores.schedules.get(c.req.param("id"));
		if (!schedule) return c.json({ error: "Not found" }, 404);
		return c.json(schedule);
	});

	app.put("/api/schedules/:id", async (c) => {
		const body = await c.req.json<Schedule>();
		if (body.id !== c.req.param("id"))
			return c.json({ error: "ID mismatch" }, 400);
		stores.schedules.update(body);
		return c.json(body);
	});

	app.delete("/api/schedules/:id", (c) => {
		stores.schedules.remove(c.req.param("id"));
		return c.body(null, 204);
	});

	// --- Schedule Groups ---

	app.get("/api/schedule-groups", (c) =>
		c.json(stores.scheduleGroups.list()),
	);

	app.get("/api/schedule-groups/:id", (c) => {
		const group = stores.scheduleGroups.get(c.req.param("id"));
		if (!group) return c.json({ error: "Not found" }, 404);
		return c.json(group);
	});

	// --- Adjustments ---

	app.get("/api/adjustments", (c) => c.json(stores.adjustments.list()));

	app.post("/api/adjustments", async (c) => {
		const body = await c.req.json<Adjustment>();
		stores.adjustments.create(body);
		return c.json(body, 201);
	});

	app.delete("/api/adjustments/:id", (c) => {
		stores.adjustments.remove(c.req.param("id"));
		return c.body(null, 204);
	});

	// --- Scenarios ---

	app.get("/api/scenarios", (c) => c.json(stores.scenarios.list()));

	app.post("/api/scenarios", async (c) => {
		const body = await c.req.json<Scenario>();
		stores.scenarios.create(body);
		return c.json(body, 201);
	});

	app.get("/api/scenarios/:id", (c) => {
		const scenario = stores.scenarios.get(c.req.param("id"));
		if (!scenario) return c.json({ error: "Not found" }, 404);
		return c.json(scenario);
	});

	app.put("/api/scenarios/:id", async (c) => {
		const body = await c.req.json<Scenario>();
		if (body.id !== c.req.param("id"))
			return c.json({ error: "ID mismatch" }, 400);
		stores.scenarios.update(body);
		return c.json(body);
	});

	app.delete("/api/scenarios/:id", (c) => {
		stores.scenarios.remove(c.req.param("id"));
		return c.body(null, 204);
	});

	// --- Projection ---

	app.get("/api/projection", async (c) => {
		const startDate = c.req.query("startDate");
		const endDate = c.req.query("endDate");
		if (!startDate || !endDate) {
			return c.json({ error: "startDate and endDate are required" }, 400);
		}

		const accounts = stores.accounts.list();
		const externalParties = stores.parties.list();
		const schedules = stores.schedules.list();
		const adjustments = stores.adjustments.list();

		const scenarioId = c.req.query("scenarioId");
		let scenario: Scenario | undefined;
		if (scenarioId) {
			const found = stores.scenarios.get(scenarioId);
			if (!found) return c.json({ error: "Not found" }, 404);
			scenario = found;
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

	return app;
}
