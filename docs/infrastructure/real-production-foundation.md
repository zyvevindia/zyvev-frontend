# Real production foundation — Day 1, Day 2 & Day 3

**Phase:** Persistent production platform (Supabase + Postgres)  
**Status:** Foundation + activation (additive dual-write)

## Overview

EVSavari moves from browser-only operational intelligence (`localStorage` buffers) toward **durable Postgres persistence** via Supabase, while preserving:

- Existing Render API for catalog/leads (unchanged)
- Admin dashboards and ops modules (unchanged)
- Compare engine, trust calibration, calm UX
- `PrivateRoute` / JWT admin login (unchanged)

The persistence layer **gracefully idles** when Supabase env vars are unset — no frontend crashes.

## Architecture

```
src/backend/
├── activation.js             # Production-safe init (main.jsx)
├── catalog/
│   ├── catalogConventions.js   # Slug, media, compare conventions
│   ├── tier1CatalogDefinitions.js
│   └── catalogSeedUtils.js     # Service-role seed helpers
├── config.js
├── env/
│   ├── loadNodeEnv.js        # dotenv bootstrap for Node scripts
│   └── cloudinaryEnv.js      # CLOUDINARY_URL + discrete var normalization
├── envValidation.js
├── index.js
├── supabase/
│   ├── client.js             # Anon key (browser)
│   └── adminClient.js        # Service role (Node scripts ONLY)
├── schema/migrations/
│   ├── 001_foundation.sql
│   └── 002_foundation_read_policies.sql
└── services/
    ├── persistenceMirror.js  # Dual-write from usageLearningBuffer
    ├── sessionService.js
    ├── compareEventService.js
    ├── trustFeedbackService.js
    ├── leadService.js
    ├── operationalSnapshotService.js
    ├── authService.js
    ├── vehicleService.js
    └── vehicleMediaService.js
```

## Environment setup

| Variable | Where | Required for |
|----------|-------|--------------|
| `VITE_SUPABASE_URL` | Vercel / `.env.local` | Browser + scripts |
| `VITE_SUPABASE_ANON_KEY` | Vercel / `.env.local` | Browser persistence |
| `SUPABASE_SERVICE_ROLE_KEY` | **Scripts / CI only** | Catalog seed (`backend:seed-nexon-ev`, `backend:seed-tier1`) |

**Never** add `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_SERVICE_ROLE_KEY` to Vite env.

## Node env loading (operational scripts)

Vite loads `.env.local` automatically in the browser. **Node scripts do not** — they use a centralized bootstrap:

```
scripts/lib/bootstrapEnv.mjs  →  src/backend/env/loadNodeEnv.js  →  dotenv
```

Every `scripts/*.mjs` file imports `./lib/bootstrapEnv.mjs` as its **first** import. Bootstrap runs before any backend module loads.

**Execution order (ESM-safe):**

1. `bootstrapEnv.mjs` → `loadNodeEnvCore.js` (dotenv only — no `envValidation` / `config.js`)
2. `process.env` populated from `.env` then `.env.local`
3. Script imports backend modules dynamically or statically **after** step 1
4. `BACKEND_CONFIG` uses **getters** — reads env at access time, not module load time
5. `readEnv()` prefers `process.env` in Node over `import.meta.env`

Bootstrap diagnostics (no secrets):

```
bootstrap-env: cwd=... root=... .env=... VITE_SUPABASE_URL=set (xxx.supabase.co) ...
```

1. `.env` (base)
2. `.env.local` (overrides)

No manual PowerShell `$env:VAR=...` injection required for local ops:

```bash
npm run backend:persistence-smoke -- --live
npm run backend:seed-nexon-ev
npm run backend:seed-tier1
npm run media:fix-cloudinary
```

### Operational env requirements

| Variable | Scope | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | Browser + scripts | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser + scripts | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Scripts only** | Catalog seed, admin read-back |
| `CLOUDINARY_URL` | Scripts | `cloudinary://KEY:SECRET@CLOUD_NAME` |
| `CLOUDINARY_CLOUD_NAME` | Scripts | Or use `VITE_CLOUDINARY_CLOUD_NAME` |
| `CLOUDINARY_API_KEY` | Scripts | Alternative to `CLOUDINARY_URL` |
| `CLOUDINARY_API_SECRET` | Scripts | Alternative to `CLOUDINARY_URL` |

Validation: `validateOperationalEnv()` in `src/backend/envValidation.js` — fails with clear errors, never logs secrets.

### Local setup

```bash
cp .env.example .env.local
# Edit .env.local with Supabase + Cloudinary credentials
npm run backend:persistence-smoke -- --live
```

### Security notes

- Service role and Cloudinary secrets stay in `.env.local` (gitignored) — never in Vercel `VITE_*` vars
- `loadNodeEnv.js` is imported only from Node scripts, never from `main.jsx` or Vite bundles
- `maskSecret()` available for operational logging

