# Backend API — production deployment notes

This repository is **frontend-only**. The API is expected as a separate Node service (e.g. on **Render**). Use this as a checklist when configuring that service.

## Process model

- **Start**: `npm start` or `node server.js` (per backend `package.json`).
- **Port**: Listen on `process.env.PORT` (Render/Railway inject).
- **Health**: Prefer `GET /health` returning `200` + JSON `{ "ok": true }`. Until present, use **`GET /cars?limit=1`** as liveness (already used by `npm run launch:validate`).

## Production env validation (API)

Validate on startup (non-fatal warnings vs fatal errors — match existing backend patterns):

| Variable | Role |
|----------|------|
| `MONGODB_URI` | Atlas connection |
| `JWT_SECRET` or equivalent | Auth signing |
| `CORS_ORIGIN` / allowlist | Must include `https://evsavari.com` and preview origins if needed |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verify |
| `PORT` | Injected by host |

## Graceful behavior

- If DB unreachable: fail readiness but avoid silent half-states; return **503** on protected routes (do not return **200** with empty catalog unless explicitly designed and documented).
- **Boot**: Prefer validating required env (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`) at startup; **fail fast** on missing critical vars in production if that matches the backend’s current pattern.
- **Rate limiting**: keep enabled in production; do not disable for “speed” without ops sign-off.
- **Turnstile**: On verify failure, return a clear **4xx** with generic message; log reason server-side without echoing the secret.

## Logging

- Structured logs (JSON) on stdout for host log drains.
- Correlate request id if middleware exists; never log full PII or secrets.

## Example Render service

See [examples/render-backend.service.yaml](./examples/render-backend.service.yaml) — copy into the **backend** repo as `render.yaml` and adjust names, regions, and env var **names** only.

## Deployment order

1. Migrations / schema (if any) **before** traffic-bearing deploy.
2. Deploy API; verify health.
3. Deploy frontend when new API contract is live.
