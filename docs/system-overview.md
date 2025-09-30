# The Party Spot System Overview

## Product vision
- Deliver a single platform that powers The Party Spot's public website, online booking, and in-house operations.
- Provide the owner with a Windows-installable control center that eliminates day-to-day developer involvement.
- Keep customer booking data in sync across every touchpoint in real time to prevent double-bookings and gaps.

## Primary personas
| Persona | Goals | Key interactions |
| --- | --- | --- |
| Business owner (admin) | Manage website content, pricing, availability, customer accounts, and bookings without developer help. | Desktop admin app, mobile-friendly fallback. |
| Staff member (operations) | View upcoming events, mark prep/cleanup status, and adjust schedules. | Admin app (restricted role) |
| Customer | Discover offerings, browse calendar availability, book and manage reservations, receive reminders. | Public website + transactional email/SMS |

## Feature scope snapshot
- **Website (apps/web)**
  - Landing pages, pricing, venue gallery, FAQ, testimonials.
  - Booking flow with time-slot selector, deposit checkout, confirmation.
  - Customer account portal for rebooking, rescheduling, and payment history.
- **Admin control center (apps/admin-desktop)**
  - Dashboard widgets: upcoming events, occupancy heatmap, revenue KPIs.
  - Drag-and-drop calendar for day/week/month views with colored blocks per booking stage.
  - CRUD for bookings, customers, add-ons, pricing tiers.
  - WYSIWYG page editor (content blocks linked to site CMS tables).
  - Notification center with email/SMS templates.
  - System settings: business hours, blackout dates, staff accounts, payout settings.
   - Add-on catalog with inventory, tiered pricing, taxes, discounts, and upsell toggles.
   - Payments console: capture/release deposits, issue refunds, reconcile Stripe payouts.
   - Analytics workspace: customizable reports, export to CSV, daily/weekly/monthly P&L snapshots.
- **Operations tooling**
  - Checklist workflow per booking (prep, clean, maintenance).
  - Inventory manager for add-ons (e.g., bounce houses, decorations).
- **Automation & communications**
  - Automated reminders (24h, 1h), post-event follow-ups, cancellation workflows.
  - Conflict detection & resolution suggestions.

## System architecture
```
official-app/
├─ apps/
│  ├─ web/            → Astro + Svelte marketing & booking front-end
│  ├─ admin-desktop/  → Tauri + Svelte desktop shell embedding admin SPA
│  └─ api/            → Supabase edge functions & optional Node workers
├─ shared/
│  ├─ domain/         → TypeScript domain models & validation (zod)
│  └─ ui/             → Reusable Svelte components + Tailwind presets
├─ docs/              → Product and architecture documentation
└─ tooling/           → CI workflows, scripts, infra templates
```

### Core services
| Layer | Responsibility | Tech choices |
| --- | --- | --- |
| Front-end web | Customer-facing experience, booking funnel, content pages. | Astro 5 + Svelte islands + Tailwind. |
| Desktop admin | Native-feeling control panel, offline cache, power-user tools. | Tauri (Rust shell) + Svelte SPA, packaged installer for Windows. |
| API & data | Booking availability, payments, authentication, notifications. | Supabase (Postgres, Auth, Storage) + Supabase Edge Functions, with optional Node worker in `apps/api` for long-running tasks. |
| Real-time sync | Multi-client updates, presence, calendar changes. | Supabase Realtime channels; fall back to periodic revalidation. |
| Integrations | Payments, messaging, analytics ingest. | Stripe (deposits/balance), Twilio (SMS), Resend (email), Metabase/Supabase SQL for reporting dashboards. |

### Payments & revenue management
- Stripe Connect Standard account for payouts to business owner, with webhook-driven reconciliation into Supabase `payout_ledger`.
- Admin console displays aggregated totals: gross revenue, fees, deposits outstanding, refunds, per-day profitability.
- Support modifiers per booking: add-ons, discounts, taxes; formulas stored in `pricing_rule` + `pricing_modifier` tables.
- Batch actions for outstanding balances (capture remaining payment post-event) and automated receipts.
- Financial snapshots cached nightly into `financial_summary` table for fast analytics rendering and CSV export.

### Shared libraries
- `@party-spot/domain`: Zod schemas, TypeScript types for bookings, customers, pricing, add-ons.
- `@party-spot/api-client`: Thin wrapper around Supabase client with typed queries.
- `@party-spot/ui`: Tailwind component primitives (buttons, modals, timeline) for reuse between web and admin SPA.

