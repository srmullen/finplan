# Owner is a plain string, not a first-class entity

`Owner` is stored as a free-text string on `Account` rather than as a separate DB entity. The form suggests currently-used values via a datalist, but there is no owners table and no CRUD for owners.

`ExternalParty` is a first-class entity because Schedules reference it by ID and it participates in the projection graph. `Owner` has no such role — it is cosmetic grouping only, with no downstream logic. Making it an entity would add schema complexity (a join table or FK, migration cost to rename across accounts) with no functional benefit. If cross-account rename ever becomes necessary, a single `UPDATE accounts SET owner = $new WHERE owner = $old` is sufficient.
