/**
 * Tier-1 OEM families for soft-launch media/catalog audits.
 */

import { PRODUCTION_FAMILY_SLUGS } from "../media/productionFamilies.js";

export const TIER1_OEM_GROUPS = [
  {
    oem: "Tata",
    families: [
      "tata-nexon-ev",
      "tata-punch-ev",
      "tata-curvv-ev",
      "tata-tiago-ev",
    ],
  },
  {
    oem: "MG",
    families: ["mg-comet-ev", "mg-zs-ev"],
  },
  {
    oem: "Mahindra",
    families: [
      "mahindra-be-6",
      "mahindra-xev-9e",
      "mahindra-xuv400",
    ],
  },
  {
    oem: "BYD",
    families: ["byd-atto-3"],
  },
  {
    oem: "Hyundai",
    families: ["hyundai-kona-electric"],
  },
];

export const TIER1_FAMILY_SLUGS = TIER1_OEM_GROUPS.flatMap((g) => g.families);

export function isTier1FamilySlug(slug = "") {
  const key = String(slug || "").trim().toLowerCase();
  return TIER1_FAMILY_SLUGS.includes(key);
}

export function tier1ManifestCoverage() {
  const manifest = new Set(PRODUCTION_FAMILY_SLUGS);
  const covered = TIER1_FAMILY_SLUGS.filter((f) => manifest.has(f));
  return {
    total: TIER1_FAMILY_SLUGS.length,
    manifestCount: covered.length,
    missingManifest: TIER1_FAMILY_SLUGS.filter((f) => !manifest.has(f)),
    percent:
      TIER1_FAMILY_SLUGS.length > 0
        ? Math.round((covered.length / TIER1_FAMILY_SLUGS.length) * 100)
        : 0,
  };
}
