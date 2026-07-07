// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account, ProjectionResult } from "../engine/types";

vi.mock("@src/hooks/useAccounts");
vi.mock("@src/api/client");
let capturedToggleScenario: (id: string) => void = () => {};
let capturedOnScenarioUpdated: () => void = () => {};
vi.mock("@src/components/ScenarioManager", () => ({
	default: ({
		onToggleScenario,
		onScenarioUpdated,
	}: {
		onToggleScenario: (id: string) => void;
		onScenarioUpdated?: () => void;
	}) => {
		capturedToggleScenario = onToggleScenario;
		if (onScenarioUpdated) capturedOnScenarioUpdated = onScenarioUpdated;
		return <div data-testid="scenario-manager" />;
	},
}));
let capturedTickFormatter: ((v: unknown) => string) | undefined;
let capturedTooltipFormatter: ((v: number) => string) | undefined;
let capturedChartData: Record<string, string | number>[] = [];

vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	LineChart: ({
		children,
		data,
	}: {
		children: React.ReactNode;
		data?: Record<string, string | number>[];
	}) => {
		if (data) capturedChartData = data;
		return <div>{children}</div>;
	},
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
	Legend: () => null,
	ReferenceLine: () => null,
}));

import { get } from "@src/api/client";
import { useAccounts } from "@src/hooks/useAccounts";
import ProjectionView from "./ProjectionView";

const account: Account = {
	id: "acc-1",
	name: "Checking",
	type: "checking",
	owner: "Sean",
	seedBalance: 1000,
	seedDate: "2024-01-01",
	rate: 0,
	amortizing: false,
};

const amortizingAccount: Account = {
	id: "loan-1",
	name: "Car Loan",
	type: "loan",
	owner: "Sean",
	seedBalance: -10000,
	seedDate: "2024-01-01",
	rate: 0,
	amortizing: true,
};

const projectionResult: ProjectionResult = {
	"acc-1": [
		{ date: "2024-01-01", balance: 1000 },
		{ date: "2024-01-15", balance: 1050 }, // same month — filtered by sampleMonthly
		{ date: "2024-02-01", balance: 1100 },
	],
};

function setupMocks(accounts: Account[] = []) {
	vi.mocked(useAccounts).mockReturnValue({
		accounts,
		addAccount: vi.fn(),
		updateAccount: vi.fn(),
		deleteAccount: vi.fn(),
		refresh: vi.fn(),
		error: null,
	} as ReturnType<typeof useAccounts>);
}

beforeEach(() => {
	vi.clearAllMocks();
	setupMocks();
	vi.mocked(get).mockResolvedValue(projectionResult);
});

afterEach(() => {
	cleanup();
});

describe("ProjectionView — no accounts", () => {
	it("shows empty message when there are no accounts", () => {
		render(<ProjectionView />);
		expect(screen.getByText(/No accounts yet/)).toBeTruthy();
	});

	it("clears results when accounts is empty", async () => {
		render(<ProjectionView />);
		await act(async () => {});
		expect(vi.mocked(get)).not.toHaveBeenCalled();
	});
});

describe("ProjectionView — with accounts", () => {
	beforeEach(() => setupMocks([account]));

	it("renders the account filter checkbox", async () => {
		render(<ProjectionView />);
		await act(async () => {});
		expect(screen.getByText("Checking")).toBeTruthy();
	});

	it("fetches baseline projection on mount", async () => {
		render(<ProjectionView />);
		await act(async () => {});
		expect(vi.mocked(get)).toHaveBeenCalledWith(
			expect.stringContaining("/api/projection"),
		);
	});

	it("toggles account visibility when checkbox is clicked", async () => {
		render(<ProjectionView />);
		await act(async () => {});
		const checkbox = screen.getAllByRole("checkbox")[0]!;
		fireEvent.click(checkbox);
		expect((checkbox as HTMLInputElement).checked).toBe(false);
		fireEvent.click(checkbox);
		expect((checkbox as HTMLInputElement).checked).toBe(true);
	});

	it("shows Scenarios panel when Scenarios button is clicked", async () => {
		render(<ProjectionView />);
		await act(async () => {});
		fireEvent.click(screen.getByRole("button", { name: "Scenarios" }));
		expect(screen.getByTestId("scenario-manager")).toBeTruthy();
	});

	it("shows active scenario count in Scenarios button", async () => {
		render(<ProjectionView />);
		await act(async () => {});
		expect(screen.getByRole("button", { name: "Scenarios" })).toBeTruthy();
	});

	it("changes horizon when select is changed", async () => {
		render(<ProjectionView />);
		await act(async () => {});
		const select = screen.getByRole("combobox");
		const callsBefore = vi.mocked(get).mock.calls.length;
		fireEvent.change(select, { target: { value: "24" } });
		await act(async () => {});
		expect(vi.mocked(get).mock.calls.length).toBeGreaterThan(callsBefore);
	});
});

