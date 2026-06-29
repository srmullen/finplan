// @vitest-environment jsdom
import { beforeEach, describe, it, vi } from "vitest";

vi.mock("@src/App", () => ({ default: () => null }));
vi.mock("@src/index.css", () => ({}));

describe("main", () => {
	beforeEach(() => {
		const root = document.createElement("div");
		root.id = "root";
		document.body.appendChild(root);
	});

	it("mounts the app into the root element", async () => {
		await import("./main");
	});
});
