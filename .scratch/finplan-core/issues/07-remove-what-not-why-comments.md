Status: closed

# Remove what-not-why comments

## What to build

Strip comments that describe *what* the code does rather than *why* it must work that way:

- `projection.ts`: remove section-divider banners (`// --- Date utilities ---`, `// --- Schedule firing ---`, etc.) and inline step labels (`// Running balances`, `// Step 1 & 2:`, `// Step 3: transfers`, `// Record`)
- `projection.test.ts`: remove pre-`it()` prose comments that restate the test name verbatim (e.g. the biweekly/semi-monthly/weekly count explanations above each test)
- `ProjectionView.tsx`: the three `// eslint-disable-next-line react-hooks/exhaustive-deps` suppressions currently have no explanation; add a one-line comment on each explaining *why* the dep is intentionally omitted (stale-closure risk from object-literal recreation on every render)

Two comments in `projection.ts` are justified and must be kept: the `Date.UTC(year, month, 0)` last-day-of-month trick, and the negative-rate compounding direction note.

## Acceptance criteria

- [ ] No section-divider or step-label comments remain in `projection.ts`
- [ ] No pre-test prose comments in `projection.test.ts` that duplicate the `it()` description
- [ ] Each `eslint-disable` suppression in `ProjectionView.tsx` has a one-line WHY explanation
- [ ] The two justified comments in `projection.ts` are preserved
- [ ] All tests still pass; typecheck clean

## Blocked by

None — can start immediately.
