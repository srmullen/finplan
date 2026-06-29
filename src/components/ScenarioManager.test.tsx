// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Scenario, Schedule } from "../engine/types";

vi.mock("@src/hooks/useScenarios");
vi.mock("@src/hooks/useAccounts");
vi.mock("@src/hooks/useExternalParties");
vi.mock("@src/hooks/useSchedules");
vi.mock("@src/utils/id", () => ({ generateId: () => "new-id" }));

import { useAccounts } from "@src/hooks/useAccounts";
import { useExternalParties } from "@src/hooks/useExternalParties";
import { useScenarios } from "@src/hooks/useScenarios";
import { useSchedules } from "@src/hooks/useSchedules";
import ScenarioManager from "./ScenarioManager";

const onToggleScenario = vi.fn();

const scenario: Scenario = {
	id: "sc-1",
	name: "My Scenario",
	scheduleOverrides: [],
	additionalSchedules: [],
	additionalAccounts: [],
};

const scheduleA: Schedule = {
	id: "s-1",
	sourceId: "party-1",
	destinationId: "acc-1",
	amount: 500,
	estimated: false,
	frequency: "monthly",
	startDate: "2024-01-01",
	terminateAtZero: false,
};

const mockUpdateScenario = vi.fn();
const mockDeleteScenario = vi.fn();
const mockAddScenario = vi.fn();

function setupHooks(scenarios: Scenario[], schedules: Schedule[] = []) {
	vi.mocked(useScenarios).mockReturnValue({
		scenarios,
		addScenario: mockAddScenario,
		updateScenario: mockUpdateScenario,
		deleteScenario: mockDeleteScenario,
		error: null,
	} as ReturnType<typeof useScenarios>);
	vi.mocked(useAccounts).mockReturnValue({
		accounts: [],
		addAccount: vi.fn(),
		updateAccount: vi.fn(),
		deleteAccount: vi.fn(),
		refresh: vi.fn(),
		error: null,
	} as ReturnType<typeof useAccounts>);
	vi.mocked(useExternalParties).mockReturnValue({
		externalParties: [],
		addParty: vi.fn(),
		updateParty: vi.fn(),
		deleteParty: vi.fn(),
		error: null,
	} as ReturnType<typeof useExternalParties>);
	vi.mocked(useSchedules).mockReturnValue({
		schedules,
		addSchedule: vi.fn(),
		updateSchedule: vi.fn(),
		deleteSchedule: vi.fn(),
		error: null,
	} as ReturnType<typeof useSchedules>);
}

beforeEach(() => {
	vi.clearAllMocks();
	setupHooks([]);
});

afterEach(() => {
	cleanup();
});

describe("ScenarioManager — empty state", () => {
	it("shows empty message when no scenarios exist", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		expect(screen.getByText("No scenarios yet.")).toBeTruthy();
	});

	it("Create button is disabled when name is empty", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
	});

	it("calls addScenario on form submit with a name", async () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.change(screen.getByPlaceholderText("New scenario name…"), { target: { value: "New Plan" } });
		await act(async () => {
			fireEvent.submit(screen.getByRole("button", { name: "Create" }).closest("form")!);
		});
		expect(mockAddScenario).toHaveBeenCalledWith(expect.objectContaining({ name: "New Plan" }));
	});
});

describe("ScenarioManager — scenario list", () => {
	beforeEach(() => setupHooks([scenario]));

	it("renders the scenario name", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		expect(screen.getByText("My Scenario")).toBeTruthy();
	});

	it("calls onToggleScenario when checkbox is clicked", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("checkbox"));
		expect(onToggleScenario).toHaveBeenCalledWith("sc-1");
	});

	it("shows rename form when Rename is clicked, cancels on ✕", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Rename" }));
		expect(screen.getByDisplayValue("My Scenario")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "✕" }));
		expect(screen.queryByDisplayValue("My Scenario")).toBeNull();
	});

	it("calls updateScenario when rename Save is submitted", async () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Rename" }));
		fireEvent.change(screen.getByDisplayValue("My Scenario"), { target: { value: "Renamed" } });
		await act(async () => {
			fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);
		});
		expect(mockUpdateScenario).toHaveBeenCalledWith(expect.objectContaining({ name: "Renamed" }));
	});

	it("calls deleteScenario when Delete is confirmed", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(true);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		await act(async () => fireEvent.click(screen.getByRole("button", { name: "Delete" })));
		expect(mockDeleteScenario).toHaveBeenCalledWith("sc-1");
	});

	it("does not delete when confirm is cancelled", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(false);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		await act(async () => fireEvent.click(screen.getByRole("button", { name: "Delete" })));
		expect(mockDeleteScenario).not.toHaveBeenCalled();
	});

	it("shows the editor when Edit is clicked", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByText("Editing: My Scenario")).toBeTruthy();
	});

	it("toggles editor off when Edit/Close is clicked again", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(screen.queryByText("Editing: My Scenario")).toBeNull();
	});

	it("closes editor when Done is clicked", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "✕ Done" }));
		expect(screen.queryByText("Editing: My Scenario")).toBeNull();
	});

	it("clears editingId when the currently-edited scenario is deleted", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(true);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => fireEvent.click(screen.getByRole("button", { name: "Delete" })));
		expect(mockDeleteScenario).toHaveBeenCalled();
	});
});

