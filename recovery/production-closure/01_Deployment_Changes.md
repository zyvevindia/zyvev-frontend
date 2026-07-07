# PCS-01 Deployment Changes

**Date:** 2026-07-07  
**Sprint:** PCS-01 — Production Closure

---

## Workstream 1 — Catalog Deployment

### Root cause

`/catalog/published/manifest.json` returned **HTTP 404** because:

1. **`public/catalog/published/` was never committed to git** (`git status` showed `?? public/catalog/published/`).
2. Vercel deploys from the git repository — untracked files are **not included** in production builds.
3. No `prebuild` step runs `catalog:publish` (`CATALOG_PUBLISHER_ENABLED` defaults OFF by design).

This was **not** a Vercel rewrite issue, path misconfiguration, or missing `vercel.json` rule. Static files under `public/` are served at the same path when present in the deploy artifact.

### Changes made

| File | Change |
|---|---|
| `public/catalog/published/*` | **Added to git** (8 files: manifest, snapshot, diagnostics, checksums, etc.) |
| `vercel.json` | Cache-Control headers for `/catalog/published/(.*)` |
| `scripts/deployment-repo-validation.mjs` | Fail if `manifest.json` missing from repo |
| `scripts/deploy-smoke.mjs` | **Required** check: `GET /catalog/published/manifest.json` → 200 |

### Verification (post-deploy)

```bash
curl -s -o /dev/null -w "%{http_code}" https://evsavari.com/catalog/published/manifest.json
# Expected: 200
npm run deploy:smoke
```

---

## Workstream 2 — Deployment Infrastructure

| File | Change |
|---|---|
| `api/health.js` | New Vercel serverless liveness endpoint `GET /api/health` |
| `.github/workflows/production-verify.yml` | Post-push + 6-hour schedule `deploy:smoke` against production |
| `scripts/deploy-smoke.mjs` | Added frontend `/api/health`, vehicle detail, listing, dealer shell checks |

---

## Workstream 5 — CI Productionization

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | Added `npm run catalog:certify:strict` blocking step + artifact upload |
| `package.json` | Added `catalog:certify:strict` script |
| `scripts/deployment-repo-validation.mjs` | Validates CI wires `catalog:certify:strict` |

---

## Files not changed (intentional)

- **No** `prebuild` catalog publish hook — artifacts committed explicitly; publisher flag remains OFF.
- **No** CRS runtime flag changes — cutover remains OFF until staging drill (see `06_Feature_Flag_Status.md`).
- **No** backend Render changes — sibling repo; blockers documented in `03_Configuration_Report.md`.

---

## Commit scope

PCS-01 deployment commit includes:

- `public/catalog/published/` (8 JSON files)
- `api/health.js`
- `vercel.json`
- `.github/workflows/ci.yml`
- `.github/workflows/production-verify.yml`
- `scripts/deploy-smoke.mjs`
- `scripts/deployment-repo-validation.mjs`
- `package.json`
- `recovery/production-closure/` (this sprint documentation)
