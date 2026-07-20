# Schedule Active state is Baseline-only; a Scenario cannot reactivate a Baseline-inactive Schedule

Users need a way to remove a Schedule from all calculations without deleting it. A `paused` override already exists, but only as a per-Scenario diff (`ScheduleOverride.paused`, ADR 0001) — the Baseline Schedule keeps running regardless. There was no way to stop a Schedule at the Baseline level itself.

## Decision

Add `active` directly to Schedule (default `true`). An inactive Schedule is excluded from the Baseline Projection, Total In/Total Out, and Account In/Account Out/Remaining as if it didn't exist — and this exclusion carries into every Scenario built on that Baseline, not just the Baseline itself. The existing Scenario `paused` override is unchanged and still works independently: a Scenario may pause a Schedule that's Active in the Baseline, but cannot override a Baseline-inactive Schedule back to active for that Scenario — reactivating it requires editing the Baseline Schedule directly.

Deactivating is per-Schedule only. A Payment Group (`ScheduleGroup`, ADR 0013) has no group-level action that cascades Active state to its members — pausing a whole group's real-world payment means toggling each member individually, matching how group-member edits already work (ADR 0021).

## Considered Options

- **Let a Scenario override reactivate a Baseline-inactive Schedule** — rejected. It would mean "inactive" no longer reliably removes a Schedule from every calculation, undermining the reason the field exists, and blurs the boundary between Baseline state and Scenario diffs (ADR 0001: Scenarios are diffs over Baseline, not a way to resurrect what Baseline has turned off).
- **Group-level pause action for Payment Groups** — rejected for this pass. Keeps the change minimal and consistent with the existing per-member group-editing model (ADR 0021); can be layered on later if pausing every member individually proves tedious in practice.
