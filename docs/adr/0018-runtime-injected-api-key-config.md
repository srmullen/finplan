# Frontend reads its API key from a runtime-injected config, not a Vite build-time env var

`src/api/client.ts` previously read `FINPLAN_API_KEY` via `import.meta.env.VITE_API_KEY`, which Vite inlines into the static bundle at `npm run build` time. `.dockerignore` excludes `.env` from the Docker build context, and the Dagger `publish` pipeline (ADR 0016) never passed it as a build arg either — so every image built by that pipeline baked in an empty key, and the deployed frontend's `Authorization` header could never match the server's runtime `FINPLAN_API_KEY`. Every API request against a published image 401'd. This was undiscovered because local development always runs `vite dev`, which reads `.env` directly and never exercises the built/served path.

Fixed by having the server (`server/index.ts`, the `GET *` static handler) template `<script>window.__FINPLAN_CONFIG__={"apiKey":"..."}</script>` into `index.html` at request time, using the same `FINPLAN_API_KEY` it already validates requests against. `client.ts` now reads `window.__FINPLAN_CONFIG__?.apiKey`, falling back to `import.meta.env.VITE_API_KEY` so `vite dev` is unaffected.

This key is not a secret hidden from the browser's own user — it must be readable by client-side JS to be sent back on every request, exactly as it was when (intended to be) baked into the JS bundle. It functions as a shared-secret front-door lock (deterring crawlers/opportunistic scanners), not real authentication; the actual security boundary for this app is network exposure (LAN/VPN/reverse proxy), which this change doesn't affect.

## Considered Options

- **Pass `VITE_API_KEY` as a Dockerfile `ARG`/Dagger build arg** — rejected; fixes the mechanism but re-couples the key to image-build time, so one published `:latest` image could no longer serve multiple deployments each with their own key (see ADR 0017) — rotating the key would mean rebuilding and republishing the image.
- **Separate `GET /api/config` JSON endpoint** — rejected; functionally equivalent, but forces `client.ts` to become async and gate the app behind a config fetch before any other request can fire. Injecting into `index.html` makes the key available synchronously before React mounts.
