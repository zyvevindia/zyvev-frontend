# Source Acquisition Gap Report

Generated: 2026-06-09

Measurement only — no fixes applied.

Raw HTML saved under `docs/catalog/production-validation/source-acquisition-gap/html/`.

## Executive summary

| Vehicle | OEM fetch | Root cause |
|---------|-----------|------------|
| Tata Curvv EV | 200 but **wrong page** | `301` redirect to unrelated JLR conference event — **identical HTML for Curvv and Nexon** (SHA256 match) |
| Tata Nexon EV | 200 but **wrong page** | Same redirect — zero mentions of "Curvv" or "Nexon" in acquired HTML |
| MG Windsor EV | **404** | Configured URL `/vehicles/windsor-ev` does not exist on mgmotor.co.in |
| Mahindra BE 6 | **404** | Configured URL `/be6` does not exist on mahindra.com |

**OEM extraction yield:** Tata OEM → **0 evidence records** (grounded AI finds nothing in corporate shell). MG/Mahindra → **0 OEM sources acquired** (404). All evidence today comes from **CarDekho reference** pages only.

**PDF discovery:** 0/4 — no local PDFs; no `.pdf` hrefs in any acquired OEM HTML; brochure links (if any) are loaded via JS after page render.

**fetch() vs browser:** Tata OEM pages are WordPress shells with 16 script tags and 2.7% text ratio — vehicle specs and brochure downloads are not in the initial HTML response.

---

## Tata Curvv EV (`tata-curvv-ev`)

### 1. HTML acquired today

**OEM:** https://www.tatamotors.com/curvv/ev

| Property | Value |
|----------|-------|
| HTTP OK | true |
| Status/errors | 200 |
| Content-Type | text/html; charset=UTF-8 |
| Raw HTML bytes | 62055 |
| Saved to | `docs\catalog\production-validation\source-acquisition-gap\html\tata-curvv-ev\oem.html` |

**REFERENCE:** https://www.cardekho.com/tata/curvv-ev

| Property | Value |
|----------|-------|
| HTTP OK | true |
| Status/errors | 200 |
| Content-Type | text/html; charset=utf-8 |
| Raw HTML bytes | 611540 |
| Saved to | `docs\catalog\production-validation\source-acquisition-gap\html\tata-curvv-ev\ref-www-cardekho-com.html` |

**OEM visible text preview (first 400 chars after tag strip):**

```
EV Conference presentation – JLR &#8211; Tata Motors Tools --> Contact --> English --> --> Mode Light Dark Future of Mobility Our history Organisation Overview About us Our history Our leadership Our global presence Subsidiaries and other entities Innovations --> Business Commercial vehicles Passenger vehicles Electric vehicles Luxury vehicles --> Corporate Responsibility Overview Sustainability s
```

### 2. Evidence records generated

| Field | Value | Source | Confidence | Snippet |
|-------|-------|--------|------------|--------|
| brand | Tata | CarDekho | 95 | Tata Curvv EV price starts at ₹16.99 Lakh in New Delhi. |
| startingPrice | 1699000 | CarDekho | 90 | ₹16.99 Lakh |
| topVariantPrice | 1949000 | CarDekho | 90 | ₹19,49,000 |
| batteryCapacityKwh | 55 | CarDekho | 95 | 55 kWh battery pack |
| claimedRangeKm | 502 | CarDekho | 95 | claimed range of 502 km |
| powerPs | 165 | CarDekho | 95 | 165 bhp |

**Total:** 6 records · 3 variants

**Note:** All 6 records sourced from CarDekho only. Tata OEM extraction produced **0 records** (empty grounded pass).

### 3. PDF discovery attempts

| Step | Result |
|------|--------|
| Local PDF paths checked | `docs\catalog\validation-sources\tata-curvv-ev.pdf`, `data-acquisition\incoming\tata-curvv-ev.pdf` |
| Local PDF found | No |
| .pdf hrefs in OEM HTML | 0 |
| Passed brochure keyword filter | 0 |
| Filter rule | href must match /brochure|spec|download|e-brochure|ebrochure|factsheet|technical/i in resolved URL |

### 4. Why brochure URLs are not found

- **HTTP 301 redirect:** `https://www.tatamotors.com/curvv/ev` → `https://www.tatamotors.com/events/ev-conference-presentation-jlr/`
- Acquired HTML canonical confirms JLR conference event — not Curvv product page
- No `.pdf` hrefs; no "Curvv" or "brochure" in response body
- Wrong destination page — corporate shell without vehicle specs or downloads

### 5. JS rendering & fetch() content gap

| Signal | Value |
|--------|-------|
| Likely JS-rendered | **YES** |
| Vehicle keywords in visible text | Yes (generic "EV" in nav only — **no "Curvv"**) |
| HTML bytes / visible text bytes | 62055 / 1673 |
| Text-to-HTML ratio | 0.027 |
| Script tags | 16 |
| Redirect | **301 → JLR conference event page** |
| Same HTML as Nexon OEM | **Yes (identical file hash)** |
| OEM evidence records | **0** |
| Signals | heavy script tags (16); og:title present: "Tata Motors | Agile, new-age & future-ready" |

