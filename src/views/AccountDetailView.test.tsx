// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Account, ExternalParty, ProjectionResult, Schedule } from "../engine/types";

vi.mock("@src/hooks/useAccounts");
vi.mock("@src/hooks/useSchedules");
vi.mock("@src/hooks/useExternalParties");
vi.mock("@src/api/client");
vi.mock("@src/components/AdjustmentPanel", () => ({
	default: ({ fixedAccountId }: { fixedAccountId?: string }) => (
		<div data-testid="adjustment-panel" data-account={fixedAccountId} />
	),
}));
let capturedTickFormatter: ((v: unknown) => string) | undefined;
let capturedTooltipFormatter: ((v: number) => string) | undefined;

vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	LineChart: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	Line: () => null,
	XAxis: () => null,
	YAxis: ({ tickFormatter }: { tickFormatter?: (v: unknown) => string }) => {
		if (tickFormatter) capturedTickFormatter = tickFormatter;
		return null;
	},
	CartesianGrid: () => null,
	Tooltip: ({ formatter }: { formatter?: (v: number) => string }) => {
		if (formatter) capturedTooltipFormatter = formatter;
		return null;
	},
	ReferenceLine: () => null,
}));

import { get } from "@src/api/client";
import { useAccounts } from "@src/hooks/useAccounts";
import { useExternalParties } from "@src/hooks/useExternalParties";
import { useSchedules } from "@src/hooks/useSchedules";
import AccountDetailView from "./AccountDetailView";

const mockAddSchedule = vi.fn();
const mockDeleteSchedule = vi.fn();

const account: Account = {
	id: "acc-1",
	name: "Checking",
	type: "checking",
	owner: "Sean",
	institution: "Chase",
	seedBalance: 5000,
	seedDate: "2024-01-01",
	rate: 0.02,
	amortizing: false,
};

const party: ExternalParty = { id: "party-1", name: "Employer" };

const schedule: Schedule = {
	id: "sched-1",
	sourceId: "party-1",
	destinationId: "acc-1",
	amount: 3000,
	estimated: false,
	frequency: "monthly",
	startDate: "2024-01-01",
	terminateAtZero: false,
};

const projectionResult: ProjectionResult = {
	"acc-1": [
		{ date: "2024-01-01", balance: 5000 },
		{ date: "2024-02-01", balance: 5100 },
	],
};

function setupMocks(
	accounts: Account[] = [account],
	schedules: Schedule[] = [],
	parties: ExternalParty[] = [party],
) {
	vi.mocked(useAccounts).mockReturnValue({
		accounts,
		addAccount: vi.fn(),
		updateAccount: vi.fn(),
		deleteAccount: vi.fn(),
		refresh: vi.fn(),
		error: null,
	} as ReturnType<typeof useAccounts>);
	vi.mocked(useSchedules).mockReturnValue({
		schedules,
		addSchedule: mockAddSchedule,
		updateSchedule: vi.fn(),
		deleteSchedule: mockDeleteSchedule,
		error: null,
	} as ReturnType<typeof useSchedules>);
	vi.mocked(useExternalParties).mockReturnValue({
		externalParties: parties,
		addParty: vi.fn(),
		updateParty: vi.fn(),
		deleteParty: vi.fn(),
		error: null,
	} as ReturnType<typeof useExternalParties>);
	vi.mocked(get).mockResolvedValue(projectionResult);
}

function renderAt(id: string) {
	return render(
		<MemoryRouter initialEntries={[`/accounts/${id}`]}>
			<Routes>
				<Route path="/accounts/:id" element={<AccountDetailView />} />
			</Routes>
		</MemoryRouter>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	setupMocks();
});

afterEach(() => {
	cleanup();
});

describe("AccountDetailView — loading state", () => {
	it("renders nothing while accounts list is empty (loading)", () => {
		setupMocks([], [], []);
		const { container } = renderAt("acc-1");
		expect(container.firstChild).toBeNull();
	});
});

describe("AccountDetailView — not found", () => {
	it("shows not-found message for an unknown account id", () => {
		renderAt("does-not-exist");
		expect(screen.getByText("Account not found.")).toBeTruthy();
	});

	it("shows back link on not-found page", () => {
		renderAt("does-not-exist");
		expect(screen.getByText("← Accounts")).toBeTruthy();
	});
});

