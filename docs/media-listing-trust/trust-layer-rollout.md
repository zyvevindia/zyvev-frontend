# Trust layer rollout recommendations

## Phase 1 — Media (current sprint)

- Upload Tier-1 CDN packs for Nexon, Punch, ZS EV, XUV400, Atto 3 (highest intent).
- Run `audit-media.mjs` in CI on catalog PRs.
- Keep production on legacy images until CDN 200 checks pass.

## Phase 2 — Listing UX (staging)

- Enable `USE_EV_MASTER=true` on staging only.
- Verify cards: Lakh pricing, 2 signal chips, trust pills.
- Compare flow unchanged structurally; insight cards when `catalogMeta` present.

## Phase 3 — Production dual-read

- Publish Tier-1 variants (`governance.status: published`).
- Enable dual-read; monitor 404 rate on catalog images.
- Do **not** enable `VITE_CATALOG_DETAIL_ENRICH` until API stable.

## Phase 4 — Full trust

- “EVSavari Verified” only for `published` + live CDN audit.
- Reduce “fields to verify” flags in catalog JSON.
- Add owner-data refresh for real-world range bands.

## Metrics

- Listing CTR / detail bounce (wrong image proxy)
- Compare add rate
- Lead quality from listing card (unchanged forms)

## Rollback

- `USE_EV_MASTER=false` — instant legacy listings
- Frontend deploy independent; fallbacks safe with flags off
