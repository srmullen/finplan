// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { Account, ExternalParty } from "../engine/types";

vi.mock("@src/hooks/useAccounts");
vi.mock("@src/hooks/useExternalParties");

import { useAccounts } from "@src/hooks/useAccounts";
import { useExternalParties } from "@src/hooks/useExternalParties";
import AccountsView from "./AccountsView";

function renderView() {
	return render(
		<MemoryRouter>
			<AccountsView />
		</MemoryRouter>,
	);
}

const mockAddAccount = vi.fn();
const mockUpdateAccount = vi.fn();
const mockDeleteAccount = vi.fn();
const mockAddParty = vi.fn();
const mockUpdateParty = vi.fn();
const mockDeleteParty = vi.fn();

const account: Account = {
	id: "acc-1",
	name: "Checking",
	type: "checking",
	owner: "Sean",
	seedBalance: 1000,
	seedDate: "2024-01-01",
	rate: 0.05,
	amortizing: false,
};

const negativeAccount: Account = {
	id: "acc-2",
	name: "Credit Card",
	type: "credit_card",
	owner: "Wife",
	seedBalance: -500,
	seedDate: "2024-01-01",
	rate: 0,
	amortizing: false,
};

const party: ExternalParty = { id: "party-1", name: "Employer" };

function setupMocks(accounts: Account[] = [], parties: ExternalParty[] = []) {
	vi.mocked(useAccounts).mockReturnValue({
		accounts,
		addAccount: mockAddAccount,
		updateAccount: mockUpdateAccount,
		deleteAccount: mockDeleteAccount,
		refresh: vi.fn(),
		error: null,
	} as ReturnType<typeof useAccounts>);
	vi.mocked(useExternalParties).mockReturnValue({
		externalParties: parties,
		addParty: mockAddParty,
		updateParty: mockUpdateParty,
		deleteParty: mockDeleteParty,
		error: null,
	} as ReturnType<typeof useExternalParties>);
}

beforeEach(() => {
	vi.clearAllMocks();
	setupMocks();
});

afterEach(() => {
	cleanup();
});

describe("AccountsView — empty state", () => {
	it("shows empty messages when no accounts or parties", () => {
		renderView();
		expect(screen.getByText("No accounts yet. Add one above.")).toBeTruthy();
		expect(screen.getByText("No external parties yet.")).toBeTruthy();
	});

	it("shows AccountForm when '+ Add account' is clicked, hides on Cancel", () => {
		renderView();
		fireEvent.click(screen.getByRole("button", { name: "+ Add account" }));
		expect(screen.getByLabelText("Name")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.queryByLabelText("Name")).toBeNull();
	});

	it("calls addAccount and hides form on save (add mode)", async () => {
		renderView();
		fireEvent.click(screen.getByRole("button", { name: "+ Add account" }));
		fireEvent.change(screen.getByLabelText("Name"), {
			target: { value: "Savings" },
		});
		await act(async () => {
			fireEvent.submit(screen.getByLabelText("Name").closest("form")!);
		});
		expect(mockAddAccount).toHaveBeenCalled();
	});

	it("shows ExternalPartyForm when '+ Add external party' is clicked, hides on Cancel", () => {
		renderView();
		fireEvent.click(
			screen.getByRole("button", { name: "+ Add external party" }),
		);
		expect(screen.getByLabelText("Name")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.queryByLabelText("Name")).toBeNull();
	});

	it("calls addParty and hides form on save (add mode)", async () => {
		renderView();
		fireEvent.click(
			screen.getByRole("button", { name: "+ Add external party" }),
		);
		fireEvent.change(screen.getByLabelText("Name"), {
			target: { value: "Utility" },
		});
		await act(async () => {
			fireEvent.submit(screen.getByLabelText("Name").closest("form")!);
		});
		expect(mockAddParty).toHaveBeenCalled();
	});
});

describe("AccountsView — with data", () => {
	beforeEach(() => setupMocks([account, negativeAccount], [party]));

	it("groups accounts by owner", () => {
		renderView();
		expect(screen.getByText("Sean")).toBeTruthy();
		expect(screen.getByText("Wife")).toBeTruthy();
	});

	it("renders account with non-zero rate as percentage", () => {
		renderView();
		expect(screen.getByText("5.0%")).toBeTruthy();
	});

	it("renders '—' for zero rate", () => {
		renderView();
		const dashes = screen.getAllByText("—");
		expect(dashes.length).toBeGreaterThan(0);
	});

	it("renders negative balance (credit card)", () => {
		renderView();
		expect(screen.getByText("-$500")).toBeTruthy();
	});

	it("renders 'amortizing' for an amortizing account", () => {
		const loanAccount: Account = {
			id: "acc-3",
			name: "Car Loan",
			type: "loan",
			owner: "Sean",
			seedBalance: -5000,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: true,
		};
		setupMocks([account, loanAccount]);
		renderView();
		expect(screen.getByText("amortizing")).toBeTruthy();
	});

	it("renders parties table", () => {
		renderView();
		expect(screen.getByText("Employer")).toBeTruthy();
	});

	it("shows AccountForm in edit mode when Edit is clicked, calls updateAccount on save", async () => {
		renderView();
		fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
		expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
		await act(async () => {
			fireEvent.submit(
				screen.getByRole("button", { name: "Save changes" }).closest("form")!,
			);
		});
		expect(mockUpdateAccount).toHaveBeenCalled();
	});

	it("calls deleteAccount when Delete is confirmed", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(true);
		renderView();
		await act(async () => {
			fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]!);
		});
		expect(mockDeleteAccount).toHaveBeenCalled();
	});

	it("does not call deleteAccount when Delete is cancelled", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(false);
		renderView();
		await act(async () => {
			fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]!);
		});
		expect(mockDeleteAccount).not.toHaveBeenCalled();
	});

	it("shows party edit form and calls updateParty on save", async () => {
		renderView();
		const editBtns = screen.getAllByRole("button", { name: "Edit" });
		fireEvent.click(editBtns.at(-1)!);
		expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
		await act(async () => {
			fireEvent.submit(
				screen.getByRole("button", { name: "Save changes" }).closest("form")!,
			);
		});
		expect(mockUpdateParty).toHaveBeenCalled();
	});

	it("calls deleteParty when party Delete is confirmed", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(true);
		renderView();
		const deleteBtns = screen.getAllByRole("button", { name: "Delete" });
		await act(async () => {
			fireEvent.click(deleteBtns.at(-1)!);
		});
		expect(mockDeleteParty).toHaveBeenCalled();
	});

	it("does not call deleteParty when party Delete is cancelled", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(false);
		renderView();
		const deleteBtns = screen.getAllByRole("button", { name: "Delete" });
		await act(async () => {
			fireEvent.click(deleteBtns.at(-1)!);
		});
		expect(mockDeleteParty).not.toHaveBeenCalled();
	});
});
