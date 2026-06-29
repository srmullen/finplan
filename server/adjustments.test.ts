import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import type { Adjustment } from "../src/engine/types";
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

const sampleAdjustment: Adjustment = {
	id: "adj-1",
	accountId: "acc-1",
	date: "2024-01-15",
	actualBalance: 2000,
};

describe("GET /api/adjustments — SQLite", () => {
	it("returns empty array when no adjustments exist", async () => {
		const app = makeApp();
		const res = await req(app, "/api/adjustments");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});
});

describe("POST /api/adjustments — SQLite", () => {
	it("creates adjustment and returns 201", async () => {
		const app = makeApp();
		const res = await req(app, "/api/adjustments", "POST", sampleAdjustment);
		expect(res.status).toBe(201);
	});
});

describe("DELETE /api/adjustments/:id — SQLite", () => {
	it("returns 204 and removes the adjustment", async () => {
		const app = makeApp();
		await req(app, "/api/adjustments", "POST", sampleAdjustment);
		const res = await req(app, "/api/adjustments/adj-1", "DELETE");
		expect(res.status).toBe(204);
		const listRes = await req(app, "/api/adjustments");
		expect(await listRes.json()).toEqual([]);
	});
});
