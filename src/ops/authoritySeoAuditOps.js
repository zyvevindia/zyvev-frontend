/**
 * Authority SEO readiness audit — Track B operational reporting.
 */

import {
  ALL_AUTHORITY_TOPICS,
  AUTHORITY_CLUSTERS,
  getAuthorityArchitectureSummary,
  AUTHORITY_GUIDE_TARGETS,
} from "../content/authority/index.js";
import { buildCompareSupportAuthorityAudit } from "../content/authority/compareSupport.js";
import { generateAuthorityCoverageReport } from "./authorityCoverageOps.js";
import { READINESS_STATUS } from "../content/authority/metadata.js";
import { isAuthorityTopicRouteReady } from "../content/authority/routeReadiness.js";

/**
 * @param {object} [_ctx]
 */
export function generateAuthoritySeoAuditReport(_ctx = {}) {
  const architecture = getAuthorityArchitectureSummary();
  const coverage = generateAuthorityCoverageReport();
  const compareSupport = buildCompareSupportAuthorityAudit();

  const topics = ALL_AUTHORITY_TOPICS.map((t) => {
    const routeReady = isAuthorityTopicRouteReady(t);
    return {
      id: t.id,
      title: t.title,
      cluster: t.cluster,
      readiness: t.readiness,
      seoPriority: t.seoPriority,
      compareSupportRelevance: t.compareSupportRelevance,
      canonicalPath: t.canonicalPath || null,
      routeReady,
      gap:
        t.readiness === READINESS_STATUS.STRUCTURED && !routeReady
          ? "structured_no_route"
          : !t.canonicalPath
            ? "no_canonical_path"
            : null,
    };
  });

  const gaps = topics.filter((t) => t.gap);
  const weakClusters = AUTHORITY_CLUSTERS.map((c) => {
    const clusterTopics = topics.filter((t) => t.cluster === c.id);
    const published = clusterTopics.filter(
      (t) => t.readiness === READINESS_STATUS.PUBLISHED && t.routeReady
    ).length;
    const score = Math.round(
      (published / Math.max(clusterTopics.length, 1)) * 100
    );
    return {
      id: c.id,
      label: c.label,
      published,
      total: clusterTopics.length,
      score,
      readiness: score >= 70 ? "ready" : score >= 40 ? "partial" : "weak",
    };
  }).filter((c) => c.readiness !== "ready");

  return {
    generatedAt: new Date().toISOString(),
    reportType: "authority-seo-readiness",
    architecture,
    guideTargetCount: AUTHORITY_GUIDE_TARGETS.length,
    coverage: coverage.summary,
    weakCoverageClusters: coverage.weakClusters || [],
    compareSupport: compareSupport.summary,
    weakComparePairs: compareSupport.weakPairs,
    topics,
    gaps: gaps.slice(0, 24),
    weakClusters,
    summary: {
      totalTopics: architecture.totalTopics,
      publishedTopics: architecture.publishedTopics,
      structuredTopics: architecture.structuredTopics,
      gapCount: gaps.length,
      compareWeakPairs: compareSupport.summary.weak,
      avgClusterScore: Math.round(
        weakClusters.reduce((s, c) => s + c.score, 0) /
          Math.max(AUTHORITY_CLUSTERS.length, 1)
      ),
    },
  };
}

export function authoritySeoAuditMarkdown(report) {
  const lines = [
    "# Authority SEO readiness",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Topics: **${report.summary?.totalTopics}** (${report.summary?.publishedTopics} published, ${report.summary?.structuredTopics} structured)`,
    `- Guide targets: **${report.guideTargetCount}**`,
    `- Topic gaps: **${report.summary?.gapCount}**`,
    `- Weak compare pairs: **${report.summary?.compareWeakPairs}**`,
    "",
    "## Clusters",
    "",
    "| Cluster | Published | Total | Readiness |",
    "| --- | --- | --- | --- |",
  ];
  for (const c of report.weakClusters || []) {
    lines.push(
      `| ${c.label} | ${c.published} | ${c.total} | ${c.readiness} |`
    );
  }
  if (report.gaps?.length) {
    lines.push("", "## Topic gaps (sample)", "");
    for (const g of report.gaps.slice(0, 12)) {
      lines.push(`- **${g.id}**: ${g.gap}`);
    }
  }
  return lines.join("\n");
}
