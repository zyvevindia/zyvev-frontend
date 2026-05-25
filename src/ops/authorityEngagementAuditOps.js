/**
 * Authority engagement & learning pathway audit.
 */

import {
  BEGINNER_LEARNING_PATHWAY,
  CHARGING_LEARNING_PATHWAY,
  OWNERSHIP_LEARNING_PATHWAY,
  EV_MYTHS_PATHWAY,
  getLearningPathway,
} from "../content/authority/learningPathways.js";
import { isAuthorityTopicRouteReady } from "../content/authority/routeReadiness.js";
import { BEGINNER_EV_TOPICS } from "../content/authority/beginnerTopics.js";
import { CHARGING_GUIDE_TOPICS } from "../content/authority/chargingTopics.js";
import { OWNERSHIP_EXPLAINER_TOPICS } from "../content/authority/ownershipGuidance.js";
import { EV_MYTH_TOPICS, EV_MYTH_HUB_TOPIC } from "../content/authority/evMythTopics.js";
import { auditCompareAuthorityDepth } from "../content/authority/compareAuthorityDepth.js";
import { CONTENT_REGISTRY_ENTRIES } from "../content/registry.js";

function pathwayReadiness(steps) {
  const ready = steps.filter((s) =>
    CONTENT_REGISTRY_ENTRIES.some((e) => e.path === s.href)
  ).length;
  return {
    total: steps.length,
    ready,
    percent: Math.round((ready / Math.max(steps.length, 1)) * 100),
  };
}

export function generateAuthorityEngagementAuditReport() {
  const pathways = {
    beginner: pathwayReadiness(BEGINNER_LEARNING_PATHWAY),
    charging: pathwayReadiness(CHARGING_LEARNING_PATHWAY),
    ownership: pathwayReadiness(OWNERSHIP_LEARNING_PATHWAY),
    evMyths: pathwayReadiness(EV_MYTHS_PATHWAY),
  };

  const topicsWithContinue = [
    ...BEGINNER_EV_TOPICS,
    ...CHARGING_GUIDE_TOPICS,
    ...OWNERSHIP_EXPLAINER_TOPICS,
    EV_MYTH_HUB_TOPIC,
    ...EV_MYTH_TOPICS,
  ]
    .filter((t) => t.canonicalPath)
    .map((t) => {
      const pathway = getLearningPathway(
        t.learningPathwayId || "beginner",
        t.canonicalPath
      );
      return {
        id: t.id,
        continueCount: pathway.continueLearning.length,
        routeReady: isAuthorityTopicRouteReady(t),
      };
    });

  const orphanPages = CONTENT_REGISTRY_ENTRIES.filter(
    (e) =>
      e.contentSlug?.startsWith("authority-") &&
      !topicsWithContinue.some((t) => t.routeReady && e.path)
  ).slice(0, 10);

  const compareDepth = auditCompareAuthorityDepth();

  const engagementScore = Math.round(
    (pathways.beginner.percent +
      pathways.charging.percent +
      pathways.ownership.percent +
      pathways.evMyths.percent) /
      4
  );

  return {
    generatedAt: new Date().toISOString(),
    reportType: "authority-engagement",
    engagementScore,
    pathways,
    compareAuthorityDepth: compareDepth,
    topicsWithContinue: topicsWithContinue.slice(0, 25),
    orphanAuthorityPages: orphanPages.map((e) => e.path),
    summary: {
      avgPathwayReadiness: engagementScore,
      weakComparePairs: compareDepth.weakPairs.length,
    },
  };
}

export function authorityEngagementAuditMarkdown(report) {
  return [
    "# Authority engagement audit",
    "",
    `Engagement score: **${report.engagementScore}/100**`,
    "",
    "## Learning pathways",
    "",
    `| Pathway | Ready steps |`,
    `| --- | --- |`,
    `| Beginner | ${report.pathways?.beginner?.ready}/${report.pathways?.beginner?.total} |`,
    `| Charging | ${report.pathways?.charging?.ready}/${report.pathways?.charging?.total} |`,
    `| Ownership | ${report.pathways?.ownership?.ready}/${report.pathways?.ownership?.total} |`,
    `| EV myths | ${report.pathways?.evMyths?.ready}/${report.pathways?.evMyths?.total} |`,
    "",
    `Weak compare pairs: **${report.summary?.weakComparePairs}**`,
  ].join("\n");
}
