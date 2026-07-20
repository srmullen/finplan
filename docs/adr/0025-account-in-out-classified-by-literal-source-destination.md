# Account In/Account Out classified by literal source/destination match, diverging from Total In/Total Out

Total In/Total Out (ADR 0019) classify by node type: a Schedule counts as Out if its destination is an ExternalParty *or* a debt Account, and transfers between two other tracked Accounts count as neither In nor Out. That rule works at the household level but breaks down per-Account — a transfer from Checking to Savings is neutral for the household, but it's plainly an outflow for Checking and an inflow for Savings. Reusing ADR 0019's rule per-Account would hide that movement entirely from both accounts' own figures.

## Decision

Account In/Account Out (CONTEXT.md) classify a Schedule relative to one specific Account only: it counts as Account In if the Account is the destination, Account Out if the Account is the source — regardless of what's on the other end. Node type (ExternalParty, tracked Account, debt Account) plays no role, unlike Total In/Total Out.

A consequence: summing Account In/Account Out across every Account does not reproduce Total In/Total Out whenever a Schedule pays into a debt Account from another tracked Account. That leg nets to zero across the two Accounts (Out for the source, In for the debt Account), but ADR 0019 counts it as Out at the household level regardless of source. This divergence is accepted, not a bug to reconcile — the Accounts page's Total row is a literal sum of the per-Account rows above it, and the Schedules/Projection pages' Total In/Total Out is untouched and computed independently.

## Considered Options

- **Reuse ADR 0019's household classification per Account** (still special-case debt destinations, still treat transfers between two tracked Accounts as neither) — rejected. An Account's own transfer out to another tracked Account would show as neither In nor Out in that Account's row, hiding real money movement from the one place a user would expect to see it.
- **Force the Accounts page Total to always equal Total In/Total Out** — rejected. That would make the Total row not equal the sum of the rows above it, which is a more confusing inconsistency than the divergence it would avoid.
