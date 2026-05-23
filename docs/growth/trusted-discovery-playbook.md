# Trusted discovery playbook

Trusted discovery on EVSavari is **usefulness-first** — shares and community paths must help someone make a better EV decision, not inflate vanity metrics.

## Approved discovery patterns

1. Share a **specific compare URL** with context (“compare Nexon vs Punch for city use”).  
2. Share an **ownership or charging guide** that answers a real question.  
3. Arrive from **WhatsApp, LinkedIn, or EV communities** with a clear landing path.

## Ops review (`/admin/public-beta-ops` → Public authority)

| Panel | Healthy signal |
|-------|----------------|
| Best trusted discovery paths | Channels with repeat compare or guide return |
| Most durable community journeys | Share → compare → completion |
| Weak discovery retention | Empty or share-without-engagement |
| Trusted compare-sharing paths | Shared compares with depth ≥ 2 |
| Strong authority-sharing journeys | Guide shares with follow-on compare |

## Signals

- `trustedDiscoveryPersistence`  
- `compareShareDurability`  
- `repeatUserReferralQuality`  
- `trustedCommunityAcquisition`  
- `ownershipGuideSharingQuality`  

## Prohibited

- Manipulative virality (“share to unlock”)  
- Growth hacks and referral bonuses  
- Spam in EV groups or mass DMs  
- Generic hype without a useful link  

## Scaling gate

Promote community presence only when `trustedDiscoveryHealthy` is true and `weakDiscoveryRetention` is not `weak`.
