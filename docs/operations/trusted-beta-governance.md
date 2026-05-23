# Trusted beta governance — EVSavari

**Sprint:** Trusted EV Intelligence Beta  
**Principle:** Trustworthy decision intelligence — no speculative AI, no SEO spam.

---

## Recommendation review workflow

1. Weekly export from `/admin/recommendation-realism` (CSV/JSON).
2. Triage **NEEDS_REVIEW** and **human review suggested** pairs first.
3. Cross-check with `/admin/compare-calibration` editorial queue.
4. Update catalog compare narrative or intelligence flags in editorial ingest — not ad-hoc UI overrides.

**Statuses:** TRUSTED · GOOD · NEEDS_REVIEW

---

## Compare realism standards

| Signal | Action |
|--------|--------|
| Score gap >35 pts | Verify editorial pick matches scores |
| Flat scores (<5 pt spread) | Differentiate strengths or adjust copy |
| Duplicate “better at” pills | Deduplicate in catalog meta |
| Low completion + high traffic | Editorial review on CTA and mobile layout |
| Overconfident messaging risk | Lower confidence band in copy |

---

## Ownership realism policy

- TCO and running-cost figures are **indicative** unless OEM-verified.
- Always surface dealer/city confirmation in compare and detail trust strips.
- Missing ownership bundle → cap recommendation confidence; flag in realism dashboard.

---

## Charging practicality policy

- DC time and home-charging notes must come from intelligence bundle when present.
- Do not claim “fastest charging” without DC data.
- City vs highway nuance required when compare set mixes use cases.

---

## Authority content governance

- Six controlled topic clusters only (see `authorityDepthOps.js`).
- Link from high-traffic compare → existing guides; do not mass-generate URLs.
- Guide support completeness tracked on `/admin/seo-authority` and premium journeys.

---

## Trust messaging discipline

- No fake precision (avoid “guaranteed”, “always best”).
- Use: directional, indicative, verify locally, data quality affects confidence.
- Score tooltips must mention missing/estimated fields when applicable.

---

## Beta operational cadence

| Day | Task |
|-----|------|
| Mon | Refresh `/admin/public-beta-ops` — record trust snapshot |
| Tue | Premium journeys — push one family toward PREMIUM_READY |
| Wed | Realism queue — clear top 3 NEEDS_REVIEW pairs |
| Thu | Conversion quality — weak CTA pages |
| Fri | Authority depth — one internal link improvement |

**Gate doc:** `docs/launch/trusted-beta-readiness.md`