Reference (https://www.cardekho.com/tata/curvv-ev): visible text 31486 bytes, likely JS-rendered: true, vehicle keywords: true

### Acquisition pipeline sources

- **OEM_WEBSITE** https://www.tatamotors.com/curvv/ev: 62055 HTML bytes, 1673 visible text bytes
- **TRUSTED_REFERENCE** https://www.cardekho.com/tata/curvv-ev: 611540 HTML bytes, 31486 visible text bytes

---

## Tata Nexon EV (`tata-nexon-ev`)

### 1. HTML acquired today

**OEM:** https://www.tatamotors.com/nexon/ev

| Property | Value |
|----------|-------|
| HTTP OK | true |
| Status/errors | 200 |
| Content-Type | text/html; charset=UTF-8 |
| Raw HTML bytes | 62055 |
| Saved to | `docs\catalog\production-validation\source-acquisition-gap\html\tata-nexon-ev\oem.html` |

**REFERENCE:** https://www.cardekho.com/tata/nexon-ev

| Property | Value |
|----------|-------|
| HTTP OK | true |
| Status/errors | 200 |
| Content-Type | text/html; charset=utf-8 |
| Raw HTML bytes | 724554 |
| Saved to | `docs\catalog\production-validation\source-acquisition-gap\html\tata-nexon-ev\ref-www-cardekho-com.html` |

**OEM visible text preview (first 400 chars after tag strip):**

```
EV Conference presentation – JLR &#8211; Tata Motors Tools --> Contact --> English --> --> Mode Light Dark Future of Mobility Our history Organisation Overview About us Our history Our leadership Our global presence Subsidiaries and other entities Innovations --> Business Commercial vehicles Passenger vehicles Electric vehicles Luxury vehicles --> Corporate Responsibility Overview Sustainability s
```

### 2. Evidence records generated

| Field | Value | Source | Confidence | Snippet |
|-------|-------|--------|------------|--------|
| brand | Tata | CarDekho | 95 | The 2025 Tata Nexon EV is offered with two battery pack opti |
| model | Nexon EV | CarDekho | 95 | The 2025 Tata Nexon EV is offered with two battery pack opti |
| startingPrice | 1249000 | CarDekho | 90 | Nexon EV car price starts at ₹12.49 Lakh in New Delhi (ex-sh |
| topVariantPrice | 1719000 | CarDekho | 90 | It is priced between Rs.12.49 - 17.19 Lakh (Ex-showroom pric |
| batteryCapacityKwh | 30 | CarDekho | 90 | The 2025 Tata Nexon EV is offered with two battery pack opti |
| claimedRangeKm | 275 | CarDekho | 90 | with a claimed range of 275km and 489km respectively. |
| acChargingKw | 7.2 | CarDekho | 90 | Charging Time required to fully charge the Nexon EV - 7.2kW  |
| torqueNm | 215 | CarDekho | 90 | The Tata Nexon EV has maximum torque of 215Nm. |

**Total:** 8 records · 11 variants

### 3. PDF discovery attempts

| Step | Result |
|------|--------|
| Local PDF paths checked | `docs\catalog\validation-sources\tata-nexon-ev.pdf`, `data-acquisition\incoming\tata-nexon-ev.pdf` |
| Local PDF found | No |
| .pdf hrefs in OEM HTML | 0 |
| Passed brochure keyword filter | 0 |
| Filter rule | href must match /brochure|spec|download|e-brochure|ebrochure|factsheet|technical/i in resolved URL |

### 4. Why brochure URLs are not found

- **HTTP 301 redirect:** `https://www.tatamotors.com/nexon/ev` → same JLR conference event page as Curvv
- No `.pdf` hrefs; no "Nexon" in acquired HTML body
- Wrong destination page — not the Nexon EV product site

### 5. JS rendering & fetch() content gap

| Signal | Value |
|--------|-------|
| Likely JS-rendered | **YES** |
| Vehicle keywords in visible text | Yes (generic nav only — **no "Nexon"**) |
| HTML bytes / visible text bytes | 62055 / 1673 |
| Text-to-HTML ratio | 0.027 |
| Script tags | 16 |
| Redirect | **301 → JLR conference event page** |
| Same HTML as Curvv OEM | **Yes (identical file hash)** |
| OEM evidence records | **0** |
| Signals | heavy script tags (16); og:title present: "Tata Motors | Agile, new-age & future-ready" |

Reference (https://www.cardekho.com/tata/nexon-ev): visible text 38862 bytes, likely JS-rendered: true, vehicle keywords: true

### Acquisition pipeline sources

- **OEM_WEBSITE** https://www.tatamotors.com/nexon/ev: 62055 HTML bytes, 1673 visible text bytes
- **TRUSTED_REFERENCE** https://www.cardekho.com/tata/nexon-ev: 724576 HTML bytes, 38862 visible text bytes

---

## MG Windsor EV (`mg-windsor-ev`)

### 1. HTML acquired today

**OEM:** https://www.mgmotor.co.in/vehicles/windsor-ev

| Property | Value |
|----------|-------|
| HTTP OK | false |
| Status/errors | HTTP 404 Not Found |
| Content-Type | — |
| Raw HTML bytes | 0 |
| Saved to | `—` |

**REFERENCE:** https://www.cardekho.com/mg/windsor-ev

| Property | Value |
|----------|-------|
| HTTP OK | true |
| Status/errors | 200 |
| Content-Type | text/html; charset=utf-8 |
| Raw HTML bytes | 638531 |
| Saved to | `docs\catalog\production-validation\source-acquisition-gap\html\mg-windsor-ev\ref-www-cardekho-com.html` |

### 2. Evidence records generated

| Field | Value | Source | Confidence | Snippet |
|-------|-------|--------|------------|--------|
| startingPrice | 1400000 | CarDekho | 90 | MG Windsor EV price starts at ₹14 Lakh ex-showroom |
| batteryCapacityKwh | 38 | CarDekho | 85 | The battery capacity of MG Windsor EV is between 38 - 52.9 k |
| claimedRangeKm | 332 | CarDekho | 90 | The range of MG Windsor EV is 332 km. |
| acChargingTimeHours | 7 | CarDekho | 85 | Charging Time required to fully charge the MG Windsor EV - 7 |

**Total:** 4 records · 5 variants

### 3. PDF discovery attempts

| Step | Result |
|------|--------|
| Local PDF paths checked | `docs\catalog\validation-sources\mg-windsor-ev.pdf`, `data-acquisition\incoming\mg-windsor-ev.pdf` |
| Local PDF found | No |
| .pdf hrefs in OEM HTML | 0 |
| Passed brochure keyword filter | 0 |
| Filter rule | N/A — OEM fetch failed |

### 4. Why brochure URLs are not found

- OEM fetch failed: HTTP 404 Not Found

### 5. JS rendering & fetch() content gap

Reference (https://www.cardekho.com/mg/windsor-ev): visible text 39857 bytes, likely JS-rendered: true, vehicle keywords: true

### Acquisition pipeline sources

- **TRUSTED_REFERENCE** https://www.cardekho.com/mg/windsor-ev: 638531 HTML bytes, 39857 visible text bytes

---

## Mahindra BE 6 (`mahindra-be-6`)

### 1. HTML acquired today

**OEM:** https://www.mahindra.com/be6

| Property | Value |
|----------|-------|
| HTTP OK | false |
| Status/errors | HTTP 404 Not Found |
| Content-Type | — |
| Raw HTML bytes | 0 |
| Saved to | `—` |

**REFERENCE:** https://www.cardekho.com/mahindra/be-6

| Property | Value |
|----------|-------|
| HTTP OK | true |
| Status/errors | 200 |
| Content-Type | text/html; charset=utf-8 |
| Raw HTML bytes | 761395 |
| Saved to | `docs\catalog\production-validation\source-acquisition-gap\html\mahindra-be-6\ref-www-cardekho-com.html` |

### 2. Evidence records generated

| Field | Value | Source | Confidence | Snippet |
|-------|-------|--------|------------|--------|
| brand | Mahindra | CarDekho | 98 | The battery capacity of Mahindra BE 6 is between 59 - 79 kWh |
| model | BE 6 | CarDekho | 98 | The battery capacity of Mahindra BE 6 is between 59 - 79 kWh |
| batteryCapacityKwh | 79 | CarDekho | 90 | The battery capacity of Mahindra BE 6 is between 59 - 79 kWh |
| claimedRangeKm | 683 | CarDekho | 98 | The range of Mahindra BE 6 is 683 km. |
| acChargingTimeHours | 8 | CarDekho | 90 | Charging Time required to fully charge the BE 6 - 6 / 8.7 h  |
| dcChargingTimeMinutes | 20 | CarDekho | 98 | 20Min with 140 kW DC |
| powerPs | 282 | CarDekho | 98 | this beast owns a 282 bhp |
| torqueNm | 380 | CarDekho | 98 | this beast has 380 nm torque |

**Total:** 8 records · 2 variants

### 3. PDF discovery attempts

| Step | Result |
|------|--------|
| Local PDF paths checked | `docs\catalog\validation-sources\mahindra-be-6.pdf`, `data-acquisition\incoming\mahindra-be-6.pdf` |
| Local PDF found | No |
| .pdf hrefs in OEM HTML | 0 |
| Passed brochure keyword filter | 0 |
| Filter rule | N/A — OEM fetch failed |

### 4. Why brochure URLs are not found

- OEM fetch failed: HTTP 404 Not Found

### 5. JS rendering & fetch() content gap

Reference (https://www.cardekho.com/mahindra/be-6): visible text 42989 bytes, likely JS-rendered: true, vehicle keywords: true

### Acquisition pipeline sources

- **TRUSTED_REFERENCE** https://www.cardekho.com/mahindra/be-6: 761291 HTML bytes, 42989 visible text bytes

---

