/**
 * Controlled authority guide targets — single source for ops + SEO.
 * Extends legacy targets; paths prefer canonical discovery routes.
 */

import { BEGINNER_EV_TOPICS } from "./beginnerTopics.js";
import { CHARGING_GUIDE_TOPICS } from "./chargingTopics.js";
import { OWNERSHIP_EXPLAINER_TOPICS } from "./ownershipGuidance.js";
import { EV_MYTH_HUB_TOPIC } from "./evMythTopics.js";

/** Legacy + cluster targets used by seoAuthorityOps and coverage audits. */
const LEGACY_GUIDE_TARGETS = Object.freeze([
  {
    id: "best_ev_under_10_lakh",
    title: "Best EV under ₹10 lakh",
    path: "/best-evs/under-10-lakh",
    cluster: "best_ev_authority",
    linkFrom: ["/discover/under-15-lakh", "/compare"],
  },
  {
    id: "best_ev_city",
    title: "Best EV for city driving",
    path: "/discover/city-driving",
    cluster: "discovery",
    linkFrom: ["/compare", "/charging-guides/home-charging"],
  },
  {
    id: "best_ev_highway",
    title: "Best EV for highway driving",
    path: "/discover/highway-evs",
    cluster: "discovery",
    linkFrom: ["/compare", "/ownership-guides/highway-ownership"],
  },
  {
    id: "best_ev_family",
    title: "Best EV for family",
    path: "/discover/family-friendly",
    cluster: "discovery",
    linkFrom: ["/compare", "/best-evs/large-family"],
  },
]);

function topicToGuideTarget(topic, clusterKey) {
  if (!topic.canonicalPath) return null;
  return {
    id: topic.id,
    title: topic.title,
    path: topic.canonicalPath,
    cluster: clusterKey,
    linkFrom: topic.linkFrom || ["/compare", "/guides"],
    contentSlug: topic.contentSlug || null,
    seoPriority: topic.seoPriority,
    compareSupportRelevance: topic.compareSupportRelevance,
  };
}

function buildFromTopics(topics, clusterKey) {
  return topics
    .map((t) => topicToGuideTarget(t, clusterKey))
    .filter(Boolean);
}

function dedupeGuideTargets(targets) {
  const byId = new Map();
  for (const t of targets) {
    if (!byId.has(t.id)) byId.set(t.id, t);
  }
  return [...byId.values()];
}

export const AUTHORITY_GUIDE_TARGETS = Object.freeze(
  dedupeGuideTargets([
    ...LEGACY_GUIDE_TARGETS,
    ...buildFromTopics(BEGINNER_EV_TOPICS, "beginner"),
    ...buildFromTopics(CHARGING_GUIDE_TOPICS, "charging"),
  ...buildFromTopics(OWNERSHIP_EXPLAINER_TOPICS, "ownership"),
  topicToGuideTarget(EV_MYTH_HUB_TOPIC, "ev_myths"),
  {
      id: "city_vs_highway",
      title: "City vs highway suitability",
      path: "/discover/city-driving",
      cluster: "suitability",
      linkFrom: ["/compare", "/discover/highway-evs"],
    },
  ])
);
