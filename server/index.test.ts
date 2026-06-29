import { describe, expect, it } from "vitest";
import type {
	Account,
	Adjustment,
	ExternalParty,
	Scenario,
	Schedule,
} from "../src/engine/types";
import { createApp } from "./index";
import type {
	AccountStore,
	AdjustmentStore,
	ExternalPartyStore,
	ScenarioStore,
	ScheduleStore,
	Stores,
} from "./index";

function makeAccountStore(): AccountStore {
	const items: Account[] = [];
	return {
		list: () => [...items],
		get: (id) => items.find((a) => a.id === id) ?? null,
		create: (a) => {
			items.push(a);
		},
		update: (a) => {
			const i = items.findIndex((x) => x.id === a.id);
			if (i >= 0) items[i] = a;
		},
		remove: (id) => {
			const i = items.findIndex((x) => x.id === id);
			if (i >= 0) items.splice(i, 1);
		},
	};
}

function makePartyStore(): ExternalPartyStore {
	const items: ExternalParty[] = [];
	return {
		list: () => [...items],
		get: (id) => items.find((p) => p.id === id) ?? null,
		create: (p) => {
			items.push(p);
		},
		update: (p) => {
			const i = items.findIndex((x) => x.id === p.id);
			if (i >= 0) items[i] = p;
		},
		remove: (id) => {
			const i = items.findIndex((x) => x.id === id);
			if (i >= 0) items.splice(i, 1);
		},
	};
}

function makeScheduleStore(): ScheduleStore {
	const items: Schedule[] = [];
	return {
		list: () => [...items],
		get: (id) => items.find((s) => s.id === id) ?? null,
		create: (s) => {
			items.push(s);
		},
		update: (s) => {
			const i = items.findIndex((x) => x.id === s.id);
			if (i >= 0) items[i] = s;
		},
		remove: (id) => {
			const i = items.findIndex((x) => x.id === id);
			if (i >= 0) items.splice(i, 1);
		},
	};
}

function makeAdjustmentStore(): AdjustmentStore {
	const items: Adjustment[] = [];
	return {
		list: () => [...items],
		create: (a) => {
			items.push(a);
		},
		remove: (id) => {
			const i = items.findIndex((x) => x.id === id);
			if (i >= 0) items.splice(i, 1);
		},
	};
}

function makeScenarioStore(): ScenarioStore {
	const items: Scenario[] = [];
	return {
		list: () => [...items],
		get: (id) => items.find((s) => s.id === id) ?? null,
		create: (s) => {
			items.push(s);
		},
		update: (s) => {
			const i = items.findIndex((x) => x.id === s.id);
			if (i >= 0) items[i] = s;
		},
		remove: (id) => {
			const i = items.findIndex((x) => x.id === id);
			if (i >= 0) items.splice(i, 1);
		},
	};
}

function makeStores(): Stores {
	return {
		accounts: makeAccountStore(),
		parties: makePartyStore(),
		schedules: makeScheduleStore(),
		adjustments: makeAdjustmentStore(),
		scenarios: makeScenarioStore(),
	};
}

const AUTH = "Bearer test-key";
const app = createApp(makeStores(), "test-key");

function put(path: string, body: unknown) {
	return app.fetch(
		new Request(`http://localhost${path}`, {
			method: "PUT",
			headers: { Authorization: AUTH, "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

describe("GET /api/health", () => {
	it("returns 200 { ok: true } without Authorization header", async () => {
		const res = await app.fetch(new Request("http://localhost/api/health"));
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	it("returns 401 for other /api/* routes without Authorization", async () => {
		const res = await app.fetch(
			new Request("http://localhost/api/accounts"),
		);
		expect(res.status).toBe(401);
	});
});

describe("PUT /api/accounts/:id — ID mismatch guard", () => {
	const account = {
		id: "acc-1",
		name: "Checking",
		type: "checking",
		owner: "Sean",
		seedBalance: 1000,
		seedDate: "2024-01-01",
		rate: 0,
		amortizing: false,
	};

	it("returns 400 when body.id does not match URL :id", async () => {
		const res = await put("/api/accounts/acc-1", { ...account, id: "wrong" });
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: expect.any(String) });
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const res = await put("/api/accounts/acc-1", account);
		expect(res.status).toBe(200);
	});
});

describe("PUT /api/external-parties/:id — ID mismatch guard", () => {
	const party = { id: "party-1", name: "Employer" };

	it("returns 400 when body.id does not match URL :id", async () => {
		const res = await put("/api/external-parties/party-1", {
			...party,
			id: "wrong",
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: expect.any(String) });
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const res = await put("/api/external-parties/party-1", party);
		expect(res.status).toBe(200);
	});
});

describe("PUT /api/schedules/:id — ID mismatch guard", () => {
	const schedule = {
		id: "sched-1",
		sourceId: "party-1",
		destinationId: "acc-1",
		amount: 500,
		estimated: false,
		frequency: "monthly",
		startDate: "2024-01-01",
		terminateAtZero: false,
	};

	it("returns 400 when body.id does not match URL :id", async () => {
		const res = await put("/api/schedules/sched-1", {
			...schedule,
			id: "wrong",
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: expect.any(String) });
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const res = await put("/api/schedules/sched-1", schedule);
		expect(res.status).toBe(200);
	});
});

describe("PUT /api/scenarios/:id — ID mismatch guard", () => {
	const scenario = {
		id: "scenario-1",
		name: "Test Scenario",
		scheduleOverrides: [],
		additionalSchedules: [],
		additionalAccounts: [],
	};

	it("returns 400 when body.id does not match URL :id", async () => {
		const res = await put("/api/scenarios/scenario-1", {
			...scenario,
			id: "wrong",
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: expect.any(String) });
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const res = await put("/api/scenarios/scenario-1", scenario);
		expect(res.status).toBe(200);
	});
});

describe("GET /api/projection — scenarioId handling", () => {
	const base =
		"http://localhost/api/projection?startDate=2024-01-01&endDate=2024-12-31";

	it("returns 200 for baseline projection without scenarioId", async () => {
		const res = await app.fetch(
			new Request(base, { headers: { Authorization: AUTH } }),
		);
		expect(res.status).toBe(200);
	});

	it("returns 404 with error body when scenarioId is not found", async () => {
		const res = await app.fetch(
			new Request(`${base}&scenarioId=nonexistent`, {
				headers: { Authorization: AUTH },
			}),
		);
		expect(res.status).toBe(404);
		expect(await res.json()).toMatchObject({ error: expect.any(String) });
	});
});
