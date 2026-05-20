# Ingestion runbook

## When to use

- OEM sends **CSV / JSON** price or spec deltas.
- Internal spreadsheet exports (structured columns only — no prose blobs).

## Preconditions

1. Admin logged in; **Load catalog** on `/admin/catalog-ingestion` (builds diff against live API snapshot).
2. Confirm **slug** column matches EVSavari **family** slugs (`tata-nexon-ev`, not marketing names).
3. Never paste secrets into import JSON.

## JSON envelope

```json
{
  "format": "evsavari-ingestion/1",
  "sourceSystem": "oem_export_feb",
  "items": [
    { "slug": "tata-nexon-ev", "starting_price": 1599000, "range_km": 465 }
  ]
}
```

## CSV

- Row 1: headers. Supported aliases include `slug`, `starting_price`, `range_km`, `battery_kwh`, `dc_fast_kw`, `connector`, etc.
- Malformed rows (column count mismatch) surface as parse errors — fix file and re-import.

## After import

1. Review **duplicate slugs**, **dangerous price moves**, **missing catalog** rows.
2. **Approve** only after editorial + catalog owner sign-off.
3. **Download publish bundle** JSON and apply via **backend** or controlled DB migration — then refresh trust/freshness per governance SOP.

## What this does **not** do

- Does not call `content:generate` or mutate `public/seo-data`.
- Does not write to Mongo from the SPA.
