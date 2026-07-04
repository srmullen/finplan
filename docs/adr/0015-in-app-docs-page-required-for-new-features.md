# In-app /docs page for users; documenting new features is a convention, not a CI gate

Today, `CONTEXT.md` and `docs/adr/` are the only documentation this repo produces, and both are explicitly developer/agent-facing — the domain-modeling skill keeps `CONTEXT.md` "devoid of implementation details" as a glossary, and ADRs record architectural decisions. Neither is written for, or shown to, whoever actually uses finplan day to day.

We're adding a `/docs` route (nav label "Docs") as a plain-language user manual, kept separate from `CONTEXT.md`/ADRs rather than folded into them — different audience, different register. It's authored as plain JSX (no markdown dependency, matching the size of the app today), rendered as a single scrollable page with an anchor-linked table of contents built from the start rather than deferred, since the page is expected to grow. At launch it has one section per existing top-level view (Projection, Accounts, Schedules) — this also covers Payment Groups, Scenarios, and Adjustments, since those render inside those views rather than as separate nav items. Each section follows a fixed template: "What it's for" and "How to use it," in plain language, deliberately excluding implementation detail (e.g. storage sign conventions) that belongs in `CONTEXT.md`/ADRs instead.

Going forward, any change that alters what a user can see or do must add or update a `/docs` section — see `docs/agents/feature-docs.md` for the exact rule and template. This is enforced by convention only, not by CI, and `CLAUDE.md` points to the convention file alongside the repo's other agent-skill pointers (issue tracker, triage labels, domain docs).

## Considered Options

**CI-enforced doc-diff check** (e.g. failing a PR if `src/views/` changes without a matching `/docs` change) — rejected. Whether a diff is "user-facing" is a judgment call a heuristic can't reliably make; false positives on refactors/bugfixes would train bypassing the check, undermining trust in CI the way ADR-0009's coverage gate currently doesn't.

**Markdown-authored content with a rendering library** — rejected for now. The page is a handful of sections at launch; adding a markdown dependency and load/parse step is more infrastructure than the current content justifies. Revisit if the page grows enough that editing JSX prose becomes painful.

**Fold this into `CONTEXT.md`/ADRs instead of a new surface** — rejected. Those are intentionally developer-facing and free of implementation detail is the wrong constraint for a user manual; a term can be precisely defined in `CONTEXT.md` and separately explained in plain language in `/docs` without the two duplicating each other.

## Consequences

- The three initial sections (Projection, Accounts, Schedules) still need to be written — that's an implementation task, out of scope for this docs-only session.
- There's no automated backstop: if the convention lapses, nothing fails CI. Revisit as a CI-enforced check only if it proves not to be followed in practice.
- `CLAUDE.md` gains a fourth "Agent skills" bullet, pointing to `docs/agents/feature-docs.md`.
