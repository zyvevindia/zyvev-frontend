/**
 * Topic relationship graph — topical authority & internal-link density.
 */

import { EV_MYTH_TOPICS, EV_MYTH_HUB_TOPIC } from "./evMythTopics.js";
import { BEGINNER_EV_TOPICS } from "./beginnerTopics.js";
import { CHARGING_GUIDE_TOPICS } from "./chargingTopics.js";
import { OWNERSHIP_EXPLAINER_TOPICS } from "./ownershipGuidance.js";

/** @type {Record<string, string[]>} */
export const TOPIC_RELATIONSHIPS = Object.freeze({
  "how-evs-work": ["ev-charging-types-explained", "myth-battery-dies-quickly", "ev-ownership-for-beginners"],
  "ev-charging-types-explained": ["home-charging-explained", "fast-vs-slow-charging", "myth-apartment-charging-impossible"],
  "apartment-ev-suitability": ["apartment-charging-setup", "myth-apartment-charging-impossible", "ownership-society-rwa"],
  "ev-battery-lifespan": ["myth-battery-dies-quickly", "myth-battery-replacement-cost", "ownership-battery-health"],
  "myth-battery-dies-quickly": ["ev-battery-lifespan", "myth-battery-replacement-cost", "myth-resale-value-loss"],
  "myth-highway-practicality": ["ownership-highway-reality", "public-charging-guide", "myth-resale-value-loss"],
  "myth-fire-risk": ["myth-rain-flood-safety", "overnight-charging-safety", "extension-board-charging-risks"],
  "ev-myths-hub": EV_MYTH_TOPICS.map((t) => t.id),
  "ev-ownership-for-beginners": ["how-evs-work", "ev-myths-hub", "apartment-ev-suitability"],
});

export function getRelatedTopicIds(topicId) {
  return TOPIC_RELATIONSHIPS[topicId] || [];
}

export function buildTopicRelationRows(allTopics) {
  return allTopics.map((t) => ({
    id: t.id,
    cluster: t.cluster,
    path: t.canonicalPath,
    relatedIds: getRelatedTopicIds(t.id),
    relatedCount: getRelatedTopicIds(t.id).length,
  }));
}

export function scoreClusterSemanticDepth(topicsInCluster = []) {
  const withPath = topicsInCluster.filter((t) => t.canonicalPath).length;
  const withRelations = topicsInCluster.filter(
    (t) => getRelatedTopicIds(t.id).length >= 2
  ).length;
  const total = Math.max(topicsInCluster.length, 1);
  return Math.round(((withPath / total) * 50 + (withRelations / total) * 50));
}
