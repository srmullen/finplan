Status: ready-for-agent

# finplan — Core Application

## Problem Statement

Managing household finances requires understanding how money flows between accounts over time, but existing tools don't let users model the relationships between accounts or project future balances. There's no way to ask "what happens to our savings if we add $200/month toward the car loan?" or to compare the projected state of our finances against what actually happened six months later.

## Solution

finplan is a single-user household web app that models finances as a flow graph — Accounts and ExternalParties as nodes, Schedules as edges — and generates Projections showing how Account balances evolve over time. Users can create named Scenarios as what-if variants of the Baseline and compare them side-by-side in a Projection chart. Adjustments let users record actual balances at any point in time, anchoring future Projections to reality and surfacing variance against what was predicted.

## User Stories

### Accounts

1. As a household member, I want to create an Account with a name, type (checking, savings, investment, credit card, loan, etc.), owner (Sean, Wife, or Joint), and opening balance, so that I can model all the financial accounts in my household.
2. As a household member, I want to mark an Account as amortizing or revolving, so that the Projection engine knows whether to terminate Schedules flowing to it when its balance reaches zero.
3. As a household member, I want to set an annual Rate on an Account, so that I can model investment growth (e.g., 8% IRA return) or credit card interest charges.
4. As a household member, I want to edit an Account's name, owner, rate, or type, so that I can keep the model accurate as my situation changes.
5. As a household member, I want to delete an Account, so that I can remove accounts that are no longer relevant.
6. As a household member, I want to view a list of all Accounts grouped by owner, so that I can quickly see the household's financial inventory.

### ExternalParties

7. As a household member, I want to create an ExternalParty with a name (e.g., "Employer", "Electric Company"), so that I can model sources and sinks of money that don't have a tracked balance.
8. As a household member, I want to edit or delete an ExternalParty, so that I can keep the list of external endpoints accurate.
9. As a household member, I want to view a list of all ExternalParties, so that I can see all external money sources and destinations.

### Schedules

10. As a household member, I want to create a Schedule between any two nodes (Account or ExternalParty) with an amount, frequency, and start date, so that I can model recurring money flows like paychecks, bill payments, and savings transfers.
11. As a household member, I want to choose from the following frequencies when creating a Schedule: once, weekly, biweekly, semi-monthly, monthly, quarterly, annually, so that my real-world payment cadences are accurately represented.
12. As a household member, I want to mark a Schedule's amount as estimated (rather than exact), so that I can model variable expenses like utility bills with a best-guess amount.
13. As a household member, I want to set an optional end date on a Schedule, so that I can model payments that stop on a known date.
14. As a household member, I want Schedules flowing into an amortizing Account to automatically terminate in the Projection when that Account's balance reaches zero, so that I can see when a loan is paid off without entering an end date.
15. As a household member, I want to create a one-time Schedule (frequency: once) for a specific future date, so that I can model planned one-time events like a down payment or a tax refund.
16. As a household member, I want to edit a Schedule's amount, frequency, or termination condition, so that I can keep the model current when my financial situation changes.
17. As a household member, I want to delete a Schedule, so that I can remove flows that no longer exist.
18. As a household member, I want to view a list of all Schedules showing source, amount, frequency, and destination, so that I can see the full picture of money moving through my household.

### Baseline & Projection

19. As a household member, I want to view a Projection chart showing each Account's balance over time, so that I can see where my finances are headed.
20. As a household member, I want to set a Projection horizon (defaulting to 12 months), so that I can zoom in on near-term cash flow or zoom out to see long-term trends like loan payoffs and investment growth.
21. As a household member, I want to filter the Projection chart to show only selected Accounts, so that I can focus on the accounts I care about without visual clutter.
22. As a household member, I want to see the Projection engine apply Account Rates as compounding growth each period alongside Transfers from Schedules, so that my investment and savings accounts project realistically.
23. As a household member, I want to see a visual indicator on the Projection chart when an amortizing Account reaches zero (loan paid off), so that I can quickly identify payoff milestones.
24. As a household member, I want to see a visual indicator when an Account balance is projected to go negative, so that I can anticipate and prevent cash flow problems.

### Adjustments

25. As a household member, I want to record an Adjustment for a single Account at a specific date with the actual real-world balance, so that I can anchor the Projection to reality.
26. As a household member, I want Adjustments to serve as the new seed balance for that Account in future Projections from that date forward, so that my projections stay grounded in actuals over time.
27. As a household member, I want to see the variance between the projected balance and the actual balance at the time of an Adjustment, so that I can understand how well my model tracks reality.
28. As a household member, I want to record Adjustments for some Accounts without requiring all Accounts to be updated simultaneously, so that I can update what I have available without a full reconciliation.
29. As a household member, I want to view a history of Adjustments for any Account, so that I can see how its actual balance has tracked against projections over time.