### Cloudinary compatibility

Scripts accept **either**:

- `CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME`, or
- `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`

`normalizeCloudinaryEnv()` derives missing discrete vars from `CLOUDINARY_URL` before SDK config.

### Supabase activation checklist

1. Create Supabase project  
2. Run `001_foundation.sql` in SQL Editor  
3. Run `002_foundation_read_policies.sql`  
4. Set `VITE_SUPABASE_*` on Vercel Production + Preview  
5. Redeploy frontend  
6. Optional: `SUPABASE_SERVICE_ROLE_KEY` locally → `npm run backend:seed-nexon-ev` or `npm run backend:seed-tier1`

## Persistence flow (Day 2)

1. **localStorage buffer** remains primary for ops dashboards (unchanged).
2. On app load, `activateBackendPersistence()` touches `sessions` when configured.
3. On each `appendUsageLearningEvent()`, **additive mirror** writes to Supabase when configured:
   - **Compare events:** `compare_*` funnel types → `compare_events`
   - **Trust feedback:** `recommendation_doubted`, tooltips → `trust_feedback`
   - **Leads:** `lead_*` types → `leads`
4. Mirror failures are swallowed — buffer always wins locally.

## First live persistence validation

```bash
npm run backend:persistence-smoke -- --live
```

Validates: connection, sessions, compare/trust/lead write+read, mirror, auth session check.

## First real EV insertion (Tata Nexon EV)

```bash
# Requires service role in .env.local (scripts only)
npm run backend:seed-nexon-ev
```

Persists:

- `vehicles` — `tata-nexon-ev`
- `vehicle_variants` — Creative Plus, Empowered Plus
- `vehicle_media` — hero, listing-thumb, compare-thumb, og, exterior, interior, charging-port

Verify read (anon):

```bash
npm run backend:persistence-smoke -- --live
# reports: catalog read tata-nexon-ev (seed present)
```

## Operational persistence activation

| Event types | Table |
|-------------|-------|
| `compare_started`, `compare_completed`, … | `compare_events` |
| `recommendation_doubted`, trust tooltips | `trust_feedback` |
| `lead_started`, `lead_submitted`, … | `leads` |

Not mirrored yet: operational snapshots, full telemetry migration (human-governed, incremental).

## Auth persistence readiness

- `authService.js` — Supabase session + `users` profile upsert scaffold
- `sessionService.js` — anonymous session keys persisted
- **Not wired** to `Login.jsx` / `PrivateRoute` — existing JWT admin flow unchanged

## Ingestion readiness

- Schema supports tier-1 OEM families (Tata, MG, Mahindra, BYD, Hyundai)
- Cloudinary public_id + URL per media role
- Batch seed via service-role scripts only (no scraper, no automation agents)

## Deployment guidance

- `index.html` cache headers prevent stale router bundles after deploy (`vercel.json`)
- Missing Supabase env → persistence idles, app works normally
- No secrets logged from `activation.js`

## Tier-1 catalog operations (Day 3)

Disciplined onboarding for 11 Indian EV families — definitions in `src/backend/catalog/tier1CatalogDefinitions.js`.

```bash
npm run backend:seed-tier1                    # all families
npm run backend:seed-tier1 -- --only=slug     # single family
npm run backend:catalog-ops-smoke             # conventions (offline)
npm run backend:catalog-ops-smoke -- --live   # Supabase read-back
npm run backend:compare-validate              # day3 compare pairs
```

Each family persists:

- `vehicles` — slug, brand, ownership/charging meta, `compare_ready`
- `vehicle_variants` — normalized trims with compare_specs
- `vehicle_media` — 7 roles mapped to Cloudinary public IDs

Playbook: [tier1-catalog-operations-playbook.md](../catalog/tier1-catalog-operations-playbook.md)

## Validation

```bash
npm run build
npm run admin:routes-smoke
npm run backend:persistence-smoke
npm run backend:persistence-smoke -- --live   # after schema + env
npm run backend:catalog-ops-smoke
npm run backend:compare-validate
npm run post-launch:smoke
npm run backend:seed-nexon-ev                 # optional, service role
npm run backend:seed-tier1                    # optional, all tier-1
```

## Remaining follow-ups

1. Apply migrations to production Supabase if not done  
2. Set Vercel env vars and redeploy  
3. Run live smoke + tier-1 seed in production project  
4. Wire Supabase Auth to admin login (future — not Day 2/3)  
5. Tighten RLS before high-volume public traffic  
6. Incremental operational snapshot persistence  
7. Human review of indicative specs before marketing campaigns  
8. Execute tier-1 authority content plan (8 pillars)

## Related

- [Schema README](../../src/backend/schema/README.md)
- [Tier-1 catalog playbook](../catalog/tier1-catalog-operations-playbook.md)
- [Day 3 readiness](../launch/day3-catalog-operations-readiness.md)
- [Required env vars](../deployment/required-env-vars.md)
