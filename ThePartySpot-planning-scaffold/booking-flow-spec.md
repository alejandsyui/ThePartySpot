# Booking Flow Spec

Steps:
1. Select package
2. Choose date/time and duration
3. Enter host info (email, name) — offer magic-link signup
4. Add-ons: select optional add-on items (minibar, bathroom/utilities, catering, security guard)
	- Minibar: per booking or hourly package
	- Bathroom / Utilities: extra cleaning or portable restrooms
	- Catering: menu options and quantity selection
	- Security guard: physical on-site security option
5. Review & confirm
6. Receive magic link / confirmation email

Edge cases: double-booking checks, deposit flow (Phase 2), time zone handling (US only)

Behaviour notes:
- Add-ons must be priced and configurable per venue/time slot by the Owner.
- Add-ons appear in checkout, included in captured payments, and visible in booking details and receipts.
