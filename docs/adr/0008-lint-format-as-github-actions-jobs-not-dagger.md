# Lint and format checks run as GitHub Actions jobs, not inside Dagger

The rest of CI runs inside a Dagger pipeline (`dagger call ci`), but lint and format checks run as a separate, parallel GitHub Actions job using `oven-sh/setup-bun` directly. Lint and format are stateless, sub-second checks with no build artifacts or caching needs — wrapping them in Dagger adds startup overhead without benefit. Running them as a plain Actions job keeps the Dagger pipeline focused on the steps that actually need its container model (typecheck, test, build), and means formatting mistakes fail the PR in seconds rather than waiting for the full pipeline.

## Considered Options

- **Extend the Dagger `ci` function** — consistent tooling boundary, everything in one place, but sequential execution means lint waits behind tests and build.
- **Separate GitHub Actions job (chosen)** — parallel execution, faster feedback, no Dagger overhead for a check that needs none of it.