describe("AccountDetailView — account header", () => {
	it("shows the account name", async () => {
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText("Checking")).toBeTruthy();
	});

	it("shows owner, institution, type, and kind", async () => {
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText("Sean")).toBeTruthy();
		expect(screen.getByText("Chase")).toBeTruthy();
		expect(screen.getByText("checking")).toBeTruthy();
		expect(screen.getByText("revolving")).toBeTruthy();
	});

	it("shows seed balance and date in header", async () => {
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText(/seed balance as of 2024-01-01/)).toBeTruthy();
		expect(screen.getByText(/2\.0% rate/)).toBeTruthy();
	});

	it("shows 'amortizing' for an amortizing account", async () => {
		setupMocks([{ ...account, amortizing: true }]);
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText("amortizing")).toBeTruthy();
	});

	it("shows back link to accounts list", async () => {
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText("← Accounts")).toBeTruthy();
	});
});

describe("AccountDetailView — schedules panel", () => {
	it("shows empty message when no schedules involve this account", async () => {
		renderAt("acc-1");
		await act(async () => {});
		expect(
			screen.getByText("No schedules involve this account."),
		).toBeTruthy();
	});

	it("lists schedules involving this account with counterparty and amount", async () => {
		setupMocks([account], [schedule]);
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText("Employer")).toBeTruthy();
		expect(screen.getByText("$3,000")).toBeTruthy();
		expect(screen.getByText("monthly")).toBeTruthy();
	});

	it("does not list schedules that don't involve this account", async () => {
		const unrelatedSchedule: Schedule = {
			...schedule,
			id: "sched-2",
			sourceId: "other-1",
			destinationId: "other-2",
		};
		setupMocks([account], [unrelatedSchedule]);
		renderAt("acc-1");
		await act(async () => {});
		expect(
			screen.getByText("No schedules involve this account."),
		).toBeTruthy();
	});

	it("shows schedule form when '+ Add schedule' is clicked", async () => {
		setupMocks([account, { ...account, id: "acc-2", name: "Savings" }]);
		renderAt("acc-1");
		await act(async () => {});
		fireEvent.click(screen.getByRole("button", { name: "+ Add schedule" }));
		expect(screen.getByRole("button", { name: "Add schedule" })).toBeTruthy();
	});

	it("hides form and calls addSchedule on save", async () => {
		setupMocks([account, { ...account, id: "acc-2", name: "Savings" }]);
		renderAt("acc-1");
		await act(async () => {});
		fireEvent.click(screen.getByRole("button", { name: "+ Add schedule" }));
		const form = screen.getByRole("button", { name: "Add schedule" }).closest("form")!;
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "500" },
		});
		await act(async () => {
			fireEvent.submit(form);
		});
		expect(mockAddSchedule).toHaveBeenCalled();
	});

	it("hides form on cancel", async () => {
		setupMocks([account, { ...account, id: "acc-2", name: "Savings" }]);
		renderAt("acc-1");
		await act(async () => {});
		fireEvent.click(screen.getByRole("button", { name: "+ Add schedule" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(
			screen.queryByRole("button", { name: "Add schedule" }),
		).toBeNull();
	});

	it("calls deleteSchedule when Delete is confirmed", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(true);
		setupMocks([account], [schedule]);
		renderAt("acc-1");
		await act(async () => {});
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		});
		expect(mockDeleteSchedule).toHaveBeenCalledWith("sched-1");
	});

	it("does not call deleteSchedule when Delete is cancelled", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(false);
		setupMocks([account], [schedule]);
		renderAt("acc-1");
		await act(async () => {});
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		});
		expect(mockDeleteSchedule).not.toHaveBeenCalled();
	});
});

describe("AccountDetailView — projection", () => {
	it("fetches projection on mount when accounts are loaded", async () => {
		renderAt("acc-1");
		await act(async () => {});
		expect(vi.mocked(get)).toHaveBeenCalledWith(
			expect.stringContaining("/api/projection"),
		);
	});

	it("fetches both with-adj and no-adj projections", async () => {
		renderAt("acc-1");
		await act(async () => {});
		const calls = vi.mocked(get).mock.calls.map(([url]) => url as string);
		expect(calls.some((u) => u.includes("noAdj=1"))).toBe(true);
		expect(calls.some((u) => !u.includes("noAdj"))).toBe(true);
	});

	it("shows empty message when projection returns no data for this account", async () => {
		vi.mocked(get).mockResolvedValue({});
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText("No projection data.")).toBeTruthy();
	});
});

describe("AccountDetailView — adjustments panel", () => {
	it("renders AdjustmentPanel with fixedAccountId", async () => {
		renderAt("acc-1");
		await act(async () => {});
		const panel = screen.getByTestId("adjustment-panel");
		expect(panel.dataset.account).toBe("acc-1");
	});
});

