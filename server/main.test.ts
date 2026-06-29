import { afterEach, describe, expect, it, vi } from "vitest";
import { checkApiKey } from "./guard";

describe("startup guard — missing FINPLAN_API_KEY", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("logs an error when FINPLAN_API_KEY is not set", () => {
		const mockConsoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		vi.spyOn(process, "exit").mockImplementation(
			(() => {}) as () => never,
		);

		checkApiKey("");

		expect(mockConsoleError).toHaveBeenCalledWith(
			expect.stringContaining("FINPLAN_API_KEY"),
		);
	});

	it("exits with code 1 when FINPLAN_API_KEY is not set", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const mockExit = vi
			.spyOn(process, "exit")
			.mockImplementation((() => {}) as () => never);

		checkApiKey("");

		expect(mockExit).toHaveBeenCalledWith(1);
	});
});

describe("startup guard — FINPLAN_API_KEY set", () => {
	it("does not exit when FINPLAN_API_KEY is set to a non-empty string", () => {
		const mockExit = vi
			.spyOn(process, "exit")
			.mockImplementation((() => {}) as () => never);

		checkApiKey("some-key");

		expect(mockExit).not.toHaveBeenCalled();
		vi.restoreAllMocks();
	});
});
