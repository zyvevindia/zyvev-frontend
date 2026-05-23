# Community distribution playbook

EVSavari community discovery is **usefulness-first**. This playbook governs how authority content and compare flows may be shared — without growth hacks, spam referrals, or manipulative virality.

## Principles

1. **Share when it helps** — WhatsApp or LinkedIn shares should carry context (which compare or guide helped), not generic hype.
2. **No incentive loops** — No points, leaderboards, or referral bonuses.
3. **Session-level quality only** — Ops read channel labels and share depth from the usage buffer; no fingerprinting.
4. **Trust before reach** — Expand community paths only when `communityDiscoveryMaturity` is not `early` and compare-after-share completion is present.

## Approved channels

| Channel | Use |
|---------|-----|
| WhatsApp | Personal share of a specific compare or ownership guide |
| LinkedIn | Professional EV research shares with editorial context |
| EV communities | Forum or group links with explicit page URLs (no auto-posting) |

## Ops review (weekly)

On `/admin/public-beta-ops` → **Retention & authority compounding**:

- **Highest-trust referral paths** — prefer channels with repeat compare or guide return
- **Best community discovery** — channels with healthy share depth
- **Weak share journeys** — shares without follow-on compare or guide engagement
- **Most shared compare flows** — validate messaging matches calm UX

## What we do not do

- Mass DM templates or “share to unlock” mechanics
- Fake urgency (“share in 24h”)
- Automated cross-posting to groups
- Paid influencer bursts without editorial review

## Scaling gate

Hold broader community outreach until:

- `trustedReturnUserPersistence` is `persistent` or `emerging` with improving retention trend
- `compareShareConversionQuality` is `present` or better
- `weakShareJourneys` is empty or explained by low buffer volume

## Rollback

If share volume rises but `trustedSessionRatio` falls, pause community campaigns and review compare trust calibration before resuming.
