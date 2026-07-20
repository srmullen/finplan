// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DocsView from "./DocsView";

afterEach(() => {
	cleanup();
});

describe("DocsView", () => {
	it("renders a heading for each documented view", () => {
		render(<DocsView />);
		expect(
			screen.getByRole("heading", { level: 2, name: "Projection" }),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { level: 2, name: "Accounts" }),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { level: 2, name: "Schedules" }),
		).toBeTruthy();
	});

	it("renders a table of contents link for each section", () => {
		render(<DocsView />);
		const nav = screen.getByRole("navigation", {
			name: "Table of contents",
		});
		expect(nav.querySelector('a[href="#projection"]')).toBeTruthy();
		expect(nav.querySelector('a[href="#accounts"]')).toBeTruthy();
		expect(nav.querySelector('a[href="#schedules"]')).toBeTruthy();
	});

	it("documents the negative balance warning under both Accounts and Projection", () => {
		render(<DocsView />);
		expect(screen.getAllByText("Negative balance warning")).toHaveLength(2);
	});

	it("documents the Active/inactive Schedule state", () => {
		render(<DocsView />);
		expect(screen.getByText("Active / inactive")).toBeTruthy();
	});
});
