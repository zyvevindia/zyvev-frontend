# Privacy Compliance Report — Analytics

**Scope:** Pre–Sprint 3  
**Engine:** `src/analytics/`

---

## PII Policy

**Never sent to analytics providers:**

| Field | Blocked by |
|-------|------------|
| Email | `sanitizeProps()` in `track.js` |
| Phone | `sanitizeProps()` |
| Name / first_name / last_name | `sanitizeProps()` |
| Address | `sanitizeProps()` |

Behavioral API (`event-tracking/`) uses a separate allowlist — also excludes PII.

---

## Technical Controls

| Control | Implementation |
|---------|------------------|
| IP anonymization | GA4 direct: `anonymize_ip: true` |
| No autocapture PII | PostHog: `autocapture: false` |
| Consent gate | `VITE_ANALYTICS_REQUIRE_CONSENT=true` + localStorage |
| Session ID | Anonymous UUID in sessionStorage only |
| No fingerprinting | No canvas/font/device ID collection |

---

## Consent Model

Default (production soft launch): **analytics allowed** unless user opts out via `setAnalyticsConsent(false)`.

Strict mode: set `VITE_ANALYTICS_REQUIRE_CONSENT=true` — requires explicit grant before init.

Storage key: `evsavari_analytics_consent_v1`

---

## Data Minimization

Event parameters limited to:

- Slugs (vehicle, landing, guide)
- Page paths
- Counts and ranks
- CTA types and surfaces
- Anonymous session ID

---

## Hashing

Not implemented. If future business requires hashed identifiers, add in `envelope.js` only — never raw PII from forms.

---

## Third-Party Processors

| Provider | Data sent | DPA required |
|----------|-----------|--------------|
| Google Analytics 4 | Anonymous events | Google terms |
| Google Tag Manager | Same via dataLayer | Google terms |
| Microsoft Clarity | Session replay (no PII by policy) | Microsoft terms |
| PostHog (optional) | Anonymous events | PostHog DPA if enabled |
| Meta / LinkedIn (future) | Only when env IDs set | Platform DPAs |

---

## Compliance Checklist

- [x] PII stripped before dispatch
- [x] No hardcoded tracking IDs in source
- [x] Consent mechanism available
- [x] IP anonymization on direct GA4
- [ ] Privacy policy updated to mention analytics (manual — legal)
- [ ] Cookie/consent banner if REQUIRE_CONSENT enabled (manual — product)

Run verification: `npm run analytics:certify:foundation`
