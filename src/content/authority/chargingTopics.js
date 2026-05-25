/**
 * Charging guide taxonomy, intents, FAQ structure, and schema hints.
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

/** High-level charging taxonomy for SEO and internal linking. */
export const CHARGING_GUIDE_TAXONOMY = Object.freeze({
  setup: {
    label: "Setup & installation",
    topicIds: ["home-charging-explained", "apartment-charging-setup"],
  },
  speed_and_network: {
    label: "Speed & public network",
    topicIds: ["fast-vs-slow-charging", "public-charging-guide"],
  },
  cost_and_safety: {
    label: "Cost & safety",
    topicIds: [
      "ev-charging-cost-india",
      "overnight-charging-safety",
      "rain-water-charging-myths",
      "extension-board-charging-risks",
    ],
  },
});

/** Search / buyer intent → topic mapping. */
export const CHARGING_INTENT_MAP = Object.freeze([
  {
    intent: "home_charger_setup",
    queries: ["home ev charger", "wallbox india", "install ev charger"],
    topicIds: ["home-charging-explained", "apartment-charging-setup"],
  },
  {
    intent: "charging_speed",
    queries: ["fast charging vs slow", "dc fast charge time"],
    topicIds: ["fast-vs-slow-charging"],
  },
  {
    intent: "public_charging",
    queries: ["public ev charging india", "highway charging stops"],
    topicIds: ["public-charging-guide"],
  },
  {
    intent: "charging_cost",
    queries: ["ev charging cost per km", "electricity bill ev"],
    topicIds: ["ev-charging-cost-india"],
  },
  {
    intent: "charging_safety",
    queries: ["rain charging ev safe", "extension board ev"],
    topicIds: ["overnight-charging-safety", "rain-water-charging-myths", "extension-board-charging-risks"],
  },
]);

/** FAQ block structure for human review + JSON-LD preparation. */
export const CHARGING_FAQ_STRUCTURE = Object.freeze({
  schemaType: "FAQPage",
  fields: ["question", "answer", "caveat", "sourcesToVerify"],
  templates: [
    {
      id: "home_ac_safe",
      question: "Is AC home charging safe for Indian homes?",
      caveat: "Depends on wiring, load, and certified installer — verify locally.",
    },
    {
      id: "apartment_permission",
      question: "Do apartments need society approval for EV charging?",
      caveat: "Policies vary by RWA/building; document permissions before purchase.",
    },
    {
      id: "rain_charging",
      question: "Is charging in rain safe?",
      caveat: "Use OEM-approved equipment; avoid ad-hoc extension setups.",
    },
  ],
});

