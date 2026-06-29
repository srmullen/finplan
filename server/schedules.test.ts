import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import type { Schedule } from "../src/engine/types";
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

const sampleSchedule: Schedule = {
	id: "sched-1",
	sourceId: "party-1",
	destinationId: "acc-1",
	amount: 500,
	estimated: false,
	frequency: "monthly",
	startDate: "2024-01-01",
	terminateAtZero: false,
};

describe("GET /api/schedules — SQLite", () => {
	it("returns empty array when no schedules exist", async () => {
		const app = makeApp();
		const res = await req(app, "/api/schedules");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});
});

describe("POST /api/schedules — SQLite", () => {
	it("creates schedule and returns 201", async () => {
		const app = makeApp();
		const res = await req(app, "/api/schedules", "POST", sampleSchedule);
		expect(res.status).toBe(201);
	});
});

describe("GET /api/schedules/:id — SQLite", () => {
	it("returns schedule when found", async () => {
		const app = makeApp();
		await req(app, "/api/schedules", "POST", sampleSchedule);
		const res = await req(app, "/api/schedules/sched-1");
		expect(res.status).toBe(200);
		const data = (await res.json()) as Schedule;
		expect(data.id).toBe("sched-1");
	});

	it("returns 404 when not found", async () => {
		const app = makeApp();
		const res = await req(app, "/api/schedules/nonexistent");
		expect(res.status).toBe(404);
	});
});

describe("PUT /api/schedules/:id — SQLite", () => {
	it("returns 400 when body.id does not match URL :id", async () => {
		const app = makeApp();
		const res = await req(app, "/api/schedules/sched-1", "PUT", {
			...sampleSchedule,
			id: "wrong",
		});
		expect(res.status).toBe(400);
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const app = makeApp();
		await req(app, "/api/schedules", "POST", sampleSchedule);
		const res = await req(app, "/api/schedules/sched-1", "PUT", {
			...sampleSchedule,
			amount: 750,
		});
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/schedules/:id — SQLite", () => {
	it("returns 204 and removes the schedule", async () => {
		const app = makeApp();
		await req(app, "/api/schedules", "POST", sampleSchedule);
		const res = await req(app, "/api/schedules/sched-1", "DELETE");
		expect(res.status).toBe(204);
		const listRes = await req(app, "/api/schedules");
		expect(await listRes.json()).toEqual([]);
	});
});
