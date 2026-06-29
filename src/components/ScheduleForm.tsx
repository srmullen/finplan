import { type FormEvent, useState } from "react";
import type {
	Account,
	ExternalParty,
	Frequency,
	Schedule,
} from "../engine/types";
import { generateId } from "../utils/id";

interface Props {
	initial?: Schedule;
	defaultSourceId?: string;
	accounts: Account[];
	externalParties: ExternalParty[];
	onSave: (schedule: Schedule) => void;
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

export default function ScheduleForm({
	initial,
	defaultSourceId,
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

	const [sourceId, setSourceId] = useState(
		initial?.sourceId ?? defaultSourceId ?? firstNodeId,
	);
	const [destinationId, setDestinationId] = useState(
		initial?.destinationId ?? firstNodeId,
	);
	const [amount, setAmount] = useState(String(initial?.amount ?? ""));
	const [estimated, setEstimated] = useState(initial?.estimated ?? false);
	const [frequency, setFrequency] = useState<Frequency>(
		initial?.frequency ?? "monthly",
	);
	const [startDate, setStartDate] = useState(initial?.startDate ?? today);
	const [endDate, setEndDate] = useState(initial?.endDate ?? "");
	const [terminateAtZero, setTerminateAtZero] = useState(
		initial?.terminateAtZero ?? false,
	);

	const destNode = allNodes.find((n) => n.id === destinationId);
	const destIsAmortizing = destNode?.isAmortizing ?? false;

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const schedule: Schedule = {
			id: initial?.id ?? generateId(),
			sourceId,
			destinationId,
			amount: parseFloat(amount) || 0,
			estimated,
			frequency,
			startDate,
			...(endDate ? { endDate } : {}),
			terminateAtZero: destIsAmortizing && terminateAtZero,
		};
		onSave(schedule);
	}

	return (
		<form onSubmit={handleSubmit} style={styles.form}>
			<div style={styles.row}>
				<div style={styles.field}>
					<label htmlFor="sched-source">From</label>
					<select
						id="sched-source"
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

				<div style={styles.field}>
					<label htmlFor="sched-dest">To</label>
					<select
						id="sched-dest"
						value={destinationId}
						onChange={(e) => setDestinationId(e.target.value)}
					>
						{allNodes.map((n) => (
							<option key={n.id} value={n.id}>
								{n.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<div style={styles.row}>
				<div style={styles.field}>
					<label htmlFor="sched-amount">Amount ($)</label>
					<input
						id="sched-amount"
						required
						type="number"
						step="0.01"
						min="0"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
					/>
				</div>

				<div style={styles.field}>
					<label htmlFor="sched-frequency">Frequency</label>
					<select
						id="sched-frequency"
						value={frequency}
						onChange={(e) => setFrequency(e.target.value as Frequency)}
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
					<label htmlFor="sched-start">Start date</label>
					<input
						id="sched-start"
						type="date"
						required
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
					/>
				</div>

				<div style={styles.field}>
					<label htmlFor="sched-end">End date (optional)</label>
					<input
						id="sched-end"
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
					/>
				</div>
			</div>

			<div style={styles.row}>
				<label style={styles.checkbox}>
					<input
						type="checkbox"
						checked={estimated}
						onChange={(e) => setEstimated(e.target.checked)}
					/>
					Amount is estimated
				</label>

				{destIsAmortizing && (
					<label style={styles.checkbox}>
						<input
							type="checkbox"
							checked={terminateAtZero}
							onChange={(e) => setTerminateAtZero(e.target.checked)}
						/>
						Stop when destination balance reaches zero
					</label>
				)}
			</div>

			<div style={styles.actions}>
				<button type="button" onClick={onCancel} style={styles.cancelBtn}>
					Cancel
				</button>
				<button type="submit" style={styles.saveBtn}>
					{initial ? "Save changes" : "Add schedule"}
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
