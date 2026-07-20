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
				<DocsBlock label="Total In / Total Out">
					Above the chart, Total In and Total Out show the same
					monthly-equivalent figures as the Schedules page, plus a second
					number: the actual total that's expected to move over your selected
					horizon. Changing the horizon updates that second figure but not the
					monthly-equivalent one. Both figures only count flows touching an
					account that's currently checked in the filter — a transfer with one
					checked and one hidden endpoint (like paying down a hidden credit card
					from a visible checking account) still counts. Once you have one or
					more Scenarios active, Baseline and each Scenario get their own Total
					In/Out instead of one blended number, matching the separate lines
					already drawn on the chart.
				</DocsBlock>
				<DocsBlock label="Net Worth">
					A Net Worth card sits alongside Total In/Out, showing your current net
					worth and what it's projected to be at the end of your selected
					horizon — all checked accounts added together, with any loan or credit
					card balance subtracted rather than added. Like Total In/Out, you get
					a separate card per Scenario once one is active, so you can see how a
					what-if changes your overall position, not just individual cash flows.
					Hovering the chart also shows Net Worth for that date in the tooltip,
					underneath the individual account values.
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
				<DocsBlock label="Net Worth">
					A Net Worth total appears at the top of the page, above the account
					list — every account's balance added together, with any loan or credit
					card balance subtracted rather than added, so it reflects what you
					actually have rather than double-counting debt as an asset. It turns
					red if it's negative. Each account's balance in the list below (and
					the date next to it) reflects your latest recorded Adjustment for that
					account, falling back to its original starting balance and date if you
					haven't recorded one yet.
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
					group so they display and can be edited or deleted together. You can
					still use a member's own row-level "Edit" button to tweak just that
					member's amount, frequency, destination, or dates — doing so keeps it
					in the group, and its source account field is locked since every
					member of a group shares the same source.
				</DocsBlock>
				<DocsBlock label="Total In / Total Out">
					Total In is the monthly-equivalent sum of every active schedule coming
					from an external party (paychecks, gifts, refunds). Total Out is the
					monthly-equivalent sum of every active schedule going to an external
					party, or to a loan or credit card account — a credit card payment
					counts as Out even though it comes from another account of yours,
					since paying down debt is money leaving the household. Transfers
					between two of your own non-debt accounts count toward neither total.
					Each schedule's amount is normalized to a monthly-equivalent figure
					based on its frequency before summing. A schedule counts for the
					current month as soon as its start date falls anywhere in that month —
					you don't have to wait for the exact day to arrive. Once started, it
					keeps counting every month (even ones like an annual premium that only
					technically charges once a year) unless it ends partway through the
					current month without firing again before its end date. A one-time
					schedule only counts in the month it's scheduled for.
				</DocsBlock>
				<DocsBlock label="Row color stripe">
					Each schedule row shows a colored stripe along its left edge using the
					same green/red convention as Total In/Total Out above: green if that
					row counts toward Total In, red if it counts toward Total Out, and
					blue if it's an internal transfer between two of your own accounts
					that counts toward neither. In a Payment Group, each member row is
					striped individually based on its own destination — the group's header
					row is never striped.
				</DocsBlock>
				<DocsBlock label="Active / inactive">
					Every schedule has an Active state, on by default. Deactivating one
					removes it from the Baseline Projection and Total In/Total Out
					entirely, as if it didn't exist — without deleting it — and that
					exclusion carries into every Scenario built on the Baseline too. A
					Scenario's own "paused" override still works independently and can
					pause a schedule that's Active in the Baseline, but it can't bring a
					Baseline-inactive schedule back for that Scenario; reactivating it
					means editing the Baseline schedule directly. Inactive schedules are
					hidden by default on both the Schedules page and an account's detail
					page — check "Show inactive" to reveal them, dimmed the same way a
					paused schedule is dimmed in the Scenario editor. Use the
					Activate/Deactivate button on a schedule's row to toggle it. In a
					Payment Group, each member is toggled individually — there's no
					group-level action that deactivates every member at once.
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
