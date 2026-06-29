import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import type { Account } from "../src/engine/types";
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

const sampleAccount: Account = {
	id: "acc-1",
	name: "Checking",
	type: "checking",
	owner: "Sean",
	seedBalance: 1000,
	seedDate: "2024-01-01",
	rate: 0,
	amortizing: false,
};

describe("GET /api/accounts — SQLite", () => {
	it("returns empty array when no accounts exist", async () => {
		const app = makeApp();
		const res = await req(app, "/api/accounts");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});
});

describe("POST /api/accounts — SQLite", () => {
	it("creates account and returns 201", async () => {
		const app = makeApp();
		const res = await req(app, "/api/accounts", "POST", sampleAccount);
		expect(res.status).toBe(201);
	});
});

describe("GET /api/accounts/:id — SQLite", () => {
	it("returns account when found", async () => {
		const app = makeApp();
		await req(app, "/api/accounts", "POST", sampleAccount);
		const res = await req(app, "/api/accounts/acc-1");
		expect(res.status).toBe(200);
		const data = (await res.json()) as Account;
		expect(data.id).toBe("acc-1");
	});

	it("returns 404 when not found", async () => {
		const app = makeApp();
		const res = await req(app, "/api/accounts/nonexistent");
		expect(res.status).toBe(404);
	});
});

describe("PUT /api/accounts/:id — SQLite", () => {
	it("returns 400 when body.id does not match URL :id", async () => {
		const app = makeApp();
		const res = await req(app, "/api/accounts/acc-1", "PUT", {
			...sampleAccount,
			id: "wrong",
		});
		expect(res.status).toBe(400);
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const app = makeApp();
		await req(app, "/api/accounts", "POST", sampleAccount);
		const res = await req(app, "/api/accounts/acc-1", "PUT", {
			...sampleAccount,
			name: "Updated",
		});
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/accounts/:id — SQLite", () => {
	it("returns 204 and removes the account", async () => {
		const app = makeApp();
		await req(app, "/api/accounts", "POST", sampleAccount);
		const res = await req(app, "/api/accounts/acc-1", "DELETE");
		expect(res.status).toBe(204);
		const listRes = await req(app, "/api/accounts");
		expect(await listRes.json()).toEqual([]);
	});
});
