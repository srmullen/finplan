# Editing a grouped Schedule in place preserves group membership and locks its source account

`SchedulesView` renders the same per-row "Edit" button for a Payment Group's member Schedules as it does for standalone ones, opening `ScheduleForm`. `ScheduleForm` has no concept of `groupId` — submitting through it silently dropped the member's `groupId`, detaching it from its Payment Group with no warning. The only way to edit a member without losing group membership was to open the group's own editor via its header row, which is not discoverable.

## Decision

Keep the per-row "Edit" button and standalone `ScheduleForm` available for members of a Payment Group (do not force all edits through the group editor). When editing a Schedule that has a `groupId`:

- The save path must carry the existing `groupId` through unchanged — editing a member never detaches it from its group.
- The source account field is treated as fixed/inherited from the group and is not editable from this form (shown read-only or hidden, per implementation). This is a consequence of the Payment Group invariant that all members share one source account (ADR 0013); the standalone `PUT /api/schedules/:id` route has no cross-member validation to catch a source change that would silently violate that invariant for the rest of the group.

## Considered Options

- **Redirect "Edit" on a member row to the parent group's editor** — rejected; the common case is tweaking a single member's amount or date, and forcing the full group form open for that is heavier than needed.
- **Allow the source field to be edited standalone, re-validating the shared-source invariant across all members on save** — rejected; would require the single-Schedule update endpoint to know about and rewrite sibling rows, turning a single-record update into a cross-entity write. Locking the field is simpler and keeps `PUT /api/schedules/:id` a single-record operation.
