// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExternalParty } from "../engine/types";
import ExternalPartyForm from "./ExternalPartyForm";

vi.mock("@src/utils/id", () => ({ generateId: () => "generated-id" }));

afterEach(() => {
	cleanup();
});

const onSave = vi.fn();
const onCancel = vi.fn();

const existing: ExternalParty = { id: "party-1", name: "Employer" };

describe("ExternalPartyForm — add mode", () => {
	it("renders 'Add external party' button when no initial provided", () => {
		render(<ExternalPartyForm onSave={onSave} onCancel={onCancel} />);
		expect(screen.getByRole("button", { name: "Add external party" })).toBeTruthy();
	});

	it("calls onSave with generated id on submit", () => {
		render(<ExternalPartyForm onSave={onSave} onCancel={onCancel} />);
		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Utility Co" } });
		fireEvent.submit(screen.getByRole("button", { name: "Add external party" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith({ id: "generated-id", name: "Utility Co" });
	});

	it("calls onCancel when Cancel is clicked", () => {
		render(<ExternalPartyForm onSave={onSave} onCancel={onCancel} />);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onCancel).toHaveBeenCalled();
	});
});

describe("ExternalPartyForm — edit mode", () => {
	it("renders 'Save changes' button when initial is provided", () => {
		render(<ExternalPartyForm initial={existing} onSave={onSave} onCancel={onCancel} />);
		expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
	});

	it("pre-fills the name field", () => {
		render(<ExternalPartyForm initial={existing} onSave={onSave} onCancel={onCancel} />);
		expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Employer");
	});

	it("calls onSave with the original id on submit", () => {
		render(<ExternalPartyForm initial={existing} onSave={onSave} onCancel={onCancel} />);
		fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form")!);
		expect(onSave).toHaveBeenCalledWith({ id: "party-1", name: "Employer" });
	});
});
