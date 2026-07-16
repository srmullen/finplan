# Monthly Total In/Out snapshot uses "fires this month," not an exact-date comparison

`computeCashFlowTotals` (`src/utils/cashFlow.ts`) gated each Schedule with `isScheduleActive`, which excluded it entirely whenever `schedule.startDate > today` — an exact calendar-day comparison. A Schedule or Payment Group starting later in the *current* month (e.g. the 28th) was excluded from that month's Total In/Out until the day itself arrived, even though it plainly belongs to this month's cash flow. The symmetric case (an `endDate` earlier in the current month) has the same defect in reverse. This produced Total In/Out figures that silently omitted schedules a user had every reason to expect were counted.

`computeHorizonCashFlowTotals` and the Projection engine don't have this problem — they walk real calendar days and call `scheduleFiresOn` (`src/engine/projection.ts`), which is already frequency-aware.

## Decision

Replace the exact-date `isScheduleActive` gate with a frequency-aware eligibility check, reusing `scheduleFiresOn`: a Schedule counts toward the current month's snapshot — at its full Monthly-Equivalent Amount (see CONTEXT.md) — if and only if `scheduleFiresOn` returns true for at least one day between the 1st and last day of the current calendar month. If it has zero occurrences within the current month (e.g. a biweekly Schedule whose next firing falls in the following month), it's excluded entirely. There is no proration for partial-month start/end.

## Considered Options

- **Compare year-month of `startDate`/`endDate` only** (no frequency check) — rejected; doesn't correctly exclude a Schedule whose frequency means it has no actual occurrence this month (e.g. a biweekly Schedule that last fired late last month and won't fire again until next month, despite `startDate` nominally falling in a prior month).
- **Prorate the amount by days remaining/elapsed in the month** — rejected; Total In/Out is defined elsewhere as a smoothed monthly-equivalent rate, not an actual dollar total for specific elapsed days. Prorating would make a schedule's contribution inconsistent with every other schedule's (which is always the full smoothed rate), and the app has no other precedent for partial-month figures.
