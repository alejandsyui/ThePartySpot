# Payments Spec (Phase 2)

Goals
- Collect deposits (optional) or full payment at booking.
- Support future upsells and invoicing.

Provider: Stripe (recommended)

Flows
- Deposit flow: customer pays X% deposit at booking; remaining balance due onsite or before event.
- Full payment: capture payment at booking and create invoice record.

Data to store
- stripe_payment_id, amount, currency, status, captured_at

Security
- Use Stripe Checkout or PaymentIntents; do not store card details on our servers.