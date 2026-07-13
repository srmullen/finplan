import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { get } from "../api/client";
import AdjustmentPanel from "../components/AdjustmentPanel";
import ScheduleForm from "../components/ScheduleForm";
import type { ProjectionResult, Schedule } from "../engine/types";
import { useAccounts } from "../hooks/useAccounts";
import { useExternalParties } from "../hooks/useExternalParties";
import { useSchedules } from "../hooks/useSchedules";
import { displayBalance } from "../utils/displayBalance";
import { formatDate } from "../utils/formatDate";

function formatCurrency(n: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(n);
}

function sampleMonthly(series: { date: string; balance: number }[]) {
	const seen = new Set<string>();
	return series.filter((p) => {
		const ym = p.date.slice(0, 7);
		if (seen.has(ym)) return false;
		seen.add(ym);
		return true;
	});
}

export default function AccountDetailView() {
	const { id } = useParams<{ id: string }>();
	const { accounts } = useAccounts();
	const { schedules, addSchedule, deleteSchedule } = useSchedules();
	const { externalParties } = useExternalParties();

	const [showScheduleForm, setShowScheduleForm] = useState(false);
	const [projection, setProjection] = useState<
		{ date: string; balance: number }[]
	>([]);
	const [baselineNoAdj, setBaselineNoAdj] = useState<ProjectionResult>({});
	const fetchIdRef = useRef(0);

	const account = accounts.find((a) => a.id === id);
	const accountSchedules = schedules.filter(
		(s) => s.sourceId === id || s.destinationId === id,
	);

	const today = new Date();
	const startDate = today.toISOString().slice(0, 10);
	const endDate = new Date(
		today.getFullYear(),
		today.getMonth() + 12,
		today.getDate(),
	)
		.toISOString()
		.slice(0, 10);

	useEffect(() => {
		if (!id || accounts.length === 0) return;

		const fetchId = ++fetchIdRef.current;
		const params = new URLSearchParams({ startDate, endDate });

		void Promise.all([
			get<ProjectionResult>(`/api/projection?${params}`),
			get<ProjectionResult>(`/api/projection?${params}&noAdj=1`),
		]).then(([proj, noAdj]) => {
			if (fetchIdRef.current !== fetchId) return;
			setProjection(proj[id] ?? []);
			setBaselineNoAdj(noAdj);
		});
	}, [id, accounts, startDate, endDate]);

	function nodeLabel(nodeId: string) {
		const acc = accounts.find((a) => a.id === nodeId);
		if (acc) return `${acc.name} (${acc.owner})`;
		const party = externalParties.find((p) => p.id === nodeId);
		if (party) return party.name;
		return nodeId;
	}

	function handleSaveSchedule(schedule: Schedule) {
		void addSchedule(schedule);
		setShowScheduleForm(false);
	}

	function handleDeleteSchedule(scheduleId: string) {
		if (confirm("Delete this schedule?")) {
			void deleteSchedule(scheduleId);
		}
	}

	const yAxisTickFormatter = (v: unknown) => formatCurrency(Number(v));
	const tooltipFormatter = (v: number) => formatCurrency(v);

	// Still loading
	if (accounts.length === 0) return null;

	if (!account) {
		return (
			<div>
				<Link to="/accounts" style={styles.backLink}>
					← Accounts
				</Link>
				<p style={styles.notFound}>Account not found.</p>
			</div>
		);
	}

	const chartData = sampleMonthly(projection).map((p) => ({
		date: p.date.slice(0, 7),
		balance: Math.round(displayBalance(account, p.balance)),
	}));

	const noNodes = accounts.length + externalParties.length < 2;

	const goesNegative =
		!account.amortizing && projection.some((p) => p.balance < 0);

	return (
		<div>
			<Link to="/accounts" style={styles.backLink}>
				← Accounts
			</Link>

			<div style={styles.header}>
				<div>
					<h1 style={styles.accountName}>{account.name}</h1>
					<div style={styles.meta}>
						<span>{account.owner}</span>
						{account.institution && <span>{account.institution}</span>}
						<span>{account.type.replace("_", " ")}</span>
						<span>{account.amortizing ? "amortizing" : "revolving"}</span>
					</div>
				</div>
				<div style={styles.balanceBlock}>
					<div
						style={{
							...styles.seedBalance,
							color:
								!account.amortizing && account.seedBalance < 0
									? "#dc2626"
									: "#111827",
						}}
					>
						{formatCurrency(displayBalance(account, account.seedBalance))}
					</div>
					<div style={styles.seedMeta}>
						seed balance as of {account.seedDate}
						{account.rate !== 0 &&
							` · ${(account.rate * 100).toFixed(1)}% rate`}
					</div>
				</div>
			</div>

			{goesNegative && (
				<div role="alert" style={styles.warningBanner}>
					This account is projected to go negative within the next 12 months.
				</div>
			)}

			<section style={styles.section}>
				<div style={styles.sectionHeader}>
					<h2 style={styles.sectionTitle}>Projection (12 months)</h2>
				</div>
				{chartData.length === 0 ? (
					<p style={styles.empty}>No projection data.</p>
				) : (
					<ResponsiveContainer width="100%" height={280}>
						<LineChart
							data={chartData}
							margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
							<XAxis dataKey="date" tick={{ fontSize: 11 }} />
							<YAxis
								tickFormatter={yAxisTickFormatter}
								tick={{ fontSize: 11 }}
								width={90}
							/>
							<Tooltip formatter={tooltipFormatter} />
							<ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
							<Line
								type="monotone"
								dataKey="balance"
								name={account.name}
								stroke="#2563eb"
								dot={false}
								strokeWidth={2}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</section>

			<section style={styles.section}>
				<div style={styles.sectionHeader}>
					<h2 style={styles.sectionTitle}>Schedules</h2>
					{!showScheduleForm && (
						<button
							type="button"
							style={styles.addBtn}
							onClick={() => setShowScheduleForm(true)}
							disabled={noNodes}
							title={
								noNodes
									? "Add at least two accounts or external parties first"
									: undefined
							}
						>
							+ Add schedule
						</button>
					)}
				</div>

				{showScheduleForm && (
					<ScheduleForm
						defaultSourceId={account.id}
						accounts={accounts}
						externalParties={externalParties}
						onSave={handleSaveSchedule}
						onCancel={() => setShowScheduleForm(false)}
					/>
				)}

				{accountSchedules.length === 0 ? (
					<p style={styles.empty}>No schedules involve this account.</p>
				) : (
					<table className="data-table">
						<thead>
							<tr>
								<th>From</th>
								<th>Amount</th>
								<th>Frequency</th>
								<th>To</th>
								<th>Start</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{accountSchedules.map((s) => (
								<tr key={s.id}>
									<td>{nodeLabel(s.sourceId)}</td>
									<td style={{ fontVariantNumeric: "tabular-nums" }}>
										${s.amount.toLocaleString()}
										{s.estimated ? " ~" : ""}
									</td>
									<td>{s.frequency}</td>
									<td>{nodeLabel(s.destinationId)}</td>
									<td>{formatDate(s.startDate)}</td>
									<td style={styles.actions}>
										<button
											type="button"
											style={styles.deleteBtn}
											onClick={() => handleDeleteSchedule(s.id)}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</section>

			<section style={styles.section}>
				<h2 style={styles.sectionTitle}>Adjustments</h2>
				<AdjustmentPanel
					accounts={accounts}
					baselineResult={baselineNoAdj}
					fixedAccountId={account.id}
				/>
			</section>
		</div>
	);
}

const styles = {
	backLink: {
		display: "inline-block",
		marginBottom: "1rem",
		color: "#6b7280",
		textDecoration: "none",
		fontSize: "0.875rem",
	},
	header: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: "2rem",
		paddingBottom: "1rem",
		borderBottom: "1px solid #e5e7eb",
	},
	accountName: { margin: 0, marginBottom: "0.5rem" },
	meta: {
		display: "flex",
		gap: "1rem",
		color: "#6b7280",
		fontSize: "0.875rem",
	},
	balanceBlock: { textAlign: "right" as const },
	warningBanner: {
		marginBottom: "1.5rem",
		padding: "0.75rem 1rem",
		background: "#fef2f2",
		border: "1px solid #fca5a5",
		borderRadius: "6px",
		color: "#991b1b",
		fontSize: "0.875rem",
	},
	seedBalance: {
		fontSize: "1.5rem",
		fontWeight: 700,
		fontVariantNumeric: "tabular-nums",
	},
	seedMeta: { color: "#6b7280", fontSize: "0.8rem", marginTop: "0.25rem" },
	section: {
		marginBottom: "2rem",
		padding: "1.25rem",
		background: "#f9fafb",
		border: "1px solid #e5e7eb",
		borderRadius: "6px",
	},
	sectionHeader: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: "1rem",
	},
	sectionTitle: { margin: 0, fontSize: "1rem", fontWeight: 600 },
	addBtn: {
		padding: "0.3rem 0.75rem",
		border: "1px dashed #9ca3af",
		borderRadius: "4px",
		background: "none",
		cursor: "pointer",
		color: "#374151",
		fontSize: "0.85rem",
	},
	actions: {
		textAlign: "right" as const,
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
	empty: { color: "#9ca3af", fontSize: "0.875rem", margin: 0 },
	notFound: { color: "#9ca3af", marginTop: "1rem" },
};
