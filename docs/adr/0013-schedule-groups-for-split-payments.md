# ADR-0013: Schedule Groups for Split Payments

## Status
Accepted

## Context

Some real-world payments consist of multiple components that flow to different destinations, but leave the source account as a single transaction. A mortgage payment is the canonical example: the total outflow from checking includes a principal+interest portion (which reduces the amortizing loan balance) and an escrow portion (which is held by the servicer for property taxes, insurance, etc. and does not reduce the loan balance).

Before this decision, finplan had no way to model this. A user setting the mortgage Schedule amount to the full payment would cause the amortizing account balance to decline faster than reality — the escrow portion was being incorrectly applied to the loan principal.

Two Schedule records (one for P+I, one for escrow) would produce accurate projections but would appear as two separate outflows from the checking account, misrepresenting a single bank transaction.

## Decision

We introduce `ScheduleGroup` as a general-purpose grouping concept for Schedules that together constitute one logical payment.

**Data model:**
- New entity: `ScheduleGroup { id: string; name: string }`
- `Schedule` gains an optional `groupId?: string` field
- All Schedules within a group must share the same source account (enforced by the API)
- Deleting a `ScheduleGroup` cascades to delete all its member Schedules

**Scenarios:**
- No new Scenario override types are introduced
- `additionalSchedules` in a Scenario can include Schedules with a `groupId` pointing to an existing group, naturally extending that group within the Scenario
- Individual member Schedules remain overridable via existing `scheduleOverrides`

**UI:**
- A dedicated "Add Payment Group" entry point sits alongside "Add Schedule"
- The creation flow: name the group → define member Schedules (all sharing one source account) → save atomically
- In the Schedules list, groups render as a named header row followed by indented member Schedule rows (always visible, no collapse/expand)
- The group is identified to the user as a **Payment Group**

## Consequences

- Mortgage and similar payments can be modeled with accurate loan balance projections and accurate cash-flow representation simultaneously
- The pattern generalises to any split-payment scenario (e.g., gross pay with withholdings, bundled insurance riders)
- `Schedule` and `ScheduleGroup` must be stored and fetched together; callers that list Schedules should also receive group membership info
- The source-account constraint means mixed-source groups are not supported — each logical payment must originate from a single account
