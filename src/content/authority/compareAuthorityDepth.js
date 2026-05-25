/**
 * Compare authority depth scoring.
 */

import { mapCompareSupportAuthority, PRIORITY_COMPARE_PAIRS } from "./compareSupport.js";
import { GENERATED_COMPARE_SLUGS } from "../generated/manifest.js";

const OWNERSHIP_REALISM_HINTS = [
  "limitation",
  "realism",
  "tradeoff",
  "verify",
  "may not",
  "depends",
];

/**
 * @param {string} compareSlug
 */
export function scoreCompareAuthorityDepth(compareSlug) {
  const mapped = mapCompareSupportAuthority(compareSlug);
  const linkCount =
    mapped.beginner.length + mapped.charging.length + mapped.ownership.length;
  const clusterCount = [mapped.beginner, mapped.charging, mapped.ownership].filter(
    (a) => a.length > 0
  ).length;

  let score = 40;
  if (linkCount >= 2) score += 20;
  if (linkCount >= 4) score += 15;
  if (clusterCount >= 2) score += 15;
  if (mapped.supportScore === "adequate") score += 10;
  if (mapped.inManifest) score += 5;
  if (mapped.gaps.length) score -= mapped.gaps.length * 5;

  const band =
    score >= 80 ? "strong" : score >= 60 ? "adequate" : score >= 40 ? "partial" : "weak";

  return {
    compareSlug,
    depthScore: Math.max(0, Math.min(100, score)),
    band,
    linkCount,
    clusterCount,
    gaps: mapped.gaps,
    hasBeginner: mapped.beginner.length > 0,
    hasCharging: mapped.charging.length > 0,
    hasOwnership: mapped.ownership.length > 0,
    hasMythSupport: mapped.beginner.some((l) =>
      String(l.href || "").includes("myth-")
    ),
  };
}

export function auditCompareAuthorityDepth() {
  const slugs = [
    ...new Set([...PRIORITY_COMPARE_PAIRS, ...GENERATED_COMPARE_SLUGS.slice(0, 30)]),
  ];
  const results = slugs.map(scoreCompareAuthorityDepth);
  const weak = results.filter((r) => r.band === "weak" || r.band === "partial");
  return {
    pairCount: results.length,
    avgDepth: Math.round(
      results.reduce((s, r) => s + r.depthScore, 0) / Math.max(results.length, 1)
    ),
    weakPairs: weak.map((r) => r.compareSlug),
    missingOwnershipRealism: weak.filter((r) => !r.hasOwnership).length,
    missingBeginnerPath: weak.filter((r) => !r.hasBeginner).length,
    results: results.slice(0, 24),
  };
}
