// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Account, ExternalParty } from "../engine/types";
import ScheduleGroupForm from "./ScheduleGroupForm";

const { mockGenerateId } = vi.hoisted(() => {
	let counter = 0;
	return { mockGenerateId: vi.fn(() => `generated-id-${++counter}`) };
});

vi.mock("@src/utils/id", () => ({ generateId: mockGenerateId }));

afterEach(() => {
	cleanup();
});

const onSave = vi.fn();
const onCancel = vi.fn();

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
	{
		id: "loan-1",
		name: "Car Loan",
		type: "loan",
		owner: "Sean",
		seedBalance: -10000,
		seedDate: "2024-01-01",
		rate: 0,
		amortizing: true,
	},
];

const parties: ExternalParty[] = [{ id: "party-1", name: "Servicer" }];

function submit() {
	fireEvent.submit(
		screen.getByRole("button", { name: "Add payment group" }).closest("form")!,
	);
}

describe("ScheduleGroupForm — no nodes provided", () => {
	it("uses empty string for firstNodeId and submits without error", () => {
		render(
			<ScheduleGroupForm
				accounts={[]}
				externalParties={[]}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		submit();
		const saved = onSave.mock.calls.at(-1)?.[0];
		expect(saved.group.name).toBe("");
		expect(saved.schedules).toHaveLength(2);
	});
});

describe("ScheduleGroupForm — structure", () => {
	it("starts with two member rows", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		expect(screen.getAllByLabelText("To")).toHaveLength(2);
	});

	it("adds a member row when + Add member is clicked", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "+ Add member" }));
		expect(screen.getAllByLabelText("To")).toHaveLength(3);
	});

	it("disables Remove member when only two rows remain", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		const removeBtns = screen.getAllByRole("button", {
			name: "Remove member",
		}) as HTMLButtonElement[];
		expect(removeBtns.every((b) => b.disabled)).toBe(true);
	});

	it("removes a row when Remove member is clicked with more than two rows", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "+ Add member" }));
		const removeBtns = screen.getAllByRole("button", { name: "Remove member" });
		fireEvent.click(removeBtns[0]);
		expect(screen.getAllByLabelText("To")).toHaveLength(2);
	});

	it("calls onCancel when Cancel is clicked", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onCancel).toHaveBeenCalled();
	});
});

describe("ScheduleGroupForm — submit", () => {
	it("saves a group with a shared sourceId across all member schedules", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Group name"), {
			target: { value: "Mortgage" },
		});
		fireEvent.change(screen.getByLabelText("From"), {
			target: { value: "acc-1" },
		});
		fireEvent.change(screen.getAllByLabelText("Amount ($)")[0], {
			target: { value: "1500" },
		});
		fireEvent.change(screen.getAllByLabelText("Amount ($)")[1], {
			target: { value: "500" },
		});
		submit();

		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				group: expect.objectContaining({ name: "Mortgage" }),
				schedules: [
					expect.objectContaining({ sourceId: "acc-1", amount: 1500 }),
					expect.objectContaining({ sourceId: "acc-1", amount: 500 }),
				],
			}),
		);
	});

	it("stamps every member schedule with the new group's id", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		submit();
		const saved = onSave.mock.calls.at(-1)?.[0];
		expect(saved.schedules.every((s: { groupId: string }) => s.groupId === saved.group.id)).toBe(
			true,
		);
	});

	it("shows terminateAtZero checkbox only for rows whose destination is amortizing", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		expect(
			screen.queryByText("Stop when destination balance reaches zero"),
		).toBeNull();
		fireEvent.change(screen.getAllByLabelText("To")[0], {
			target: { value: "loan-1" },
		});
		expect(
			screen.getAllByText("Stop when destination balance reaches zero"),
		).toHaveLength(1);
	});

	it("omits endDate when the end date field is left empty", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		submit();
		const saved = onSave.mock.calls.at(-1)?.[0];
		expect(
			saved.schedules.every(
				(s: { endDate?: string }) => s.endDate === undefined,
			),
		).toBe(true);
	});

	it("includes endDate when set on a row", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getAllByLabelText("End date (optional)")[0], {
			target: { value: "2030-01-01" },
		});
		submit();
		const saved = onSave.mock.calls.at(-1)?.[0];
		expect(saved.schedules[0].endDate).toBe("2030-01-01");
	});

	it("updates frequency on a row", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getAllByLabelText("Frequency")[0], {
			target: { value: "weekly" },
		});
		submit();
		const saved = onSave.mock.calls.at(-1)?.[0];
		expect(saved.schedules[0].frequency).toBe("weekly");
	});

	it("updates startDate on a row", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getAllByLabelText("Start date")[0], {
			target: { value: "2025-03-01" },
		});
		submit();
		const saved = onSave.mock.calls.at(-1)?.[0];
		expect(saved.schedules[0].startDate).toBe("2025-03-01");
	});

	it("marks a row as estimated when its checkbox is checked", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.click(
			screen.getAllByRole("checkbox", { name: "Amount is estimated" })[0],
		);
		submit();
		const saved = onSave.mock.calls.at(-1)?.[0];
		expect(saved.schedules[0].estimated).toBe(true);
	});

	it("sets terminateAtZero true when checked and destination is amortizing", () => {
		render(
			<ScheduleGroupForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getAllByLabelText("To")[0], {
			target: { value: "loan-1" },
		});
		fireEvent.click(
			screen.getByRole("checkbox", {
				name: "Stop when destination balance reaches zero",
			}),
		);
		submit();
		const saved = onSave.mock.calls.at(-1)?.[0];
		expect(saved.schedules[0].terminateAtZero).toBe(true);
	});
});
