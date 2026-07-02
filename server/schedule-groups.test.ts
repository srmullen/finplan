import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { createApp } from "./index";
import { createSQLiteStores } from "./stores";

const AUTH = "Bearer test-key";

function makeApp() {
	const db = new Database(":memory:");
	const stores = createSQLiteStores(db);
	return { app: createApp(stores, "test-key"), db };
}

function req(
	app: ReturnType<typeof makeApp>["app"],
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

describe("GET /api/schedule-groups — SQLite", () => {
	it("returns empty array when no groups exist", async () => {
		const { app } = makeApp();
		const res = await req(app, "/api/schedule-groups");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});

	it("returns groups inserted directly into the store", async () => {
		const { app, db } = makeApp();
		db.prepare("INSERT INTO schedule_groups (id, name) VALUES (?, ?)").run(
			"g1",
			"Mortgage",
		);
		const res = await req(app, "/api/schedule-groups");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([{ id: "g1", name: "Mortgage" }]);
	});
});

describe("GET /api/schedule-groups/:id — SQLite", () => {
	it("returns group when found", async () => {
		const { app, db } = makeApp();
		db.prepare("INSERT INTO schedule_groups (id, name) VALUES (?, ?)").run(
			"g1",
			"Mortgage",
		);
		const res = await req(app, "/api/schedule-groups/g1");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ id: "g1", name: "Mortgage" });
	});

	it("returns 404 when not found", async () => {
		const { app } = makeApp();
		const res = await req(app, "/api/schedule-groups/nonexistent");
		expect(res.status).toBe(404);
	});
});
