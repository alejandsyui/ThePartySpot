# Realtime & Push Design

- Save push subscription per user
- On DB change (request/state update) emit realtime event and enqueue push/email job
- Service worker handles incoming push and opens the live session link
