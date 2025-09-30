# Admin Desktop (Svelte + Tauri)

Owner-facing desktop control center for The Party Spot. This app wraps a Svelte/Vite frontend in a Tauri shell so we can deliver native-feeling booking, catalog, and finance tooling on Windows and macOS.

## Prerequisites

- Node.js ≥ 20.19 (Vite 7 requirement)
- pnpm 10 (repo is pinned to 10.17.1)
- Rust toolchain with the `cargo` command on PATH
- For Windows packaging: Microsoft Visual C++ Build Tools

```powershell
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Rustlang.Rustup
```

After installing Node via winget, restart your shell so the new version is in effect.

## Install dependencies

```powershell
pnpm install
```

This resolves the workspace and pulls in `@tauri-apps/cli` + `@tauri-apps/api`.

## Run in Tauri dev shell

```powershell
pnpm --filter admin-desktop run tauri:dev
```

This launches the desktop window with live reload for the Svelte UI. The Rust backend hot-reloads on change as well.

## Build a desktop bundle

```powershell
pnpm --filter admin-desktop run tauri:build
```

Artifacts land under `apps/admin-desktop/src-tauri/targets`. On Windows you'll get an MSI installer and a portable `.exe`.

## Project layout

- `src/App.svelte` – main dashboard shell with sidebar navigation and ownership stats.
- `src/app.css` – bespoke glassmorphism styling matching the brand system.
- `src-tauri/` – Tauri configuration, Rust commands (calendar launcher, greetings), and icons.

## Next steps

- Wire real Supabase/Stripe/Twilio integrations into the Rust commands.
- Sync booking state with the Astro web app once the API contract is finalized.
- Flesh out secondary navigation views (inventory, staffing, reporting).
