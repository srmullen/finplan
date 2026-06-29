import { describe, expect, it, vi } from "vitest";

vi.mock("better-sqlite3", () => ({
	default: class {
		exec() {}
		prepare() {
			return { run: () => {}, get: () => null, all: () => [] };
		}
	},
}));

const { mockExit, mockConsoleError } = vi.hoisted(() => {
	delete process.env.FINPLAN_API_KEY;
	const mockExit = vi.fn();
	const mockConsoleError = vi.fn();
	process.exit = mockExit as unknown as typeof process.exit;
	console.error = mockConsoleError;
	return { mockExit, mockConsoleError };
});

import "./index";

describe("startup guard — missing FINPLAN_API_KEY", () => {
	it("logs an error when FINPLAN_API_KEY is not set", () => {
		expect(mockConsoleError).toHaveBeenCalledWith(
			expect.stringContaining("FINPLAN_API_KEY"),
		);
	});

	it("exits with code 1 when FINPLAN_API_KEY is not set", () => {
		expect(mockExit).toHaveBeenCalledWith(1);
	});
});
