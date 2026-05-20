# Controlled public beta — operational cadence

Internal reference for EVSavari ops during controlled public maturity. Buyer UX stays quiet; admin hubs carry the load.

## Daily cadence (15–30 minutes)

1. **Ops discipline hub** (`/admin/ops-discipline`): load operational snapshot; note health score, SEO opportunity rows, compare improvement rows, ingestion telemetry (if you used ingestion in this browser).
2. **Real usage learning** (`/admin/real-usage-learning`): load catalog once; scan top user friction, top priority EV queue (P1 first), trust refinement, compare improvement snippets.
3. **Traffic intelligence** (`/admin/traffic-intelligence`): compare abandonment vs landing weak-engagement classes for the same window.
4. **Unresolved high-severity feedback**: triage from local feedback buffer / audit log per your runbook.
5. **Ingestion queue** (`/admin/catalog-ingestion`): clear or advance stale pending (>7d); no autonomous publish — export bundles only through the controlled pipeline.

## Weekly cadence

- Reconcile **GSC** (indexing, CTR) with internal SEO opportunity queue labels; update `public/seo-data` only via governed editorial/ingestion paths.
- Spot-check **top compare pairs** from improvement queue: spec parity, trust blocks, missing guides (quality over quantity).
- Review **repeated taxonomy mismatch** histogram on ingestion telemetry; fix mapping rules or OEM field docs, not silent overrides.

## Deployment / update checklist

See also **[`docs/deploy/README.md`](../deploy/README.md)** (production go / no-go, domain, rollback).

- [ ] `VITE_LAUNCH_PROFILE` and optional `VITE_OPS_*` / `VITE_BETA_*` copy reviewed (short, accurate).
- [ ] Backend **behavioral** and **ops-snapshot** endpoints aligned with frontend flags for this release.
- [ ] No secrets in Vite env; `.env.local` gitignored.
- [ ] `npm run build` green on the release commit.
- [ ] Smoke suite (below) on staging or pre-prod before production tag.
- [ ] Post-deploy: smoke again on production URL; spot-check one EV detail, one compare, one discovery page.

## Smoke-test checklist (`npm run post-launch:smoke` + `npm run ingestion:smoke`)

- **post-launch:smoke** (aggregates SEO QA, trust, soft-launch, catalog-ops, intelligence, usage-learning): confirms scripted invariants for compare/SEO/trust/catalog paths used in CI.
- **ingestion:smoke**: ingestion pipeline + review queue invariants.
- **Manual (5 min)** after a risky release:
  - [ ] Compare: start compare, complete to a stable end state (no console errors).
  - [ ] EV detail: trust section loads; no layout break on mobile width.
  - [ ] Admin: Ops discipline snapshot load (401 acceptable without token — expect graceful message).

## Controlled public beta discipline

- Prefer **deterministic queues** (top EV, compare, SEO, trust) over ad-hoc spreadsheets.
- **Human review** before any catalog or trust copy that affects buyer-facing pages.
- Keep **SoftLaunchBanner** and feedback acknowledgments **minimal** — operational usefulness, not marketing noise.
