import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import type { ExternalParty } from "../src/engine/types";
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

const sampleParty: ExternalParty = { id: "party-1", name: "Employer" };

describe("GET /api/external-parties — SQLite", () => {
	it("returns empty array when no parties exist", async () => {
		const app = makeApp();
		const res = await req(app, "/api/external-parties");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});
});

describe("POST /api/external-parties — SQLite", () => {
	it("creates party and returns 201", async () => {
		const app = makeApp();
		const res = await req(app, "/api/external-parties", "POST", sampleParty);
		expect(res.status).toBe(201);
	});
});

describe("GET /api/external-parties/:id — SQLite", () => {
	it("returns party when found", async () => {
		const app = makeApp();
		await req(app, "/api/external-parties", "POST", sampleParty);
		const res = await req(app, "/api/external-parties/party-1");
		expect(res.status).toBe(200);
		const data = (await res.json()) as ExternalParty;
		expect(data.id).toBe("party-1");
	});

	it("returns 404 when not found", async () => {
		const app = makeApp();
		const res = await req(app, "/api/external-parties/nonexistent");
		expect(res.status).toBe(404);
	});
});

describe("PUT /api/external-parties/:id — SQLite", () => {
	it("returns 400 when body.id does not match URL :id", async () => {
		const app = makeApp();
		const res = await req(app, "/api/external-parties/party-1", "PUT", {
			...sampleParty,
			id: "wrong",
		});
		expect(res.status).toBe(400);
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const app = makeApp();
		await req(app, "/api/external-parties", "POST", sampleParty);
		const res = await req(app, "/api/external-parties/party-1", "PUT", {
			...sampleParty,
			name: "Updated Employer",
		});
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/external-parties/:id — SQLite", () => {
	it("returns 204 and removes the party", async () => {
		const app = makeApp();
		await req(app, "/api/external-parties", "POST", sampleParty);
		const res = await req(app, "/api/external-parties/party-1", "DELETE");
		expect(res.status).toBe(204);
		const listRes = await req(app, "/api/external-parties");
		expect(await listRes.json()).toEqual([]);
	});
});
