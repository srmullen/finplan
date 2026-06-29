import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import type { Scenario } from "../src/engine/types";
import { createApp } from "./index";
import { createSQLiteStores } from "./stores";

const AUTH = "Bearer test-key";

function makeApp() {
	const db = new Database(":memory:");
	const stores = createSQLiteStores(db);
	return createApp(stores, "test-key");
}

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

const sampleScenario: Scenario = {
	id: "sc-1",
	name: "Base",
	scheduleOverrides: [],
	additionalSchedules: [],
	additionalAccounts: [],
};

describe("GET /api/scenarios — SQLite", () => {
	it("returns empty array when no scenarios exist", async () => {
		const app = makeApp();
		const res = await req(app, "/api/scenarios");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});
});

describe("POST /api/scenarios — SQLite", () => {
	it("creates scenario and returns 201", async () => {
		const app = makeApp();
		const res = await req(app, "/api/scenarios", "POST", sampleScenario);
		expect(res.status).toBe(201);
	});
});

describe("GET /api/scenarios/:id — SQLite", () => {
	it("returns scenario when found", async () => {
		const app = makeApp();
		await req(app, "/api/scenarios", "POST", sampleScenario);
		const res = await req(app, "/api/scenarios/sc-1");
		expect(res.status).toBe(200);
		const data = (await res.json()) as Scenario;
		expect(data.id).toBe("sc-1");
	});

	it("returns 404 when not found", async () => {
		const app = makeApp();
		const res = await req(app, "/api/scenarios/nonexistent");
		expect(res.status).toBe(404);
	});
});

describe("PUT /api/scenarios/:id — SQLite", () => {
	it("returns 400 when body.id does not match URL :id", async () => {
		const app = makeApp();
		const res = await req(app, "/api/scenarios/sc-1", "PUT", {
			...sampleScenario,
			id: "wrong",
		});
		expect(res.status).toBe(400);
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const app = makeApp();
		await req(app, "/api/scenarios", "POST", sampleScenario);
		const res = await req(app, "/api/scenarios/sc-1", "PUT", {
			...sampleScenario,
			name: "Updated",
		});
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/scenarios/:id — SQLite", () => {
	it("returns 204 and removes the scenario", async () => {
		const app = makeApp();
		await req(app, "/api/scenarios", "POST", sampleScenario);
		const res = await req(app, "/api/scenarios/sc-1", "DELETE");
		expect(res.status).toBe(204);
		const listRes = await req(app, "/api/scenarios");
		expect(await listRes.json()).toEqual([]);
	});
});
