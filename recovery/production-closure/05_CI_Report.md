# CI Report — PCS-01

**Date:** 2026-07-07

---

## CI Pipeline (`ci.yml`) — Blocking Gates

| Step | Command | Blocking | PCS-01 Change |
|---|---|---|---|
| Repo validation | `deployment-repo-validation.mjs` | ✅ | Now checks catalog manifest + health + cert strict |
| Build | `npm run build` | ✅ | — |
| Media verify | `npm run media:verify` | ✅ | — |
| **Catalog certify strict** | `npm run catalog:certify:strict` | ✅ | **NEW** |
| Post-launch smoke | `npm run post-launch:smoke` | ✅ | — |
| Ingestion smoke | `npm run ingestion:smoke` | ✅ | — |
| E2E functional | `npm run test:e2e` | ✅ | — |
| Visual baseline validate | `visual:baseline:validate:strict` | ✅ | — |
| Visual baseline tests | `visual:baseline:test` | ✅ | — |
| Visual certification | `visual:certification:strict` | ✅ | — |
| Visual regression | `npm run test:visual` | ✅ | — |
| Lint | commented out | ❌ | Unchanged |

---

## Production Verify Pipeline (`production-verify.yml`) — NEW

| Property | Value |
|---|---|
| Trigger | Push to `main`/`master`, every 6 hours, manual |
| Command | `npm run deploy:smoke` |
| Targets | `https://evsavari.com`, Render API |
| Wait | 120s after push (Vercel deploy window) |
| Failure | Workflow red — acts as deployment gate signal |

**Note:** This does not block Vercel deploy itself (no deploy hook integration). It **detects** bad production state within 2–6 hours.

---

## Artifacts Archived

| Artifact | Workflow | Retention |
|---|---|---|
| `visual-certification-reports` | CI | 14 days |
| `catalog-certification-reports` | CI | 14 days (**NEW**) |
| `playwright-report` | CI on failure | 14 days |
| `production-smoke-failure-*` | Production Verify on failure | 7 days |

---

## Scripts Added

| Script | Purpose |
|---|---|
| `catalog:certify:strict` | CI-friendly strict catalog gate |

---

## PDOA Gaps Closed

| PDOA Gap | PCS-01 Status |
|---|---|
| GAP-H01 `catalog:certify --strict` not in CI | ✅ **Resolved** |
| GAP-H02 `deploy:smoke` not automated | ✅ **Partially resolved** — scheduled + post-push workflow |
| GAP-M03 Catalog reports not CI artifacts | ✅ **Resolved** |

---

## Remaining CI Gaps

| Gap | Reason | Owner | Effort |
|---|---|---|---|
| Lint not gated | ESLint debt | Eng | 1–3 days |
| Supabase live in CI | No secrets | DevOps | 1 day |
| Lead E2E in CI | Not implemented | QA | 3–5 days |
| Vercel deploy hook fail-fast | No Vercel API token in repo | DevOps | 2 hrs |

---

## Pipeline Diagram

```
PR / push
  → deploy:repo-check (static)
  → build
  → media:verify ───────────── blocking
  → catalog:certify:strict ─── blocking (NEW)
  → post-launch:smoke ──────── blocking
  → ingestion:smoke
  → playwright e2e + visual ── blocking

push to main
  → (Vercel auto-deploy)
  → wait 120s
  → deploy:smoke (production URLs) ── NEW workflow

every 6h
  → deploy:smoke (production URLs)
```
