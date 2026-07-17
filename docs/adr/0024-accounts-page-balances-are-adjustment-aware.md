# Accounts page balances use the latest Adjustment, not always seedBalance

The Accounts page has always displayed each Account's raw `seedBalance`, regardless of any Adjustment recorded since. The Projection engine (`project()` in `src/engine/projection.ts`) already anchors its starting balance to the latest Adjustment with `date <= startDate`, falling back to `seedBalance` only when no such Adjustment exists — but this logic lived entirely inside the engine and never reached the Accounts page. Introducing a Net Worth total (ADR 0023) on the Accounts page made this gap concrete: summing raw `seedBalance` across Accounts would produce a Net Worth figure more accurate than the individual balance rows sitting directly beside it whenever an Adjustment existed, since the total would need Adjustment data the rows themselves weren't using.

## Decision

The Accounts page becomes Adjustment-aware for every balance it shows, not just the new Net Worth total. Each Account's displayed balance is its latest Adjustment with `date <= today` if one exists, otherwise `seedBalance` — the same rule the Projection engine already applies at `startDate`, applied here with `startDate` = today. This requires no new API endpoint: `/api/adjustments` already returns the full list (same shape `useAdjustments` already fetches for `AdjustmentPanel`), so the Accounts page can compute this client-side.

The "As of" column follows the same source: it shows the Adjustment's date when an Adjustment is used for that row, and `seedDate` otherwise. Showing `seedDate` next to an Adjustment-sourced balance would misstate which date the balance actually reflects.

## Considered Options

- **Adjustment-aware Net Worth total only; leave per-row balances on `seedBalance`** — rejected; would make the Net Worth total more accurate than the individual rows it's computed from, on the same page, at the same time — an internal inconsistency a user would have no way to explain without reading source.
- **Leave "As of" always showing `seedDate`** — rejected; once the balance itself can come from an Adjustment, `seedDate` no longer describes what date that balance is "as of" for every row, and the column exists specifically to answer that question.
- **Fetch Adjustments via a new dedicated endpoint scoped to "latest per account"** — rejected; `/api/adjustments` already returns everything needed, and `useAdjustments` already exists as a hook fetching that shape. Reusing it keeps this a frontend-only change.