describe("ScenarioManager — editor with schedule overrides", () => {
	it("renders schedule overrides table when schedules exist", () => {
		setupHooks([scenario], [scheduleA]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByText("Schedule overrides")).toBeTruthy();
	});

	it("does nothing when NaN is entered for a schedule with no existing override", async () => {
		setupHooks([scenario], [scheduleA]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			// Use a non-numeric non-empty string so @testing-library overrides the DOM value
			// and React sees a change event (empty→"abc") and calls onChange with NaN
			fireEvent.change(screen.getByPlaceholderText("500"), { target: { value: "abc" } });
		});
		expect(mockUpdateScenario).not.toHaveBeenCalled();
	});

	it("adds a new override when amount is changed on a schedule without an existing override", async () => {
		setupHooks([scenario], [scheduleA]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText("500"), { target: { value: "750" } });
		});
		expect(mockUpdateScenario).toHaveBeenCalledWith(expect.objectContaining({
			scheduleOverrides: [{ scheduleId: "s-1", amount: 750 }],
		}));
	});


	it("removes override when NaN is entered and override only has scheduleId+amount", async () => {
		const scenarioWithAmountOverride: Scenario = {
			...scenario,
			scheduleOverrides: [{ scheduleId: "s-1", amount: 750 }],
		};
		setupHooks([scenarioWithAmountOverride], [scheduleA]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.change(screen.getByDisplayValue("750"), { target: { value: "" } });
		});
		expect(mockUpdateScenario).toHaveBeenCalledWith(expect.objectContaining({
			scheduleOverrides: [],
		}));
	});

	it("updates existing override's amount when a valid value is entered", async () => {
		const scenarioWithExisting: Scenario = {
			...scenario,
			scheduleOverrides: [{ scheduleId: "s-1", amount: 750, paused: false }],
		};
		setupHooks([scenarioWithExisting], [scheduleA]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.change(screen.getByDisplayValue("750"), { target: { value: "1000" } });
		});
		expect(mockUpdateScenario).toHaveBeenCalledWith(expect.objectContaining({
			scheduleOverrides: [{ scheduleId: "s-1", amount: 1000, paused: false }],
		}));
	});

	it("strips amount from override when NaN is entered and other fields remain", async () => {
		const scenarioWithPausedAndAmount: Scenario = {
			...scenario,
			scheduleOverrides: [{ scheduleId: "s-1", amount: 750, paused: false }],
		};
		setupHooks([scenarioWithPausedAndAmount], [scheduleA]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.change(screen.getByDisplayValue("750"), { target: { value: "" } });
		});
		const call = mockUpdateScenario.mock.calls.at(-1)![0] as Scenario;
		expect(call.scheduleOverrides[0]).not.toHaveProperty("amount");
	});

	it("pauses a schedule that has no override yet", async () => {
		setupHooks([scenario], [scheduleA]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.click(screen.getAllByRole("checkbox").at(-1)!);
		});
		expect(mockUpdateScenario).toHaveBeenCalledWith(expect.objectContaining({
			scheduleOverrides: [{ scheduleId: "s-1", paused: true }],
		}));
	});

	it("removes the override when unpausing a pause-only override", async () => {
		const scenarioPaused: Scenario = {
			...scenario,
			scheduleOverrides: [{ scheduleId: "s-1", paused: true }],
		};
		setupHooks([scenarioPaused], [scheduleA]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.click(screen.getAllByRole("checkbox").at(-1)!);
		});
		expect(mockUpdateScenario).toHaveBeenCalledWith(expect.objectContaining({
			scheduleOverrides: [],
		}));
	});

	it("toggles paused on an override that has other fields", async () => {
		const scenarioWithAmount: Scenario = {
			...scenario,
			scheduleOverrides: [{ scheduleId: "s-1", amount: 750, paused: false }],
		};
		setupHooks([scenarioWithAmount], [scheduleA]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.click(screen.getAllByRole("checkbox").at(-1)!);
		});
		const call = mockUpdateScenario.mock.calls.at(-1)![0] as Scenario;
		expect(call.scheduleOverrides[0]!.paused).toBe(true);
	});

	const scheduleB: Schedule = {
		id: "s-2",
		sourceId: "party-1",
		destinationId: "acc-1",
		amount: 300,
		estimated: false,
		frequency: "monthly",
		startDate: "2024-01-01",
		terminateAtZero: false,
	};

	it("preserves unrelated overrides when toggling pause on one of multiple overrides", async () => {
		const twoOverrides: Scenario = {
			...scenario,
			scheduleOverrides: [
				{ scheduleId: "s-1", amount: 750, paused: false },
				{ scheduleId: "s-2", amount: 300 },
			],
		};
		setupHooks([twoOverrides], [scheduleA, scheduleB]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			// Toggle the first schedule's pause checkbox
			fireEvent.click(screen.getAllByRole("checkbox")[1]!);
		});
		const call = mockUpdateScenario.mock.calls.at(-1)![0] as Scenario;
		expect(call.scheduleOverrides).toHaveLength(2);
		expect(call.scheduleOverrides.find(o => o.scheduleId === "s-2")!.amount).toBe(300);
	});

	it("preserves unrelated overrides when updating amount on one of multiple overrides", async () => {
		const twoOverrides: Scenario = {
			...scenario,
			scheduleOverrides: [
				{ scheduleId: "s-1", amount: 500 },
				{ scheduleId: "s-2", amount: 300 },
			],
		};
		setupHooks([twoOverrides], [scheduleA, scheduleB]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.change(screen.getByDisplayValue("500"), { target: { value: "1000" } });
		});
		const call = mockUpdateScenario.mock.calls.at(-1)![0] as Scenario;
		expect(call.scheduleOverrides.find(o => o.scheduleId === "s-1")!.amount).toBe(1000);
		expect(call.scheduleOverrides.find(o => o.scheduleId === "s-2")!.amount).toBe(300);
	});

	it("preserves unrelated overrides when stripping amount via NaN on one of multiple overrides", async () => {
		const twoOverrides: Scenario = {
			...scenario,
			scheduleOverrides: [
				{ scheduleId: "s-1", amount: 500, paused: false },
				{ scheduleId: "s-2", amount: 300 },
			],
		};
		setupHooks([twoOverrides], [scheduleA, scheduleB]);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.change(screen.getByDisplayValue("500"), { target: { value: "" } });
		});
		const call = mockUpdateScenario.mock.calls.at(-1)![0] as Scenario;
		const s1Override = call.scheduleOverrides.find(o => o.scheduleId === "s-1")!;
		expect(s1Override).not.toHaveProperty("amount");
		expect(call.scheduleOverrides.find(o => o.scheduleId === "s-2")!.amount).toBe(300);
	});
});

