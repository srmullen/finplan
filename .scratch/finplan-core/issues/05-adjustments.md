Status: ready-for-agent

# Adjustments

## Parent

`.scratch/finplan-core/PRD.md`

## What to build

Allow the user to record an Adjustment for any Account at a specific date: a manually entered real-world balance that anchors the Projection to reality.

An Adjustment has: Account, date, and actual balance. Adjustments are per-Account — the user does not need to update all Accounts simultaneously.

The most recent Adjustment for each Account becomes its seed balance for all Projections from that date forward. If no Adjustment exists, the Account's original seed balance is used.

On the Projection chart, show variance at Adjustment dates: the difference between what was projected for that date and the actual balance recorded. Variance is computed on the fly and not stored.

The user can view a history of Adjustments for any Account.

## Acceptance criteria

- [ ] User can record an Adjustment for a single Account with a date and actual balance
- [ ] Multiple Adjustments can exist for the same Account at different dates
- [ ] The Projection engine uses the most recent Adjustment as the seed for each Account
- [ ] Variance between projected and actual balance is displayed at each Adjustment date on the chart
- [ ] Variance is computed on the fly — not stored
- [ ] User can view a history of Adjustments for any Account
- [ ] User can delete an Adjustment

## Blocked by

- `issues/04-baseline-projection-chart.md`
