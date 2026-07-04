# Feature Docs

New features that change what a user can see or do must add or update a section on the in-app `/docs` page (the "Docs" nav link), a plain-language user manual for whoever uses finplan day to day. See ADR-0015 for why this exists as a convention rather than a CI gate.

## What counts as a new feature

Requires a `/docs` update:

- A new view or route
- A new field, button, or action visible in an existing view
- A new domain concept surfaced in the UI

Does not require a `/docs` update:

- Refactors, or bug fixes that restore already-documented behavior
- Internal API/schema/server-only changes with no visible effect
- Test, lint, CI, or tooling changes

## Section format

Each feature gets one `<h2>` section, added to both the page body and the table-of-contents at the top, following this template:

- **What it's for** — one short paragraph, plain language, describing the purpose
- **How to use it** — one short paragraph describing the user-facing steps

Write for the person using the app, not the person building it. Skip implementation detail (storage conventions, schema, internal naming) that doesn't affect how the feature is used — that belongs in `CONTEXT.md` or `docs/adr/`, not here.

## Relationship to CONTEXT.md and ADRs

`/docs` is a separate surface from `CONTEXT.md` and `docs/adr/`. Those stay developer/agent-facing (domain glossary and architectural decisions); `/docs` is user-facing. A term can be precisely defined in `CONTEXT.md` and separately explained in plain language in `/docs` — don't conflate the two or duplicate content between them.

This is a convention, not a CI-enforced gate. No automated check fails a PR for skipping it.
