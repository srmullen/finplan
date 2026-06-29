import { describe, expect, it, vi } from "vitest";

const { mockServe } = vi.hoisted(() => ({
	mockServe: vi.fn(),
}));

vi.mock("@hono/node-server", () => ({
	serve: mockServe,
}));

vi.mock("node:url", () => ({
	fileURLToPath: vi.fn().mockReturnValue("/fake/server/main.ts"),
}));

vi.mock("better-sqlite3", () => ({
	default: class {
		exec() {}
		prepare() {
			return { run: () => {}, get: () => null, all: () => [] };
		}
	},
}));

vi.mock("node:fs", () => ({
	existsSync: vi.fn().mockReturnValue(false),
	readFileSync: vi.fn().mockReturnValue(Buffer.from("")),
}));

vi.hoisted(() => {
	process.env.FINPLAN_API_KEY = "test-key";
	process.argv[1] = "/fake/server/main.ts";
});

import "./main";

describe("server startup — starts when run directly", () => {
	it("calls serve with app.fetch and the configured port", () => {
		expect(mockServe).toHaveBeenCalledOnce();
		expect(mockServe).toHaveBeenCalledWith(
			expect.objectContaining({ port: 3000 }),
		);
	});
});