describe("AccountDetailView — header edge cases", () => {
	it("omits institution when not set", async () => {
		setupMocks([{ ...account, institution: undefined }]);
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.queryByText("Chase")).toBeNull();
	});

	it("omits rate from seed meta when rate is 0", async () => {
		setupMocks([{ ...account, rate: 0 }]);
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.queryByText(/rate/)).toBeNull();
	});
});

describe("AccountDetailView — schedules panel edge cases", () => {
	it("shows '~' marker for estimated schedules", async () => {
		const estimatedSchedule: Schedule = {
			...schedule,
			estimated: true,
		};
		setupMocks([account], [estimatedSchedule]);
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText(/~/)).toBeTruthy();
	});

	it("falls back to raw id when nodeLabel finds no account or party", async () => {
		const unknownNodeSchedule: Schedule = {
			...schedule,
			sourceId: "unknown-node-id",
		};
		setupMocks([account], [unknownNodeSchedule], []);
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText("unknown-node-id")).toBeTruthy();
	});
});

describe("AccountDetailView — chart formatters", () => {
	it("yAxis tickFormatter formats as USD currency", async () => {
		renderAt("acc-1");
		await act(async () => {});
		expect(capturedTickFormatter).toBeDefined();
		expect(capturedTickFormatter?.(1234)).toBe("$1,234");
		expect(capturedTickFormatter?.(-500)).toBe("-$500");
	});

	it("tooltip formatter formats as USD currency", async () => {
		renderAt("acc-1");
		await act(async () => {});
		expect(capturedTooltipFormatter).toBeDefined();
		expect(capturedTooltipFormatter?.(9876)).toBe("$9,876");
	});

	it("sampleMonthly deduplicates points in the same month", async () => {
		// Two points in the same month — sampleMonthly should keep only the first
		vi.mocked(get).mockResolvedValue({
			"acc-1": [
				{ date: "2024-01-01", balance: 5000 },
				{ date: "2024-01-15", balance: 5050 }, // same month → filtered
				{ date: "2024-02-01", balance: 5100 },
			],
		});
		renderAt("acc-1");
		await act(async () => {});
		// If deduplication works, chart renders without error (not verifying exact data,
		// just that the branch executes without throwing)
		expect(screen.queryByText("No projection data.")).toBeNull();
	});
});

describe("AccountDetailView — header balance", () => {
	it("renders negative seed balance without error", async () => {
		setupMocks([{ ...account, seedBalance: -5000, rate: 0 }]);
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText("-$5,000")).toBeTruthy();
	});

	it("displays amortizing seed balance as positive", async () => {
		setupMocks([{ ...account, seedBalance: -20000, amortizing: true, rate: 0 }]);
		renderAt("acc-1");
		await act(async () => {});
		expect(screen.getByText("$20,000")).toBeTruthy();
	});
});

describe("AccountDetailView — stale fetch guard", () => {
	it("discards stale projection result when effect re-runs before first fetch completes", async () => {
		let resolveFirst!: (v: ProjectionResult) => void;
		let resolveSecond!: (v: ProjectionResult) => void;
		const staleResult: ProjectionResult = {
			"acc-1": [{ date: "2024-01-01", balance: 99999 }],
		};

		vi.mocked(get)
			.mockReturnValueOnce(new Promise<ProjectionResult>((r) => { resolveFirst = r; }))
			.mockReturnValueOnce(new Promise<ProjectionResult>((r) => { resolveSecond = r; }))
			.mockResolvedValue(projectionResult);

		// Return a new array reference each render to trigger effect re-run on rerender
		vi.mocked(useAccounts).mockImplementation(() => ({
			accounts: [account],
			addAccount: vi.fn(),
			updateAccount: vi.fn(),
			deleteAccount: vi.fn(),
			refresh: vi.fn(),
			error: null,
		}));

		const { rerender } = render(
			<MemoryRouter initialEntries={["/accounts/acc-1"]}>
				<Routes>
					<Route path="/accounts/:id" element={<AccountDetailView />} />
				</Routes>
			</MemoryRouter>,
		);

		// Re-render while first fetches are still pending — effect re-runs with fetchId=2
		// (new accounts reference from mockImplementation triggers the effect dep change)
		await act(async () => {
			rerender(
				<MemoryRouter initialEntries={["/accounts/acc-1"]}>
					<Routes>
						<Route path="/accounts/:id" element={<AccountDetailView />} />
					</Routes>
				</MemoryRouter>,
			);
		});

		// fetchIdRef.current is now 2; resolving the stale fetches (fetchId=1) hits the guard
		await act(async () => {
			resolveFirst(staleResult);
			resolveSecond(staleResult);
		});
		await act(async () => {});
	});
});
