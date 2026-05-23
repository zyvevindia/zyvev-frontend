# SEO authority cluster roadmap

Controlled editorial clusters for EVSavari public beta — **no mass page generation**.

## Approved clusters

| Cluster | Hub paths | Compare linkage |
|---------|-----------|-----------------|
| Ownership reality | `/guides/ownership-running-cost`, `/guides/ownership-insurance-tco` | Compare utility rail + detail discovery |
| Charging practicality | `/charging-guides/home-charging` | Compare + apartment discover |
| Apartment charging | `/guides/ownership-society-rwa`, `/discover/apartment-living` | Shown when apartment risk in compare set |
| City vs highway | `/discover/city-driving`, `/discover/highway-evs` | Suitability-driven compare links |
| Running cost | `/guides/ownership-running-cost` | Detail + compare |
| EV beginner | `/discover/under-15-lakh` | Compare depth ≥ 2 |
| Family practicality | `/discover/family-friendly`, `/best-evs/large-family` | Body-type heuristic on compare |
| Long-trip guidance | `/guides/ownership-highway-ownership` | Highway usability signal |

## Internal linking discipline

1. **Compare → guides** — `buildCompareAuthorityLinks()` (max 4 contextual links).
2. **Detail → compare** — `findEditorialCompareLinks()` in `vehicleInternalLinks.js`.
3. **Guide → compare** — `compareToGuideLinks` in `seoAuthorityOps` report.
4. **No orphan discovery** — weekly SEO QA + orphan path list in admin.

## Scoring (existing ops only)

- `guideOpportunityScore` — `seoAuthorityOps.js`
- `clusterCompleteness` — per-cluster preset + traffic paths
- `topicalAuthorityScore` — aggregate for `/admin/seo-authority`

## Editorial cadence

- **Bi-weekly:** deepen one cluster hub (editorial, not AI bulk).
- **Weekly:** review `guideOpportunities` export from SEO authority admin.
- **Per compare launch:** verify `GENERATED_COMPARE_SLUGS` includes pair before scaling links.

## Out of scope

- Programmatic city × model pages
- Thin “best EV” variants without catalog backing
- AI article farms