### Scenarios

30. As a household member, I want to create a named Scenario, so that I can model a what-if variant of my finances (e.g., "buy new house", "pay off car early").
31. As a household member, I want a Scenario to inherit all Baseline Accounts and Schedules automatically, so that I only need to specify what's different — not rebuild the full picture.
32. As a household member, I want to override a Schedule's amount within a Scenario without modifying the Baseline, so that I can model changes like increasing a monthly savings transfer.
33. As a household member, I want to add a new Schedule within a Scenario that doesn't exist in the Baseline, so that I can model a new financial commitment like a mortgage or college fund contribution.
34. As a household member, I want to add a new Account within a Scenario, so that I can model a new account that doesn't yet exist (e.g., a 529 savings account, an escrow account).
35. As a household member, I want to pause a Baseline Schedule within a Scenario, so that I can model what happens if I stop a recurring payment.
36. As a household member, I want to overlay one or more Scenarios on the Projection chart alongside the Baseline, so that I can visually compare the financial outcomes of different decisions.
37. As a household member, I want Scenario overlays on the Projection chart to be visually distinct from the Baseline (e.g., dashed lines or different colors), so that I can clearly tell them apart.
38. As a household member, I want to select which Scenarios to overlay on the Projection chart, so that I can compare specific what-ifs without visual clutter.
39. As a household member, I want changes to the Baseline (e.g., a salary increase) to automatically propagate to all Scenarios, so that Scenarios stay accurate without manual re-sync.
40. As a household member, I want to rename or delete a Scenario, so that I can keep my what-if list organized.

## Implementation Decisions

- **finplan is a web app** (ADR-0002). No mobile or desktop targets initially.
- **Scenarios are diffs over the Baseline, not full copies** (ADR-0001). A Scenario stores only its overrides; everything else inherits from the Baseline automatically.
- **Rate is a property of an Account, not a Schedule** (ADR-0003). The Projection engine compounds Rate against the Account's current balance each period, separate from fixed-amount Schedule Transfers.
- **The Projection engine is a pure function**: inputs are Accounts (with seed balances and Rates), Schedules, a Scenario override set (if any), and a date range. Output is a time series of per-Account balances. No side effects, no I/O.
- **Amortizing accounts terminate Schedules at zero**: the engine stops applying Transfers to an amortizing Account once its balance reaches zero in a given projection run.
- **Adjustments reseed per-Account**: when the engine runs a Projection, it uses the most recent Adjustment for each Account (or the original seed balance if none) as the starting point.
- **Schedule amounts are fixed or estimated**: both are stored as a single number. Estimated Schedules are flagged so the UI can indicate the amount is approximate.
- **All data is entered manually**: no external bank connections, no import/export initially.
- **The Projection chart is the hero view**: Account list and Schedule list are management views; the chart is the default landing screen.
- **Chart filtering**: the Baseline is always visible; the user selects which Accounts and which Scenarios to overlay.
- **Default Projection horizon**: 12 months, user-configurable.

## Testing Decisions

The Projection engine is the primary testing target. It is a pure function with clear inputs and outputs and no UI or storage dependencies — it is the highest-value seam in the codebase and the place where bugs are most costly.

A good test for the Projection engine:
- Tests external behavior (the output time series) not internal implementation details (how the engine iterates)
- Provides a minimal set of Accounts and Schedules, runs the engine, and asserts on resulting balances at key dates
- Does not mock anything — the engine has no dependencies to mock

Key scenarios to test:
- A single Account with a recurring Schedule produces the correct balance series
- A Rate compounds correctly over multiple periods
- An amortizing Account's balance terminates at zero and its inbound Schedules stop
- A Scenario override produces a divergent balance series from the Baseline
- A one-time Schedule (frequency: once) fires exactly once at the correct date
- An Adjustment reseeds the balance at the correct date

## Out of Scope

- External bank connections or transaction import
- Mobile or desktop app
- Goal-seeking ("what monthly savings amount gets me to $50k by date X?") — future enhancement
- Visual graph view of the money-flow network — future enhancement
- Multi-user access or authentication — finplan is a single-user household app
- Full loan amortization tables (principal/interest breakdown) — the engine models loan payoff by running the Projection to zero, not by computing an amortization schedule
- Variance annotation (recording why an Adjustment differs from the Projection) — variance is computed on the fly, not stored

## Further Notes

- The Projection engine should be designed to be runnable independently of the UI and storage layers, to keep it testable and portable.
- "Biweekly" (every two weeks, 26 times/year) and "semi-monthly" (twice a month on fixed dates, 24 times/year) are distinct frequencies and must be handled separately — they produce different cash flow patterns, especially in months with three biweekly occurrences.
- A future goal-seeking feature (ADR candidate when built) would work by inverting the Projection engine: given a target balance at a horizon date, compute the Schedule amount required to reach it.
