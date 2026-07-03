import { type FormEvent, useState } from "react";
import type {
	Account,
	ExternalParty,
	Frequency,
	Schedule,
	ScheduleGroupWithMembers,
} from "../engine/types";
import { generateId } from "../utils/id";

interface Props {
	accounts: Account[];
	externalParties: ExternalParty[];
	onSave: (input: ScheduleGroupWithMembers) => void;
	onCancel: () => void;
}

const FREQUENCIES: Frequency[] = [
	"once",
	"weekly",
	"biweekly",
	"semi-monthly",
	"monthly",
	"quarterly",
	"annually",
];

interface MemberRow {
	destinationId: string;
	amount: string;
	estimated: boolean;
	frequency: Frequency;
	startDate: string;
	endDate: string;
	terminateAtZero: boolean;
}

function makeRow(destinationId: string, startDate: string): MemberRow {
	return {
		destinationId,
		amount: "",
		estimated: false,
		frequency: "monthly",
		startDate,
		endDate: "",
		terminateAtZero: false,
	};
}

export default function ScheduleGroupForm({
	accounts,
	externalParties,
	onSave,
	onCancel,
}: Props) {
	const today = new Date().toISOString().slice(0, 10);

	const allNodes = [
		...accounts.map((a) => ({
			id: a.id,
			label: `${a.name} (${a.owner})`,
			isAmortizing: a.amortizing,
		})),
		...externalParties.map((p) => ({
			id: p.id,
			label: p.name,
			isAmortizing: false,
		})),
	];

	const firstNodeId = allNodes[0]?.id ?? "";

	const [name, setName] = useState("");
	const [sourceId, setSourceId] = useState(firstNodeId);
	const [rows, setRows] = useState<MemberRow[]>([
		makeRow(firstNodeId, today),
		makeRow(firstNodeId, today),
	]);

	function updateRow(index: number, patch: Partial<MemberRow>) {
		setRows((prev) =>
			prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
		);
	}

	function addRow() {
		setRows((prev) => [...prev, makeRow(firstNodeId, today)]);
	}

	function removeRow(index: number) {
		setRows((prev) => prev.filter((_, i) => i !== index));
	}

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const groupId = generateId();
		const schedules: Schedule[] = rows.map((row) => {
			const destNode = allNodes.find((n) => n.id === row.destinationId);
			const destIsAmortizing = destNode?.isAmortizing ?? false;
			const schedule: Schedule = {
				id: generateId(),
				sourceId,
				destinationId: row.destinationId,
				amount: parseFloat(row.amount) || 0,
				estimated: row.estimated,
				frequency: row.frequency,
				startDate: row.startDate,
				...(row.endDate ? { endDate: row.endDate } : {}),
				terminateAtZero: destIsAmortizing && row.terminateAtZero,
				groupId,
			};
			return schedule;
		});
		onSave({ group: { id: groupId, name }, schedules });
	}

	return (
		<form onSubmit={handleSubmit} style={styles.form}>
			<div style={styles.row}>
				<div style={styles.field}>
					<label htmlFor="group-name">Group name</label>
					<input
						id="group-name"
						required
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</div>

				<div style={styles.field}>
					<label htmlFor="group-source">From</label>
					<select
						id="group-source"
						value={sourceId}
						onChange={(e) => setSourceId(e.target.value)}
					>
						{allNodes.map((n) => (
							<option key={n.id} value={n.id}>
								{n.label}
							</option>
						))}
					</select>
				</div>
			</div>

			{rows.map((row, index) => {
				const destNode = allNodes.find((n) => n.id === row.destinationId);
				const destIsAmortizing = destNode?.isAmortizing ?? false;
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: rows are only appended/removed, not reordered
					<fieldset key={index} style={styles.memberFieldset}>
						<legend>Member {index + 1}</legend>

						<div style={styles.row}>
							<div style={styles.field}>
								<label htmlFor={`member-${index}-dest`}>To</label>
								<select
									id={`member-${index}-dest`}
									value={row.destinationId}
									onChange={(e) =>
										updateRow(index, { destinationId: e.target.value })
									}
								>
									{allNodes.map((n) => (
										<option key={n.id} value={n.id}>
											{n.label}
										</option>
									))}
								</select>
							</div>

							<div style={styles.field}>
								<label htmlFor={`member-${index}-amount`}>Amount ($)</label>
								<input
									id={`member-${index}-amount`}
									required
									type="number"
									step="0.01"
									min="0"
									value={row.amount}
									onChange={(e) => updateRow(index, { amount: e.target.value })}
								/>
							</div>

							<div style={styles.field}>
								<label htmlFor={`member-${index}-frequency`}>Frequency</label>
								<select
									id={`member-${index}-frequency`}
									value={row.frequency}
									onChange={(e) =>
										updateRow(index, { frequency: e.target.value as Frequency })
									}
								>
									{FREQUENCIES.map((f) => (
										<option key={f} value={f}>
											{f}
										</option>
									))}
								</select>
							</div>
						</div>

						<div style={styles.row}>
							<div style={styles.field}>
								<label htmlFor={`member-${index}-start`}>Start date</label>
								<input
									id={`member-${index}-start`}
									type="date"
									required
									value={row.startDate}
									onChange={(e) =>
										updateRow(index, { startDate: e.target.value })
									}
								/>
							</div>

							<div style={styles.field}>
								<label htmlFor={`member-${index}-end`}>
									End date (optional)
								</label>
								<input
									id={`member-${index}-end`}
									type="date"
									value={row.endDate}
									onChange={(e) => updateRow(index, { endDate: e.target.value })}
								/>
							</div>
						</div>

						<div style={styles.row}>
							<label style={styles.checkbox}>
								<input
									type="checkbox"
									checked={row.estimated}
									onChange={(e) =>
										updateRow(index, { estimated: e.target.checked })
									}
								/>
								Amount is estimated
							</label>

							{destIsAmortizing && (
								<label style={styles.checkbox}>
									<input
										type="checkbox"
										checked={row.terminateAtZero}
										onChange={(e) =>
											updateRow(index, { terminateAtZero: e.target.checked })
										}
									/>
									Stop when destination balance reaches zero
								</label>
							)}

							<button
								type="button"
								style={styles.removeBtn}
								disabled={rows.length <= 2}
								onClick={() => removeRow(index)}
							>
								Remove member
							</button>
						</div>
					</fieldset>
				);
			})}

			<button type="button" style={styles.addRowBtn} onClick={addRow}>
				+ Add member
			</button>

			<div style={styles.actions}>
				<button type="button" onClick={onCancel} style={styles.cancelBtn}>
					Cancel
				</button>
				<button type="submit" style={styles.saveBtn}>
					Add payment group
				</button>
			</div>
		</form>
	);
}

