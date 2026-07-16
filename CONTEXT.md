# finplan

A personal financial planning tool for manually tracking account relationships and simulating account balances over time.

## Language

### Nodes

**Account**:
A financial account whose balance the user owns and tracks over time. May hold a positive balance (asset) or negative balance (liability).
_Avoid_: Wallet, fund, pot

**ExternalParty**:
A named endpoint in the money-flow graph with no tracked balance. Represents the outside world — employers, lenders with no tracked payoff, utilities, etc.
_Avoid_: Source, sink, counterparty, payee

### Account properties

**Owner**:
A free-text label on an Account identifying who it belongs to within the household (e.g., Sean, Wife, Joint). Cosmetic grouping only — no access control. Not a first-class entity — stored as a plain string on Account.
_Avoid_: User, member, person

**Institution**:
An optional free-text label on an Account naming the bank or provider that holds it (e.g., Chase, Fidelity, Navy Federal). Cosmetic only — used for display and filtering, not for logic.
_Avoid_: Bank, provider, issuer

**Rate**:
An annual percentage applied to an Account's balance each period by the Projection engine. Positive for growth (savings, investments); negative for interest charges (credit card debt). Separate from Schedules — Rate is balance-driven, Schedules are fixed-amount flows.
_Avoid_: Interest rate, APY, return, yield

**Amortizing Account**:
A liability Account stored with a negative seed balance that approaches zero as payments are applied, closing when it reaches zero (e.g., car loan, mortgage). Payments to it automatically terminate at payoff. The user enters the amount owed as a positive number; the system stores it as negative. Balances are displayed to the user as positive and declining (the UI negates the stored value at render time); the engine and API always return the raw negative value.
_Avoid_: Term loan, closed-end account

**Revolving Account**:
An Account whose balance fluctuates indefinitely with no natural termination (e.g., credit card, checking account).
_Avoid_: Open-end account

### Edges

**Payment Group**:
A named collection of Schedules that together represent a single real-world payment outflow from one source account. Used when a payment fans out to multiple destinations (e.g., a mortgage payment split between the loan account and an escrow servicer). All member Schedules must share the same source account. Displayed in the UI as a group header followed by its member Schedules. Deleting a Payment Group deletes all its members. Editing a member Schedule individually preserves its group membership and treats its source account as fixed/inherited from the group, rather than detaching it (see ADR 0021). Called `ScheduleGroup` in code.
_Avoid_: Split payment, compound schedule, payment bundle

**Transfer**:
A single movement of money from one node to another at a specific point in time. The atomic unit of money flow — one event, two balance changes.
_Avoid_: Transaction, payment, movement

**Schedule**:
A rule that generates one or more Transfers between two nodes. Defined by an amount, frequency, source node, destination node, start date, and an optional termination condition (end date or balance threshold). Covers both recurring flows and planned one-time events. Supported frequencies: once, weekly, biweekly, semi-monthly, monthly, quarterly, annually.
_Avoid_: RecurringTransfer, recurring payment, rule

### Cash flow

**Total In**:
The sum of Schedule amounts whose source is an ExternalParty — money entering the household's tracked Accounts from outside. Each Schedule contributes its full monthly-equivalent amount (see Monthly-Equivalent Amount) for the current calendar month if it fires at least once during that month, or $0 otherwise — never a prorated partial amount.
_Avoid_: Income, inflow

**Total Out**:
The sum of Schedule amounts whose destination is an ExternalParty, or whose destination Account is a loan or credit_card Account — regardless of the source. Money moving between two other Accounts counts as neither Total In nor Total Out. Eligibility for the current month follows the same fires-at-least-once rule as Total In (see ADR 0020).
_Avoid_: Expenses, outflow, spending

**Monthly-Equivalent Amount**:
A Schedule's amount normalized to a smoothed monthly rate for display in Total In/Total Out (e.g., a weekly Schedule's amount × 52/12). Used only for the current-month snapshot totals, not for Projections or the cumulative horizon total, both of which replay actual per-occurrence Transfers instead.
_Avoid_: Monthly average, run rate

### Simulation

**Baseline**:
The authoritative state of the household's finances as modeled in finplan — real Accounts, real Schedules, real seed balances. The default against which all Scenarios are compared.
_Avoid_: Default, current state, actuals

**Scenario**:
A named set of overrides applied on top of the Baseline Schedules and Accounts, producing its own Projection for side-by-side comparison. Scenarios do not modify the Baseline.
_Avoid_: What-if, simulation variant, plan

**Projection**:
The output of a simulation: a time series of Account balances from a start date to a horizon date, generated by replaying all active Schedules and Rates forward. The default horizon is 12 months; the user may configure it.
_Avoid_: Forecast, simulation output, plan

**Adjustment**:
A manually recorded real-world balance for a single Account at a specific date. Used to anchor future Projections to reality and to compute variance against what was projected. Adjustments are per-Account and do not require all accounts to be updated simultaneously.
_Avoid_: Snapshot, checkpoint, reconciliation
