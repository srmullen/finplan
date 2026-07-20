// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Account,
	ExternalParty,
	Schedule,
	ScheduleGroup,
} from "../engine/types";

vi.mock("@src/hooks/useSchedules");
vi.mock("@src/hooks/useScheduleGroups");
vi.mock("@src/hooks/useAccounts");
vi.mock("@src/hooks/useExternalParties");

import { useAccounts } from "@src/hooks/useAccounts";
import { useExternalParties } from "@src/hooks/useExternalParties";
import { useScheduleGroups } from "@src/hooks/useScheduleGroups";
import { useSchedules } from "@src/hooks/useSchedules";
import SchedulesView from "./SchedulesView";

const mockAddSchedule = vi.fn();
const mockUpdateSchedule = vi.fn();
const mockDeleteSchedule = vi.fn();
const mockRefreshSchedules = vi.fn();
const mockAddGroup = vi.fn();
const mockUpdateGroup = vi.fn();
const mockDeleteGroup = vi.fn();

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
	scheduleGroups: ScheduleGroup[] = [],
) {
	vi.mocked(useSchedules).mockReturnValue({
		schedules,
		addSchedule: mockAddSchedule,
		updateSchedule: mockUpdateSchedule,
		deleteSchedule: mockDeleteSchedule,
		refresh: mockRefreshSchedules,
		error: null,
	} as ReturnType<typeof useSchedules>);
	vi.mocked(useScheduleGroups).mockReturnValue({
		scheduleGroups,
		addGroup: mockAddGroup,
		updateGroup: mockUpdateGroup,
		deleteGroup: mockDeleteGroup,
		refresh: vi.fn(),
		error: null,
	} as ReturnType<typeof useScheduleGroups>);
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
		const btn = screen.getByRole("button", {
			name: "+ Add schedule",
		}) as HTMLButtonElement;
		expect(btn.disabled).toBe(true);
	});

	it("disables Add Payment Group button when fewer than 2 nodes", () => {
		render(<SchedulesView />);
		const btn = screen.getByRole("button", {
			name: "+ Add payment group",
		}) as HTMLButtonElement;
		expect(btn.disabled).toBe(true);
	});
});

