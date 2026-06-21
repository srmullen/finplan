Status: closed

# Fix Rate compounding formula

## What to build

The daily compounding step in the Projection engine uses `Math.abs(account.rate)`, which makes the balance grow in magnitude regardless of the rate's sign. For a liability Account (negative balance) with a negative Rate this produces the correct direction by accident, but for an asset Account (positive balance) with a negative Rate — e.g. a savings account with a maintenance fee modelled as a negative Rate — the balance grows instead of shrinking.

Replace `Math.abs(account.rate)` with `account.rate` directly:

```
balance = balance * (1 + account.rate / 365)
```

This is the correct formula: a positive rate grows a positive balance; a negative rate shrinks a positive balance; a negative rate applied to a negative balance makes it more negative (larger debt) because multiplying two negatives yields a positive increment in the negative direction.

Add a test for a positive-balance account with a negative rate to lock in the correct direction and prevent regression.

## Acceptance criteria

- [ ] The compounding multiplier is `(1 + account.rate / 365)` with no `Math.abs`
- [ ] Existing tests for positive-rate growth and negative-rate debt still pass
- [ ] A new test verifies that a positive-balance account with a negative rate shrinks over time
- [ ] Typecheck clean

## Blocked by

None — can start immediately.
