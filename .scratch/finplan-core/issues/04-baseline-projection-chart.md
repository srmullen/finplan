Status: ready-for-agent

# Baseline Projection chart

## Parent

`.scratch/finplan-core/PRD.md`

## What to build

Connect real persisted data (Accounts and Schedules) to the Projection engine and render the results as the hero chart view.

The chart displays a time series of Account balances from today to a configurable horizon date (default: 12 months from today). The user can filter which Accounts appear on the chart. Each Account is a distinct line.

The chart should surface two notable events visually:
- When an amortizing Account's balance reaches zero (loan paid off)
- When any Account balance is projected to go negative (potential overdraft)

The Projection starts each Account from its most recent seed balance (actual Adjustment if one exists, otherwise the seed balance set on the Account).

## Acceptance criteria

- [ ] The Projection chart is the default landing screen
- [ ] Chart renders balance curves for all Accounts over the configured horizon
- [ ] Horizon defaults to 12 months and is user-configurable
- [ ] User can filter which Accounts appear on the chart
- [ ] Account Rates are applied as compounding growth each period
- [ ] Amortizing Account payoff is visually indicated on the chart
- [ ] Projected negative balance is visually indicated on the chart
- [ ] Chart updates in response to Account or Schedule changes

## Blocked by

- `issues/01-scaffold-and-projection-engine.md`
- `issues/03-schedule-management.md`