export const CHARGING_GUIDE_TOPICS = Object.freeze([
  baseTopicMeta({
    id: "home-charging-explained",
    title: "Home charging explained",
    cluster: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    intent: CONTENT_INTENT.EDUCATE,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.PRE_PURCHASE,
    seoPriority: SEO_PRIORITY.P0,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/charging-guides/home-charging",
    contentSlug: "best-evs-for-home-charging",
    readiness: READINESS_STATUS.PUBLISHED,
    reviewSections: ["Setup options", "Typical costs", "When home charging is enough"],
    compareConcerns: ["home_charging"],
  }),
  baseTopicMeta({
    id: "fast-vs-slow-charging",
    title: "Fast charging vs slow charging",
    cluster: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    intent: CONTENT_INTENT.EDUCATE,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.RESEARCH,
    seoPriority: SEO_PRIORITY.P1,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/charging-guides/fast-vs-slow",
    contentSlug: "authority-fast-vs-slow",
    readiness: READINESS_STATUS.PUBLISHED,
    reviewSections: ["AC overnight habits", "DC highway stops", "Battery care trade-offs"],
    compareConcerns: ["fast_charging_expectations"],
  }),
  baseTopicMeta({
    id: "public-charging-guide",
    title: "Public charging guide",
    cluster: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    intent: CONTENT_INTENT.EDUCATE,
    difficulty: DIFFICULTY.INTERMEDIATE,
    ownershipStage: OWNERSHIP_STAGE.OWNERSHIP,
    seoPriority: SEO_PRIORITY.P1,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.MEDIUM,
    canonicalPath: "/charging-guides/public-charging",
    contentSlug: "authority-public-charging",
    readiness: READINESS_STATUS.PUBLISHED,
    reviewSections: ["Apps and networks", "Planning highway legs", "Fallback planning"],
    compareConcerns: ["highway_anxiety", "public_network_gaps"],
  }),
  baseTopicMeta({
    id: "apartment-charging-setup",
    title: "Apartment charging setup",
    cluster: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    intent: CONTENT_INTENT.COMPARE_SUPPORT,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.PRE_PURCHASE,
    seoPriority: SEO_PRIORITY.P0,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/charging-guides/apartment-setup",
    contentSlug: "authority-apartment-setup",
    readiness: READINESS_STATUS.PUBLISHED,
    reviewSections: ["RWA steps", "Shared vs dedicated parking", "Backup public charging"],
    compareConcerns: ["apartment_charging"],
  }),
  baseTopicMeta({
    id: "ev-charging-cost-india",
    title: "EV charging cost in India",
    cluster: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    intent: CONTENT_INTENT.OWNERSHIP_REALISM,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.SHORTLIST,
    seoPriority: SEO_PRIORITY.P0,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/ownership-guides/running-cost",
    contentSlug: "ownership-running-cost",
    readiness: READINESS_STATUS.PUBLISHED,
    reviewSections: ["Home tariff worked example", "Public DC cost caveats"],
    compareConcerns: ["running_cost"],
  }),
  baseTopicMeta({
    id: "overnight-charging-safety",
    title: "Overnight charging safety",
    cluster: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    intent: CONTENT_INTENT.SAFETY_MYTH_BUST,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.OWNERSHIP,
    seoPriority: SEO_PRIORITY.P1,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.MEDIUM,
    canonicalPath: "/charging-guides/overnight-safety",
    contentSlug: "authority-overnight-safety",
    readiness: READINESS_STATUS.PUBLISHED,
    reviewSections: ["Certified hardware", "Load management", "When to stop using workarounds"],
    compareConcerns: ["safety_fear"],
  }),
  baseTopicMeta({
    id: "rain-water-charging-myths",
    title: "Rain & water charging myths",
    cluster: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    intent: CONTENT_INTENT.SAFETY_MYTH_BUST,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.OWNERSHIP,
    seoPriority: SEO_PRIORITY.P2,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.MEDIUM,
    canonicalPath: "/ownership-guides/monsoon-driving",
    contentSlug: "ownership-monsoon-driving",
    readiness: READINESS_STATUS.PUBLISHED,
    reviewSections: ["Monsoon habits", "Equipment ratings", "What not to do"],
    compareConcerns: ["monsoon_range", "charging_fear"],
  }),
  baseTopicMeta({
    id: "extension-board-charging-risks",
    title: "Extension board charging risks",
    cluster: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    intent: CONTENT_INTENT.SAFETY_MYTH_BUST,
    difficulty: DIFFICULTY.BEGINNER,
    ownershipStage: OWNERSHIP_STAGE.PRE_PURCHASE,
    seoPriority: SEO_PRIORITY.P1,
    compareSupportRelevance: COMPARE_SUPPORT_RELEVANCE.HIGH,
    canonicalPath: "/charging-guides/extension-board-risks",
    contentSlug: "authority-extension-risks",
    readiness: READINESS_STATUS.PUBLISHED,
    reviewSections: ["Fire and overload risk", "OEM guidance", "Safer alternatives"],
    compareConcerns: ["unsafe_charging_habits"],
    editorialNotes: "Strong calm warning tone — no fearmongering, cite certified install paths.",
  }),
]);

export function getChargingTopic(id) {
  return CHARGING_GUIDE_TOPICS.find((t) => t.id === id) || null;
}
