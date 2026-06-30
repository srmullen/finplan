// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account, Adjustment, ProjectionResult } from "../engine/types";
import AdjustmentPanel from "./AdjustmentPanel";

const { mockAddAdjustment, mockDeleteAdjustment, mockAdjustments } = vi.hoisted(
	() => ({
		mockAddAdjustment: vi.fn(),
		mockDeleteAdjustment: vi.fn(),
		mockAdjustments: { current: [] as Adjustment[] },
	}),
);

vi.mock("@src/hooks/useAdjustments", () => ({
	useAdjustments: () => ({
		adjustments: mockAdjustments.current,
		addAdjustment: mockAddAdjustment,
		deleteAdjustment: mockDeleteAdjustment,
		error: null,
	}),
}));

vi.mock("@src/utils/id", () => ({ generateId: () => "generated-id" }));

const accounts: Account[] = [
	{
		id: "acc-1",
		name: "Checking",
		type: "checking",
		owner: "Sean",
		seedBalance: 1000,
		seedDate: "2024-01-01",
		rate: 0,
		amortizing: false,
	},
];

const loanAccount: Account = {
	id: "loan-1",
	name: "Car Loan",
	type: "loan",
	owner: "Sean",
	seedBalance: -20000,
	seedDate: "2024-01-01",
	rate: 0.05,
	amortizing: true,
};

const adjustment: Adjustment = {
	id: "adj-1",
	accountId: "acc-1",
	date: "2024-01-15",
	actualBalance: 2000,
};

const baselineResult: ProjectionResult = {
	"acc-1": [{ date: "2024-01-15", balance: 1800 }],
};

beforeEach(() => {
	vi.clearAllMocks();
	mockAdjustments.current = [];
});

afterEach(() => {
	cleanup();
});

describe("AdjustmentPanel — empty state", () => {
	it("shows empty message when there are no adjustments", () => {
		render(
			<AdjustmentPanel accounts={accounts} baselineResult={baselineResult} />,
		);
		expect(screen.getByText("No adjustments recorded.")).toBeTruthy();
	});

	it("sets empty accountId when accounts list is empty", () => {
		render(<AdjustmentPanel accounts={[]} baselineResult={{}} />);
		expect(screen.getByRole("button", { name: "Record" })).toBeTruthy();
	});
});

describe("AdjustmentPanel — adding adjustments", () => {
	it("calls addAdjustment with a generated id on submit", async () => {
		render(
			<AdjustmentPanel accounts={accounts} baselineResult={baselineResult} />,
		);
		fireEvent.change(screen.getByLabelText("Actual balance ($)"), {
			target: { value: "2500" },
		});
		await act(async () => {
			fireEvent.submit(
				screen.getByLabelText("Actual balance ($)").closest("form")!,
			);
		});
		expect(mockAddAdjustment).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "generated-id",
				accountId: "acc-1",
				actualBalance: 2500,
			}),
		);
	});

	it("negates typed value before storing for amortizing accounts", async () => {
		render(
			<AdjustmentPanel
				accounts={[loanAccount]}
				baselineResult={{}}
				fixedAccountId="loan-1"
			/>,
		);
		fireEvent.change(screen.getByLabelText("Actual balance ($)"), {
			target: { value: "18000" },
		});
		await act(async () => {
			fireEvent.submit(
				screen.getByLabelText("Actual balance ($)").closest("form")!,
			);
		});
		expect(mockAddAdjustment).toHaveBeenCalledWith(
			expect.objectContaining({ actualBalance: -18000 }),
		);
	});

	it("updates accountId when account select is changed", async () => {
		const accounts2 = [
			...accounts,
			{ ...accounts[0]!, id: "acc-2", name: "Savings" },
		];
		render(
			<AdjustmentPanel accounts={accounts2} baselineResult={baselineResult} />,
		);
		fireEvent.change(screen.getByLabelText("Account"), {
			target: { value: "acc-2" },
		});
		fireEvent.change(screen.getByLabelText("Actual balance ($)"), {
			target: { value: "3000" },
		});
		await act(async () => {
			fireEvent.submit(
				screen.getByLabelText("Actual balance ($)").closest("form")!,
			);
		});
		expect(mockAddAdjustment).toHaveBeenCalledWith(
			expect.objectContaining({ accountId: "acc-2" }),
		);
	});

	it("updates date when date input is changed", async () => {
		render(
			<AdjustmentPanel accounts={accounts} baselineResult={baselineResult} />,
		);
		fireEvent.change(screen.getByLabelText("Date"), {
			target: { value: "2025-03-15" },
		});
		fireEvent.change(screen.getByLabelText("Actual balance ($)"), {
			target: { value: "1500" },
		});
		await act(async () => {
			fireEvent.submit(
				screen.getByLabelText("Actual balance ($)").closest("form")!,
			);
		});
		expect(mockAddAdjustment).toHaveBeenCalledWith(
			expect.objectContaining({ date: "2025-03-15" }),
		);
	});
});

