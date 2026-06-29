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
	delete process.env.FINPLAN_API_KEY;
	vi.spyOn(process, "exit").mockImplementation((() => {}) as () => never);
	// argv[1] is intentionally different from fileURLToPath's return value
	process.argv[1] = "/some/other/script.ts";
});

import "./main";

describe("main — imported as module (not entry point)", () => {
	it("does not call serve when not run directly", () => {
		expect(mockServe).not.toHaveBeenCalled();
	});
});
