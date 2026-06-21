Status: closed

# Scenarios

## Parent

`.scratch/finplan-core/PRD.md`

## What to build

Implement Scenarios — named what-if variants of the Baseline that produce their own Projections for side-by-side comparison on the chart.

A Scenario is a diff over the Baseline: it stores only its overrides. Everything not explicitly overridden inherits from the Baseline automatically. This means Baseline changes (e.g., a salary update) propagate to all Scenarios without manual re-sync.

A Scenario override set can include any combination of:
- Override an existing Schedule's amount or termination condition
- Pause an existing Baseline Schedule (exclude it from this Scenario's Projection)
- Add a new Schedule that doesn't exist in the Baseline
- Add a new Account that doesn't exist in the Baseline (with its own seed balance, Rate, and type)

On the Projection chart, the user selects which Scenarios to overlay alongside the Baseline. Scenario lines are visually distinct from the Baseline (e.g., dashed or differently colored). The Account filter applies to all overlaid Scenarios.

## Acceptance criteria

- [ ] User can create a named Scenario
- [ ] A Scenario inherits all Baseline Accounts and Schedules by default
- [ ] User can override an existing Schedule's amount within a Scenario
- [ ] User can pause a Baseline Schedule within a Scenario
- [ ] User can add a new Schedule within a Scenario
- [ ] User can add a new Account within a Scenario
- [ ] Baseline changes automatically propagate to all Scenarios (no manual re-sync required)
- [ ] User can select which Scenarios to overlay on the Projection chart
- [ ] Scenario lines are visually distinct from the Baseline on the chart
- [ ] Account filter on the chart applies across the Baseline and all overlaid Scenarios
- [ ] User can rename or delete a Scenario

## Blocked by

- `issues/04-baseline-projection-chart.md`