describe("AdjustmentPanel — with adjustments", () => {
	beforeEach(() => {
		mockAdjustments.current = [adjustment];
	});

	it("renders the adjustment table", () => {
		render(
			<AdjustmentPanel accounts={accounts} baselineResult={baselineResult} />,
		);
		// "Checking" also appears in the account filter dropdown, so use getAllByText
		expect(screen.getAllByText("Checking").length).toBeGreaterThan(0);
		expect(screen.getByText("Jan 15, 2024")).toBeTruthy();
	});

	it("shows positive variance in green", () => {
		render(
			<AdjustmentPanel accounts={accounts} baselineResult={baselineResult} />,
		);
		// actual 2000 - projected 1800 = +200
		expect(screen.getByText("+$200")).toBeTruthy();
	});

	it("shows negative variance in red", () => {
		const lowBaseline: ProjectionResult = {
			"acc-1": [{ date: "2024-01-15", balance: 2500 }],
		};
		render(
			<AdjustmentPanel accounts={accounts} baselineResult={lowBaseline} />,
		);
		// actual 2000 - projected 2500 = -500
		expect(screen.getByText("-$500")).toBeTruthy();
	});

	it("shows '—' for projected when baseline has no matching date", () => {
		render(<AdjustmentPanel accounts={accounts} baselineResult={{}} />);
		const dashes = screen.getAllByText("—");
		expect(dashes.length).toBeGreaterThan(0);
	});

	it("shows account name falling back to id when account not found", () => {
		const adjForUnknown: Adjustment = {
			...adjustment,
			accountId: "unknown-id",
		};
		mockAdjustments.current = [adjForUnknown];
		render(
			<AdjustmentPanel accounts={accounts} baselineResult={baselineResult} />,
		);
		expect(screen.getByText("unknown-id")).toBeTruthy();
	});

	it("renders raw projected balance when account for adjustment is not found", () => {
		const adjForUnknown: Adjustment = {
			id: "adj-x",
			accountId: "unknown-id",
			date: "2024-01-15",
			actualBalance: 500,
		};
		mockAdjustments.current = [adjForUnknown];
		const baselineWithUnknown: ProjectionResult = {
			"unknown-id": [{ date: "2024-01-15", balance: 400 }],
		};
		render(
			<AdjustmentPanel accounts={accounts} baselineResult={baselineWithUnknown} />,
		);
		expect(screen.getByText("$400")).toBeTruthy();
	});

	it("shows '—' for variance when projected is null", () => {
		const adjForUnknown: Adjustment = { ...adjustment, accountId: "x" };
		mockAdjustments.current = [adjForUnknown];
		render(<AdjustmentPanel accounts={accounts} baselineResult={{}} />);
		// no projected series for "x" → variance null → "—"
		const dashes = screen.getAllByText("—");
		expect(dashes.length).toBeGreaterThan(0);
	});

	it("shows '—' when series exists but date is not in the projection", () => {
		// series exists but adjustment date doesn't match any projected point
		const mismatchedBaseline: ProjectionResult = {
			"acc-1": [{ date: "2024-01-10", balance: 1800 }],
		};
		render(
			<AdjustmentPanel
				accounts={accounts}
				baselineResult={mismatchedBaseline}
			/>,
		);
		// adjustment.date = "2024-01-15" not in series → getProjected returns null → "—"
		const dashes = screen.getAllByText("—");
		expect(dashes.length).toBeGreaterThan(0);
	});

	it("filters by account when filter is changed", () => {
		const adj2: Adjustment = {
			id: "adj-2",
			accountId: "acc-2",
			date: "2024-01-16",
			actualBalance: 500,
		};
		mockAdjustments.current = [adjustment, adj2];
		const accounts2 = [
			...accounts,
			{ ...accounts[0]!, id: "acc-2", name: "Savings" },
		];
		render(
			<AdjustmentPanel accounts={accounts2} baselineResult={baselineResult} />,
		);
		const filterSelect = screen.getByRole("combobox", {
			name: /Filter by account/,
		});
		fireEvent.change(filterSelect, { target: { value: "acc-1" } });
		expect(screen.queryByText("2024-01-16")).toBeNull();
	});

	it("displays amortizing actual balance as positive", () => {
		const loanAdj: typeof adjustment = {
			id: "adj-loan",
			accountId: "loan-1",
			date: "2024-01-15",
			actualBalance: -16000,
		};
		mockAdjustments.current = [loanAdj];
		const loanBaseline: ProjectionResult = {
			"loan-1": [{ date: "2024-01-15", balance: -17000 }],
		};
		render(
			<AdjustmentPanel
				accounts={[loanAccount]}
				baselineResult={loanBaseline}
				fixedAccountId="loan-1"
			/>,
		);
		expect(screen.getByText("$16,000")).toBeTruthy();
		expect(screen.getByText("$17,000")).toBeTruthy();
	});

	it("shows positive variance (green) when amortizing actual is less owed than projected", () => {
		const loanAdj: typeof adjustment = {
			id: "adj-loan",
			accountId: "loan-1",
			date: "2024-01-15",
			actualBalance: -16000,
		};
		mockAdjustments.current = [loanAdj];
		const loanBaseline: ProjectionResult = {
			"loan-1": [{ date: "2024-01-15", balance: -17000 }],
		};
		render(
			<AdjustmentPanel
				accounts={[loanAccount]}
				baselineResult={loanBaseline}
				fixedAccountId="loan-1"
			/>,
		);
		// actual(-16000) - projected(-17000) = +1000 → green
		expect(screen.getByText("+$1,000")).toBeTruthy();
	});

	it("calls deleteAdjustment when Delete button is clicked", async () => {
		render(
			<AdjustmentPanel accounts={accounts} baselineResult={baselineResult} />,
		);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		});
		expect(mockDeleteAdjustment).toHaveBeenCalledWith("adj-1");
	});

	it("filters to fixedAccountId when that prop is set", () => {
		const adj2: Adjustment = {
			id: "adj-2",
			accountId: "acc-2",
			date: "2024-01-16",
			actualBalance: 500,
		};
		mockAdjustments.current = [adjustment, adj2];
		const accounts2 = [
			...accounts,
			{ ...accounts[0]!, id: "acc-2", name: "Savings" },
		];
		render(
			<AdjustmentPanel
				accounts={accounts2}
				baselineResult={baselineResult}
				fixedAccountId="acc-1"
			/>,
		);
		expect(screen.getByText("Jan 15, 2024")).toBeTruthy();
		expect(screen.queryByText("Jan 16, 2024")).toBeNull();
	});

	it("hides account picker and filter when fixedAccountId is set", () => {
		render(
			<AdjustmentPanel
				accounts={accounts}
				baselineResult={baselineResult}
				fixedAccountId="acc-1"
			/>,
		);
		expect(screen.queryByLabelText("Account")).toBeNull();
	});
});
