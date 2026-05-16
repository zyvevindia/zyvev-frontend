# Deploy Verification Checklist

Run **immediately after** production deploy from a machine with network egress.

---

## 1. Environment & profile

```bash
cd zyvev-backend
node scripts/validate-launch-profile.js public-beta
npm run ops:production-activation -- --live https://evsavari.com
```

| Check | Pass |
|-------|------|
| `cutoverCodeReady: true` | ☐ |
| Backend profile env matches `public-beta` | ☐ |
| Behavioral flag enabled (when learning starts) | ☐ |

---

## 2. Live smoke

```bash
npm run ops:live-smoke https://evsavari.com
```

| URL / flow | Pass |
|------------|------|
| Homepage `200` | ☐ |
| Vehicle detail `200` + canonical in HTML | ☐ |
| Compare page loads | ☐ |
| SEO guide page `200` | ☐ |
| `robots.txt` correct | ☐ |
| `sitemap.xml` `200` | ☐ |
| `/api/behavioral/events` reachable (OPTIONS/POST policy) | ☐ |

**Manual (mobile):** see [mobile-qa-signoff.md](./mobile-qa-signoff.md)

---

## 3. SEO integrity

```bash
npm run ops:seo
```

| Check | Expected |
|-------|----------|
| Canonical errors | `0` |
| Sitemap freshness | `ok` |
| Crawlable URL count | ~52 |

---

## 4. Catalog & trust

| Check | Pass |
|-------|------|
| Detail page shows trust block (flagship) | ☐ |
| Compare trust panel visible (2+ vehicles) | ☐ |
| No console errors on detail/compare | ☐ |

---

## 5. Lead flow

| Check | Pass |
|-------|------|
| Lead modal opens on detail | ☐ |
| Submit succeeds (test lead) | ☐ |
| Admin can see lead | ☐ |

---

## 6. Rollback decision

**Rollback if:**

- Canonical errors > 0 on top URLs
- Lead submit broken
- Widespread 5xx on API
- Accidental indexing of `/admin` or `/dealer`

**Do not rollback for:**

- Low initial GSC indexed count (normal Week 1)
- Zero behavioral events first hours (verify flag first)

**Rollback steps:** [production-env-checklist.md](./production-env-checklist.md) → Rollback section

---

## 7. Post-deploy ops cadence

- Day 0: This checklist + [mobile-qa-signoff.md](./mobile-qa-signoff.md)
- Daily: `npm run ops:daily-live-ops -- --db`
- Week 1: [week-1-indexing-ops.md](../search-console-operations/week-1-indexing-ops.md)

---

## Sign-off

| Role | Date | Notes |
|------|------|-------|
| Deploy operator | | |
| Editorial/ops | | |
