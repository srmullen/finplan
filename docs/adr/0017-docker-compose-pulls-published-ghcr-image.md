# docker-compose pulls the published GHCR image instead of building locally

`docker-compose.yml` now references `image: ghcr.io/srmullen/finplan:latest` with no `build:` section, replacing the previous `build: .`. This makes compose consume the same artifact produced by the `publish` Dagger function (ADR 0016), so a deploy host — including a Raspberry Pi — only needs Docker, not the Node/npm toolchain, and never runs a build itself. Since the package is private, a one-time `docker login ghcr.io` with a `read:packages` token is required on each new host, as already noted in ADR 0016.

## Considered Options

- **Keep `build: .`** — rejected; requires the full Node toolchain and repo source on every deploy target, duplicating what the `publish` pipeline already produces, and drifts from "build once, deploy everywhere."
- **Pin to a specific release tag** (e.g. `:v0.3.0`) — rejected for now; adds reproducibility but requires editing the compose file to upgrade. `:latest` is simpler for a single self-managed deployment; revisit if rollback/pinning becomes necessary.
- **Parameterize the tag via an env var** (`${FINPLAN_VERSION:-latest}`) — rejected as unneeded complexity while only `latest` is ever used in practice.

## Consequences

Added `restart: unless-stopped` (survive host reboot/crash without fighting a deliberate stop) and a `healthcheck` against the existing unauthenticated `/api/health` endpoint using `wget` (the `node:22-alpine` base image has no `curl`).
