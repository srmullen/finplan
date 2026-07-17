import { useState } from "react";
import { Link } from "react-router-dom";
import AccountForm from "../components/AccountForm";
import ExternalPartyForm from "../components/ExternalPartyForm";
import type { Account, ExternalParty } from "../engine/types";
import { useAccounts } from "../hooks/useAccounts";
import { useAdjustments } from "../hooks/useAdjustments";
import { useExternalParties } from "../hooks/useExternalParties";
import { displayBalance } from "../utils/displayBalance";
import { formatDate } from "../utils/formatDate";
import { computeNetWorth } from "../utils/netWorth";
import { resolveEffectiveBalance } from "../utils/resolveEffectiveBalance";

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

function formatBalance(n: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(n);
}

export default function AccountsView() {
	const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts();
	const { adjustments } = useAdjustments();
	const { externalParties, addParty, updateParty, deleteParty } =
		useExternalParties();
	const [showAccountForm, setShowAccountForm] = useState(false);
	const [editingAccount, setEditingAccount] = useState<Account | null>(null);
	const [showPartyForm, setShowPartyForm] = useState(false);
	const [editingParty, setEditingParty] = useState<ExternalParty | null>(null);

	function saveAccount(account: Account) {
		if (editingAccount) {
			void updateAccount(account);
			setEditingAccount(null);
		} else {
			void addAccount(account);
			setShowAccountForm(false);
		}
	}

	function handleDeleteAccount(id: string) {
		if (confirm("Delete this account?")) {
			void deleteAccount(id);
		}
	}

	function saveParty(party: ExternalParty) {
		if (editingParty) {
			void updateParty(party);
			setEditingParty(null);
		} else {
			void addParty(party);
			setShowPartyForm(false);
		}
	}

	function handleDeleteParty(id: string) {
		if (confirm("Delete this external party?")) {
			void deleteParty(id);
		}
	}

	const ownerSuggestions = [
		...new Set(accounts.map((a) => a.owner).filter(Boolean)),
	].sort();
	const institutionSuggestions = [
		...new Set(accounts.map((a) => a.institution ?? "").filter(Boolean)),
	].sort();

	const sortedAccounts = [...accounts].sort(
		(a, b) => a.owner.localeCompare(b.owner) || a.name.localeCompare(b.name),
	);

	const asOfDate = today();
	const effectiveBalances = new Map(
		accounts.map((a) => [a.id, resolveEffectiveBalance(a, adjustments, asOfDate)]),
	);
	// biome-ignore lint/style/noNonNullAssertion: id always comes from the same accounts list the map was built from
	const netWorth = computeNetWorth(accounts, (id) => effectiveBalances.get(id)!.balance);

	return (
		<div>
			<h1>Accounts</h1>

			<div style={styles.netWorth}>
				<span style={styles.netWorthLabel}>Net Worth</span>
				<span
					style={{
						...styles.netWorthAmount,
						...(netWorth < 0 ? { color: "#dc2626" } : {}),
					}}
				>
					{formatBalance(netWorth)}
				</span>
			</div>

			{(showAccountForm || editingAccount) && (
				<AccountForm
					initial={editingAccount ?? undefined}
					ownerSuggestions={ownerSuggestions}
					institutionSuggestions={institutionSuggestions}
					onSave={saveAccount}
					onCancel={() => {
						setShowAccountForm(false);
						setEditingAccount(null);
					}}
				/>
			)}

			{!showAccountForm && !editingAccount && (
				<button
					type="button"
					style={styles.addBtn}
					onClick={() => setShowAccountForm(true)}
				>
					+ Add account
				</button>
			)}

			{accounts.length === 0 ? (
				<p style={styles.empty}>No accounts yet. Add one above.</p>
			) : (
				<table className="data-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Owner</th>
							<th>Institution</th>
							<th>Type</th>
							<th style={{ textAlign: "right" }}>Balance</th>
							<th>As of</th>
							<th>Rate</th>
							<th>Kind</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{sortedAccounts.map((a) => {
							const effective = resolveEffectiveBalance(
								a,
								adjustments,
								asOfDate,
							);
							return (
								<tr key={a.id}>
									<td>
										<Link to={`/accounts/${a.id}`} style={styles.nameLink}>
											{a.name}
										</Link>
									</td>
									<td>{a.owner}</td>
									<td>{a.institution ?? ""}</td>
									<td>{a.type.replace("_", " ")}</td>
									<td
										style={{
											textAlign: "right",
											fontVariantNumeric: "tabular-nums",
										}}
									>
										<span
											style={{
												color:
													!a.amortizing && effective.balance < 0
														? "#dc2626"
														: undefined,
											}}
										>
											{formatBalance(displayBalance(a, effective.balance))}
										</span>
									</td>
									<td>{formatDate(effective.date)}</td>
									<td>
										{a.rate !== 0 ? `${(a.rate * 100).toFixed(1)}%` : "—"}
									</td>
									<td>{a.amortizing ? "amortizing" : "revolving"}</td>
									<td style={styles.actions}>
										<button
											type="button"
											style={styles.editBtn}
											onClick={() => {
												setShowAccountForm(false);
												setEditingAccount(a);
											}}
										>
											Edit
										</button>
										<button
											type="button"
											style={styles.deleteBtn}
											onClick={() => handleDeleteAccount(a.id)}
										>
											Delete
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}

			<hr style={styles.divider} />

			<h1>External Parties</h1>

			{(showPartyForm || editingParty) && (
				<ExternalPartyForm
					initial={editingParty ?? undefined}
					onSave={saveParty}
					onCancel={() => {
						setShowPartyForm(false);
						setEditingParty(null);
					}}
				/>
			)}

			{!showPartyForm && !editingParty && (
				<button
					type="button"
					style={styles.addBtn}
					onClick={() => setShowPartyForm(true)}
				>
					+ Add external party
				</button>
			)}

			{externalParties.length === 0 ? (
				<p style={styles.empty}>No external parties yet.</p>
			) : (
				<table className="data-table">
					<thead>
						<tr>
							<th>Name</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{externalParties.map((p) => (
							<tr key={p.id}>
								<td>{p.name}</td>
								<td style={styles.actions}>
									<button
										type="button"
										style={styles.editBtn}
										onClick={() => {
											setShowPartyForm(false);
											setEditingParty(p);
										}}
									>
										Edit
									</button>
									<button
										type="button"
										style={styles.deleteBtn}
										onClick={() => handleDeleteParty(p.id)}
									>
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

const styles = {
	netWorth: {
		display: "flex",
		flexDirection: "column" as const,
		gap: "0.25rem",
		marginBottom: "1.5rem",
	},
	netWorthLabel: {
		fontSize: "0.75rem",
		fontWeight: 600,
		color: "#6b7280",
		textTransform: "uppercase" as const,
		letterSpacing: "0.05em",
	},
	netWorthAmount: {
		fontSize: "2rem",
		fontWeight: 700,
		fontVariantNumeric: "tabular-nums" as const,
	},
	addBtn: {
		padding: "0.4rem 0.875rem",
		border: "1px dashed #9ca3af",
		borderRadius: "4px",
		background: "none",
		cursor: "pointer",
		color: "#374151",
		marginBottom: "1rem",
		display: "block",
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
	empty: { color: "#9ca3af", marginBottom: "1.5rem" },
	nameLink: { color: "#1d4ed8", textDecoration: "none" },
	divider: { margin: "2rem 0", borderColor: "#e5e7eb" },
};
