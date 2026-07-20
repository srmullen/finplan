// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Account, ExternalParty, Schedule } from "../engine/types";
import ScheduleForm from "./ScheduleForm";

vi.mock("@src/utils/id", () => ({ generateId: () => "generated-id" }));

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

const parties: ExternalParty[] = [{ id: "party-1", name: "Employer" }];

const existingSchedule: Schedule = {
	id: "s-1",
	sourceId: "party-1",
	destinationId: "acc-1",
	amount: 3000,
	estimated: true,
	frequency: "biweekly",
	startDate: "2024-01-05",
	endDate: "2024-12-31",
	terminateAtZero: false,
};

describe("ScheduleForm — add mode (no initial, no nodes)", () => {
	it("uses empty string for firstNodeId when no nodes provided", () => {
		render(
			<ScheduleForm
				accounts={[]}
				externalParties={[]}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		expect(screen.getByRole("button", { name: "Add schedule" })).toBeTruthy();
	});
});

describe("ScheduleForm — add mode (with nodes)", () => {
	it("renders 'Add schedule' button when no initial", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		expect(screen.getByRole("button", { name: "Add schedule" })).toBeTruthy();
	});

	it("calls onSave with generated id and defaults on submit", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "500" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "Add schedule" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "generated-id",
				amount: 500,
			}),
		);
	});

	it("includes endDate in saved schedule when end date is set", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "100" },
		});
		fireEvent.change(screen.getByLabelText("End date (optional)"), {
			target: { value: "2024-12-31" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "Add schedule" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ endDate: "2024-12-31" }),
		);
	});

	it("omits endDate when end date field is empty", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "100" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "Add schedule" }).closest("form")!,
		);
		const saved = onSave.mock.calls.at(-1)?.[0] as Schedule;
		expect(saved.endDate).toBeUndefined();
	});

	it("shows terminateAtZero checkbox when destination is amortizing", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		const destSelect = screen.getByLabelText("To");
		fireEvent.change(destSelect, { target: { value: "loan-1" } });
		expect(
			screen.getByText("Stop when destination balance reaches zero"),
		).toBeTruthy();
	});

	it("does not show terminateAtZero checkbox when destination is not amortizing", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		expect(
			screen.queryByText("Stop when destination balance reaches zero"),
		).toBeNull();
	});

	it("sets terminateAtZero true when checked and destination is amortizing", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("To"), {
			target: { value: "loan-1" },
		});
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "200" },
		});
		const terminateCheckbox = screen.getByRole("checkbox", {
			name: "Stop when destination balance reaches zero",
		});
		fireEvent.click(terminateCheckbox);
		fireEvent.submit(
			screen.getByRole("button", { name: "Add schedule" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ terminateAtZero: true }),
		);
	});

	it("calls onCancel when Cancel is clicked", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onCancel).toHaveBeenCalled();
	});

	it("updates sourceId when From select is changed", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("From"), {
			target: { value: "party-1" },
		});
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "500" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "Add schedule" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ sourceId: "party-1" }),
		);
	});

	it("updates frequency when Frequency select is changed", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Frequency"), {
			target: { value: "weekly" },
		});
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "100" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "Add schedule" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ frequency: "weekly" }),
		);
	});

	it("updates startDate when Start date input is changed", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Start date"), {
			target: { value: "2025-03-01" },
		});
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "100" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "Add schedule" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ startDate: "2025-03-01" }),
		);
	});

	it("marks schedule as estimated when estimated checkbox is checked", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "200" },
		});
		fireEvent.click(
			screen.getByRole("checkbox", { name: "Amount is estimated" }),
		);
		fireEvent.submit(
			screen.getByRole("button", { name: "Add schedule" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ estimated: true }),
		);
	});

	it("saves amount as 0 when amount field is empty or zero", () => {
		render(
			<ScheduleForm
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Amount ($)"), {
			target: { value: "0" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "Add schedule" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amount: 0 }));
	});
});

describe("ScheduleForm — edit mode", () => {
	it("renders 'Save changes' button when initial is provided", () => {
		render(
			<ScheduleForm
				initial={existingSchedule}
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
	});

	it("pre-fills amount from initial schedule", () => {
		render(
			<ScheduleForm
				initial={existingSchedule}
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		expect(
			(screen.getByLabelText("Amount ($)") as HTMLInputElement).value,
		).toBe("3000");
	});

	it("calls onSave with original id on submit", () => {
		render(
			<ScheduleForm
				initial={existingSchedule}
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: "s-1" }));
	});

	it("does not add a groupId when editing a schedule without one", () => {
		render(
			<ScheduleForm
				initial={existingSchedule}
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form")!,
		);
		const saved = onSave.mock.calls.at(-1)?.[0] as Schedule;
		expect(saved.groupId).toBeUndefined();
	});

	it("leaves the source select enabled when editing a schedule without a groupId", () => {
		render(
			<ScheduleForm
				initial={existingSchedule}
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		expect(
			(screen.getByLabelText("From") as HTMLSelectElement).disabled,
		).toBe(false);
	});

	it("preserves active: false on submit when editing an inactive schedule", () => {
		render(
			<ScheduleForm
				initial={{ ...existingSchedule, active: false }}
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form")!,
		);
		const saved = onSave.mock.calls.at(-1)?.[0] as Schedule;
		expect(saved.active).toBe(false);
	});

	it("does not add an active field when editing an active schedule", () => {
		render(
			<ScheduleForm
				initial={existingSchedule}
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form")!,
		);
		const saved = onSave.mock.calls.at(-1)?.[0] as Schedule;
		expect(saved.active).toBeUndefined();
	});
});

describe("ScheduleForm — editing a payment group member", () => {
	const groupedSchedule: Schedule = {
		...existingSchedule,
		id: "s-2",
		groupId: "group-1",
	};

	it("preserves the existing groupId on submit", () => {
		render(
			<ScheduleForm
				initial={groupedSchedule}
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form")!,
		);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ groupId: "group-1" }),
		);
	});

	it("disables the source select and shows an inherited-source hint", () => {
		render(
			<ScheduleForm
				initial={groupedSchedule}
				accounts={accounts}
				externalParties={parties}
				onSave={onSave}
				onCancel={onCancel}
			/>,
		);
		expect(
			(screen.getByLabelText("From") as HTMLSelectElement).disabled,
		).toBe(true);
		expect(
			screen.getByText(
				"Inherited from the payment group and can't be changed here.",
			),
		).toBeTruthy();
	});
});
