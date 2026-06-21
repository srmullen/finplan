Status: closed

# Account & ExternalParty management

## Parent

`.scratch/finplan-core/PRD.md`

## What to build

Implement full CRUD for Accounts and ExternalParties, persisted to storage and visible in list views.

An Account has: name, type (checking, savings, investment, credit card, loan, etc.), owner (Sean, Wife, Joint), seed balance (with an as-of date), annual Rate (optional, positive for growth / negative for interest charges), and a classification of amortizing or revolving.

An ExternalParty has: name only.

Both are nodes in the money-flow graph and must be selectable as Schedule endpoints in the next issue.

List views should group Accounts by owner and show key properties at a glance (type, balance, rate). ExternalParties appear in a separate flat list.

## Acceptance criteria

- [ ] User can create an Account with all required fields
- [ ] User can set an Account as amortizing or revolving
- [ ] User can set an optional annual Rate on an Account
- [ ] User can edit any Account field
- [ ] User can delete an Account
- [ ] Accounts are displayed in a list grouped by owner
- [ ] User can create an ExternalParty with a name
- [ ] User can edit or delete an ExternalParty
- [ ] ExternalParties are displayed in a flat list
- [ ] All data persists across page reloads

## Blocked by

- `issues/01-scaffold-and-projection-engine.md`
