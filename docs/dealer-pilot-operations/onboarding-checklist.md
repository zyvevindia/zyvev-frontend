# Dealer Onboarding Checklist

Complete before first lead handoff.

## Platform readiness

- [ ] `ops:weekly-live-ops -- --db` — all critical checks pass or documented  
- [ ] `ops:daily-live-ops -- --db` — 3 consecutive days stable  
- [ ] Live smoke passed from operator network  
- [ ] Behavioral ingestion enabled in production  
- [ ] GSC sitemap submitted  

## Content & trust

- [ ] Pilot 3 models have trust blocks on detail pages  
- [ ] Compare paths tested mobile + desktop  
- [ ] No public observation exposure  
- [ ] Trust anomalies logged in [trust-anomaly-tracking.md](../weekly-live-ops/trust-anomaly-tracking.md) reviewed  

## Lead & privacy

- [ ] Lead form privacy copy current  
- [ ] Admin intent-summary returns dealer-safe output  
- [ ] Team trained: **never** share `leadQuality` tier with dealer  
- [ ] Sample summaries prepared ([dealer-pilot-package/](../dealer-pilot-package/))  

## Dealer partner

- [ ] Metro selected ([metro-pilot-structure.md](./metro-pilot-structure.md))  
- [ ] 3 models agreed ([three-model-pilot.md](./three-model-pilot.md))  
- [ ] Single point of contact named  
- [ ] Email handoff format agreed  

## Pilot launch

- [ ] Start date set  
- [ ] Mid-pilot review scheduled (day 7)  
- [ ] End-of-pilot review scheduled (day 14)  