describe("ScenarioManager — additional accounts in editor", () => {
	beforeEach(() => setupHooks([scenario]));

	it("adds an additional account via AccountForm", async () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "+ Add account" }));
		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Emergency Fund" } });
		await act(async () => {
			fireEvent.submit(screen.getByLabelText("Name").closest("form")!);
		});
		const call = mockUpdateScenario.mock.calls.at(-1)![0] as Scenario;
		expect(call.additionalAccounts[0]!.name).toBe("Emergency Fund");
	});

	it("cancels adding account when AccountForm Cancel is clicked", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "+ Add account" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.getByRole("button", { name: "+ Add account" })).toBeTruthy();
	});

	it("populates owner and institution suggestions from existing accounts", () => {
		vi.mocked(useAccounts).mockReturnValue({
			accounts: [
				{ id: "a1", name: "Checking", type: "checking", owner: "Sean", institution: "Chase", seedBalance: 0, seedDate: "2024-01-01", rate: 0, amortizing: false },
				{ id: "a2", name: "Savings", type: "savings", owner: "Wife", seedBalance: 0, seedDate: "2024-01-01", rate: 0, amortizing: false },
			],
			addAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn(), refresh: vi.fn(), error: null,
		} as ReturnType<typeof useAccounts>);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "+ Add account" }));
		const ownerOpts = [...document.querySelectorAll("#owner-suggestions option")].map(
			(o) => (o as HTMLOptionElement).value,
		);
		expect(ownerOpts).toContain("Sean");
		expect(ownerOpts).toContain("Wife");
		const instOpts = [...document.querySelectorAll("#institution-suggestions option")].map(
			(o) => (o as HTMLOptionElement).value,
		);
		expect(instOpts).toContain("Chase");
	});
});

