# Public beta growth playbook

Controlled traffic growth for EVSavari — learning without dark patterns.

## Acquisition channels (track via UTM + referrer host)

| Channel | UTM example | Notes |
|---------|-------------|-------|
| WhatsApp shares | `utm_source=whatsapp` | High intent; monitor compare depth |
| LinkedIn | `utm_source=linkedin` | Authority posts; link to compare or guides |
| EV communities | `utm_source=ev_community` | Forum/WhatsApp groups — quality varies |
| Reddit | `utm_source=reddit` | Watch bounce on thin landing |
| Direct | (no UTM) | Brand recall; often repeat visitors |
| Organic search | referrer search engines | Strengthen guide ↔ compare links |
| Repeat visitors | `repeated_ev_interest` buffer | Session-scoped only |

## Weekly ops review

1. `/admin/public-beta-ops` — **Safe to scale traffic?** + growth metrics
2. `/admin/recommendation-refinement` — unstable pairs before amplifying traffic
3. `/admin/conversion-refinement` — trust-assisted conversion quality

## Scale discipline

- Increase traffic **one channel at a time** (e.g. +20% WhatsApp week-over-week)
- Pause scale if:
  - `betaStabilityTrend === declining` two weeks
  - Trust friction score > 50
  - Compare abandon exceeds completion in buffer

## Share copy principles

- Lead with **practical comparison** (range, charging, ownership) — not hype
- Link to **specific compare pairs** when possible
- Include **one guide link** for authority (running cost, apartment charging, etc.)

## Privacy

- Session UTM + referrer host only — no fingerprinting, no PII in buffer
- No aggressive retargeting during beta
