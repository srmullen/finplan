# Net Worth sums raw signed balances, scoped differently per page

The app has no single figure summarizing overall financial position — a user has to mentally add up every Account balance themselves, including remembering that Amortizing Account balances display as a positive "amount owed" (`displayBalance`, ADR 0012) rather than their true negative stored value. Summing the *displayed* values would double-count amortizing debt as an asset instead of a liability.

## Decision

Net Worth is the sum of each Account's **raw signed balance** — the same convention balances already use internally (negative = liability, positive = asset) — never the sign-flipped `displayBalance` value used for on-screen Amortizing Account rows. It is always a single household-wide total; there is no per-Owner breakdown, since Owner is a cosmetic label with no other structural role in the app.

The two pages that show Net Worth source it differently, each matching the balance data the page already has:

- **Accounts page**: Net Worth sums each Account's Adjustment-aware current balance (ADR 0024) — the same value each row now displays.
- **Projection page**: Net Worth sums each Account's Projection balance for a given date, scoped to only the Accounts currently checked in the account visibility filter (the same `visibleAccountIds` set that already drives the chart and the Total In/Total Out cards). It is computed once per Scenario group — Baseline, plus one more for each active Scenario — matching the existing Total In/Total Out card pattern exactly, so scenario comparison works the same way for Net Worth as it does for cash flow.
  - A stat card shows current Net Worth and Net Worth at the horizon end, alongside the Total In/Total Out cards.
  - Hovering the chart shows Net Worth for the hovered date as a computed row in the tooltip. This is not a rendered chart line — an aggregate series sharing axes with individual Account balance lines (which can differ by orders of magnitude) would distort the chart's scale.
- A negative total is styled in the same red (`#dc2626`) already used elsewhere on both pages for negative balances.

## Considered Options

- **Sum `displayBalance` instead of raw balance** — rejected; would add Amortizing Account debt as a positive contribution to Net Worth, which is definitionally wrong (a $20,000 car loan should subtract $20,000, not add it).
- **Per-Owner Net Worth breakdown** — rejected; Owner has no other structural meaning in the app (ADR-equivalent: see CONTEXT.md "Owner" — cosmetic only), and a breakdown adds grouping/subtotal UI beyond what was asked for. Can be layered on later if wanted.
- **Render Net Worth as a line on the Projection chart** — rejected; mixes an aggregate series with individual Account series on the same Y-axis, which can compress the visible range for the very balances the chart exists to show. A stat card plus tooltip row gets the same information without the scale problem.
- **Baseline-only Net Worth on the Projection page (ignore active Scenarios)** — rejected; scenario comparison is the reason Scenarios exist, and Total In/Total Out already sets the precedent of one figure per Scenario group.