describe("ScenarioManager — additional accounts chip removal", () => {
	const scenarioWithAccount: Scenario = {
		...scenario,
		additionalAccounts: [{
			id: "extra-1",
			name: "Extra",
			type: "savings",
			owner: "Sean",
			seedBalance: 0,
			seedDate: "2024-01-01",
			rate: 0,
			amortizing: false,
		}],
	};

	beforeEach(() => setupHooks([scenarioWithAccount]));

	it("removes an additional account when ✕ chip button is clicked", async () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.click(screen.getByText("Extra (Sean) — savings").parentElement!.querySelector("button")!);
		});
		const call = mockUpdateScenario.mock.calls.at(-1)![0] as Scenario;
		expect(call.additionalAccounts).toHaveLength(0);
	});
});

describe("ScenarioManager — additional schedules in editor", () => {
	beforeEach(() => setupHooks([scenario]));

	it("cancels adding schedule when ScheduleForm Cancel is clicked", () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "+ Add schedule" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.getByRole("button", { name: "+ Add schedule" })).toBeTruthy();
	});

	it("adds an additional schedule via ScheduleForm", async () => {
		vi.mocked(useAccounts).mockReturnValue({
			accounts: [{ id: "acc-1", name: "Checking", type: "checking", owner: "Sean", seedBalance: 0, seedDate: "2024-01-01", rate: 0, amortizing: false }],
			addAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn(), refresh: vi.fn(), error: null,
		} as ReturnType<typeof useAccounts>);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "+ Add schedule" }));
		fireEvent.change(screen.getByLabelText("Amount ($)"), { target: { value: "750" } });
		await act(async () => {
			fireEvent.submit(screen.getByLabelText("Amount ($)").closest("form")!);
		});
		const call = mockUpdateScenario.mock.calls.at(-1)![0] as Scenario;
		expect(call.additionalSchedules).toHaveLength(1);
		expect(call.additionalSchedules[0]!.amount).toBe(750);
	});
});

describe("ScenarioManager — additional schedules chip removal", () => {
	const scenarioWithSchedule: Scenario = {
		...scenario,
		additionalSchedules: [scheduleA],
	};

	beforeEach(() => setupHooks([scenarioWithSchedule]));

	it("removes an additional schedule when ✕ chip button is clicked", async () => {
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		await act(async () => {
			fireEvent.click(screen.getAllByRole("button", { name: "✕" })[0]!);
		});
		const call = mockUpdateScenario.mock.calls.at(-1)![0] as Scenario;
		expect(call.additionalSchedules).toHaveLength(0);
	});
});

describe("ScenarioManager — nodeLabel resolution", () => {
	beforeEach(() => setupHooks([scenario]));

	const acc = {
		id: "a1",
		name: "Checking",
		type: "checking" as const,
		owner: "Sean" as const,
		seedBalance: 0,
		seedDate: "2024-01-01",
		rate: 0,
		amortizing: false,
	};

	it("resolves account node labels in schedule overrides", () => {
		vi.mocked(useAccounts).mockReturnValue({
			accounts: [acc],
			addAccount: vi.fn(),
			updateAccount: vi.fn(),
			deleteAccount: vi.fn(),
			refresh: vi.fn(),
			error: null,
		} as ReturnType<typeof useAccounts>);
		vi.mocked(useSchedules).mockReturnValue({
			schedules: [{ ...scheduleA, sourceId: "a1", destinationId: "party-1" }],
			addSchedule: vi.fn(),
			updateSchedule: vi.fn(),
			deleteSchedule: vi.fn(),
			error: null,
		} as ReturnType<typeof useSchedules>);
		vi.mocked(useExternalParties).mockReturnValue({
			externalParties: [{ id: "party-1", name: "Employer" }],
			addParty: vi.fn(),
			updateParty: vi.fn(),
			deleteParty: vi.fn(),
			error: null,
		} as ReturnType<typeof useExternalParties>);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByText("Checking (Sean)")).toBeTruthy();
		expect(screen.getByText("Employer")).toBeTruthy();
	});

	it("falls back to id when node is not found", () => {
		vi.mocked(useSchedules).mockReturnValue({
			schedules: [{ ...scheduleA, sourceId: "unknown-id" }],
			addSchedule: vi.fn(),
			updateSchedule: vi.fn(),
			deleteSchedule: vi.fn(),
			error: null,
		} as ReturnType<typeof useSchedules>);
		render(<ScenarioManager activeScenarioIds={new Set()} onToggleScenario={onToggleScenario} />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByText("unknown-id")).toBeTruthy();
	});
});
