// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@src/views/ProjectionView", () => ({
	default: () => <div>ProjectionView</div>,
}));
vi.mock("@src/views/AccountsView", () => ({
	default: () => <div>AccountsView</div>,
}));
vi.mock("@src/views/SchedulesView", () => ({
	default: () => <div>SchedulesView</div>,
}));
vi.mock("sonner", () => ({ Toaster: () => null }));

import App from "./App";

describe("App", () => {
	it("renders navigation links", () => {
		render(<App />);
		expect(screen.getByText("Projection")).toBeTruthy();
		expect(screen.getByText("Accounts")).toBeTruthy();
		expect(screen.getByText("Schedules")).toBeTruthy();
	});
});
