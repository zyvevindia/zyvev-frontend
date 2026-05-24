# EVSavari database schema

Foundation Postgres schema for Supabase persistence.

## Apply

1. Create a Supabase project at https://supabase.com  
2. Open **SQL Editor** → run migrations in order:
   - `migrations/001_foundation.sql`
   - `migrations/002_foundation_read_policies.sql` (Day 2 — read policies for validation)
3. Set frontend env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`  
4. **Never** add `SUPABASE_SERVICE_ROLE_KEY` to Vite env (scripts only)

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Admin/dealer profiles (links to Supabase Auth) |
| `sessions` | Anonymous + authenticated session keys |
| `compare_events` | Compare funnel events |
| `trust_feedback` | Trust/doubt feedback |
| `leads` | Buyer intent records |
| `vehicles` | Catalog families (Tata, MG, etc.) |
| `vehicle_variants` | Trim/battery variants |
| `vehicle_media` | Cloudinary role mapping |
| `operational_snapshots` | Ops maturity / beta summaries |

## Migrations

- `001_foundation.sql` — Day 1 foundation (UUID PKs, indexes, RLS)
- `002_foundation_read_policies.sql` — Day 2 anon/authenticated SELECT for smoke validation

Future migrations: add `003_*.sql` in order; do not edit applied files.
