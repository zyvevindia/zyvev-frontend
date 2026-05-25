/**
 * Authority content module — Track B SEO activation.
 */

export * from "./metadata.js";
export * from "./clusters.js";
export * from "./beginnerTopics.js";
export * from "./chargingTopics.js";
export * from "./ownershipGuidance.js";
export * from "./compareSupport.js";
export * from "./guideTargets.js";
export * from "./internalLinks.js";
export * from "./routeReadiness.js";
export * from "./evMythTopics.js";
export * from "./learningPathways.js";
export * from "./topicRelations.js";
export * from "./depthScoring.js";
export * from "./editorialQuality.js";
export * from "./compareAuthorityDepth.js";

import { BEGINNER_EV_TOPICS } from "./beginnerTopics.js";
import { CHARGING_GUIDE_TOPICS } from "./chargingTopics.js";
import { OWNERSHIP_EXPLAINER_TOPICS } from "./ownershipGuidance.js";
import { EV_MYTH_TOPICS, EV_MYTH_HUB_TOPIC } from "./evMythTopics.js";
import { AUTHORITY_CLUSTERS } from "./clusters.js";

export const ALL_AUTHORITY_TOPICS = Object.freeze([
  ...BEGINNER_EV_TOPICS,
  ...CHARGING_GUIDE_TOPICS,
  ...OWNERSHIP_EXPLAINER_TOPICS,
  EV_MYTH_HUB_TOPIC,
  ...EV_MYTH_TOPICS,
]);

export function listTopicsByCluster(clusterId) {
  return ALL_AUTHORITY_TOPICS.filter((t) => t.cluster === clusterId);
}

export function getAuthorityArchitectureSummary() {
  return {
    clusters: AUTHORITY_CLUSTERS.map((c) => ({
      id: c.id,
      label: c.label,
      topicCount: listTopicsByCluster(c.id).length,
    })),
    totalTopics: ALL_AUTHORITY_TOPICS.length,
    publishedTopics: ALL_AUTHORITY_TOPICS.filter(
      (t) => t.readiness === "published" && t.canonicalPath
    ).length,
    structuredTopics: ALL_AUTHORITY_TOPICS.filter(
      (t) => t.readiness === "structured"
    ).length,
  };
}
