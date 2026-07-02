import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Account,
	Adjustment,
	ExternalParty,
	Scenario,
	Schedule,
	ScheduleGroup,
} from "../src/engine/types";
import { createApp } from "./index";
import type {
	AccountStore,
	AdjustmentStore,
	ExternalPartyStore,
	ScenarioStore,
	ScheduleGroupStore,
	ScheduleStore,
	Stores,
} from "./index";

const { mockExistsSync, mockReadFileSync } = vi.hoisted(() => ({
	mockExistsSync: vi.fn().mockReturnValue(false),
	mockReadFileSync: vi.fn().mockReturnValue(Buffer.from("")),
}));

vi.mock("node:fs", () => ({
	existsSync: mockExistsSync,
	readFileSync: mockReadFileSync,
}));

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

function makeScheduleGroupStore(): ScheduleGroupStore {
	const items: ScheduleGroup[] = [];
	return {
		list: () => [...items],
		get: (id) => items.find((g) => g.id === id) ?? null,
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
		scheduleGroups: makeScheduleGroupStore(),
		adjustments: makeAdjustmentStore(),
		scenarios: makeScenarioStore(),
	};
}

const AUTH = "Bearer test-key";
const app = createApp(makeStores(), "test-key");

function req(path: string, method = "GET", body?: unknown) {
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

beforeEach(() => {
	vi.clearAllMocks();
	mockExistsSync.mockReturnValue(false);
	mockReadFileSync.mockReturnValue(Buffer.from(""));
});

afterEach(() => {
	vi.clearAllMocks();
});

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

describe("GET /api/accounts", () => {
	it("returns empty array when no accounts", async () => {
		const res = await req("/api/accounts");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});
});

describe("POST /api/accounts", () => {
	it("inserts and returns 201", async () => {
		const body = {
			id: "a1",
			name: "Savings",
			type: "savings",
			owner: "Sean",
			seedBalance: 0,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: false,
		};
		const res = await req("/api/accounts", "POST", body);
		expect(res.status).toBe(201);
	});

	it("inserts amortizing account and returns 201", async () => {
		const body = {
			id: "a2",
			name: "Car Loan",
			type: "loan",
			owner: "Sean",
			seedBalance: -10000,
			seedDate: "2024-01-01",
			rate: 0.05,
			amortizing: true,
		};
		const res = await req("/api/accounts", "POST", body);
		expect(res.status).toBe(201);
	});
});

describe("GET /api/accounts/:id", () => {
	it("returns 404 when account not found", async () => {
		const res = await req("/api/accounts/nonexistent");
		expect(res.status).toBe(404);
	});

	it("returns account when found", async () => {
		const stores = makeStores();
		stores.accounts.create({
			id: "acc-1",
			name: "Checking",
			type: "checking",
			owner: "Sean",
			seedBalance: 1000,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: false,
		});
		const a = createApp(stores, "test-key");
		const res = await a.fetch(
			new Request("http://localhost/api/accounts/acc-1", {
				headers: { Authorization: AUTH },
			}),
		);
		expect(res.status).toBe(200);
		const data = (await res.json()) as { id: string };
		expect(data.id).toBe("acc-1");
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
		const res = await req("/api/accounts/acc-1", "PUT", {
			...account,
			id: "wrong",
		});
		expect(res.status).toBe(400);
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const res = await req("/api/accounts/acc-1", "PUT", account);
		expect(res.status).toBe(200);
	});

	it("returns 200 updating an amortizing account", async () => {
		const res = await req("/api/accounts/acc-1", "PUT", {
			...account,
			amortizing: true,
		});
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/accounts/:id", () => {
	it("returns 204", async () => {
		const res = await req("/api/accounts/acc-1", "DELETE");
		expect(res.status).toBe(204);
	});
});

describe("GET /api/external-parties", () => {
	it("returns empty array", async () => {
		const res = await req("/api/external-parties");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});
});

describe("POST /api/external-parties", () => {
	it("inserts and returns 201", async () => {
		const res = await req("/api/external-parties", "POST", {
			id: "p1",
			name: "Utility",
		});
		expect(res.status).toBe(201);
	});
});

describe("GET /api/external-parties/:id", () => {
	it("returns 404 when not found", async () => {
		const res = await req("/api/external-parties/nonexistent");
		expect(res.status).toBe(404);
	});

	it("returns party when found", async () => {
		const stores = makeStores();
		stores.parties.create({ id: "party-1", name: "Employer" });
		const a = createApp(stores, "test-key");
		const res = await a.fetch(
			new Request("http://localhost/api/external-parties/party-1", {
				headers: { Authorization: AUTH },
			}),
		);
		expect(res.status).toBe(200);
	});
});

describe("PUT /api/external-parties/:id — ID mismatch guard", () => {
	const party = { id: "party-1", name: "Employer" };

	it("returns 400 when body.id does not match URL :id", async () => {
		const res = await req("/api/external-parties/party-1", "PUT", {
			...party,
			id: "wrong",
		});
		expect(res.status).toBe(400);
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const res = await req("/api/external-parties/party-1", "PUT", party);
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/external-parties/:id", () => {
	it("returns 204", async () => {
		const res = await req("/api/external-parties/party-1", "DELETE");
		expect(res.status).toBe(204);
	});
});

describe("GET /api/schedules", () => {
	it("returns empty array", async () => {
		const res = await req("/api/schedules");
		expect(res.status).toBe(200);
	});
});

describe("POST /api/schedules", () => {
	it("inserts and returns 201", async () => {
		const body = {
			id: "s1",
			sourceId: "p1",
			destinationId: "a1",
			amount: 100,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		};
		const res = await req("/api/schedules", "POST", body);
		expect(res.status).toBe(201);
	});

	it("passes null for endDate when not provided", async () => {
		const body = {
			id: "s1",
			sourceId: "p1",
			destinationId: "a1",
			amount: 100,
			estimated: true,
			frequency: "monthly",
			startDate: "2024-01-01",
			terminateAtZero: true,
		};
		const res = await req("/api/schedules", "POST", body);
		expect(res.status).toBe(201);
	});
});

describe("GET /api/schedules/:id", () => {
	it("returns 404 when not found", async () => {
		const res = await req("/api/schedules/nonexistent");
		expect(res.status).toBe(404);
	});

	it("returns schedule when found", async () => {
		const stores = makeStores();
		stores.schedules.create({
			id: "s-1",
			sourceId: "party-1",
			destinationId: "acc-1",
			amount: 500,
			estimated: false,
			frequency: "monthly",
			startDate: "2024-01-01",
			terminateAtZero: false,
		});
		const a = createApp(stores, "test-key");
		const res = await a.fetch(
			new Request("http://localhost/api/schedules/s-1", {
				headers: { Authorization: AUTH },
			}),
		);
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
		const res = await req("/api/schedules/sched-1", "PUT", {
			...schedule,
			id: "wrong",
		});
		expect(res.status).toBe(400);
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const res = await req("/api/schedules/sched-1", "PUT", schedule);
		expect(res.status).toBe(200);
	});

	it("returns 200 updating estimated and terminateAtZero schedule", async () => {
		const res = await req("/api/schedules/sched-1", "PUT", {
			...schedule,
			estimated: true,
			terminateAtZero: true,
		});
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/schedules/:id", () => {
	it("returns 204", async () => {
		const res = await req("/api/schedules/s-1", "DELETE");
		expect(res.status).toBe(204);
	});
});

describe("GET /api/adjustments", () => {
	it("returns empty array", async () => {
		const res = await req("/api/adjustments");
		expect(res.status).toBe(200);
	});
});

describe("POST /api/adjustments", () => {
	it("inserts and returns 201", async () => {
		const body = {
			id: "a1",
			accountId: "acc-1",
			date: "2024-01-15",
			actualBalance: 2000,
		};
		const res = await req("/api/adjustments", "POST", body);
		expect(res.status).toBe(201);
	});
});

describe("DELETE /api/adjustments/:id", () => {
	it("returns 204", async () => {
		const res = await req("/api/adjustments/adj-1", "DELETE");
		expect(res.status).toBe(204);
	});
});

describe("GET /api/scenarios", () => {
	it("returns empty array", async () => {
		const res = await req("/api/scenarios");
		expect(res.status).toBe(200);
	});
});

describe("POST /api/scenarios", () => {
	it("inserts and returns 201", async () => {
		const body = {
			id: "sc1",
			name: "Test",
			scheduleOverrides: [],
			additionalSchedules: [],
			additionalAccounts: [],
		};
		const res = await req("/api/scenarios", "POST", body);
		expect(res.status).toBe(201);
	});
});

describe("GET /api/scenarios/:id", () => {
	it("returns 404 when not found", async () => {
		const res = await req("/api/scenarios/nonexistent");
		expect(res.status).toBe(404);
	});

	it("returns scenario when found", async () => {
		const stores = makeStores();
		stores.scenarios.create({
			id: "sc-1",
			name: "Test",
			scheduleOverrides: [],
			additionalSchedules: [],
			additionalAccounts: [],
		});
		const a = createApp(stores, "test-key");
		const res = await a.fetch(
			new Request("http://localhost/api/scenarios/sc-1", {
				headers: { Authorization: AUTH },
			}),
		);
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
		const res = await req("/api/scenarios/scenario-1", "PUT", {
			...scenario,
			id: "wrong",
		});
		expect(res.status).toBe(400);
	});

	it("returns 200 when body.id matches URL :id", async () => {
		const res = await req("/api/scenarios/scenario-1", "PUT", scenario);
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/scenarios/:id", () => {
	it("returns 204", async () => {
		const res = await req("/api/scenarios/sc-1", "DELETE");
		expect(res.status).toBe(204);
	});
});

describe("GET /api/projection", () => {
	const base =
		"http://localhost/api/projection?startDate=2024-01-01&endDate=2024-12-31";

	it("returns 400 when startDate is missing", async () => {
		const res = await app.fetch(
			new Request("http://localhost/api/projection?endDate=2024-12-31", {
				headers: { Authorization: AUTH },
			}),
		);
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: expect.any(String) });
	});

	it("returns 400 when endDate is missing", async () => {
		const res = await app.fetch(
			new Request("http://localhost/api/projection?startDate=2024-01-01", {
				headers: { Authorization: AUTH },
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 200 for baseline projection without scenarioId", async () => {
		const res = await app.fetch(
			new Request(base, { headers: { Authorization: AUTH } }),
		);
		expect(res.status).toBe(200);
	});

	it("returns 200 with noAdj=1 parameter", async () => {
		const res = await app.fetch(
			new Request(`${base}&noAdj=1`, { headers: { Authorization: AUTH } }),
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

	it("returns 200 with a valid scenarioId", async () => {
		const stores = makeStores();
		stores.scenarios.create({
			id: "sc-1",
			name: "Test",
			scheduleOverrides: [],
			additionalSchedules: [],
			additionalAccounts: [],
		});
		const a = createApp(stores, "test-key");
		const res = await a.fetch(
			new Request(`${base}&scenarioId=sc-1`, {
				headers: { Authorization: AUTH },
			}),
		);
		expect(res.status).toBe(200);
	});
});

describe("GET * — static file handler", () => {
	it("returns 404 when neither the file nor index.html exists", async () => {
		mockExistsSync.mockReturnValue(false);
		const res = await app.fetch(new Request("http://localhost/some-route"));
		expect(res.status).toBe(404);
	});

	it("returns 200 when the requested file exists", async () => {
		mockExistsSync.mockReturnValueOnce(true);
		const res = await app.fetch(new Request("http://localhost/app.js"));
		expect(res.status).toBe(200);
	});

	it("returns index.html when file does not exist but index.html does", async () => {
		mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
		const res = await app.fetch(new Request("http://localhost/deep/route"));
		expect(res.status).toBe(200);
	});
});
