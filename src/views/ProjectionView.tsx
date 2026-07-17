import { useEffect, useRef, useState } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { get } from "../api/client";
import ScenarioManager from "../components/ScenarioManager";
import { resolveSchedules } from "../engine/projection";
import type { Account, ProjectionResult } from "../engine/types";
import { useAccounts } from "../hooks/useAccounts";
import { useExternalParties } from "../hooks/useExternalParties";
import { useScenarios } from "../hooks/useScenarios";
import { useSchedules } from "../hooks/useSchedules";
import {
	type CashFlowTotals,
	computeCashFlowTotals,
	computeHorizonCashFlowTotals,
} from "../utils/cashFlow";
import { displayBalance } from "../utils/displayBalance";
import { computeNetWorth } from "../utils/netWorth";

const PALETTE = [
	"#2563eb",
	"#16a34a",
	"#dc2626",
	"#9333ea",
	"#ca8a04",
	"#0891b2",
	"#c2410c",
	"#4f46e5",
];

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

function findCrossings(
	series: { date: string; balance: number }[],
	threshold: number,
	direction: "up" | "down",
): string[] {
	const dates: string[] = [];
	for (let i = 1; i < series.length; i++) {
		const prev = series[i - 1]!.balance;
		const curr = series[i]!.balance;
		if (direction === "up" && prev < threshold && curr >= threshold)
			dates.push(series[i]!.date);
		if (direction === "down" && prev >= threshold && curr < threshold)
			dates.push(series[i]!.date);
	}
	return dates;
}

const HORIZON_OPTIONS_MONTHS = [3, 6, 12, 24, 60, 120, 240, 360];

function formatHorizonLabel(months: number): string {
	if (months <= 12) return `${months} months`;
	return `${months / 12} years`;
}

function buildProjectionUrl(
	startDate: string,
	endDate: string,
	scenarioId?: string,
) {
	const params = new URLSearchParams({ startDate, endDate });
	if (scenarioId) params.set("scenarioId", scenarioId);
	return `/api/projection?${params.toString()}`;
}

interface NetWorthFigures {
	current: number;
	horizonEnd: number;
}

interface CashFlowGroup {
	key: string;
	label: string;
	monthly: CashFlowTotals;
	cumulative: CashFlowTotals;
	netWorth: NetWorthFigures;
	accounts: Account[];
	visibleAccountIds: Set<string>;
	groupResult: ProjectionResult;
}

function netWorthFigures(
	groupAccounts: Account[],
	groupResult: ProjectionResult,
	visibleAccountIds: Set<string>,
): NetWorthFigures {
	return {
		current: computeNetWorth(
			groupAccounts,
			(id) => groupResult[id]?.[0]?.balance ?? 0,
			visibleAccountIds,
		),
		horizonEnd: computeNetWorth(
			groupAccounts,
			(id) => groupResult[id]?.at(-1)?.balance ?? 0,
			visibleAccountIds,
		),
	};
}

function netWorthAtDate(group: CashFlowGroup, date: string): number {
	return computeNetWorth(
		group.accounts,
		(id) => group.groupResult[id]?.find((p) => p.date === date)?.balance ?? 0,
		group.visibleAccountIds,
	);
}

