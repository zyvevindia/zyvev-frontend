# Structured Data Issue Handling

## Detection

- Google Rich Results Test / GSC enhancements
- `node scripts/audit-structured-data.js` (backend)

## Valid types on EVSavari

| Page | Schema |
|------|--------|
| Vehicle detail | Vehicle, BreadcrumbList, FAQPage (if FAQs) |
| SEO guide | BreadcrumbList, FAQPage |
| Compare | BreadcrumbList, ItemList |

## Prohibited

- `aggregateRating` / `review` on vehicles (audit fails intentionally)

## Fix workflow

1. Run static audit — fix builder or `public/seo-data/*.json`
2. Deploy
3. Re-test one URL per template type
4. Do not add new schema types without governance review

## SPA caveat

Live view-source may not show JSON-LD; use Rich Results Test on deployed URL or trust static audit + client render verification in browser DevTools → Elements after load.
