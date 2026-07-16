# Schedule rows show a colored left-border stripe for their Total In/Out classification

The Schedules table gave no visual indication of which rows counted toward Total In, Total Out, or neither (a transfer between two tracked Accounts) — a user had to mentally re-derive `classifyScheduleDirection` (source/destination node types) for each row to know whether it affected the totals shown directly above the table.

## Decision

Each Schedule row in `SchedulesView` gets a colored left-border stripe (3-4px) reflecting its `classifyScheduleDirection` result, reusing the same colors already used for the Total In/Total Out figures on the same page (`#16a34a` green for "in", `#dc2626` red for "out"). Rows classified as "neither" get no stripe (default row appearance).

This applies only to `SchedulesView` — `ProjectionView` never renders individual Schedule rows, only aggregate totals and Account balances, so there's no row-level surface there to stripe.

**Payment Group rows:** each indented member row gets its own stripe based on its own individual classification (e.g. a mortgage group's principal+interest row and escrow row are each independently "out" under the existing destination-based rule — ADR 0019). The group's header row is not striped, since it's a label rather than a flow itself.

**No legend.** The stripe colors reuse the exact convention already established by the Total In/Total Out cards rendered directly above the table on the same page load, so no additional legend or tooltip is added.

## Considered Options

- **Full-row background tint** — rejected; a wash across the entire row reads as heavier/louder than needed, especially combined with the existing indentation used to show Payment Group membership.
- **Small badge/dot + text label per row** — rejected; adds a new UI element and consumes cell space for information the border stripe conveys just as clearly at a glance.
- **Color the Amount cell text only** — rejected; less scannable at a glance down a long table than a full-height row-edge stripe, and risks being confused with the `estimated` (`~`) annotation already shown next to the amount.
- **Stripe the group header with one summary color, or stripe both header and members** — rejected; Payment Groups have no guarantee their members share one classification (a group could in principle mix an "out" destination with a "neither" one), so a single summary color on the header would be ambiguous or misleading. Striping only the members avoids inventing a synthetic group-level classification.
