/**
 * Ownership guidance metadata — usage scenarios and friendliness flags.
 */

import {
  AUTHORITY_CLUSTER_ID,
  baseTopicMeta,
  COMPARE_SUPPORT_RELEVANCE,
  CONTENT_INTENT,
  DIFFICULTY,
  OWNERSHIP_STAGE,
  READINESS_STATUS,
  SEO_PRIORITY,
} from "./metadata.js";

/** @typedef {object} OwnershipFriendlinessFlags */
export const OWNERSHIP_USAGE_SCENARIOS = Object.freeze([
  {
    id: "city_usage",
    label: "City usage",
    description: "Stop-start traffic, short trips, parking constraints.",
    flags: {
      cityFriendly: true,
      beginnerFriendly: true,
      apartmentFriendly: true,
      familyFriendly: false,
      highwayFriendly: false,
    },
    discoveryPath: "/discover/city-driving",
    topicIds: ["ev-vs-petrol-running-cost", "home-charging-basics"],
  },
  {
    id: "family_usage",
    label: "Family usage",
    description: "Space, safety, school runs, occasional highway.",
    flags: {
      cityFriendly: true,
      beginnerFriendly: true,
      apartmentFriendly: true,
      familyFriendly: true,
      highwayFriendly: true,
    },
    discoveryPath: "/discover/family-friendly",
    topicIds: ["ev-ownership-for-beginners", "ev-maintenance-explained"],
  },
  {
    id: "office_commute",
    label: "Office commute",
    description: "Predictable daily km, overnight charging fit.",
    flags: {
      cityFriendly: true,
      beginnerFriendly: true,
      apartmentFriendly: true,
      familyFriendly: false,
      highwayFriendly: false,
    },
    discoveryPath: "/discover/city-driving",
    topicIds: ["home-charging-basics", "ev-charging-cost-india"],
  },
  {
    id: "apartment_ownership",
    label: "Apartment ownership",
    description: "Society charging, permissions, public backup.",
    flags: {
      cityFriendly: true,
      beginnerFriendly: true,
      apartmentFriendly: true,
      familyFriendly: false,
      highwayFriendly: false,
    },
    discoveryPath: "/discover/apartment-living",
    topicIds: ["apartment-ev-suitability", "apartment-charging-setup"],
  },
  {
    id: "long_distance",
    label: "Long-distance usage",
    description: "Highway legs, DC planning, realistic range.",
    flags: {
      cityFriendly: false,
      beginnerFriendly: false,
      apartmentFriendly: false,
      familyFriendly: true,
      highwayFriendly: true,
    },
    discoveryPath: "/discover/highway-evs",
    topicIds: ["public-charging-guide", "fast-vs-slow-charging"],
  },
  {
    id: "beginner_confidence",
    label: "Beginner confidence",
    description: "First EV purchase — reduce overwhelm before compare.",
    flags: {
      cityFriendly: true,
      beginnerFriendly: true,
      apartmentFriendly: true,
      familyFriendly: true,
      highwayFriendly: false,
    },
    discoveryPath: "/discover/under-15-lakh",
    topicIds: ["how-evs-work", "ev-ownership-for-beginners"],
  },
]);

