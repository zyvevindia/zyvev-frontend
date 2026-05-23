/**
 * Public beta priority tier-1 families (highest-intent EVs).
 * MG Windsor included for roadmap tracking when catalog adds the family.
 */

export const PUBLIC_BETA_TIER1_FAMILIES = Object.freeze([
  { slug: "tata-nexon-ev", label: "Tata Nexon EV" },
  { slug: "tata-punch-ev", label: "Tata Punch EV" },
  { slug: "tata-tiago-ev", label: "Tata Tiago EV" },
  { slug: "mg-comet-ev", label: "MG Comet EV" },
  { slug: "mg-windsor-ev", label: "MG Windsor EV" },
  { slug: "byd-atto-3", label: "BYD Atto 3" },
  { slug: "mahindra-xuv400", label: "Mahindra XUV400" },
  { slug: "tata-curvv-ev", label: "Tata Curvv EV" },
]);

export const PUBLIC_BETA_TIER1_SLUGS = PUBLIC_BETA_TIER1_FAMILIES.map(
  (f) => f.slug
);
