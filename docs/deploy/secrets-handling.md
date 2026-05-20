# Secrets handling — deployment safety

## Principles

1. **Never** commit `.env`, `.env.*.local`, private keys, or Turnstile **secret** to git.
2. **Least privilege**: Vercel “Viewer” for contractors; API dashboard access separate.
3. **Rotation**: If a secret leaks, rotate at source (Render env, MongoDB user password, JWT signing secret) then redeploy.

## Frontend (Vite)

| Secret? | Variable | Notes |
|---------|----------|-------|
| Public | `VITE_*` | Embedded in client bundle — **not** for database URIs or server secrets. |
| Public by design | `VITE_SENTRY_DSN` | DSN is client-facing; still restrict project rate limits in Sentry. |
| Public | `VITE_TURNSTILE_SITE_KEY` | OK in browser. |
| **Never in Vite** | Turnstile secret, Mongo URI, JWT secret | API only. |

## Backend (reference)

Store in host **encrypted environment variables** only. Document variable *names* in `backend-production.md` / example YAML; never paste values into this repo’s issues or docs.

## CI (GitHub Actions)

- This repo’s **CI workflow does not deploy** and does not need production secrets for `build` + smoke.
- If you later add deploy jobs, use **GitHub Environments** + **secrets** scoped to `production`, not repository-wide plaintext.

## Missing-env behavior

- Missing `VITE_API_URL` in production falls back to code default (`config.js`) — verify that default matches your **intended** API before relying on it.
