# Amortizing account balances are negated in the UI, not in the engine or API

The engine stores amortizing account balances as negative numbers (e.g., -$20,000) and the API returns them that way. Users, however, think of a loan balance as a positive number that decreases toward zero as they pay it off. We chose to negate at the UI render boundary — chart data, balance displays, and adjustment entry/display — rather than changing storage or the API response.

## Considered Options

- **Flip storage to positive** — rejected because the engine relies on negative balances to know when to terminate schedules (`terminateAtZero` stops when balance reaches 0 from below); flipping storage would require inverting that logic throughout.
- **Flip the API response** — rejected because it would create a mismatch between stored values and what the API returns, making server-side logic harder to reason about and requiring the server to know which accounts are amortizing at serialization time.
- **Negate in the UI** — chosen. The engine and API are unambiguous (negative = liability, approaches zero = payoff). The UI applies a single `displayBalance` transformation at every render site, and adjustment entry negates user input before storing.

## Consequences

Variance for amortizing accounts inverts in sign: "you owe less than projected" is a positive variance (green), matching user intuition. The milestone detection for payoff (`findCrossings(series, 0, "up")`) continues to operate on raw engine data and requires no change.
