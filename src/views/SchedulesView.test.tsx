// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account, ExternalParty, Schedule } from "../engine/types";

vi.mock("@src/hooks/useSchedules");
vi.mock("@src/hooks/useAccounts");
vi.mock("@src/hooks/useExternalParties");

import { useAccounts } from "@src/hooks/useAccounts";
import { useExternalParties } from "@src/hooks/useExternalParties";
import { useSchedules } from "@src/hooks/useSchedules";
import SchedulesView from "./SchedulesView";

const mockAddSchedule = vi.fn();
const mockUpdateSchedule = vi.fn();
const mockDeleteSchedule = vi.fn();

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

const party: ExternalParty = { id: "party-1", name: "Employer" };

const schedule: Schedule = {
	id: "s-1",
	sourceId: "party-1",
	destinationId: "acc-1",
	amount: 3000,
	estimated: true,
	frequency: "biweekly",
	startDate: "2024-01-01",
	endDate: "2024-12-31",
	terminateAtZero: false,
};

function setupMocks(
	schedules: Schedule[] = [],
	accounts: Account[] = [],
	parties: ExternalParty[] = [],
) {
	vi.mocked(useSchedules).mockReturnValue({
		schedules,
		addSchedule: mockAddSchedule,
		updateSchedule: mockUpdateSchedule,
		deleteSchedule: mockDeleteSchedule,
		error: null,
	} as ReturnType<typeof useSchedules>);
	vi.mocked(useAccounts).mockReturnValue({
		accounts,
		addAccount: vi.fn(),
		updateAccount: vi.fn(),
		deleteAccount: vi.fn(),
		refresh: vi.fn(),
		error: null,
	} as ReturnType<typeof useAccounts>);
	vi.mocked(useExternalParties).mockReturnValue({
		externalParties: parties,
		addParty: vi.fn(),
		updateParty: vi.fn(),
		deleteParty: vi.fn(),
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

describe("SchedulesView — empty state (no nodes)", () => {
	it("shows empty schedule message", () => {
		render(<SchedulesView />);
		expect(screen.getByText("No schedules yet.")).toBeTruthy();
	});

	it("shows hint when fewer than 2 nodes exist", () => {
		setupMocks([], [account], []);
		render(<SchedulesView />);
		expect(screen.getByText(/at least two nodes/)).toBeTruthy();
	});

	it("disables Add schedule button when fewer than 2 nodes", () => {
		render(<SchedulesView />);
		const btn = screen.getByRole("button", { name: "+ Add schedule" }) as HTMLButtonElement;
		expect(btn.disabled).toBe(true);
	});
});

describe("SchedulesView — with nodes (2+ nodes)", () => {
	beforeEach(() => setupMocks([], [account], [party]));

	it("enables Add schedule button when 2+ nodes exist", () => {
		render(<SchedulesView />);
		const btn = screen.getByRole("button", { name: "+ Add schedule" }) as HTMLButtonElement;
		expect(btn.disabled).toBe(false);
	});

	it("shows ScheduleForm when Add schedule is clicked, hides on Cancel", () => {
		render(<SchedulesView />);
		fireEvent.click(screen.getByRole("button", { name: "+ Add schedule" }));
		expect(screen.getByLabelText("Amount ($)")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.queryByLabelText("Amount ($)")).toBeNull();
	});

	it("calls addSchedule and hides form on save (add mode)", async () => {
		render(<SchedulesView />);
		fireEvent.click(screen.getByRole("button", { name: "+ Add schedule" }));
		fireEvent.change(screen.getByLabelText("Amount ($)"), { target: { value: "500" } });
		await act(async () => {
			fireEvent.submit(screen.getByLabelText("Amount ($)").closest("form")!);
		});
		expect(mockAddSchedule).toHaveBeenCalled();
	});
});

describe("SchedulesView — with schedules", () => {
	beforeEach(() => setupMocks([schedule], [account], [party]));

	it("renders schedule row with estimated indicator", () => {
		render(<SchedulesView />);
		// estimated schedules show " ~" after amount
		expect(screen.getByText("$3,000 ~")).toBeTruthy();
	});

	it("renders schedule row without indicator for non-estimated schedule", () => {
		setupMocks([{ ...schedule, estimated: false }], [account], [party]);
		render(<SchedulesView />);
		expect(screen.getByText("$3,000")).toBeTruthy();
	});

	it("renders end date column", () => {
		render(<SchedulesView />);
		expect(screen.getByText("2024-12-31")).toBeTruthy();
	});

	it("renders '—' when end date is absent", () => {
		const noEnd: Schedule = { ...schedule, endDate: undefined };
		setupMocks([noEnd], [account], [party]);
		render(<SchedulesView />);
		expect(screen.getByText("—")).toBeTruthy();
	});

	it("shows Edit form (edit mode) and calls updateSchedule on save", async () => {
		render(<SchedulesView />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
		await act(async () => {
			fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form")!);
		});
		expect(mockUpdateSchedule).toHaveBeenCalled();
	});

	it("hides Edit form when Cancel is clicked", () => {
		render(<SchedulesView />);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
	});

	it("resolves source/destination node labels for accounts", () => {
		const scheduleWithAccount: Schedule = { ...schedule, sourceId: "acc-1", destinationId: "party-1" };
		setupMocks([scheduleWithAccount], [account], [party]);
		render(<SchedulesView />);
		expect(screen.getByText("Checking (Sean)")).toBeTruthy();
		expect(screen.getByText("Employer")).toBeTruthy();
	});

	it("falls back to id when node not found", () => {
		const scheduleUnknown: Schedule = { ...schedule, sourceId: "unknown" };
		setupMocks([scheduleUnknown], [account], [party]);
		render(<SchedulesView />);
		expect(screen.getByText("unknown")).toBeTruthy();
	});

	it("calls deleteSchedule when Delete is confirmed", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(true);
		render(<SchedulesView />);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		});
		expect(mockDeleteSchedule).toHaveBeenCalledWith("s-1");
	});

	it("does not call deleteSchedule when Delete is cancelled", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(false);
		render(<SchedulesView />);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		});
		expect(mockDeleteSchedule).not.toHaveBeenCalled();
	});
});