## Booking calendar domain model
### Entities
| Entity | Key fields | Notes |
| --- | --- | --- |
| `booking` | `id`, `customer_id`, `start_at`, `end_at`, `status`, `space_id`, `setup_buffer`, `cleanup_buffer`, `addons`, `total_amount`, `deposit_amount` | Buffers allow dynamic padding before/after events. |
| `space` | `id`, `name`, `capacity`, `color`, `default_buffers` | Supports future multi-space expansion. |
| `pricing_rule` | `id`, `space_id`, `day_of_week`, `start_time`, `end_time`, `rate_type`, `rate_amount` | Enables dynamic pricing per slot. |
| `pricing_modifier` | `id`, `type` (addon, discount, tax), `amount_type`, `amount_value`, `applies_to` | Allows per-addon pricing, seasonal promos, taxes. |
| `addon` | `id`, `name`, `description`, `base_price`, `inventory_count`, `category`, `images` | Admin controls catalog; exposed to booking flow. |
| `blackout_window` | `space_id`, `starts_at`, `ends_at`, `reason` | Blocks booking calendar automatically. |
| `financial_summary` | `id`, `date`, `gross`, `net`, `refunds`, `fees`, `balance_due` | Precomputed analytics for dashboard widgets. |

### Availability algorithm outline
1. Load existing `booking` rows for target `space_id` overlapping requested window (use Postgres range operators `tsrange`).
2. Expand requested window by setup/cleanup buffers and compare against existing bookings + buffers to prevent overlap.
3. Allow back-to-back bookings when `previous_booking.cleanup_complete = true` or buffer satisfied.
4. Persist `calendar_event` view combining bookings, cleaning tasks, blackout windows for fast read queries.
5. Emit realtime payload via Supabase channel `calendar:space:{id}` on create/update/delete; desktop/web clients subscribe to update UI instantly.

### Display considerations
- Day view: 15-minute grid, color-coded by status (`tentative`, `confirmed`, `completed`, `cleanup`).
- Week view: stacked comparables with occupancy heatmap footer.
- Month view: summary badges (# of events, total hours booked, revenue).
- Filters: space selection, status filters, staff assignments.

## Data flow scenarios
1. **Customer booking request**
   - Client queries availability endpoint -> supabase function `check_availability` -> returns slots.
   - Customer selects slot, pays deposit (Stripe PaymentIntent) -> Supabase function `create_booking` writes to Postgres -> triggers `booking_created` event -> admin desktop receives realtime update -> confirmation email/SMS dispatched.
2. **Admin manual override**
   - Desktop app updates booking (drag to new time) -> calls `update_booking` edge function -> conflict detection ensures no overlaps -> Supabase broadcast -> website recalculates availability.
3. **Content update**
   - Admin edits homepage section in WYSIWYG -> writes to `cms_blocks` table -> Astro content fetch uses incremental static regeneration + webhook to rebuild if needed.
4. **Add-on & pricing change**
   - Owner updates add-on price or availability -> writes to `addon` + `pricing_modifier` tables -> Supabase function recalculates dependent bookings (if flagged) -> website and admin calendar receive realtime update -> optional customer notifications queued.
5. **Financial reconciliation**
   - Stripe webhook posts payout event -> Supabase Edge Function `sync_payout` records transaction -> financial summaries recomputed -> analytics dashboard reflects updated totals.

## Security & permissions
- Supabase Auth with row-level security (RLS) enforcing role-based access.
- Admin desktop authenticates via PKCE flow; stores refresh token securely (Tauri secure storage).
- Staff roles limited to schedule and notes; content editing restricted to owner role.
- Audit tables capturing every change (`booking_audit`, `content_audit`).

## Implementation phases
1. **Foundation**
   - Finish Astro web scaffold (header/footer, marketing shell).
   - Scaffold Supabase project, define SQL migrations, seed data, RLS policies.
   - Create shared domain package with booking types + zod validators.
2. **Booking MVP**
   - Implement availability API (Supabase edge function).
   - Build customer booking flow with Stripe deposit.
   - Create admin SPA (web-based) inside Tauri shell: login, calendar read-only, booking detail view.
3. **Operations tooling**
   - Add drag/drop rescheduling, buffers, status transitions.
   - Build staff task checklist and notifications.
   - Add content management interface and Astro incremental rebuild pipeline.
4. **Commerce & analytics**
   - Complete payments console (refunds, manual capture, payout history).
   - Build add-on catalog manager with inventory, pricing modifiers, and publishing workflow.
   - Deliver analytics dashboards (daily/weekly/monthly reports, export) and business health email digests.
5. **Polish & packaging**
   - Desktop installer build, auto-update channel.
   - Analytics dashboards, exports, reporting.
   - QA, accessibility pass, documentation, training videos.

## Immediate next steps
- Resolve package manager issues (`pnpm install` stability on Windows; consider `pnpm config set store-dir` outside OneDrive).
- Scaffold `apps/admin-desktop` (Tauri + Vite + Svelte) with shared UI library skeleton.
- Initialize Supabase project repo (`apps/api`), add SQL migrations for core tables (`booking`, `space`, `pricing_rule`, `blackout_window`).
- Create `shared/domain` package with zod schemas for booking and availability requests.
- Replace placeholder `src/pages/index.astro` with marketing/homepage scaffold leveraging Tailwind theme.
- Draft README with setup instructions for web, admin desktop, and Supabase environments.
- Design add-on/pricing modifier schema migrations and seed data.
- Draft analytics spec: required metrics, filters, and export formats for MVP dashboard.