export const OWNERSHIP_EXPLAINER_TOPICS = Object.freeze([
  baseTopicMeta({
    id: "ownership-running-cost-reality",
    title: "Running cost & TCO reality",
    cluster: AUTHORITY_CLUSTER_ID.OWNERSHIP_EXPLAINERS,
    intent: CONTENT_INTENT.OWNERSHIP_REALISM,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.SHORTLIST,
    seoPriority: SEO_PRIORITY.P0,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/ownership-guides/running-cost",
    contentSlug: "ownership-running-cost",
    readiness: READINESS_STATUS.PUBLISHED,
    apartmentFriendly: true,
    beginnerFriendly: true,
    familyFriendly: true,
    highwayFriendly: true,
    cityFriendly: true,
    compareConcerns: ["running_cost", "tco"],
  }),
  baseTopicMeta({
    id: "ownership-highway-reality",
    title: "Highway ownership reality",
    cluster: AUTHORITY_CLUSTER_ID.OWNERSHIP_EXPLAINERS,
    intent: CONTENT_INTENT.OWNERSHIP_REALISM,
    difficulty: DIFFICULTY.INTERMEDIATE,
    ownershipStage: OWNERSHIP_STAGE.SHORTLIST,
    seoPriority: SEO_PRIORITY.P1,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/ownership-guides/highway-ownership",
    contentSlug: "ownership-highway-ownership",
    readiness: READINESS_STATUS.PUBLISHED,
    highwayFriendly: true,
    familyFriendly: true,
    cityFriendly: false,
    beginnerFriendly: false,
    apartmentFriendly: false,
    compareConcerns: ["highway_range", "trip_planning"],
  }),
  baseTopicMeta({
    id: "ownership-society-rwa",
    title: "Society & RWA charging approvals",
    cluster: AUTHORITY_CLUSTER_ID.OWNERSHIP_EXPLAINERS,
    intent: CONTENT_INTENT.COMPARE_SUPPORT,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.PRE_PURCHASE,
    seoPriority: SEO_PRIORITY.P0,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/ownership-guides/society-rwa",
    contentSlug: "ownership-society-rwa",
    readiness: READINESS_STATUS.PUBLISHED,
    apartmentFriendly: true,
    beginnerFriendly: true,
    cityFriendly: true,
    compareConcerns: ["apartment_charging"],
  }),
  baseTopicMeta({
    id: "ownership-city-commute",
    title: "EV ownership for city commute",
    cluster: AUTHORITY_CLUSTER_ID.OWNERSHIP_EXPLAINERS,
    intent: CONTENT_INTENT.OWNERSHIP_REALISM,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.OWNERSHIP,
    seoPriority: SEO_PRIORITY.P0,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/ownership-guides/city-commute",
    contentSlug: "authority-city-commute",
    readiness: READINESS_STATUS.PUBLISHED,
    cityFriendly: true,
    beginnerFriendly: true,
    compareConcerns: ["city_commute", "running_cost"],
  }),
  baseTopicMeta({
    id: "ownership-family",
    title: "EV ownership for families",
    cluster: AUTHORITY_CLUSTER_ID.OWNERSHIP_EXPLAINERS,
    intent: CONTENT_INTENT.OWNERSHIP_REALISM,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.SHORTLIST,
    seoPriority: SEO_PRIORITY.P0,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/ownership-guides/family-ownership",
    contentSlug: "authority-family-ownership",
    readiness: READINESS_STATUS.PUBLISHED,
    familyFriendly: true,
    highwayFriendly: true,
    compareConcerns: ["family_space", "highway_trips"],
  }),
  baseTopicMeta({
    id: "ownership-battery-health",
    title: "Battery health over years",
    cluster: AUTHORITY_CLUSTER_ID.OWNERSHIP_EXPLAINERS,
    intent: CONTENT_INTENT.OWNERSHIP_REALISM,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.OWNERSHIP,
    seoPriority: SEO_PRIORITY.P1,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.MEDIUM,
    canonicalPath: "/ownership-guides/battery-health",
    contentSlug: "ownership-battery-health",
    readiness: READINESS_STATUS.PUBLISHED,
    beginnerFriendly: true,
    compareConcerns: ["battery_anxiety"],
  }),
]);

/**
 * Resolve friendliness flags for a topic (defaults false).
 * @param {object} topic
 */
export function getOwnershipFriendlinessFlags(topic = {}) {
  return {
    apartmentFriendly: Boolean(topic.apartmentFriendly),
    beginnerFriendly: Boolean(topic.beginnerFriendly),
    familyFriendly: Boolean(topic.familyFriendly),
    highwayFriendly: Boolean(topic.highwayFriendly),
    cityFriendly: Boolean(topic.cityFriendly),
  };
}

export function matchScenariosByFlags(flags = {}) {
  return OWNERSHIP_USAGE_SCENARIOS.filter((s) =>
    Object.entries(flags).every(([k, v]) => !v || s.flags[k])
  );
}
