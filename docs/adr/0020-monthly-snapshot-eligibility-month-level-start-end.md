# Monthly Total In/Out snapshot uses month-level start/end comparison, with a firing check only in the ending month

`computeCashFlowTotals` (`src/utils/cashFlow.ts`) gated each Schedule with `isScheduleActive`, which excluded it entirely whenever `schedule.startDate > today` — an exact calendar-day comparison. A Schedule or Payment Group starting later in the *current* month (e.g. the 28th) was excluded from that month's Total In/Out until the day itself arrived, even though it plainly belongs to this month's cash flow. The symmetric case (an `endDate` earlier in the current month) has the same defect in reverse. This produced Total In/Out figures that silently omitted schedules a user had every reason to expect were counted.

`computeHorizonCashFlowTotals` and the Projection engine don't have this problem — they walk real calendar days and call `scheduleFiresOn` (`src/engine/projection.ts`), which is already frequency-aware.

## Decision

Replace the exact-date `isScheduleActive` gate with a month-level check, with a frequency-aware refinement that applies only to the month a Schedule ends in:

- **Started**: a Schedule is eligible once its `startDate` falls on or before the last day of the current month — no exact-day comparison. Every Schedule trivially fires on its own start date regardless of frequency, so this alone is enough to cover the start side; no firing check is needed there.
- **Ongoing, no imminent end**: if the Schedule has no `endDate`, or its `endDate` falls after the current month, it counts in full for the whole month — this is what keeps quarterly/annual Schedules smoothed at a steady monthly rate every month (per Monthly-Equivalent Amount, CONTEXT.md) rather than only in the one month they actually fire.
- **Ending this month**: if `endDate` falls within the current month, the Schedule counts only if `scheduleFiresOn` is true for at least one day between (the later of its `startDate` or the 1st of the month) and its `endDate`. If it has no occurrence left before ending, it's excluded for that final month.

Eligible Schedules count at their full Monthly-Equivalent Amount; ineligible ones contribute $0. There is no proration.

## Considered Options

- **Frequency-aware `scheduleFiresOn` check across every month, unconditionally** — rejected. This was the first design considered, but it breaks the smoothing that quarterly and (especially) annual Schedules depend on: those frequencies only fire in one specific month, so gating every month's eligibility on "did it literally fire this month" would make an annual Schedule show its smoothed amount in 1 out of 12 months and $0 in the other 11 — a regression on already-shipped behavior, not a fix. Weekly/biweekly/semi-monthly/monthly Schedules are structurally safe from this (they always fire at least once in any calendar month), which is what made the flaw easy to miss initially.
- **Compare year-month of `startDate`/`endDate` only, with no firing check anywhere** — rejected for the ending month specifically: a Schedule whose `endDate` falls early in the current month, before its frequency would have produced another occurrence, would still count in full under a pure month-comparison rule, overcounting a month where no transaction actually happened.
- **Prorate the amount by days remaining/elapsed in the month** — rejected; Total In/Out is defined elsewhere as a smoothed monthly-equivalent rate, not an actual dollar total for specific elapsed days. Prorating would make a schedule's contribution inconsistent with every other schedule's (which is always the full smoothed rate), and the app has no other precedent for partial-month figures.
