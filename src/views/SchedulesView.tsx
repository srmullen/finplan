import { Fragment, useState } from "react";
import ScheduleForm from "../components/ScheduleForm";
import ScheduleGroupForm from "../components/ScheduleGroupForm";
import type { Schedule, ScheduleGroupWithMembers } from "../engine/types";
import { useAccounts } from "../hooks/useAccounts";
import { useExternalParties } from "../hooks/useExternalParties";
import { useScheduleGroups } from "../hooks/useScheduleGroups";
import { useSchedules } from "../hooks/useSchedules";
import { formatDate } from "../utils/formatDate";

export default function SchedulesView() {
	const {
		schedules,
		addSchedule,
		updateSchedule,
		deleteSchedule,
		refresh: refreshSchedules,
	} = useSchedules();
	const { scheduleGroups, addGroup, updateGroup, deleteGroup } =
		useScheduleGroups();
	const { accounts } = useAccounts();
	const { externalParties } = useExternalParties();
	const [showForm, setShowForm] = useState(false);
	const [showGroupForm, setShowGroupForm] = useState(false);
	const [editing, setEditing] = useState<Schedule | null>(null);
	const [editingGroup, setEditingGroup] =
		useState<ScheduleGroupWithMembers | null>(null);

	const nodeLabel = (id: string) => {
		const account = accounts.find((a) => a.id === id);
		if (account) return `${account.name} (${account.owner})`;
		const party = externalParties.find((p) => p.id === id);
		if (party) return party.name;
		return id;
	};

	function saveSchedule(schedule: Schedule) {
		if (editing) {
			void updateSchedule(schedule);
			setEditing(null);
		} else {
			void addSchedule(schedule);
			setShowForm(false);
		}
	}

	async function saveGroup(input: ScheduleGroupWithMembers) {
		if (editingGroup) {
			await updateGroup(input);
			setEditingGroup(null);
		} else {
			await addGroup(input);
			setShowGroupForm(false);
		}
		await refreshSchedules();
	}

	function handleDeleteSchedule(id: string) {
		if (confirm("Delete this schedule?")) {
			void deleteSchedule(id);
		}
	}

	async function handleDeleteGroup(id: string) {
		if (!confirm("Delete this payment group and all its member schedules?")) {
			return;
		}
		await deleteGroup(id);
		await refreshSchedules();
		if (editingGroup?.group.id === id) setEditingGroup(null);
	}

	const noNodes = accounts.length + externalParties.length < 2;

	const groups = scheduleGroups
		.map((group) => ({
			group,
			members: schedules.filter((s) => s.groupId === group.id),
		}))
		.filter(({ members }) => members.length > 0);
	const groupedIds = new Set(
		groups.flatMap(({ members }) => members.map((s) => s.id)),
	);
	const ungroupedSchedules = schedules.filter((s) => !groupedIds.has(s.id));

	const renderScheduleRow = (s: Schedule, indented: boolean) => (
		<tr key={s.id}>
			<td style={indented ? styles.indentedCell : undefined}>
				{nodeLabel(s.sourceId)}
			</td>
			<td style={{ fontVariantNumeric: "tabular-nums" }}>
				${s.amount.toLocaleString()}
				{s.estimated ? " ~" : ""}
			</td>
			<td>{s.frequency}</td>
			<td>{nodeLabel(s.destinationId)}</td>
			<td>{formatDate(s.startDate)}</td>
			<td>{s.endDate ? formatDate(s.endDate) : "—"}</td>
			<td style={styles.actions}>
				<button
					type="button"
					style={styles.editBtn}
					onClick={() => {
						setShowForm(false);
						setShowGroupForm(false);
						setEditingGroup(null);
						setEditing(s);
					}}
				>
					Edit
				</button>
				<button
					type="button"
					style={styles.deleteBtn}
					onClick={() => handleDeleteSchedule(s.id)}
				>
					Delete
				</button>
			</td>
		</tr>
	);

	return (
		<div>
			<h1>Schedules</h1>

			{(showForm || editing) && (
				<ScheduleForm
					initial={editing ?? undefined}
					accounts={accounts}
					externalParties={externalParties}
					onSave={saveSchedule}
					onCancel={() => {
						setShowForm(false);
						setEditing(null);
					}}
				/>
			)}

			{(showGroupForm || editingGroup) && (
				<ScheduleGroupForm
					initial={editingGroup ?? undefined}
					accounts={accounts}
					externalParties={externalParties}
					onSave={saveGroup}
					onCancel={() => {
						setShowGroupForm(false);
						setEditingGroup(null);
					}}
				/>
			)}

			{!showForm && !editing && !showGroupForm && !editingGroup && (
				<div style={styles.addBtnRow}>
					<button
						type="button"
						style={styles.addBtn}
						onClick={() => setShowForm(true)}
						disabled={noNodes}
						title={
							noNodes
								? "Add at least two accounts or external parties first"
								: undefined
						}
					>
						+ Add schedule
					</button>
					<button
						type="button"
						style={styles.addBtn}
						onClick={() => setShowGroupForm(true)}
						disabled={noNodes}
						title={
							noNodes
								? "Add at least two accounts or external parties first"
								: undefined
						}
					>
						+ Add payment group
					</button>
				</div>
			)}

			{noNodes && (
				<p style={styles.hint}>
					You need at least two nodes (accounts or external parties) before
					creating a schedule.
				</p>
			)}

			{schedules.length === 0 ? (
				<p style={styles.empty}>No schedules yet.</p>
			) : (
				<table className="data-table">
					<thead>
						<tr>
							<th>From</th>
							<th>Amount</th>
							<th>Frequency</th>
							<th>To</th>
							<th>Start</th>
							<th>End</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{groups.map(({ group, members }) => (
							<Fragment key={group.id}>
								<tr>
									<td colSpan={6} style={styles.groupHeaderCell}>
										{group.name}
									</td>
									<td style={{ ...styles.actions, ...styles.groupHeaderCell }}>
										<button
											type="button"
											style={styles.editBtn}
											onClick={() => {
												setShowForm(false);
												setEditing(null);
												setShowGroupForm(false);
												setEditingGroup({ group, schedules: members });
											}}
										>
											Edit
										</button>
										<button
											type="button"
											style={styles.deleteBtn}
											onClick={() => void handleDeleteGroup(group.id)}
										>
											Delete
										</button>
									</td>
								</tr>
								{members.map((s) => renderScheduleRow(s, true))}
							</Fragment>
						))}
						{ungroupedSchedules.map((s) => renderScheduleRow(s, false))}
					</tbody>
				</table>
			)}
		</div>
	);
}

