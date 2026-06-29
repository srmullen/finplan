// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../engine/types";
import AccountForm from "./AccountForm";

vi.mock("@src/utils/id", () => ({ generateId: () => "generated-id" }));

afterEach(() => {
	cleanup();
});

const onSave = vi.fn();
const onCancel = vi.fn();

const defaultProps = {
	ownerSuggestions: ["Sean", "Wife"],
	institutionSuggestions: ["Chase", "Fidelity"],
	onSave,
	onCancel,
};

const existingAccount: Account = {
	id: "acc-1",
	name: "Checking",
	type: "savings",
	owner: "Wife",
	seedBalance: 5000,
	seedDate: "2024-06-01",
	rate: 0.05,
	amortizing: true,
};

describe("AccountForm — add mode (no initial)", () => {
	it("renders 'Add account' button when no initial provided", () => {
		render(<AccountForm {...defaultProps} />);
		expect(screen.getByRole("button", { name: "Add account" })).toBeTruthy();
	});

	it("calls onSave with a generated id and default values on submit", () => {
		render(<AccountForm {...defaultProps} />);
		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "My Account" } });
		fireEvent.submit(screen.getByRole("button", { name: "Add account" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
			id: "generated-id",
			name: "My Account",
			seedBalance: 0,
			rate: 0,
		}));
	});

	it("parses non-zero seedBalance and rate on submit", () => {
		render(<AccountForm {...defaultProps} />);
		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "IRA" } });
		fireEvent.change(screen.getByLabelText("Seed balance ($)"), { target: { value: "10000" } });
		fireEvent.change(screen.getByLabelText("Annual rate (%)"), { target: { value: "8" } });
		fireEvent.submit(screen.getByRole("button", { name: "Add account" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
			seedBalance: 10000,
			rate: 0.08,
		}));
	});

	it("calls onCancel when Cancel is clicked", () => {
		render(<AccountForm {...defaultProps} />);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onCancel).toHaveBeenCalled();
	});

	it("sets institution to undefined when left blank", () => {
		render(<AccountForm {...defaultProps} />);
		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Blank" } });
		fireEvent.submit(screen.getByRole("button", { name: "Add account" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ institution: undefined }));
	});

	it("sets institution when provided", () => {
		render(<AccountForm {...defaultProps} />);
		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Savings" } });
		fireEvent.change(screen.getByLabelText("Institution"), { target: { value: "Chase" } });
		fireEvent.submit(screen.getByRole("button", { name: "Add account" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ institution: "Chase" }));
	});

	it("renders owner datalist options from ownerSuggestions", () => {
		render(<AccountForm {...defaultProps} />);
		const opts = [...document.querySelectorAll("#owner-suggestions option")].map(
			(o) => (o as HTMLOptionElement).value,
		);
		expect(opts).toContain("Sean");
		expect(opts).toContain("Wife");
	});

	it("renders institution datalist options from institutionSuggestions", () => {
		render(<AccountForm {...defaultProps} />);
		const opts = [...document.querySelectorAll("#institution-suggestions option")].map(
			(o) => (o as HTMLOptionElement).value,
		);
		expect(opts).toContain("Chase");
		expect(opts).toContain("Fidelity");
	});
});

describe("AccountForm — edit mode (with initial)", () => {
	it("renders 'Save changes' button when initial is provided", () => {
		render(<AccountForm {...defaultProps} initial={existingAccount} />);
		expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
	});

	it("pre-fills fields from initial account", () => {
		render(<AccountForm {...defaultProps} initial={existingAccount} />);
		expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Checking");
	});

	it("pre-fills institution when initial has one", () => {
		render(<AccountForm {...defaultProps} initial={{ ...existingAccount, institution: "Navy Federal" }} />);
		expect((screen.getByLabelText("Institution") as HTMLInputElement).value).toBe("Navy Federal");
	});

	it("calls onSave with original id on submit", () => {
		render(<AccountForm {...defaultProps} initial={existingAccount} />);
		fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: "acc-1" }));
	});

	it("toggles the amortizing checkbox", () => {
		render(<AccountForm {...defaultProps} initial={existingAccount} />);
		const checkbox = screen.getByRole("checkbox");
		expect((checkbox as HTMLInputElement).checked).toBe(true);
		fireEvent.click(checkbox);
		fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amortizing: false }));
	});

	it("updates type when type select is changed", () => {
		render(<AccountForm {...defaultProps} />);
		fireEvent.change(screen.getByLabelText("Type"), { target: { value: "savings" } });
		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "My Savings" } });
		fireEvent.submit(screen.getByRole("button", { name: "Add account" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ type: "savings" }));
	});

	it("updates owner when owner select is changed", () => {
		render(<AccountForm {...defaultProps} />);
		fireEvent.change(screen.getByLabelText("Owner"), { target: { value: "Wife" } });
		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Her Account" } });
		fireEvent.submit(screen.getByRole("button", { name: "Add account" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ owner: "Wife" }));
	});

	it("updates seed date when date input is changed", () => {
		render(<AccountForm {...defaultProps} />);
		fireEvent.change(screen.getByLabelText("As of date"), { target: { value: "2025-06-01" } });
		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Dated Account" } });
		fireEvent.submit(screen.getByRole("button", { name: "Add account" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ seedDate: "2025-06-01" }));
	});
});
