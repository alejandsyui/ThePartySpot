# Data Model (initial)

- users: id, email, name, role, created_at
- bookings: id, user_id, start_time, end_time, package_id, guests, status, utm
- live_sessions: id, booking_id, state, started_at, ended_at
- requests: id, live_session_id, user_id, type, subtype, notes, status, assigned_to, eta_ts, created_at
- request_events: id, request_id, actor_id, event_type, note, timestamp
- subscriptions: id, user_id, push_json, enabled
- notifications_log: id, user_id, event, channel, status, timestamp
