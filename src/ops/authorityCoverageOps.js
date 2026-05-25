/**
 * Authority content readiness — operational coverage (no content generation).
 */

import { AUTHORITY_GUIDE_TARGETS } from "../content/authority/guideTargets.js";
import { INTELLIGENCE_DISCOVERY_PRESETS } from "../data/intelligenceDiscoveryPresets.js";
import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest.js";

const AUTHORITY_CLUSTERS = Object.freeze([
  {
    id: "charging_guides",
    label: "Charging guides",
    paths: ["/charging-guides/home-charging"],
    keywords: ["charging", "home-charging"],
  },
  {
    id: "ownership_guides",
    label: "Ownership guides",
    paths: ["/ownership/running-cost", "/guides/ownership-running-cost"],
    keywords: ["ownership", "running-cost", "tco"],
  },
  {
    id: "ev_myths",
    label: "EV myths",
    paths: ["/ownership-guides/ev-myths", "/ownership-guides/myth-battery-dies-quickly"],
    keywords: ["myth", "myth-battery", "myth-rain", "myth-fire", "myth-highway"],
  },
  {
    id: "beginner",
    label: "Beginner EV explainers",
    paths: ["/discover/under-15-lakh"],
    keywords: ["beginner", "first-ev"],
  },
  {
    id: "city_suitability",
    label: "City EV suitability",
    paths: ["/discover/city-driving"],
    keywords: ["city"],
  },
  {
    id: "family_suitability",
    label: "Family EV suitability",
    paths: ["/discover/family-friendly", "/best-evs/large-family"],
    keywords: ["family"],
  },
]);

/**
 * @param {object} [ctx]
 */
export function generateAuthorityCoverageReport(_ctx = {}) {
  const presetPaths = new Set(
    Object.values(INTELLIGENCE_DISCOVERY_PRESETS || {}).map((p) => p.path)
  );

  const clusters = AUTHORITY_CLUSTERS.map((cluster) => {
    const targets = AUTHORITY_GUIDE_TARGETS.filter((g) =>
      cluster.keywords.some((kw) =>
        g.cluster?.includes(kw) || g.path?.includes(kw)
      )
    );
    const hasPreset = cluster.paths.some((p) => presetPaths.has(p));
    const hasTarget = targets.length > 0;
    const score = hasPreset && hasTarget ? 85 : hasTarget ? 55 : 25;
    return {
      ...cluster,
      targetCount: targets.length,
      hasPreset,
      hasTarget,
      readiness: score >= 75 ? "ready" : score >= 50 ? "partial" : "weak",
      score,
    };
  });

  const weakClusters = clusters.filter((c) => c.readiness === "weak");
  const missingCompareSupport = GENERATED_COMPARE_SLUGS.slice(0, 20).filter(
    (slug) =>
      !AUTHORITY_GUIDE_TARGETS.some((g) =>
        g.linkFrom?.some((lf) => lf.includes("/compare"))
      )
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    clusters,
    weakClusters: weakClusters.map((c) => c.id),
    unsupportedCompareTopics: AUTHORITY_GUIDE_TARGETS.filter(
      (g) => !g.linkFrom?.some((lf) => lf.includes("/compare"))
    )
      .slice(0, 6)
      .map((g) => g.id),
    compareManifestCount: GENERATED_COMPARE_SLUGS.length,
    missingCompareSupportPages: missingCompareSupport,
    summary: {
      readyClusters: clusters.filter((c) => c.readiness === "ready").length,
      partialClusters: clusters.filter((c) => c.readiness === "partial")
        .length,
      weakClusters: weakClusters.length,
      avgScore: Math.round(
        clusters.reduce((s, c) => s + c.score, 0) / Math.max(clusters.length, 1)
      ),
    },
  };
}

export function authorityCoverageMarkdown(report) {
  const lines = [
    "# Authority content coverage",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Ready clusters: **${report.summary?.readyClusters ?? 0}**`,
    `- Partial: **${report.summary?.partialClusters ?? 0}**`,
    `- Weak: **${report.summary?.weakClusters ?? 0}**`,
    `- Compare pages in manifest: **${report.compareManifestCount}**`,
    "",
    "## Clusters",
    "",
    "| Cluster | Readiness | Score | Preset |",
    "| --- | --- | --- | --- |",
  ];
  for (const c of report.clusters || []) {
    lines.push(
      `| ${c.label} | ${c.readiness} | ${c.score} | ${c.hasPreset ? "yes" : "no"} |`
    );
  }
  if (report.weakClusters?.length) {
    lines.push("", "## Weak clusters", "", report.weakClusters.join(", "));
  }
  return lines.join("\n");
}
