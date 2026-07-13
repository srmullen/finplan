import type { ReactNode } from "react";

function DocsBlock({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div style={styles.block}>
			<div style={styles.blockLabel}>{label}</div>
			<p style={styles.paragraph}>{children}</p>
		</div>
	);
}

export default function DocsView() {
	return (
		<div style={styles.page}>
			<h1>Docs</h1>
			<p style={styles.intro}>
				A plain-language guide to what each part of finplan does and how to use
				it.
			</p>

			<nav aria-label="Table of contents" style={styles.toc}>
				<span style={styles.tocLabel}>On this page</span>
				<ul style={styles.tocList}>
					<li>
						<a href="#projection" style={styles.tocLink}>
							Projection
						</a>
					</li>
					<li>
						<a href="#accounts" style={styles.tocLink}>
							Accounts
						</a>
					</li>
					<li>
						<a href="#schedules" style={styles.tocLink}>
							Schedules
						</a>
					</li>
				</ul>
			</nav>

			<section style={styles.section}>
				<h2 id="projection" style={styles.sectionTitle}>
					Projection
				</h2>
				<DocsBlock label="What it's for">
					The Projection view shows how your account balances are expected to
					change over time. It replays your schedules and rates forward from
					today, so you can see a chart of every account's balance heading into
					the future.
				</DocsBlock>
				<DocsBlock label="How to use it">
					Pick a horizon from the dropdown, hide accounts with the checkboxes,
					and open "Scenarios" to overlay a what-if as a dashed line without
					touching your real plan. Once a scenario is active, check "Hide
					Baseline" to drop the solid lines and focus on the scenario alone.
					Milestones like an account being paid off appear right on the chart.
				</DocsBlock>
				<DocsBlock label="Negative balance warning">
					A banner appears above the chart listing any visible revolving account
					(checking, savings, credit card — not a loan) whose Baseline or an
					active Scenario dips below zero within the selected horizon. Each
					entry names the account and which line is affected — "Baseline" or the
					scenario's name — so a Scenario-only warning doesn't get mistaken for
					a real Baseline problem. Hiding an account or shrinking the horizon
					removes it from the banner once it's no longer projected to go
					negative. Loans never trigger this warning, since paying down to zero
					is expected.
				</DocsBlock>
			</section>

			<hr style={styles.divider} />

			<section style={styles.section}>
				<h2 id="accounts" style={styles.sectionTitle}>
					Accounts
				</h2>
				<DocsBlock label="What it's for">
					The Accounts view is where you keep the list of accounts and external
					parties (like employers or lenders) that make up your financial
					picture. Every account tracks a balance, an owner, and whether it's a
					growing/interest-bearing balance or a loan paying down to zero.
				</DocsBlock>
				<DocsBlock label="How to use it">
					Use "+ Add account" or "+ Add external party" to add one. Click an
					account's name to record an Adjustment — a real-world balance for a
					specific date — so future projections start from reality instead of
					drifting from what was planned.
				</DocsBlock>
				<DocsBlock label="Negative balance warning">
					On an account's detail page, a revolving account (checking, savings,
					credit card — anything that doesn't pay down to zero) shows a warning
					if its own 12-month projection dips below zero at any point.
					Amortizing accounts (loans) never show this warning, since reaching
					zero is their expected payoff.
				</DocsBlock>
			</section>

			<hr style={styles.divider} />

			<section style={styles.section}>
				<h2 id="schedules" style={styles.sectionTitle}>
					Schedules
				</h2>
				<DocsBlock label="What it's for">
					The Schedules view lists the recurring and one-time money movements
					between your accounts and external parties — paychecks, rent, loan
					payments, transfers, and so on. These are what the Projection view
					replays forward to build its chart.
				</DocsBlock>
				<DocsBlock label="How to use it">
					Use "+ Add schedule" to create a transfer with an amount, frequency,
					source, destination, and start (and optionally end) date. When a
					single real-world payment actually splits across multiple destinations
					— for example a mortgage payment that also funds an escrow account —
					use "+ Add payment group" to bundle those schedules under one named
					group so they display and can be edited or deleted together.
				</DocsBlock>
				<DocsBlock label="Total In / Total Out">
					Total In is the monthly-equivalent sum of every active schedule
					coming from an external party (paychecks, gifts, refunds). Total Out
					is the monthly-equivalent sum of every active schedule going to an
					external party, or to a loan or credit card account — a credit card
					payment counts as Out even though it comes from another account of
					yours, since paying down debt is money leaving the household.
					Transfers between two of your own non-debt accounts count toward
					neither total. Each schedule's amount is normalized to a
					monthly-equivalent figure based on its frequency before summing, only
					currently-active schedules are included, and a one-time schedule only
					counts in the month it's scheduled for.
				</DocsBlock>
			</section>
		</div>
	);
}

const styles = {
	page: {
		maxWidth: "42rem",
	},
	intro: {
		color: "#6b7280",
		marginBottom: "1.5rem",
	},
	toc: {
		display: "flex",
		flexDirection: "column" as const,
		gap: "0.5rem",
		marginBottom: "2rem",
		padding: "1rem 1.25rem",
		background: "#fff",
		border: "1px solid #e5e7eb",
		borderBottom: "1px solid #e5e7eb",
		borderRadius: "6px",
	},
	tocLabel: {
		fontSize: "0.75rem",
		fontWeight: 600,
		color: "#6b7280",
		textTransform: "uppercase" as const,
		letterSpacing: "0.05em",
	},
	tocList: {
		display: "flex",
		flexWrap: "wrap" as const,
		gap: "0.5rem 1.25rem",
		listStyle: "none",
		padding: 0,
	},
	tocLink: {
		padding: 0,
		background: "none",
		color: "#1d4ed8",
		fontWeight: 500,
	},
	section: {
		marginBottom: "1.5rem",
	},
	sectionTitle: {
		marginBottom: "0.75rem",
	},
	block: {
		marginBottom: "1rem",
	},
	blockLabel: {
		fontSize: "0.75rem",
		fontWeight: 600,
		color: "#6b7280",
		textTransform: "uppercase" as const,
		letterSpacing: "0.05em",
		marginBottom: "0.25rem",
	},
	paragraph: {
		lineHeight: 1.6,
	},
	divider: {
		margin: "1.5rem 0",
		borderColor: "#e5e7eb",
	},
};
