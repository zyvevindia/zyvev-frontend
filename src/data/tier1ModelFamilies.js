/**
 * Tier-1 model family slugs (brand-model). Longest-first matching for variant parsing.
 * Synced with public/catalog/golden-dataset/manifest.json (25 families).
 */
export const TIER1_MODEL_FAMILY_SLUGS = [
  "hyundai-creta-electric",
  "hyundai-kona-electric",
  "mahindra-xev-9e",
  "mahindra-xuv400",
  "mahindra-be-6",
  "mercedes-eqb",
  "mercedes-eqa",
  "mini-cooper-se",
  "tata-nexon-ev",
  "tata-harrier-ev",
  "tata-curvv-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
  "tata-tigor-ev",
  "maruti-e-vitara",
  "mg-windsor-ev",
  "hyundai-ioniq-5",
  "volvo-ex40",
  "mg-comet-ev",
  "mg-zs-ev",
  "byd-atto-3",
  "citroen-ec3",
  "bmw-ix1",
  "byd-seal",
  "kia-ev6",
].sort((a, b) => b.length - a.length);
