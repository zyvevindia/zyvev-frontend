/**
 * Authority depth scoring — concern coverage & beginner completeness.
 */

import { AUTHORITY_CONCERN_ID, AUTHORITY_CLUSTER_ID } from "./metadata.js";
import { BEGINNER_EV_TOPICS } from "./beginnerTopics.js";
import { CHARGING_GUIDE_TOPICS } from "./chargingTopics.js";
import { OWNERSHIP_EXPLAINER_TOPICS } from "./ownershipGuidance.js";
import { EV_MYTH_TOPICS, EV_MYTH_HUB_TOPIC } from "./evMythTopics.js";

const ALL_TOPICS_FLAT = [
  ...BEGINNER_EV_TOPICS,
  ...CHARGING_GUIDE_TOPICS,
  ...OWNERSHIP_EXPLAINER_TOPICS,
  EV_MYTH_HUB_TOPIC,
  ...EV_MYTH_TOPICS,
];
import { buildTopicRelationRows, scoreClusterSemanticDepth } from "./topicRelations.js";
import { isAuthorityTopicRouteReady } from "./routeReadiness.js";

export const CONCERN_COVERAGE_MAP = Object.freeze({
  [AUTHORITY_CONCERN_ID.APARTMENT_CHARGING]: [
    "apartment-ev-suitability",
    "apartment-charging-setup",
    "myth-apartment-charging-impossible",
    "ownership-society-rwa",
  ],
  [AUTHORITY_CONCERN_ID.OFFICE_COMMUTE]: [
    "ev-city-commute",
    "home-charging-basics",
    "ev-charging-cost-india",
  ],
  [AUTHORITY_CONCERN_ID.FAMILY_PRACTICALITY]: ["ownership-family", "myth-highway-practicality"],
  [AUTHORITY_CONCERN_ID.LONG_DISTANCE]: [
    "myth-highway-practicality",
    "ownership-highway-reality",
    "public-charging-guide",
  ],
  [AUTHORITY_CONCERN_ID.FIRST_TIME_HESITATION]: [
    "ev-ownership-for-beginners",
    "how-evs-work",
    "ev-myths-hub",
  ],
  [AUTHORITY_CONCERN_ID.CHARGING_ANXIETY]: [
    "ev-charging-types-explained",
    "myth-apartment-charging-impossible",
    "extension-board-charging-risks",
  ],
  [AUTHORITY_CONCERN_ID.RANGE_ANXIETY]: [
    "myth-highway-practicality",
    "myth-battery-dies-quickly",
  ],
  [AUTHORITY_CONCERN_ID.BATTERY_ANXIETY]: [
    "ev-battery-lifespan",
    "myth-battery-dies-quickly",
    "myth-battery-replacement-cost",
  ],
  [AUTHORITY_CONCERN_ID.RESALE_ANXIETY]: ["myth-resale-value-loss"],
  [AUTHORITY_CONCERN_ID.SAFETY_ANXIETY]: ["myth-rain-flood-safety", "myth-fire-risk"],
});

const TOPIC_BY_ID = new Map(ALL_TOPICS_FLAT.map((t) => [t.id, t]));

function topicPublished(id) {
  const t = TOPIC_BY_ID.get(id);
  return t ? isAuthorityTopicRouteReady(t) : false;
}

export function scoreConcernCoverage() {
  const covered = [];
  const gaps = [];
  for (const [concern, topicIds] of Object.entries(CONCERN_COVERAGE_MAP)) {
    if (topicIds.some((id) => topicPublished(id))) covered.push(concern);
    else gaps.push(concern);
  }
  const total = Object.keys(CONCERN_COVERAGE_MAP).length;
  return { score: Math.round((covered.length / total) * 100), covered, gaps };
}

export function scoreBeginnerConcernCompleteness() {
  const beginnerTopics = ALL_TOPICS_FLAT.filter(
    (t) => t.cluster === AUTHORITY_CLUSTER_ID.BEGINNER_EDUCATION
  );
  const ready = beginnerTopics.filter((t) => topicPublished(t.id)).length;
  const mythsReady = EV_MYTH_TOPICS.filter((t) => topicPublished(t.id)).length;
  const total = beginnerTopics.length + EV_MYTH_TOPICS.length;
  return {
    beginnerReady: ready,
    beginnerTotal: beginnerTopics.length,
    mythsReady,
    mythsTotal: EV_MYTH_TOPICS.length,
    completenessPercent: Math.round(((ready + mythsReady) / Math.max(total, 1)) * 100),
  };
}

export function scoreAuthorityDepth() {
  const concern = scoreConcernCoverage();
  const beginner = scoreBeginnerConcernCompleteness();
  const mythCluster = [EV_MYTH_HUB_TOPIC, ...EV_MYTH_TOPICS];
  const mythDepth = scoreClusterSemanticDepth(mythCluster);
  const relations = buildTopicRelationRows(ALL_TOPICS_FLAT);
  const avgRelations =
    relations.reduce((s, r) => s + r.relatedCount, 0) / Math.max(relations.length, 1);

  const depthScore = Math.round(
    concern.score * 0.35 +
      beginner.completenessPercent * 0.25 +
      mythDepth * 0.25 +
      Math.min(100, avgRelations * 25) * 0.15
  );

  return {
    depthScore,
    concernCoverage: concern,
    beginnerCompleteness: beginner,
    mythClusterDepth: mythDepth,
    avgTopicRelations: Math.round(avgRelations * 10) / 10,
    thinClusters: mythDepth < 60 ? ["ev_myths"] : [],
  };
}

export function generateAuthorityDepthAuditReport() {
  const depth = scoreAuthorityDepth();
  return {
    generatedAt: new Date().toISOString(),
    reportType: "authority-depth",
    ...depth,
    mythPages: EV_MYTH_TOPICS.map((t) => ({
      id: t.id,
      path: t.canonicalPath,
      routeReady: topicPublished(t.id),
    })),
    hubReady: topicPublished(EV_MYTH_HUB_TOPIC.id),
    topicRelations: buildTopicRelationRows([
      ...ALL_TOPICS_FLAT,
    ]).slice(0, 30),
  };
}

export function authorityDepthAuditMarkdown(report) {
  return [
    "# Authority depth audit",
    "",
    `Depth score: **${report.depthScore}/100**`,
    `Concern coverage: **${report.concernCoverage?.score}%**`,
    `Myth cluster: **${report.mythClusterDepth}%**`,
    `Hub ready: **${report.hubReady ? "yes" : "no"}**`,
    "",
    "## Myth pages",
    "",
    ...(report.mythPages || []).map(
      (m) => `- ${m.id}: ${m.routeReady ? "ready" : "gap"}`
    ),
  ].join("\n");
}
