# The Party Spot · Web Experience

This Astro + Svelte front end powers the public marketing site and interactive booking flow for The Party Spot. It showcases curated spotlight tiles, live pricing, and a guided booking builder that syncs with the desktop admin tool via shared events.

## ✨ Highlights

- **Spotlight hero tiles** — Three themed carousels (`decor`, `add-ons`, `experiences`) rotate premium imagery and dispatch booking events when their CTAs are tapped.
- **Interactive Booking Builder** — The Svelte modal walks guests through availability, décor, upsells, and account creation with live pricing summaries.
- **Event bus integration** — Any element with `data-booking-trigger` can open the builder, optionally specifying which step or preset to preselect.
- **Tailwind styling** — Glassmorphism layout, custom brand colors, and responsive typography are provided out of the box.

## 🚀 Quick start

```powershell
cd official-app
pnpm --filter web install
pnpm --filter web dev
```

The dev server boots at <http://localhost:4321>. The booking builder mounts globally, so hero CTAs and header buttons should open the modal immediately.

### Production build

```powershell
cd official-app
pnpm --filter web build
```

Outputs land in `apps/web/dist/` ready for static hosting.

## 🧩 Feature anatomy

| Area | File | Notes |
| --- | --- | --- |
| Spotlight tiles | `src/pages/index.astro` | `decorSlides`, `addonSlides`, and `experienceSlides` define titles, imagery, and booking payloads. Update these arrays or wire them to the shared content service when the API is ready. |
| Booking builder | `src/components/BookingBuilder.svelte` | Accepts global `booking:open` events. Supports `{ focusStep: 'schedule' | 'decor' | 'addons', selectId?: string }`. The modal hides its own button when embedded on the page. |
| CTA dispatch | `src/components/SpotlightShowcase.svelte` & inline script in `index.astro` | Adds `triggerEventName` support so slides and header buttons emit `booking:open`. |

### Triggering the booking builder manually

Add a `data-booking-trigger` attribute to any clickable element. Optional data attributes:

- `data-booking-focus="decor"` — Jump to a specific step (`schedule`, `decor`, or `addons`).
- `data-booking-select="neon-nightlife"` — Preselect a décor/add-on/experience by ID.

Example:

```html
<button
	data-booking-trigger
	data-booking-focus="addons"
	data-booking-select="photo-booth"
>
	Lock the 360° booth
</button>
```

## 🛠️ Customizing for production

- Swap Unsplash placeholders once official photos are ready (`src/pages/index.astro` and `public/images`).
- Pipe real availability, pricing, and add-ons through Supabase/Fastify integrations (see `shared/content` and `apps/api`).
- Hook analytics (e.g., PostHog, GA4) by listening for the same `booking:open` event.

## � Related workspaces

- `apps/admin-desktop/` — Tauri desktop console for internal staff.
- `apps/api/` — Fastify media + booking API (installation still pending due to Windows file locks).

Keep both in sync when rolling out new spotlight presets or add-ons.
