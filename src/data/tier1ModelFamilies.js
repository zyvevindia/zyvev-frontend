/**
 * Tier-1 model family slugs (brand-model). Longest-first matching for variant parsing.
 * Synced with docs/architecture/catalog/tier-1/manifest.json models.
 */
export const TIER1_MODEL_FAMILY_SLUGS = [
  "hyundai-kona-electric",
  "mahindra-xev-9e",
  "mahindra-xuv400",
  "mahindra-be-6",
  "mercedes-eqb",
  "mercedes-eqa",
  "tata-nexon-ev",
  "tata-curvv-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
  "volvo-ex40",
  "mg-comet-ev",
  "mg-zs-ev",
  "byd-atto-3",
  "bmw-ix1",
  "citroen-ec3",
  "kia-ev6",
].sort((a, b) => b.length - a.length);