export default function ProjectionView() {
	const { accounts } = useAccounts();
	const { scenarios } = useScenarios();
	const { schedules } = useSchedules();
	const { externalParties } = useExternalParties();
	const [horizonMonths, setHorizonMonths] = useState(12);
	const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
	const [showScenarios, setShowScenarios] = useState(false);
	const [hideBaseline, setHideBaseline] = useState(false);
	const [activeScenarioIds, setActiveScenarioIds] = useState<Set<string>>(
		new Set(),
	);
	const [scenarioVersion, setScenarioVersion] = useState(0);

	const [result, setResult] = useState<ProjectionResult>({});
	const [scenarioResults, setScenarioResults] = useState<
		Record<string, ProjectionResult>
	>({});

	const today = new Date();
	const startDate = today.toISOString().slice(0, 10);
	const endDate = new Date(
		today.getFullYear(),
		today.getMonth() + horizonMonths,
		today.getDate(),
	)
		.toISOString()
		.slice(0, 10);

	// Separate refs so concurrent fires don't cancel each other's in-flight request
	const baselineFetchIdRef = useRef(0);
	const scenarioFetchIdRef = useRef(0);

	useEffect(() => {
		if (accounts.length === 0) {
			setResult({});
			return;
		}

		const id = ++baselineFetchIdRef.current;

		void get<ProjectionResult>(buildProjectionUrl(startDate, endDate)).then(
			(main) => {
				if (baselineFetchIdRef.current !== id) return;
				setResult(main);
			},
		);
	}, [accounts, startDate, endDate]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scenarioVersion is a deliberate re-fetch trigger, not read in the effect body
	useEffect(() => {
		if (activeScenarioIds.size === 0) {
			setScenarioResults({});
			return;
		}

		const id = ++scenarioFetchIdRef.current;
		const fetches = [...activeScenarioIds].map((scId) =>
			get<ProjectionResult>(buildProjectionUrl(startDate, endDate, scId)).then(
				(r) => [scId, r] as const,
			),
		);

		void Promise.all(fetches).then((entries) => {
			if (scenarioFetchIdRef.current !== id) return;
			setScenarioResults(Object.fromEntries(entries));
		});
	}, [activeScenarioIds, startDate, endDate, scenarioVersion]);

	const visibleAccounts = accounts.filter((a) => !hiddenIds.has(a.id));
	const visibleAccountIds = new Set(visibleAccounts.map((a) => a.id));

	const cashFlowGroups: CashFlowGroup[] = [
		{
			key: "baseline",
			label: "Baseline",
			monthly: computeCashFlowTotals(
				schedules,
				accounts,
				externalParties,
				startDate,
				visibleAccountIds,
			),
			cumulative: computeHorizonCashFlowTotals(
				schedules,
				accounts,
				externalParties,
				startDate,
				endDate,
				visibleAccountIds,
			),
			netWorth: netWorthFigures(accounts, result, visibleAccountIds),
			accounts,
			visibleAccountIds,
			groupResult: result,
		},
	];
	for (const scId of activeScenarioIds) {
		const scenario = scenarios.find((s) => s.id === scId);
		if (!scenario) continue;

		const resolvedSchedules = resolveSchedules(schedules, scenario);
		const scenarioAccounts = [...accounts, ...scenario.additionalAccounts];
		const scenarioVisibleIds = new Set([
			...visibleAccountIds,
			...scenario.additionalAccounts.map((a) => a.id),
		]);

		cashFlowGroups.push({
			key: scId,
			label: scenario.name,
			monthly: computeCashFlowTotals(
				resolvedSchedules,
				scenarioAccounts,
				externalParties,
				startDate,
				scenarioVisibleIds,
			),
			cumulative: computeHorizonCashFlowTotals(
				resolvedSchedules,
				scenarioAccounts,
				externalParties,
				startDate,
				endDate,
				scenarioVisibleIds,
			),
			netWorth: netWorthFigures(
				scenarioAccounts,
				scenarioResults[scId] ?? {},
				scenarioVisibleIds,
			),
			accounts: scenarioAccounts,
			visibleAccountIds: scenarioVisibleIds,
			groupResult: scenarioResults[scId] ?? {},
		});
	}

	const refSeries =
		visibleAccounts.length > 0
			? sampleMonthly(result[visibleAccounts[0]!.id] ?? [])
			: [];

	const chartData = refSeries.map(({ date }) => {
		const row: Record<string, string | number> = {
			date: date.slice(0, 7),
			fullDate: date,
		};
		for (const account of visibleAccounts) {
			const point = (result[account.id] ?? []).find((p) => p.date === date);
			row[account.id] = point
				? Math.round(displayBalance(account, point.balance))
				: 0;
			for (const [scId, scResult] of Object.entries(scenarioResults)) {
				const scPoint = (scResult[account.id] ?? []).find(
					(p) => p.date === date,
				);
				row[`${account.id}_${scId}`] = scPoint
					? Math.round(displayBalance(account, scPoint.balance))
					: 0;
			}
		}
		return row;
	});

	const milestones: { date: string; label: string; color: string }[] = [];
	for (const account of visibleAccounts) {
		const series = result[account.id] ?? [];
		if (account.amortizing) {
			for (const date of findCrossings(series, 0, "up")) {
				milestones.push({
					date: date.slice(0, 7),
					label: `${account.name} paid off`,
					color: "#16a34a",
				});
			}
		}
		for (const date of findCrossings(series, 0, "down")) {
			milestones.push({
				date: date.slice(0, 7),
				label: `${account.name} negative`,
				color: "#dc2626",
			});
		}
	}

	const negativeWarnings: {
		accountId: string;
		accountName: string;
		source: string;
	}[] = [];
	for (const account of visibleAccounts) {
		if (account.amortizing) continue;
		if ((result[account.id] ?? []).some((p) => p.balance < 0)) {
			negativeWarnings.push({
				accountId: account.id,
				accountName: account.name,
				source: "Baseline",
			});
		}
		for (const scId of activeScenarioIds) {
			const scSeries = scenarioResults[scId]?.[account.id] ?? [];
			if (scSeries.some((p) => p.balance < 0)) {
				const scenarioName =
					scenarios.find((s) => s.id === scId)?.name ?? "Scenario";
				negativeWarnings.push({
					accountId: account.id,
					accountName: account.name,
					source: `${scenarioName} (scenario)`,
				});
			}
		}
	}

	function toggleAccount(id: string) {
		setHiddenIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function toggleScenario(id: string) {
		setActiveScenarioIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			if (next.size === 0) setHideBaseline(false);
			return next;
		});
	}

	const yAxisTickFormatter = (v: unknown) => formatCurrency(Number(v));

	function renderTooltipContent({
		active,
		payload,
		label,
	}: {
		active?: boolean;
		payload?: Array<{
			dataKey?: string | number;
			name?: string | number;
			value?: number;
			color?: string;
			payload?: Record<string, string | number>;
		}>;
		label?: string | number;
	}) {
		if (!active || !payload || payload.length === 0) return null;
		const fullDate = payload[0]?.payload?.fullDate;

		return (
			<div style={styles.tooltip}>
				<div style={styles.tooltipLabel}>{label}</div>
				{payload.map((entry) => (
					<div
						key={entry.dataKey}
						style={{ ...styles.tooltipRow, color: entry.color }}
					>
						{entry.name}: {formatCurrency(Number(entry.value))}
					</div>
				))}
				{typeof fullDate === "string" &&
					cashFlowGroups.map((g) => (
						<div key={`nw-${g.key}`} style={styles.tooltipNetWorth}>
							Net Worth{cashFlowGroups.length > 1 ? ` — ${g.label}` : ""}:{" "}
							{formatCurrency(netWorthAtDate(g, fullDate))}
						</div>
					))}
			</div>
		);
	}

	return (
		<div>
			<div style={styles.header}>
				<h1>Projection</h1>
				<div style={styles.controls}>
					<label>
						Horizon:{" "}
						<select
							value={horizonMonths}
							onChange={(e) => setHorizonMonths(Number(e.target.value))}
						>
							{HORIZON_OPTIONS_MONTHS.map((m) => (
								<option key={m} value={m}>
									{formatHorizonLabel(m)}
								</option>
							))}
						</select>
					</label>
					<button
						type="button"
						style={styles.panelBtn}
						onClick={() => setShowScenarios((v) => !v)}
					>
						Scenarios
						{activeScenarioIds.size > 0 ? ` (${activeScenarioIds.size})` : ""}
					</button>
					{activeScenarioIds.size > 0 && (
						<label style={styles.filterLabel}>
							<input
								type="checkbox"
								checked={hideBaseline}
								onChange={() => setHideBaseline((v) => !v)}
							/>
							Hide Baseline
						</label>
					)}
				</div>
			</div>

			{accounts.length === 0 ? (
				<p style={styles.empty}>
					No accounts yet. Add accounts and schedules to see a projection.
				</p>
			) : (
				<>
					<div style={styles.filter}>
						{accounts.map((a, i) => (
							<label key={a.id} style={styles.filterLabel}>
								<input
									type="checkbox"
									checked={!hiddenIds.has(a.id)}
									onChange={() => toggleAccount(a.id)}
								/>
								<span style={{ color: PALETTE[i % PALETTE.length] }}>
									{a.name}
								</span>
							</label>
						))}
					</div>

					<div style={styles.cashFlowSection}>
						{cashFlowGroups.map((g) => (
							<div key={g.key} style={styles.cashFlowGroup}>
								{cashFlowGroups.length > 1 && (
									<div style={styles.groupLabel}>{g.label}</div>
								)}
								<div style={styles.totalsRow}>
									<div style={styles.totalCard}>
										<span style={styles.totalLabel}>Total In</span>
										<span
											data-testid={`total-in-${g.key}`}
											style={{ ...styles.totalAmount, ...styles.totalIn }}
										>
											{formatCurrency(g.monthly.totalIn)}/mo
										</span>
										<span
											data-testid={`total-in-cumulative-${g.key}`}
											style={styles.totalSub}
										>
											{formatCurrency(g.cumulative.totalIn)} over horizon
										</span>
									</div>
									<div style={styles.totalCard}>
										<span style={styles.totalLabel}>Total Out</span>
										<span
											data-testid={`total-out-${g.key}`}
											style={{ ...styles.totalAmount, ...styles.totalOut }}
										>
											{formatCurrency(g.monthly.totalOut)}/mo
										</span>
										<span
											data-testid={`total-out-cumulative-${g.key}`}
											style={styles.totalSub}
										>
											{formatCurrency(g.cumulative.totalOut)} over horizon
										</span>
									</div>
									<div style={styles.totalCard}>
										<span style={styles.totalLabel}>Net Worth</span>
										<span
											data-testid={`net-worth-${g.key}`}
											style={{
												...styles.totalAmount,
												...(g.netWorth.current < 0 ? { color: "#dc2626" } : {}),
											}}
										>
											{formatCurrency(g.netWorth.current)}
										</span>
										<span
											data-testid={`net-worth-horizon-${g.key}`}
											style={styles.totalSub}
										>
											{formatCurrency(g.netWorth.horizonEnd)} at end of horizon
										</span>
									</div>
								</div>
							</div>
						))}
					</div>

					{negativeWarnings.length > 0 && (
						<div role="alert" style={styles.warningBanner}>
							<div style={styles.warningTitle}>
								Accounts projected to go negative
							</div>
							<ul style={styles.warningList}>
								{negativeWarnings.map((w) => (
									<li key={`${w.accountId}-${w.source}`}>
										{w.accountName} — {w.source}
									</li>
								))}
							</ul>
						</div>
					)}

					{milestones.length > 0 && (
						<div style={styles.milestones}>
							{milestones.map((m) => (
								<span
									key={`${m.label}-${m.date}`}
									style={{ ...styles.milestone, color: m.color }}
								>
									● {m.label} ({m.date})
								</span>
							))}
						</div>
					)}

					<ResponsiveContainer width="100%" height={420}>
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
							<Tooltip content={renderTooltipContent} />
							<Legend />
							<ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
							{milestones.map((m) => (
								<ReferenceLine
									key={`${m.label}-${m.date}`}
									x={m.date}
									stroke={m.color}
									strokeDasharray="4 2"
									strokeWidth={1}
								/>
							))}
							{!hideBaseline &&
								visibleAccounts.map((a, i) => (
									<Line
										key={a.id}
										type="monotone"
										dataKey={a.id}
										name={a.name}
										stroke={PALETTE[i % PALETTE.length]}
										dot={false}
										strokeWidth={2}
									/>
								))}
							{[...activeScenarioIds].flatMap((scId) =>
								visibleAccounts.map((a, i) => (
									<Line
										key={`${a.id}_${scId}`}
										type="monotone"
										dataKey={`${a.id}_${scId}`}
										name={`${a.name} (scenario)`}
										stroke={PALETTE[i % PALETTE.length]}
										dot={false}
										strokeWidth={1.5}
										strokeDasharray="6 3"
									/>
								)),
							)}
						</LineChart>
					</ResponsiveContainer>

					{showScenarios && (
						<ScenarioManager
							activeScenarioIds={activeScenarioIds}
							onToggleScenario={toggleScenario}
							onScenarioUpdated={() => setScenarioVersion((v) => v + 1)}
						/>
					)}
				</>
			)}
		</div>
	);
}

