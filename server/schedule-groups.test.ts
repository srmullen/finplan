import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import type { Schedule } from "../src/engine/types";
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

describe("POST /api/schedule-groups — SQLite", () => {
	const memberA: Schedule = {
		id: "s-a",
		sourceId: "acc-1",
		destinationId: "loan-1",
		amount: 1500,
		estimated: false,
		frequency: "monthly",
		startDate: "2024-01-01",
		terminateAtZero: false,
	};
	const memberB: Schedule = {
		id: "s-b",
		sourceId: "acc-1",
		destinationId: "party-1",
		amount: 500,
		estimated: false,
		frequency: "monthly",
		startDate: "2024-01-01",
		terminateAtZero: false,
	};

	it("creates the group and member schedules atomically, returns 201", async () => {
		const { app, db } = makeApp();
		const res = await req(app, "/api/schedule-groups", "POST", {
			group: { id: "g1", name: "Mortgage" },
			schedules: [memberA, memberB],
		});
		expect(res.status).toBe(201);

		const groupRow = db
			.prepare("SELECT * FROM schedule_groups WHERE id = ?")
			.get("g1");
		expect(groupRow).toMatchObject({ id: "g1", name: "Mortgage" });

		const scheduleRows = db
			.prepare("SELECT * FROM schedules WHERE group_id = ?")
			.all("g1");
		expect(scheduleRows).toHaveLength(2);
	});

	it("returns 400 and persists nothing when fewer than two member schedules are provided", async () => {
		const { app, db } = makeApp();
		const res = await req(app, "/api/schedule-groups", "POST", {
			group: { id: "g1", name: "Mortgage" },
			schedules: [memberA],
		});
		expect(res.status).toBe(400);

		const groupRow = db
			.prepare("SELECT * FROM schedule_groups WHERE id = ?")
			.get("g1");
		expect(groupRow).toBeUndefined();
	});

	it("returns 400 and persists nothing when sources mismatch", async () => {
		const { app, db } = makeApp();
		const res = await req(app, "/api/schedule-groups", "POST", {
			group: { id: "g1", name: "Mortgage" },
			schedules: [memberA, { ...memberB, sourceId: "other-acc" }],
		});
		expect(res.status).toBe(400);

		const groupRow = db
			.prepare("SELECT * FROM schedule_groups WHERE id = ?")
			.get("g1");
		expect(groupRow).toBeUndefined();

		const scheduleRows = db.prepare("SELECT * FROM schedules").all();
		expect(scheduleRows).toHaveLength(0);
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

describe("PUT /api/schedule-groups/:id — SQLite", () => {
	const memberA: Schedule = {
		id: "s-a",
		sourceId: "acc-1",
		destinationId: "loan-1",
		amount: 1500,
		estimated: false,
		frequency: "monthly",
		startDate: "2024-01-01",
		terminateAtZero: false,
	};
	const memberB: Schedule = {
		id: "s-b",
		sourceId: "acc-1",
		destinationId: "party-1",
		amount: 500,
		estimated: false,
		frequency: "monthly",
		startDate: "2024-01-01",
		terminateAtZero: false,
	};

	function seedGroup(app: ReturnType<typeof makeApp>["app"]) {
		return req(app, "/api/schedule-groups", "POST", {
			group: { id: "g1", name: "Mortgage" },
			schedules: [memberA, memberB],
		});
	}

	it("renames the group and reconciles members atomically, returns 200", async () => {
		const { app, db } = makeApp();
		await seedGroup(app);

		const memberC: Schedule = { ...memberB, id: "s-c", amount: 250 };
		const res = await req(app, "/api/schedule-groups/g1", "PUT", {
			group: { id: "g1", name: "Renamed" },
			schedules: [memberA, memberC],
		});
		expect(res.status).toBe(200);

		const groupRow = db
			.prepare("SELECT * FROM schedule_groups WHERE id = ?")
			.get("g1");
		expect(groupRow).toMatchObject({ name: "Renamed" });

		const memberIds = (
			db
				.prepare("SELECT id FROM schedules WHERE group_id = ?")
				.all("g1") as { id: string }[]
		)
			.map((r) => r.id)
			.sort();
		expect(memberIds).toEqual(["s-a", "s-c"]);
	});

	it("returns 400 when body.group.id does not match URL :id", async () => {
		const { app } = makeApp();
		await seedGroup(app);
		const res = await req(app, "/api/schedule-groups/g1", "PUT", {
			group: { id: "wrong", name: "Renamed" },
			schedules: [memberA, memberB],
		});
		expect(res.status).toBe(400);
	});

	it("returns 404 and persists nothing when the group does not exist", async () => {
		const { app, db } = makeApp();
		const res = await req(app, "/api/schedule-groups/nonexistent", "PUT", {
			group: { id: "nonexistent", name: "Renamed" },
			schedules: [memberA, memberB],
		});
		expect(res.status).toBe(404);
		const scheduleRows = db.prepare("SELECT * FROM schedules").all();
		expect(scheduleRows).toHaveLength(0);
	});

	it("returns 400 and leaves members unchanged when sources mismatch", async () => {
		const { app, db } = makeApp();
		await seedGroup(app);
		const res = await req(app, "/api/schedule-groups/g1", "PUT", {
			group: { id: "g1", name: "Mortgage" },
			schedules: [memberA, { ...memberB, sourceId: "other-acc" }],
		});
		expect(res.status).toBe(400);

		const scheduleRows = db
			.prepare("SELECT * FROM schedules WHERE group_id = ?")
			.all("g1");
		expect(scheduleRows).toHaveLength(2);
	});
});

describe("DELETE /api/schedule-groups/:id — SQLite", () => {
	it("cascade-deletes the group and its member schedules, returns 204", async () => {
		const { app, db } = makeApp();
		await req(app, "/api/schedule-groups", "POST", {
			group: { id: "g1", name: "Mortgage" },
			schedules: [
				{
					id: "s-a",
					sourceId: "acc-1",
					destinationId: "loan-1",
					amount: 1500,
					estimated: false,
					frequency: "monthly",
					startDate: "2024-01-01",
					terminateAtZero: false,
				},
				{
					id: "s-b",
					sourceId: "acc-1",
					destinationId: "party-1",
					amount: 500,
					estimated: false,
					frequency: "monthly",
					startDate: "2024-01-01",
					terminateAtZero: false,
				},
			],
		});

		const res = await req(app, "/api/schedule-groups/g1", "DELETE");
		expect(res.status).toBe(204);

		const groupRow = db
			.prepare("SELECT * FROM schedule_groups WHERE id = ?")
			.get("g1");
		expect(groupRow).toBeUndefined();

		const scheduleRows = db.prepare("SELECT * FROM schedules").all();
		expect(scheduleRows).toHaveLength(0);
	});
});