describe("SchedulesView — with nodes (2+ nodes)", () => {
	beforeEach(() => setupMocks([], [account], [party]));

	it("enables Add schedule button when 2+ nodes exist", () => {
		render(<SchedulesView />);
		const btn = screen.getByRole("button", {
			name: "+ Add schedule",
		}) as HTMLButtonElement;
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
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "500" },
		});
		await act(async () => {
			fireEvent.submit(screen.getByLabelText("Amount ($)").closest("form")!);
		});
		expect(mockAddSchedule).toHaveBeenCalled();
	});

	it("enables Add Payment Group button when 2+ nodes exist", () => {
		render(<SchedulesView />);
		const btn = screen.getByRole("button", {
			name: "+ Add payment group",
		}) as HTMLButtonElement;
		expect(btn.disabled).toBe(false);
	});

	it("shows ScheduleGroupForm when Add Payment Group is clicked, hides on Cancel", () => {
		render(<SchedulesView />);
		fireEvent.click(
			screen.getByRole("button", { name: "+ Add payment group" }),
		);
		expect(screen.getByLabelText("Group name")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.queryByLabelText("Group name")).toBeNull();
	});

	it("calls addGroup and refreshes schedules on save, then hides the form", async () => {
		mockAddGroup.mockResolvedValue(undefined);
		render(<SchedulesView />);
		fireEvent.click(
			screen.getByRole("button", { name: "+ Add payment group" }),
		);
		fireEvent.change(screen.getByLabelText("Group name"), {
			target: { value: "Mortgage" },
		});
		fireEvent.change(screen.getAllByLabelText("Amount ($)")[0], {
			target: { value: "1500" },
		});
		fireEvent.change(screen.getAllByLabelText("Amount ($)")[1], {
			target: { value: "500" },
		});
		await act(async () => {
			fireEvent.submit(
				screen
					.getByRole("button", { name: "Add payment group" })
					.closest("form")!,
			);
		});
		expect(mockAddGroup).toHaveBeenCalled();
		expect(mockRefreshSchedules).toHaveBeenCalled();
		expect(screen.queryByLabelText("Group name")).toBeNull();
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
		expect(screen.getByText("Dec 31, 2024")).toBeTruthy();
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
			fireEvent.submit(
				screen.getByRole("button", { name: "Save changes" }).closest("form")!,
			);
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
		const scheduleWithAccount: Schedule = {
			...schedule,
			sourceId: "acc-1",
			destinationId: "party-1",
		};
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

describe("SchedulesView — row cash flow stripe", () => {
	const creditCardAccount: Account = {
		...account,
		id: "acc-cc",
		type: "credit_card",
	};
	const inSchedule: Schedule = {
		...schedule,
		id: "s-in",
		sourceId: "party-1",
		destinationId: "acc-1",
	};
	const outSchedule: Schedule = {
		...schedule,
		id: "s-out",
		sourceId: "acc-1",
		destinationId: "acc-cc",
	};
	const neitherSchedule: Schedule = {
		...schedule,
		id: "s-neither",
		sourceId: "acc-1",
		destinationId: "acc-1",
	};

	it("shows a green left-border stripe on a row classified as in", () => {
		setupMocks([inSchedule], [account], [party]);
		render(<SchedulesView />);
		const row = screen.getByText("$3,000 ~").closest("tr") as HTMLTableRowElement;
		expect(row.style.borderLeft).toBe("4px solid rgb(22, 163, 74)");
	});

	it("shows a red left-border stripe on a row classified as out", () => {
		setupMocks([outSchedule], [account, creditCardAccount], [party]);
		render(<SchedulesView />);
		const row = screen.getByText("$3,000 ~").closest("tr") as HTMLTableRowElement;
		expect(row.style.borderLeft).toBe("4px solid rgb(220, 38, 38)");
	});

	it("shows a blue left-border stripe on a row classified as neither (internal transfer)", () => {
		setupMocks([neitherSchedule], [account], [party]);
		render(<SchedulesView />);
		const row = screen.getByText("$3,000 ~").closest("tr") as HTMLTableRowElement;
		expect(row.style.borderLeft).toBe("4px solid rgb(29, 78, 216)");
	});

	it("stripes payment group member rows individually without striping the group header", () => {
		const group: ScheduleGroup = { id: "g-1", name: "Mortgage" };
		const memberIn: Schedule = { ...inSchedule, id: "s-member-in", groupId: "g-1" };
		const memberOut: Schedule = {
			...outSchedule,
			id: "s-member-out",
			groupId: "g-1",
		};
		setupMocks(
			[memberIn, memberOut],
			[account, creditCardAccount],
			[party],
			[group],
		);
		render(<SchedulesView />);
		const headerRow = screen.getByText("Mortgage").closest("tr")!;
		expect(headerRow.style.borderLeft).toBe("");
		const rows = screen.getAllByText("$3,000 ~").map((el) => el.closest("tr")!);
		expect(rows[0].style.borderLeft).toBe("4px solid rgb(22, 163, 74)");
		expect(rows[1].style.borderLeft).toBe("4px solid rgb(220, 38, 38)");
	});
});

describe("SchedulesView — Total In/Out", () => {
	const income: Schedule = {
		id: "s-income",
		sourceId: "party-1",
		destinationId: "acc-1",
		amount: 3000,
		estimated: false,
		frequency: "monthly",
		startDate: "2020-01-01",
		terminateAtZero: false,
	};
	const creditCardAccount: Account = {
		...account,
		id: "acc-cc",
		type: "credit_card",
	};
	const debtPayment: Schedule = {
		id: "s-debt",
		sourceId: "acc-1",
		destinationId: "acc-cc",
		amount: 200,
		estimated: false,
		frequency: "monthly",
		startDate: "2020-01-01",
		terminateAtZero: false,
	};
	const internalTransfer: Schedule = {
		id: "s-internal",
		sourceId: "acc-1",
		destinationId: "acc-cc",
		amount: 999,
		estimated: false,
		frequency: "monthly",
		startDate: "2099-01-01", // not yet active
		terminateAtZero: false,
	};

	it("shows $0/mo for both totals when there are no schedules", () => {
		render(<SchedulesView />);
		expect(screen.getByTestId("total-in").textContent).toBe("$0/mo");
		expect(screen.getByTestId("total-out").textContent).toBe("$0/mo");
	});

	it("sums an ExternalParty-sourced schedule into Total In", () => {
		setupMocks([income], [account], [party]);
		render(<SchedulesView />);
		expect(screen.getByTestId("total-in").textContent).toBe("$3,000/mo");
		expect(screen.getByTestId("total-out").textContent).toBe("$0/mo");
	});

	it("sums a credit_card-destined schedule into Total Out", () => {
		setupMocks([debtPayment], [account, creditCardAccount], [party]);
		render(<SchedulesView />);
		expect(screen.getByTestId("total-in").textContent).toBe("$0/mo");
		expect(screen.getByTestId("total-out").textContent).toBe("$200/mo");
	});

	it("excludes a schedule that has not started yet from both totals", () => {
		setupMocks([internalTransfer], [account, creditCardAccount], [party]);
		render(<SchedulesView />);
		expect(screen.getByTestId("total-in").textContent).toBe("$0/mo");
		expect(screen.getByTestId("total-out").textContent).toBe("$0/mo");
	});
});

describe("SchedulesView — Active/inactive state", () => {
	const active: Schedule = { ...schedule, id: "s-active" };
	const inactive: Schedule = { ...schedule, id: "s-inactive", active: false };

	it("hides inactive schedules by default", () => {
		setupMocks([active, inactive], [account], [party]);
		render(<SchedulesView />);
		expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 active row
	});

	it("reveals inactive schedules, dimmed, when 'Show inactive' is checked", () => {
		setupMocks([active, inactive], [account], [party]);
		render(<SchedulesView />);
		fireEvent.click(screen.getByRole("checkbox", { name: "Show inactive" }));
		expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 rows
		const inactiveRow = screen
			.getAllByRole("button", { name: "Activate" })[0]
			.closest("tr") as HTMLTableRowElement;
		expect(inactiveRow.style.opacity).toBe("0.45");
	});

	it("does not show the 'Show inactive' checkbox when there are no schedules", () => {
		render(<SchedulesView />);
		expect(screen.queryByRole("checkbox", { name: "Show inactive" })).toBeNull();
	});

	it("calls updateSchedule with active: false when Deactivate is clicked on an active schedule", () => {
		setupMocks([active], [account], [party]);
		render(<SchedulesView />);
		fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
		expect(mockUpdateSchedule).toHaveBeenCalledWith(
			expect.objectContaining({ id: "s-active", active: false }),
		);
	});

	it("calls updateSchedule with active: true when Activate is clicked on an inactive schedule", () => {
		setupMocks([inactive], [account], [party]);
		render(<SchedulesView />);
		fireEvent.click(screen.getByRole("checkbox", { name: "Show inactive" }));
		fireEvent.click(screen.getByRole("button", { name: "Activate" }));
		expect(mockUpdateSchedule).toHaveBeenCalledWith(
			expect.objectContaining({ id: "s-inactive", active: true }),
		);
	});

	it("excludes an inactive schedule's amount from Total In/Out even when shown via 'Show inactive'", () => {
		const inactiveIncome: Schedule = {
			id: "s-inactive-income",
			sourceId: "party-1",
			destinationId: "acc-1",
			amount: 3000,
			estimated: false,
			frequency: "monthly",
			startDate: "2020-01-01",
			terminateAtZero: false,
			active: false,
		};
		setupMocks([inactiveIncome], [account], [party]);
		render(<SchedulesView />);
		fireEvent.click(screen.getByRole("checkbox", { name: "Show inactive" }));
		expect(screen.getByTestId("total-in").textContent).toBe("$0/mo");
	});
});

describe("SchedulesView — Payment Groups", () => {
	const group: ScheduleGroup = { id: "g-1", name: "Mortgage" };
	const memberA: Schedule = {
		...schedule,
		id: "s-member-a",
		amount: 2000,
		estimated: false,
	};
	const memberB: Schedule = {
		...schedule,
		id: "s-member-b",
		amount: 500,
		estimated: false,
		groupId: "g-1",
	};

	it("renders a group header row above its member schedules", () => {
		const grouped: Schedule = { ...memberA, groupId: "g-1" };
		setupMocks([grouped], [account], [party], [group]);
		render(<SchedulesView />);
		expect(screen.getByText("Mortgage")).toBeTruthy();
	});

	it("renders ungrouped schedules exactly as before, without a group header", () => {
		setupMocks([memberA], [account], [party], [group]);
		render(<SchedulesView />);
		expect(screen.queryByText("Mortgage")).toBeNull();
		expect(screen.getByText("$2,000")).toBeTruthy();
	});

	it("renders both grouped and ungrouped schedules together", () => {
		const grouped: Schedule = { ...memberB, groupId: "g-1" };
		setupMocks([memberA, grouped], [account], [party], [group]);
		render(<SchedulesView />);
		expect(screen.getByText("Mortgage")).toBeTruthy();
		expect(screen.getByText("$2,000")).toBeTruthy();
		expect(screen.getByText("$500")).toBeTruthy();
	});

	it("opens ScheduleGroupForm pre-populated when the group's Edit is clicked, hides on Cancel", () => {
		const grouped: Schedule = { ...memberA, groupId: "g-1" };
		setupMocks([grouped], [account], [party], [group]);
		render(<SchedulesView />);
		fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
		expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
		expect((screen.getByLabelText("Group name") as HTMLInputElement).value).toBe(
			"Mortgage",
		);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.queryByLabelText("Group name")).toBeNull();
	});

	it("calls updateGroup and refreshes schedules on save, then hides the form", async () => {
		const grouped: Schedule = { ...memberA, groupId: "g-1" };
		mockUpdateGroup.mockResolvedValue(undefined);
		setupMocks([grouped], [account], [party], [group]);
		render(<SchedulesView />);
		fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
		await act(async () => {
			fireEvent.submit(
				screen.getByRole("button", { name: "Save changes" }).closest("form")!,
			);
		});
		expect(mockUpdateGroup).toHaveBeenCalled();
		expect(mockRefreshSchedules).toHaveBeenCalled();
		expect(screen.queryByLabelText("Group name")).toBeNull();
	});

	it("calls deleteGroup and refreshes schedules when the group's Delete is confirmed", async () => {
		const grouped: Schedule = { ...memberA, groupId: "g-1" };
		vi.spyOn(window, "confirm").mockReturnValue(true);
		mockDeleteGroup.mockResolvedValue(undefined);
		setupMocks([grouped], [account], [party], [group]);
		render(<SchedulesView />);
		await act(async () => {
			fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
		});
		expect(mockDeleteGroup).toHaveBeenCalledWith("g-1");
		expect(mockRefreshSchedules).toHaveBeenCalled();
	});

	it("does not call deleteGroup when the group's Delete is cancelled", async () => {
		const grouped: Schedule = { ...memberA, groupId: "g-1" };
		vi.spyOn(window, "confirm").mockReturnValue(false);
		setupMocks([grouped], [account], [party], [group]);
		render(<SchedulesView />);
		await act(async () => {
			fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
		});
		expect(mockDeleteGroup).not.toHaveBeenCalled();
	});

	it("closes an open group edit form when that same group is deleted", async () => {
		const grouped: Schedule = { ...memberA, groupId: "g-1" };
		vi.spyOn(window, "confirm").mockReturnValue(true);
		mockDeleteGroup.mockResolvedValue(undefined);
		setupMocks([grouped], [account], [party], [group]);
		render(<SchedulesView />);
		fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
		await act(async () => {
			fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
		});
		expect(screen.queryByLabelText("Group name")).toBeNull();
	});

	it("opens the standalone ScheduleForm with a locked source when a member row's Edit is clicked", () => {
		const grouped: Schedule = { ...memberA, groupId: "g-1" };
		setupMocks([grouped], [account], [party], [group]);
		render(<SchedulesView />);
		// index 0 is the group header's Edit button; index 1 is the member row's
		fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
		expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
		expect(
			(screen.getByLabelText("From") as HTMLSelectElement).disabled,
		).toBe(true);
	});

	it("preserves groupId when a member is saved via the standalone row-level ScheduleForm", async () => {
		const grouped: Schedule = { ...memberA, groupId: "g-1" };
		setupMocks([grouped], [account], [party], [group]);
		render(<SchedulesView />);
		fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
		await act(async () => {
			fireEvent.submit(
				screen.getByRole("button", { name: "Save changes" }).closest("form")!,
			);
		});
		expect(mockUpdateSchedule).toHaveBeenCalledWith(
			expect.objectContaining({ groupId: "g-1" }),
		);
	});
});
