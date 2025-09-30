# The Party Spot Monorepo

Welcome to the official codebase powering The Party Spot web experience, admin tooling, and backend services. This workspace follows a PNPM-based monorepo layout so shared packages live alongside deployable apps.

## Repository layout

| Path | Description |
| --- | --- |
| `apps/web` | Public marketing + booking site built with Astro, Tailwind, and Svelte islands. Deployed to Vercel. |
| `apps/api` | Fastify API service intended for server runtimes or edge environments. |
| `apps/admin-desktop` | Svelte + Tauri desktop admin app (contains Rust build tooling). |
| `packages/content` | Shared content helpers consumed by the web app. |
| `shared/content` | Legacy compatibility layer mirroring `packages/content`. |
| `docs/` | Product briefs, specs, and planning artifacts. |

## Prerequisites

- Node.js >= 20 (the repo targets Vercel's 22.x runtime, but 20+ works locally)
- PNPM 10 (installed globally or via `npx pnpm`)
- Rust toolchain (required only for the Tauri desktop build)

## Install dependencies

```pwsh
# From the repository root
env PNPM_HOME="$env:USERPROFILE\AppData\Local\pnpm"  # optional: add PNPM to PATH
npx pnpm install
```

> On Windows PowerShell, PNPM's global binary may not appear on `PATH` right after installation. Using `npx pnpm` ensures commands resolve without extra setup.

## Common PNPM scripts

```pwsh
# Run the marketing/booking site locally
npx pnpm --filter web dev
# Build the Astro site
npx pnpm --filter web build

# Run the Fastify API in watch mode
npx pnpm --filter api dev
# Build the API
npx pnpm --filter api build
```

Additional workspace scripts:
- `pnpm dev` &rarr; proxies to `apps/web`
- `pnpm build` / `pnpm lint` / `pnpm test` &rarr; run recursively across all packages with declared scripts

## Deployment: Vercel (apps/web)

The `apps/web` project is linked to Vercel and deploys on demand via the CLI. Production deployments are protected by Vercel Authentication in "Standard Protection" mode (HTTP 401 for unauthenticated visitors).

### Manual deployment

```pwsh
# Preview deployment (creates a unique URL)
npx vercel --cwd apps/web --yes

# Promote the latest build to production
npx vercel --cwd apps/web --prod --yes
```

Vercel project settings are also captured in `apps/web/vercel.json` to keep the build and output directory aligned with the Astro configuration.

## Environment variables

- Copy any required runtime secrets into `.env` files within the respective apps. Example placeholders will be added as features are implemented.

## Contributing checklist

1. Install dependencies with PNPM (see above).
2. Run `npx pnpm --filter web build` before pushing to ensure the static site compiles.
3. For API changes, add or update unit tests (consider `vitest` or similar) and run them via `pnpm --filter api test` once configured.
4. Submit PRs against `main` so GitHub Actions (to be added) can lint and build automatically.

For product direction, check the `docs/` folder, especially `docs/planning/*.md`.
