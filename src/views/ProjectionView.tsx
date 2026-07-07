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
import type { ProjectionResult } from "../engine/types";
import { useAccounts } from "../hooks/useAccounts";
import { displayBalance } from "../utils/displayBalance";

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

function buildProjectionUrl(
	startDate: string,
	endDate: string,
	scenarioId?: string,
) {
	const params = new URLSearchParams({ startDate, endDate });
	if (scenarioId) params.set("scenarioId", scenarioId);
	return `/api/projection?${params.toString()}`;
}

export default function ProjectionView() {
	const { accounts } = useAccounts();
	const [horizonMonths, setHorizonMonths] = useState(12);
	const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
	const [showScenarios, setShowScenarios] = useState(false);
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

	const refSeries =
		visibleAccounts.length > 0
			? sampleMonthly(result[visibleAccounts[0]!.id] ?? [])
			: [];

	const chartData = refSeries.map(({ date }) => {
		const row: Record<string, string | number> = { date: date.slice(0, 7) };
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
			return next;
		});
	}

	const yAxisTickFormatter = (v: unknown) => formatCurrency(Number(v));
	const tooltipFormatter = (v: number) => formatCurrency(v);

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
							{[3, 6, 12, 24, 36, 60].map((m) => (
								<option key={m} value={m}>
									{m} months
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
							<Tooltip formatter={tooltipFormatter} />
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
							{visibleAccounts.map((a, i) => (
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
	milestones: {
		display: "flex",
		flexWrap: "wrap" as const,
		gap: "1rem",
		marginBottom: "0.75rem",
		fontSize: "0.8rem",
	},
	milestone: { fontWeight: 500 },
	empty: { color: "#9ca3af" },
};