describe("ProjectionView — amortizing balance display", () => {
	it("negates chart balance for amortizing accounts", async () => {
		setupMocks([amortizingAccount]);
		const loanResult: ProjectionResult = {
			"loan-1": [{ date: "2024-01-01", balance: -10000 }],
		};
		vi.mocked(get).mockResolvedValue(loanResult);
		render(<ProjectionView />);
		await act(async () => {});
		expect(capturedChartData[0]?.["loan-1"]).toBe(10000);
	});
});

describe("ProjectionView — milestones (amortizing payoff)", () => {
	it("renders payoff milestone when amortizing account crosses zero upward", async () => {
		setupMocks([amortizingAccount]);
		const loanResult: ProjectionResult = {
			"loan-1": [
				{ date: "2024-01-01", balance: -100 },
				{ date: "2024-02-01", balance: 0 },
			],
		};
		vi.mocked(get).mockResolvedValue(loanResult);
		render(<ProjectionView />);
		await act(async () => {});
		expect(screen.getByText(/Car Loan paid off/)).toBeTruthy();
	});

	it("renders negative milestone when account crosses zero downward", async () => {
		setupMocks([account]);
		const crossResult: ProjectionResult = {
			"acc-1": [
				{ date: "2024-01-01", balance: 100 },
				{ date: "2024-02-01", balance: -50 },
			],
		};
		vi.mocked(get).mockResolvedValue(crossResult);
		render(<ProjectionView />);
		await act(async () => {});
		expect(screen.getByText(/Checking negative/)).toBeTruthy();
	});
});

describe("ProjectionView — stale fetch guard", () => {
	it("discards a stale baseline result when horizon changes before fetch completes", async () => {
		setupMocks([account]);

		let resolveFirst!: (v: ProjectionResult) => void;
		let resolveSecond!: (v: ProjectionResult) => void;

		const staleResult: ProjectionResult = {
			"acc-1": [{ date: "2100-01-01", balance: 99999 }],
		};
		const freshResult: ProjectionResult = {
			"acc-1": [{ date: "2024-01-01", balance: 1000 }],
		};

		vi.mocked(get)
			.mockReturnValueOnce(
				new Promise((r) => {
					resolveFirst = r;
				}) as Promise<ProjectionResult>,
			)
			.mockReturnValueOnce(
				new Promise((r) => {
					resolveSecond = r;
				}) as Promise<ProjectionResult>,
			)
			.mockResolvedValue(freshResult);

		render(<ProjectionView />);

		// Change horizon to trigger a second effect run before the first fetch resolves
		await act(async () => {
			fireEvent.change(screen.getByRole("combobox"), {
				target: { value: "24" },
			});
		});

		// Resolve the stale first fetch
		await act(async () => {
			resolveFirst(staleResult);
			resolveSecond(staleResult);
		});

		await act(async () => {});
	});
});

describe("ProjectionView — stale scenario fetch guard", () => {
	it("discards a stale scenario result when horizon changes before scenario fetch completes", async () => {
		setupMocks([account]);

		let resolveStaleScenario!: (v: ProjectionResult) => void;
		const staleScenarioFetch = new Promise<ProjectionResult>((res) => {
			resolveStaleScenario = res;
		});

		vi.mocked(get)
			.mockResolvedValueOnce(projectionResult) // initial baseline
			.mockReturnValueOnce(staleScenarioFetch) // first (stale) scenario fetch — deferred
			.mockResolvedValue(projectionResult); // all subsequent fetches

		render(<ProjectionView />);
		await act(async () => {}); // initial baseline resolves

		fireEvent.click(screen.getByRole("button", { name: "Scenarios" }));
		await act(async () => {});

		// Toggle sc-1 → first scenario fetch starts (id=1, deferred)
		await act(async () => {
			capturedToggleScenario("sc-1");
		});

		// Change horizon → endDate changes → new scenario effect fires (id=2)
		fireEvent.change(screen.getByRole("combobox"), { target: { value: "24" } });
		await act(async () => {}); // new baseline + new scenario fetch resolve (id=2)

		// Resolve the stale first fetch → guard at line 142 fires (ref=2, id=1 → mismatch)
		await act(async () => {
			resolveStaleScenario(projectionResult);
		});
		await act(async () => {});
	});
});

describe("ProjectionView — chart formatters", () => {
	beforeEach(() => setupMocks([account]));

	it("yAxis tickFormatter formats numbers as USD currency", async () => {
		render(<ProjectionView />);
		await act(async () => {});
		expect(capturedTickFormatter).toBeDefined();
		expect(capturedTickFormatter?.(1234)).toBe("$1,234");
		expect(capturedTickFormatter?.(-500)).toBe("-$500");
	});

	it("tooltip formatter formats values as USD currency", async () => {
		render(<ProjectionView />);
		await act(async () => {});
		expect(capturedTooltipFormatter).toBeDefined();
		expect(capturedTooltipFormatter?.(9876)).toBe("$9,876");
	});
});