const styles = {
	tooltip: {
		background: "#fff",
		border: "1px solid #e5e7eb",
		borderRadius: "6px",
		padding: "0.5rem 0.75rem",
		fontSize: "0.8rem",
	},
	tooltipLabel: {
		fontWeight: 600,
		marginBottom: "0.25rem",
	},
	tooltipRow: {
		fontVariantNumeric: "tabular-nums" as const,
	},
	tooltipNetWorth: {
		marginTop: "0.25rem",
		paddingTop: "0.25rem",
		borderTop: "1px solid #e5e7eb",
		fontWeight: 600,
		fontVariantNumeric: "tabular-nums" as const,
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: "1rem",
	},
	controls: { display: "flex", gap: "0.75rem", alignItems: "center" },
	panelBtn: {
		padding: "0.35rem 0.75rem",
		border: "1px solid #d1d5db",
		borderRadius: "4px",
		background: "#fff",
		cursor: "pointer",
		fontSize: "0.85rem",
	},
	filter: {
		display: "flex",
		flexWrap: "wrap" as const,
		gap: "0.75rem",
		marginBottom: "1rem",
	},
	filterLabel: {
		display: "flex",
		alignItems: "center",
		gap: "0.25rem",
		cursor: "pointer",
		fontSize: "0.875rem",
	},
	cashFlowSection: {
		display: "flex",
		flexWrap: "wrap" as const,
		gap: "1.5rem",
		marginBottom: "1rem",
	},
	cashFlowGroup: {
		display: "flex",
		flexDirection: "column" as const,
		gap: "0.4rem",
	},
	groupLabel: {
		fontSize: "0.75rem",
		fontWeight: 600,
		color: "#6b7280",
		textTransform: "uppercase" as const,
		letterSpacing: "0.05em",
	},
	totalsRow: {
		display: "flex",
		gap: "1rem",
	},
	totalCard: {
		display: "flex",
		flexDirection: "column" as const,
		padding: "0.75rem 1rem",
		border: "1px solid #e5e7eb",
		borderRadius: "6px",
		background: "#f9fafb",
	},
	totalLabel: {
		fontSize: "0.75rem",
		fontWeight: 600,
		color: "#6b7280",
		textTransform: "uppercase" as const,
		letterSpacing: "0.05em",
	},
	totalAmount: {
		fontSize: "1.25rem",
		fontWeight: 600,
		fontVariantNumeric: "tabular-nums" as const,
	},
	totalIn: { color: "#16a34a" },
	totalOut: { color: "#dc2626" },
	totalSub: {
		fontSize: "0.75rem",
		color: "#6b7280",
		fontVariantNumeric: "tabular-nums" as const,
	},
	milestones: {
		display: "flex",
		flexWrap: "wrap" as const,
		gap: "1rem",
		marginBottom: "0.75rem",
		fontSize: "0.8rem",
	},
	milestone: { fontWeight: 500 },
	warningBanner: {
		marginBottom: "1rem",
		padding: "0.75rem 1rem",
		background: "#fef2f2",
		border: "1px solid #fca5a5",
		borderRadius: "6px",
		color: "#991b1b",
		fontSize: "0.875rem",
	},
	warningTitle: { fontWeight: 600, marginBottom: "0.25rem" },
	warningList: { margin: 0, paddingLeft: "1.25rem" },
	empty: { color: "#9ca3af" },
};
