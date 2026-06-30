import { type FormEvent, useState } from "react";
import type { Account, ProjectionResult } from "../engine/types";
import { useAdjustments } from "../hooks/useAdjustments";
import { generateId } from "../utils/id";
import { displayBalance } from "../utils/displayBalance";

interface Props {
	accounts: Account[];
	baselineResult: ProjectionResult;
	fixedAccountId?: string;
}

function formatCurrency(n: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(n);
}

function variance(
	baselineResult: ProjectionResult,
	accountId: string,
	date: string,
): number | null {
	const series = baselineResult[accountId];
	if (!series) return null;
	const point = series.find((p) => p.date === date);
	return point ? point.balance : null;
}

export default function AdjustmentPanel({
	accounts,
	baselineResult,
	fixedAccountId,
}: Props) {
	const { adjustments, addAdjustment, deleteAdjustment } = useAdjustments();
	const today = new Date().toISOString().slice(0, 10);

	const [accountId, setAccountId] = useState(
		fixedAccountId ?? accounts[0]?.id ?? "",
	);
	const [date, setDate] = useState(today);
	const [balance, setBalance] = useState("");
	const [filterAccountId, setFilterAccountId] = useState<string>("");

	const selectedAccount = accounts.find((a) => a.id === accountId);

	function handleAdd(e: FormEvent) {
		e.preventDefault();
		const raw = parseFloat(balance);
		void addAdjustment({
			id: generateId(),
			accountId,
			date,
			actualBalance: selectedAccount?.amortizing ? -raw : raw,
		});
		setBalance("");
	}

	const accountName = (id: string) =>
		accounts.find((a) => a.id === id)?.name ?? id;

	return (
		<div style={styles.panel}>
			<h2>Adjustments</h2>
			<p style={styles.hint}>
				Record an actual balance for any account at a specific date to anchor
				future projections.
			</p>

			<form onSubmit={handleAdd} style={styles.form}>
				{!fixedAccountId && (
					<div style={styles.field}>
						<label htmlFor="adj-account">Account</label>
						<select
							id="adj-account"
							value={accountId}
							onChange={(e) => setAccountId(e.target.value)}
						>
							{accounts.map((a) => (
								<option key={a.id} value={a.id}>
									{a.name}
								</option>
							))}
						</select>
					</div>
				)}
				<div style={styles.field}>
					<label htmlFor="adj-date">Date</label>
					<input
						id="adj-date"
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
					/>
				</div>
				<div style={styles.field}>
					<label htmlFor="adj-balance">Actual balance ($)</label>
					<input
						id="adj-balance"
						required
						type="number"
						step="0.01"
						value={balance}
						onChange={(e) => setBalance(e.target.value)}
						placeholder="0.00"
					/>
				</div>
				<button type="submit" style={styles.addBtn} disabled={!accountId}>
					Record
				</button>
			</form>

			{adjustments.length === 0 ? (
				<p style={styles.empty}>No adjustments recorded.</p>
			) : (
				<>
					{!fixedAccountId && (
						<div style={styles.filterRow}>
							<label style={styles.filterLabel}>
								Filter by account:{" "}
								<select
									value={filterAccountId}
									onChange={(e) => setFilterAccountId(e.target.value)}
								>
									<option value="">Show all</option>
									{accounts.map((a) => (
										<option key={a.id} value={a.id}>
											{a.name}
										</option>
									))}
								</select>
							</label>
						</div>
					)}
					<table style={styles.table}>
						<thead>
							<tr>
								<th>Account</th>
								<th>Date</th>
								<th style={{ textAlign: "right" }}>Actual</th>
								<th style={{ textAlign: "right" }}>Projected</th>
								<th style={{ textAlign: "right" }}>Variance</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{[...adjustments]
								.filter((adj) =>
									fixedAccountId
										? adj.accountId === fixedAccountId
										: !filterAccountId || adj.accountId === filterAccountId,
								)
								.sort((a, b) => b.date.localeCompare(a.date))
								.map((adj) => {
									const adjAccount = accounts.find(
										(a) => a.id === adj.accountId,
									);
									const projected = variance(
										baselineResult,
										adj.accountId,
										adj.date,
									);
									const diff =
										projected !== null ? adj.actualBalance - projected : null;
									return (
										<tr key={adj.id}>
											<td>{accountName(adj.accountId)}</td>
											<td>{adj.date}</td>
											<td
												style={{
													textAlign: "right",
													fontVariantNumeric: "tabular-nums",
												}}
											>
												{formatCurrency(
													adjAccount
														? displayBalance(adjAccount, adj.actualBalance)
														: adj.actualBalance,
												)}
											</td>
											<td
												style={{
													textAlign: "right",
													fontVariantNumeric: "tabular-nums",
													color: "#6b7280",
												}}
											>
												{projected !== null
													? formatCurrency(
															adjAccount
																? displayBalance(adjAccount, projected)
																: projected,
														)
													: "—"}
											</td>
											<td
												style={{
													textAlign: "right",
													fontVariantNumeric: "tabular-nums",
													color:
														diff === null
															? undefined
															: diff >= 0
																? "#16a34a"
																: "#dc2626",
													fontWeight: 500,
												}}
											>
												{diff !== null
													? (diff >= 0 ? "+" : "") + formatCurrency(diff)
													: "—"}
											</td>
											<td>
												<button
													type="button"
													style={styles.deleteBtn}
													onClick={() => void deleteAdjustment(adj.id)}
												>
													Delete
												</button>
											</td>
										</tr>
									);
								})}
						</tbody>
					</table>
				</>
			)}
		</div>
	);
}

const styles = {
	panel: {
		marginTop: "1.5rem",
		padding: "1rem",
		background: "#f9fafb",
		border: "1px solid #e5e7eb",
		borderRadius: "6px",
	},
	hint: { color: "#6b7280", fontSize: "0.8rem", marginBottom: "0.75rem" },
	form: {
		display: "flex",
		gap: "0.75rem",
		alignItems: "flex-end",
		marginBottom: "1rem",
	},
	field: {
		display: "flex",
		flexDirection: "column" as const,
		flex: 1,
		gap: "0.25rem",
		fontSize: "0.85rem",
	},
	addBtn: {
		padding: "0.4rem 0.875rem",
		border: "none",
		borderRadius: "4px",
		background: "#1d4ed8",
		color: "#fff",
		cursor: "pointer",
		fontWeight: 600,
		whiteSpace: "nowrap" as const,
	},
	table: {
		width: "100%",
		borderCollapse: "collapse" as const,
		fontSize: "0.85rem",
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
	filterRow: { marginBottom: "0.75rem" },
	filterLabel: {
		fontSize: "0.85rem",
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
	},
	empty: { color: "#9ca3af", fontSize: "0.85rem" },
};
