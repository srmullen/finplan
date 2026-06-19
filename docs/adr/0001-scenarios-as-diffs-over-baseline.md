# Scenarios are diffs over the Baseline, not independent copies

A Scenario stores only the overrides it introduces — a changed Schedule amount, a paused Schedule, an added Transfer — rather than copying all Baseline data. Everything not explicitly overridden inherits from the Baseline automatically, so changes to the Baseline (e.g., a salary update) propagate to all Scenarios without manual re-sync.

## Considered Options

**Full copy**: each Scenario is a complete independent clone of all Accounts and Schedules. Simpler to reason about in isolation, but Baseline changes do not propagate — every Scenario would drift from reality and require manual updates whenever the Baseline changes.

**Diff/override (chosen)**: a Scenario is a named set of overrides. A future reader might expect a Scenario to be self-contained, but the propagation behavior is the point — Scenarios are "what if I changed X," not "what if I lived in a parallel universe."
