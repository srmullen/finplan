Status: closed

# Fix pre-startDate adjustment reseeding in Projection engine

## What to build

The Projection engine initialises every Account from its `seedBalance` and only applies an Adjustment when the loop day exactly matches `adj.date`. If an Adjustment exists for a date *before* the projection's `startDate` — the common real-world case, since the user projects forward from today while their last Adjustment may be days or weeks old — it is silently ignored and the stale seed balance is used instead.

Fix the engine so that before the daily loop begins, each Account's starting balance is set to the `actualBalance` of its most recent Adjustment whose date is ≤ `startDate` (falling back to `seedBalance` if none exists). Adjustments whose date falls *within* the projection range continue to work as they do today (hard-reseed on the matching day).

Add a test for this case: an Adjustment dated before `startDate` should produce a starting balance equal to `actualBalance`, not `seedBalance`, and subsequent Schedules should compound from that corrected starting point.

## Acceptance criteria

- [ ] When the most recent Adjustment for an Account predates `startDate`, the engine uses `actualBalance` as the Account's opening balance
- [ ] When no Adjustment predates `startDate`, the engine falls back to `seedBalance` (existing behaviour preserved)
- [ ] In-range Adjustments (date within the projection window) continue to hard-reseed on their date as before
- [ ] A new test covers the pre-`startDate` Adjustment case
- [ ] All existing tests continue to pass; typecheck clean

## Blocked by

None — can start immediately.
