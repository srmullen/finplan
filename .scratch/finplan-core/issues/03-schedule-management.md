Status: closed

# Schedule management

## Parent

`.scratch/finplan-core/PRD.md`

## What to build

Implement full CRUD for Schedules. A Schedule represents a rule that generates one or more Transfers between two nodes (Account or ExternalParty).

A Schedule has: source node, destination node, amount, estimated flag (marks the amount as a best-guess rather than exact), frequency (once, weekly, biweekly, semi-monthly, monthly, quarterly, annually), start date, and an optional termination condition (end date or "stop when destination Account balance reaches zero" — the latter only available when the destination is an amortizing Account).

The Schedule list view shows source → amount → destination for each Schedule, along with frequency and start date.

## Acceptance criteria

- [ ] User can create a Schedule between any two nodes (Account or ExternalParty in either direction)
- [ ] All seven frequencies are available: once, weekly, biweekly, semi-monthly, monthly, quarterly, annually
- [ ] User can mark a Schedule amount as estimated
- [ ] User can set an optional end date on a Schedule
- [ ] When the destination is an amortizing Account, user can choose "terminate when balance reaches zero" as the termination condition
- [ ] User can edit any Schedule field
- [ ] User can delete a Schedule
- [ ] Schedules are displayed in a list showing source, amount, frequency, and destination
- [ ] All data persists across page reloads

## Blocked by

- `issues/02-account-and-external-party-management.md`
