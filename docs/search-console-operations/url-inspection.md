# URL Inspection Workflow

## When to use

- New Tier-1 vehicle or SEO guide published
- GSC reports canonical or indexing issue
- Post-deploy validation spot-check

## Steps

1. GSC → **URL inspection** → paste full URL (`https://evsavari.com/cars/...`)
2. Record:
   - Coverage status (indexed / not indexed)
   - User-declared canonical
   - Google-selected canonical (if different)
   - Last crawl date
3. **Live test** — page loads in browser; JSON-LD via Rich Results Test if needed
4. If not indexed after 2 weeks with clean audits → see [indexing-requests.md](./indexing-requests.md)

## Sample set (rotate weekly)

- 1 Tier-1 vehicle detail
- 1 programmatic SEO guide
- `/compare`
- `/cars` hub

## Do not

- Mass-request indexing for entire sitemap
- Request indexing before fixing canonical errors