const styles = {
	form: {
		display: "flex",
		flexDirection: "column" as const,
		gap: "0.875rem",
		padding: "1rem",
		background: "#f9fafb",
		border: "1px solid #e5e7eb",
		borderRadius: "6px",
		marginBottom: "1.5rem",
	},
	row: { display: "flex", gap: "1rem", alignItems: "center" },
	field: {
		display: "flex",
		flexDirection: "column" as const,
		flex: 1,
		gap: "0.25rem",
	},
	checkbox: {
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
		cursor: "pointer",
		flex: 1,
	},
	memberFieldset: {
		display: "flex",
		flexDirection: "column" as const,
		gap: "0.875rem",
		padding: "0.75rem",
		border: "1px solid #e5e7eb",
		borderRadius: "4px",
	},
	removeBtn: {
		padding: "0.2rem 0.5rem",
		border: "1px solid #fca5a5",
		borderRadius: "3px",
		background: "#fff",
		cursor: "pointer",
		color: "#dc2626",
		fontSize: "0.8rem",
	},
	addRowBtn: {
		padding: "0.4rem 0.875rem",
		border: "1px dashed #9ca3af",
		borderRadius: "4px",
		background: "none",
		cursor: "pointer",
		color: "#374151",
		alignSelf: "flex-start",
	},
	actions: { display: "flex", gap: "0.5rem", justifyContent: "flex-end" },
	cancelBtn: {
		padding: "0.4rem 0.875rem",
		border: "1px solid #d1d5db",
		borderRadius: "4px",
		background: "#fff",
		cursor: "pointer",
	},
	saveBtn: {
		padding: "0.4rem 0.875rem",
		border: "none",
		borderRadius: "4px",
		background: "#1d4ed8",
		color: "#fff",
		cursor: "pointer",
		fontWeight: 600,
	},
};