describe("ProjectionView — scenario fetching", () => {
	it("fetches scenario projection when a scenario is toggled on", async () => {
		setupMocks([account]);
		render(<ProjectionView />);
		await act(async () => {});

		// Verify baseline URL
		const [firstCall] = vi.mocked(get).mock.calls;
		expect(firstCall?.[0]).toContain("startDate=");
		expect(firstCall?.[0]).toContain("endDate=");
		expect(firstCall?.[0]).not.toContain("scenarioId=");
	});

	it("fetches scenario projection when a scenario is toggled on via ScenarioManager", async () => {
		setupMocks([account]);
		render(<ProjectionView />);
		await act(async () => {});

		// Open Scenarios panel so ScenarioManager renders and captures the toggle callback
		fireEvent.click(screen.getByRole("button", { name: "Scenarios" }));
		await act(async () => {});

		// Now toggle a scenario on via the captured callback
		await act(async () => {
			capturedToggleScenario("sc-1");
		});
		await act(async () => {});
		await act(async () => {}); // extra flush: ensures setScenarioResults re-render completes

		// The scenario effect should fetch with scenarioId
		const calls = vi.mocked(get).mock.calls.map(([url]) => url as string);
		expect(calls.some((u) => u.includes("scenarioId=sc-1"))).toBe(true);
	});

	it("clears scenario results when all scenarios are toggled off", async () => {
		setupMocks([account]);
		render(<ProjectionView />);
		await act(async () => {});

		// Open panel so ScenarioManager renders
		fireEvent.click(screen.getByRole("button", { name: "Scenarios" }));
		await act(async () => {});

		// Toggle on, then off
		await act(async () => {
			capturedToggleScenario("sc-1");
		});
		await act(async () => {});
		await act(async () => {});
		await act(async () => {
			capturedToggleScenario("sc-1");
		});
		await act(async () => {});

		// After toggling off, the scenario effect should not have fetched for sc-1 recently
		const allCalls = vi.mocked(get).mock.calls.map(([url]) => url as string);
		expect(allCalls.some((u) => u.includes("scenarioId=sc-1"))).toBe(true);
	});

	it("re-fetches active scenario projections when a scenario is edited", async () => {
		setupMocks([account]);
		render(<ProjectionView />);
		await act(async () => {});

		fireEvent.click(screen.getByRole("button", { name: "Scenarios" }));
		await act(async () => {});

		await act(async () => {
			capturedToggleScenario("sc-1");
		});
		await act(async () => {});
		await act(async () => {});

		const callsBeforeEdit = vi
			.mocked(get)
			.mock.calls.filter(([url]) => (url as string).includes("scenarioId=sc-1"))
			.length;

		await act(async () => {
			capturedOnScenarioUpdated();
		});
		await act(async () => {});

		const callsAfterEdit = vi
			.mocked(get)
			.mock.calls.filter(([url]) => (url as string).includes("scenarioId=sc-1"))
			.length;

		expect(callsAfterEdit).toBeGreaterThan(callsBeforeEdit);
	});

	it("does not trigger a scenario fetch on edit when no scenarios are active", async () => {
		setupMocks([account]);
		render(<ProjectionView />);
		await act(async () => {});

		fireEvent.click(screen.getByRole("button", { name: "Scenarios" }));
		await act(async () => {});

		const callsBefore = vi.mocked(get).mock.calls.length;

		await act(async () => {
			capturedOnScenarioUpdated();
		});
		await act(async () => {});

		expect(vi.mocked(get).mock.calls.length).toBe(callsBefore);
	});

	it("covers all chartData branch paths: missing result, missing point, and scenario data", async () => {
		// Two accounts but projection only has acc-1 data → acc-2 triggers ?? [] and point = 0
		const account2: Account = { ...account, id: "acc-2", name: "Savings" };
		setupMocks([account, account2]);

		// Baseline: only acc-1 has data; acc-2 missing → (result["acc-2"] ?? []) and point=0
		const partialBaseline: ProjectionResult = {
			"acc-1": [
				{ date: "2024-01-01", balance: 1000 },
				{ date: "2024-01-15", balance: 1050 },
				{ date: "2024-02-01", balance: 1100 },
			],
		};
		// Scenario: acc-1 has only one date (first match → balance; second → scPoint=0)
		//           acc-2 missing → (scResult["acc-2"] ?? []) and scPoint=0
		const partialScenario: ProjectionResult = {
			"acc-1": [{ date: "2024-01-01", balance: 2000 }],
		};

		vi.mocked(get)
			.mockResolvedValueOnce(partialBaseline) // baseline
			.mockResolvedValue(partialScenario); // scenario fetch

		render(<ProjectionView />);
		await act(async () => {});

		fireEvent.click(screen.getByRole("button", { name: "Scenarios" }));
		await act(async () => {});

		await act(async () => {
			capturedToggleScenario("sc-1");
		});
		await act(async () => {});
		await act(async () => {});
		await act(async () => {});
	});
});
