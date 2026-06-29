import { Database } from "bun:sqlite";
import { describe, expect, it } from "bun:test";
import type { Account, Adjustment, ExternalParty, Scenario, Schedule } from "../src/engine/types";
import {
	createApp,
	type AdjustmentStore,
	type ExternalPartyStore,
	type ScenarioStore,
	type ScheduleStore,
	type Stores,
} from "./index";
import { createBunAccountStore, initAccountSchema } from "./stores.bun";

function stubPartyStore(): ExternalPartyStore {
	const items: ExternalParty[] = [];
	return {
		list: () => [...items],
		get: (id) => items.find((p) => p.id === id) ?? null,
		create: (p) => { items.push(p); },
		update: (p) => { const i = items.findIndex((x) => x.id === p.id); if (i >= 0) items[i] = p; },
		remove: (id) => { const i = items.findIndex((x) => x.id === id); if (i >= 0) items.splice(i, 1); },
	};
}

function stubScheduleStore(): ScheduleStore {
	const items: Schedule[] = [];
	return {
		list: () => [...items],
		get: (id) => items.find((s) => s.id === id) ?? null,
		create: (s) => { items.push(s); },
		update: (s) => { const i = items.findIndex((x) => x.id === s.id); if (i >= 0) items[i] = s; },
		remove: (id) => { const i = items.findIndex((x) => x.id === id); if (i >= 0) items.splice(i, 1); },
	};
}

function stubAdjustmentStore(): AdjustmentStore {
	const items: Adjustment[] = [];
	return {
		list: () => [...items],
		create: (a) => { items.push(a); },
		remove: (id) => { const i = items.findIndex((x) => x.id === id); if (i >= 0) items.splice(i, 1); },
	};
}

function stubScenarioStore(): ScenarioStore {
	const items: Scenario[] = [];
	return {
		list: () => [...items],
		get: (id) => items.find((s) => s.id === id) ?? null,
		create: (s) => { items.push(s); },
		update: (s) => { const i = items.findIndex((x) => x.id === s.id); if (i >= 0) items[i] = s; },
		remove: (id) => { const i = items.findIndex((x) => x.id === id); if (i >= 0) items.splice(i, 1); },
	};
}

function makeApp() {
	const db = new Database(":memory:");
	initAccountSchema(db);
	const stores: Stores = {
		accounts: createBunAccountStore(db),
		parties: stubPartyStore(),
		schedules: stubScheduleStore(),
		adjustments: stubAdjustmentStore(),
		scenarios: stubScenarioStore(),
	};
	return createApp(stores, "test-key");
}

const AUTH = "Bearer test-key";

function req(
	app: ReturnType<typeof makeApp>,
	path: string,
	method = "GET",
	body?: unknown,
) {
	return app.fetch(
		new Request(`http://localhost${path}`, {
			method,
			headers: {
				Authorization: AUTH,
				...(body ? { "Content-Type": "application/json" } : {}),
			},
			...(body ? { body: JSON.stringify(body) } : {}),
		}),
	);
}

const account: Account = {
	id: "acc-1",
	name: "Checking",
	type: "checking",
	owner: "Sean",
	seedBalance: 1000,
	seedDate: "2024-01-01",
	rate: 0,
	amortizing: false,
};

describe("GET /api/accounts", () => {
	it("returns empty array initially", async () => {
		const app = makeApp();
		const res = await req(app, "/api/accounts");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});
});

describe("POST /api/accounts", () => {
	it("creates account and returns 201", async () => {
		const app = makeApp();
		const res = await req(app, "/api/accounts", "POST", account);
		expect(res.status).toBe(201);
		const data = (await res.json()) as { id: string };
		expect(data.id).toBe("acc-1");
	});
});

describe("GET /api/accounts/:id", () => {
	it("returns 404 when not found", async () => {
		const app = makeApp();
		const res = await req(app, "/api/accounts/nonexistent");
		expect(res.status).toBe(404);
	});

	it("returns account when found", async () => {
		const app = makeApp();
		await req(app, "/api/accounts", "POST", account);
		const res = await req(app, "/api/accounts/acc-1");
		expect(res.status).toBe(200);
		const data = (await res.json()) as { id: string };
		expect(data.id).toBe("acc-1");
	});
});

describe("PUT /api/accounts/:id", () => {
	it("returns 400 when body.id does not match URL :id", async () => {
		const app = makeApp();
		const res = await req(app, "/api/accounts/acc-1", "PUT", {
			...account,
			id: "wrong",
		});
		expect(res.status).toBe(400);
	});

	it("returns 200 when IDs match", async () => {
		const app = makeApp();
		await req(app, "/api/accounts", "POST", account);
		const res = await req(app, "/api/accounts/acc-1", "PUT", account);
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/accounts/:id", () => {
	it("returns 204", async () => {
		const app = makeApp();
		await req(app, "/api/accounts", "POST", account);
		const res = await req(app, "/api/accounts/acc-1", "DELETE");
		expect(res.status).toBe(204);
	});
});
