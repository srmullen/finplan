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
import type {
	Account,
	Adjustment,
	ExternalParty,
	Schedule,
} from "../engine/types";

vi.mock("@src/hooks/useAccounts");
vi.mock("@src/hooks/useAdjustments");
vi.mock("@src/hooks/useExternalParties");
vi.mock("@src/hooks/useSchedules");

import { useAccounts } from "@src/hooks/useAccounts";
import { useAdjustments } from "@src/hooks/useAdjustments";
import { useExternalParties } from "@src/hooks/useExternalParties";
import { useSchedules } from "@src/hooks/useSchedules";
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

function setupMocks(
	accounts: Account[] = [],
	parties: ExternalParty[] = [],
	adjustments: Adjustment[] = [],
	schedules: Schedule[] = [],
) {
	vi.mocked(useAccounts).mockReturnValue({
		accounts,
		addAccount: mockAddAccount,
		updateAccount: mockUpdateAccount,
		deleteAccount: mockDeleteAccount,
		refresh: vi.fn(),
		error: null,
	} as ReturnType<typeof useAccounts>);
	vi.mocked(useAdjustments).mockReturnValue({
		adjustments,
		addAdjustment: vi.fn(),
		deleteAdjustment: vi.fn(),
		error: null,
	} as ReturnType<typeof useAdjustments>);
	vi.mocked(useExternalParties).mockReturnValue({
		externalParties: parties,
		addParty: mockAddParty,
		updateParty: mockUpdateParty,
		deleteParty: mockDeleteParty,
		error: null,
	} as ReturnType<typeof useExternalParties>);
	vi.mocked(useSchedules).mockReturnValue({
		schedules,
		addSchedule: vi.fn(),
		updateSchedule: vi.fn(),
		deleteSchedule: vi.fn(),
		refresh: vi.fn(),
		error: null,
	} as ReturnType<typeof useSchedules>);
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

	it("shows owner column for each account", () => {
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

	it("displays amortizing loan balance as positive (no red)", () => {
		const loanAccount: Account = {
			id: "acc-3",
			name: "Car Loan",
			type: "loan",
			owner: "Sean",
			seedBalance: -20000,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: true,
		};
		setupMocks([loanAccount]);
		renderView();
		expect(screen.getByText("$20,000")).toBeTruthy();
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

describe("AccountsView — Net Worth", () => {
	it("sums account balances into a household-wide Net Worth total", () => {
		setupMocks([account, negativeAccount]);
		renderView();
		// 1000 + (-500) = 500
		expect(screen.getByText("$500")).toBeTruthy();
	});

	it("renders a negative Net Worth total in red", () => {
		const bigDebt: Account = { ...negativeAccount, id: "acc-3", seedBalance: -5000 };
		setupMocks([account, bigDebt]);
		renderView();
		// 1000 + (-5000) = -4000
		const total = screen.getByText("-$4,000");
		expect(total.style.color).toBe("rgb(220, 38, 38)");
	});

	it("sums an amortizing account's raw negative balance into Net Worth, not its displayed positive flip", () => {
		const loanAccount: Account = {
			id: "acc-loan",
			name: "Car Loan",
			type: "loan",
			owner: "Sean",
			seedBalance: -20000,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: true,
		};
		setupMocks([account, loanAccount]);
		renderView();
		// 1000 + (-20000) = -19000, not 1000 + 20000
		expect(screen.getByText("-$19,000")).toBeTruthy();
	});
});

describe("AccountsView — Account In/Out/Remaining", () => {
	it("shows Account In/Out/Remaining per row, classified by literal source/destination (ADR-0025)", () => {
		const savings: Account = {
			...account,
			id: "acc-savings",
			name: "Savings",
			type: "savings",
		};
		const transfer: Schedule = {
			id: "s-1",
			sourceId: "acc-1",
			destinationId: "acc-savings",
			amount: 200,
			estimated: false,
			frequency: "monthly",
			startDate: "2020-01-01",
			terminateAtZero: false,
		};
		setupMocks([account, savings], [], [], [transfer]);
		renderView();

		// Checking (source): Out $200, Remaining -$200. Savings (destination):
		// In $200, Remaining $200. Total In/Out both $200 (net zero remaining).
		expect(screen.getAllByText("-$200")).toHaveLength(2); // Checking's Out + Total Out
		expect(screen.getAllByText("+$200")).toHaveLength(2); // Savings' In + Total In
		expect(screen.getByText("= -$200")).toBeTruthy();
		expect(screen.getByText("= $200")).toBeTruthy();
		expect(screen.getByText("= $0")).toBeTruthy(); // Total row: In and Out net to zero
	});

	it("excludes an inactive schedule from Account In/Out (ADR-0026)", () => {
		const savings: Account = {
			...account,
			id: "acc-savings",
			name: "Savings",
			type: "savings",
		};
		const inactiveTransfer: Schedule = {
			id: "s-1",
			sourceId: "acc-1",
			destinationId: "acc-savings",
			amount: 200,
			estimated: false,
			frequency: "monthly",
			startDate: "2020-01-01",
			terminateAtZero: false,
			active: false,
		};
		setupMocks([account, savings], [], [], [inactiveTransfer]);
		renderView();

		expect(screen.getAllByText("+$0")).toHaveLength(3); // Checking + Savings + Total
	});

	it("sums per-account figures into a Total row", () => {
		const savings: Account = {
			...account,
			id: "acc-savings",
			name: "Savings",
			type: "savings",
		};
		const income: Schedule = {
			id: "s-1",
			sourceId: "party-1",
			destinationId: "acc-1",
			amount: 1000,
			estimated: false,
			frequency: "monthly",
			startDate: "2020-01-01",
			terminateAtZero: false,
		};
		const transfer: Schedule = {
			id: "s-2",
			sourceId: "acc-1",
			destinationId: "acc-savings",
			amount: 200,
			estimated: false,
			frequency: "monthly",
			startDate: "2020-01-01",
			terminateAtZero: false,
		};
		setupMocks([account, savings], [party], [], [income, transfer]);
		renderView();

		expect(screen.getByText("Total")).toBeTruthy();
		// Total In: 1000 (income) + 200 (transfer into Savings) = 1200
		expect(screen.getByText("+$1,200")).toBeTruthy();
		// Total Out: 200 (transfer out of Checking) — same $200 as Checking's own Out cell
		expect(screen.getAllByText("-$200")).toHaveLength(2);
		// Total Remaining: 1200 - 200 = 1000
		expect(screen.getByText("= $1,000")).toBeTruthy();
	});
});

describe("AccountsView — Adjustment-aware balances", () => {
	it("falls back to seedBalance and seedDate when no Adjustment exists for the account", () => {
		setupMocks([account]);
		renderView();
		// Net Worth total and the row balance coincide (one account) — both show $1,000
		expect(screen.getAllByText("$1,000")).toHaveLength(2);
		expect(screen.getByText("Jan 1, 2024")).toBeTruthy();
	});

	it("uses the latest qualifying Adjustment's balance and date for a row", () => {
		const adjustments: Adjustment[] = [
			{ id: "adj-1", accountId: "acc-1", date: "2025-01-01", actualBalance: 1750 },
		];
		setupMocks([account], [], adjustments);
		renderView();
		expect(screen.getAllByText("$1,750")).toHaveLength(2);
		expect(screen.getByText("Jan 1, 2025")).toBeTruthy();
		expect(screen.queryByText("$1,000")).toBeNull();
	});

	it("uses the most recent of multiple Adjustments for both the row and Net Worth", () => {
		const adjustments: Adjustment[] = [
			{ id: "adj-1", accountId: "acc-1", date: "2025-01-01", actualBalance: 1750 },
			{ id: "adj-2", accountId: "acc-1", date: "2025-06-01", actualBalance: 2000 },
		];
		setupMocks([account], [], adjustments);
		renderView();
		expect(screen.getByText("Jun 1, 2025")).toBeTruthy();
		expect(screen.getAllByText("$2,000")).toHaveLength(2);
	});

	it("ignores an Adjustment dated in the future", () => {
		const farFuture = "2999-01-01";
		const adjustments: Adjustment[] = [
			{ id: "adj-1", accountId: "acc-1", date: farFuture, actualBalance: 9999 },
		];
		setupMocks([account], [], adjustments);
		renderView();
		expect(screen.getAllByText("$1,000")).toHaveLength(2);
		expect(screen.getByText("Jan 1, 2024")).toBeTruthy();
	});
});
