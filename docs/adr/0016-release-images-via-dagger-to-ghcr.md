# Release images built via Dagger from Dockerfile, published to GHCR

A new `publish` Dagger function builds the app image from the existing `Dockerfile` (which needs updating separately to reflect the now-node/npm-based build, not bun) and pushes multi-platform (`linux/amd64`, `linux/arm64`) images to `ghcr.io/srmullen/finplan` as a private package, tagged with the release version and `latest`. A new `.github/workflows/release.yml` triggers on `release: [published]` (not `created`, so drafts never build), calling `dagger call publish` and authenticating to GHCR with the built-in `GITHUB_TOKEN` (`packages: write`) — no separate PAT. The release job does not re-run typecheck/test; it trusts the tagged commit already passed the required `ci` job before merging to `main`.

## Considered Options

- **Native Dagger container build (no Dockerfile)** — rejected; the Dockerfile is already the multi-stage build definition and should stay the single source of truth for how the app is packaged, rather than duplicating that logic in the Dagger TypeScript pipeline.
- **Docker Hub** — rejected in favor of GHCR, which needs no separate account or secret since `GITHUB_TOKEN` already authenticates against packages in this repo.
- **Public package** — rejected; despite the image holding no user data (that lives in a separate SQLite volume), the package stays private to avoid exposing the build/dependency footprint of a personal financial tool. Pulling onto a self-hosted target (e.g. Raspberry Pi) requires a one-time `docker login ghcr.io` with a `read:packages` token.
- **`linux/amd64` only** — rejected; the app may be deployed to a Raspberry Pi, so `arm64` support is needed from the start rather than bolted on later.
- **Separate `build` and `publish` Dagger functions** — rejected as an unneeded seam; nothing else consumes a built-but-unpushed image.
- **Re-running typecheck/test in the release job** — rejected as redundant; releases are always cut from an already-CI'd `main` commit.
