export default function DocsView() {
	return (
		<div>
			<h1>Docs</h1>

			<nav aria-label="Table of contents" style={styles.toc}>
				<ul style={styles.tocList}>
					<li>
						<a href="#projection">Projection</a>
					</li>
					<li>
						<a href="#accounts">Accounts</a>
					</li>
					<li>
						<a href="#schedules">Schedules</a>
					</li>
				</ul>
			</nav>

			<h2 id="projection">Projection</h2>
			<p>
				<strong>What it's for:</strong> The Projection view shows how your
				account balances are expected to change over time. It replays your
				schedules and rates forward from today, so you can see a chart of every
				account's balance heading into the future.
			</p>
			<p>
				<strong>How to use it:</strong> Pick a horizon from the dropdown, hide
				accounts with the checkboxes, and open "Scenarios" to overlay a what-if
				as a dashed line without touching your real plan. Milestones like an
				account being paid off appear right on the chart.
			</p>

			<h2 id="accounts">Accounts</h2>
			<p>
				<strong>What it's for:</strong> The Accounts view is where you keep the
				list of accounts and external parties (like employers or lenders) that
				make up your financial picture. Every account tracks a balance, an
				owner, and whether it's a growing/interest-bearing balance or a loan
				paying down to zero.
			</p>
			<p>
				<strong>How to use it:</strong> Use "+ Add account" or "+ Add external
				party" to add one. Click an account's name to record an Adjustment — a
				real-world balance for a specific date — so future projections start
				from reality instead of drifting from what was planned.
			</p>

			<h2 id="schedules">Schedules</h2>
			<p>
				<strong>What it's for:</strong> The Schedules view lists the recurring
				and one-time money movements between your accounts and external parties
				— paychecks, rent, loan payments, transfers, and so on. These are what
				the Projection view replays forward to build its chart.
			</p>
			<p>
				<strong>How to use it:</strong> Use "+ Add schedule" to create a
				transfer with an amount, frequency, source, destination, and start (and
				optionally end) date. When a single real-world payment actually splits
				across multiple destinations — for example a mortgage payment that also
				funds an escrow account — use "+ Add payment group" to bundle those
				schedules under one named group so they display and can be edited or
				deleted together.
			</p>
		</div>
	);
}

const styles = {
	toc: {
		marginBottom: "2rem",
	},
	tocList: {
		display: "flex",
		gap: "1rem",
		listStyle: "none",
		padding: 0,
	},
};