const styles = {
	addBtnRow: {
		display: "flex",
		gap: "0.5rem",
		marginBottom: "1rem",
	},
	addBtn: {
		padding: "0.4rem 0.875rem",
		border: "1px dashed #9ca3af",
		borderRadius: "4px",
		background: "none",
		cursor: "pointer",
		color: "#374151",
	},
	actions: {
		textAlign: "right" as const,
		display: "flex",
		gap: "0.25rem",
		justifyContent: "flex-end",
	},
	editBtn: {
		padding: "0.2rem 0.5rem",
		border: "1px solid #d1d5db",
		borderRadius: "3px",
		background: "#fff",
		cursor: "pointer",
		fontSize: "0.8rem",
	},
	deleteBtn: {
		padding: "0.2rem 0.5rem",
		border: "1px solid #fca5a5",
		borderRadius: "3px",
		background: "#fff",
		cursor: "pointer",
		color: "#dc2626",
		fontSize: "0.8rem",
	},
	empty: { color: "#9ca3af" },
	hint: { color: "#9ca3af", fontSize: "0.8rem", marginBottom: "1rem" },
	groupHeaderCell: {
		fontWeight: 600,
		background: "#f9fafb",
		color: "#374151",
	},
	indentedCell: { paddingLeft: "1.5rem" },
};
