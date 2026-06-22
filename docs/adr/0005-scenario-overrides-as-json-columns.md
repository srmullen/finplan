# Scenario overrides stored as JSON columns, not normalized tables

A Scenario's `scheduleOverrides` (list of per-Schedule mutations) and `additionalSchedules` / `additionalAccounts` (extra entities added by the Scenario) are stored as JSON blobs in the `scenarios` SQLite table rather than as separate normalized join tables.

Scenarios are always read and written as a whole unit — there is no query pattern that selects individual overrides in isolation. Normalizing them into `scenario_schedule_overrides` and related tables would add join complexity with no practical benefit. SQLite's native JSON support makes the blobs trivially readable from the API layer and from external tools. A future reader might expect normalized tables, but the access pattern here never requires it.

## Considered Options

**Fully normalized**: separate tables for each override type with foreign keys. Maximum SQL queryability, but Scenarios are never queried by their internal structure — the joins would exist only to satisfy a convention.

**JSON columns (chosen)**: `scheduleOverrides`, `additionalSchedules`, and `additionalAccounts` are stored as JSON. A Scenario is fetched in a single `SELECT` and parsed in one shot. Flat entities (Account, Schedule, Adjustment, ExternalParty) use proper columns since they are queried individually.
