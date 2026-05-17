# Critical issue playbook (soft launch)

## P0 — Site down or leads broken

1. Confirm scope: frontend only vs API (`evsavari-api.onrender.com`)
2. Check Render/hosting status and recent deploy
3. If API down: enable maintenance message via host; do not change routes/SEO files
4. If leads failing: verify `POST /leads` and Mongo connection; use Admin test lead on `/admin/ops-qa`
5. Communicate ETA to stakeholders; log incident in ops audit notes

## P1 — Wrong prices or specs on flagship models

1. Identify slug from user report or `site_feedback` ops audit
2. Fix Tier-1 data in backend catalog source; re-import if needed
3. Do **not** change canonical URLs or family slugs
4. Verify on staging URL before production cache clear

## P1 — Broken images on production families

1. Run `npm run media:audit -- --probe`
2. Upload missing assets to Cloudinary `evsavari/catalog/families/{slug}/`
3. Confirm `VehicleImage` falls back to SVG only after Cloudinary chain fails

## P2 — Compare or form UX

1. Reproduce on mobile; check localStorage compare list
2. Clear compare: user can use “Clear Comparison” or remove per card
3. Form errors: check network tab for validation `errors` object

## Data capture

- User reports: Admin → filter ops audit `site_feedback`
- Local buffer: browser `localStorage` key `evsavari-user-feedback-v1` (support can ask user to export)
