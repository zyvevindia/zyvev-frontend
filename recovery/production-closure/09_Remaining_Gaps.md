# Remaining Gaps — PCS-01

**Date:** 2026-07-07  
**After PCS-01 deployment closure work**

---

## Mandatory Blockers (Must close before Marketplace RC)

| # | Gap | Owner | Next Action | Effort |
|---|---|---|---|---|
| 1 | Lead E2E uncertified | QA | Playwright lead journey spec against staging API | 3–5 days |
| 2 | WebKit visual 0/56 | QA | Run `visual-linux-baselines.yml`; merge PNGs | 2–3 days |
| 3 | Turnstile live on lead forms | DevOps + Backend | Set `VITE_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | 1 day |
| 4 | Sentry + GA verified in Vercel prod | DevOps | Set env vars; verify events | 2 hours |
| 5 | Vercel production env documented | DevOps | Export env list from dashboard to `docs/deploy/vercel-production-env.md` | 1 hour |
| 6 | API `GET /health` on Render | Backend | Add route in `zyvev-backend`; configure Render health check | 30 min |
| 7 | Lead delivery monitoring | Ops | Manual ops log + alert on unmatched queue | 2 days |
| 8 | RC checklist 19 No-Go → ≤4 | PMO | Close items per `recovery/production-audit/09` | Multi-sprint |
| 9 | Legal privacy/terms | Legal | Counsel review | External |
| 10 | MVP-02 pilot execution | Ops | August commercialization plan | 4 weeks |

---

## Operational (Non-blocking for deploy, blocking for GA)

| # | Gap | Owner | Next Action | Effort |
|---|---|---|---|---|
| 11 | Render cold-start | Backend/DevOps | Upgrade plan or keep-warm cron | 1 day |
| 12 | UptimeRobot external monitor | DevOps | Create free account; ping site + /api/health | 20 min |
| 13 | Rollback runbook unsigned | PMO | Leadership signoff | 1 hour |
| 14 | Supabase live CI secrets | DevOps | Add to GitHub secrets | 1 day |
| 15 | CRS shadow staging drill | SRE | Staging env `CATALOG_RUNTIME_MODE=shadow` 48h | 2 days |
| 16 | Dealer lead notifications | Backend | Email/WhatsApp on new lead | 3–5 days |
| 17 | Monetization / billing | Product | Post-pilot Razorpay | 2–4 weeks |

---

## Explicitly Deferred

| Item | Reason |
|---|---|
| Dealer AI | Program direction — post commercial proof |
| OEM AI | Program direction |
| CRS PRIMARY in production | Intentional — after shadow/canary |
| Behavioral intelligence | Flag OFF until lead loop proven |
| ESLint in CI | Tech debt sprint |

---

## External Dependency Blockers

| Blocker | Exact Reason | Unblock |
|---|---|---|
| Vercel env configuration | No dashboard API access in PCS sprint | Owner logs into Vercel |
| Render API health | Code in sibling `zyvev-backend` repo | Backend PR |
| Turnstile secrets | Cloudflare account credentials | Owner provides keys |
| UptimeRobot | Third-party signup | DevOps creates account |

---

## Count

| Severity | Remaining |
|---|---|
| Critical (RC) | 10 |
| High (ops) | 7 |
| Deferred | 5 |

PCS-01 closed **deployment execution gaps** in the frontend repo. **Commercial and RC gaps** remain for MVP-02 / P3.
