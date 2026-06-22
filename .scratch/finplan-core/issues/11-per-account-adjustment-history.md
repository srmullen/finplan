Status: closed

# Per-account adjustment history

## Parent

`.scratch/finplan-core/issues/05-adjustments.md`

## What to build

The AdjustmentPanel currently shows all Adjustments in a single flat table sorted by date. Issue 05 requires that the user can view a history of Adjustments for any specific Account.

Add an Account selector to the AdjustmentPanel that filters the table to show only Adjustments for the selected Account. When an Account is selected, the table shows only that Account's rows (date, actual balance, projected balance, variance) in reverse-chronological order. A "Show all" option or clearing the selector restores the full table.

The new Account selector is distinct from the "Record adjustment" form — it controls the history view only, not which account the next Adjustment will be recorded for.

## Acceptance criteria

- [ ] AdjustmentPanel has an Account selector that filters the history table to a single Account
- [ ] Selecting an Account shows only that Account's Adjustments, in reverse-chronological order
- [ ] A "Show all" state (no Account selected) restores the full table — existing behaviour preserved
- [ ] The record-adjustment form is unaffected by the history filter
- [ ] Variance column continues to display correctly for filtered rows

## Blocked by

None — can start immediately.
