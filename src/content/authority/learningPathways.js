/**
 * Beginner / charging / ownership learning pathways — engagement without nav redesign.
 */

export const LEARNING_PATHWAY_ID = Object.freeze({
  BEGINNER: "beginner",
  CHARGING: "charging",
  OWNERSHIP: "ownership",
  EV_MYTHS: "ev_myths",
});

export const BEGINNER_LEARNING_PATHWAY = Object.freeze([
  { step: 1, label: "How EVs work", href: "/ownership-guides/how-evs-work" },
  { step: 2, label: "Charging types explained", href: "/charging-guides/charging-types" },
  { step: 3, label: "Running cost reality", href: "/ownership-guides/running-cost" },
  { step: 4, label: "First-time buyer guide", href: "/ownership-guides/first-time-buyers" },
  { step: 5, label: "Compare EVs", href: "/compare" },
]);

export const CHARGING_LEARNING_PATHWAY = Object.freeze([
  { step: 1, label: "Home charging", href: "/charging-guides/home-charging" },
  { step: 2, label: "Fast vs slow charging", href: "/charging-guides/fast-vs-slow" },
  { step: 3, label: "Apartment setup", href: "/charging-guides/apartment-setup" },
  { step: 4, label: "Overnight safety", href: "/charging-guides/overnight-safety" },
  { step: 5, label: "Public charging", href: "/charging-guides/public-charging" },
]);

export const OWNERSHIP_LEARNING_PATHWAY = Object.freeze([
  { step: 1, label: "Apartment suitability", href: "/ownership-guides/apartment-suitability" },
  { step: 2, label: "City commute ownership", href: "/ownership-guides/city-commute" },
  { step: 3, label: "Family ownership", href: "/ownership-guides/family-ownership" },
  { step: 4, label: "Highway ownership", href: "/ownership-guides/highway-ownership" },
  { step: 5, label: "Battery lifespan", href: "/ownership-guides/battery-lifespan" },
]);

export const EV_MYTHS_PATHWAY = Object.freeze([
  { step: 1, label: "EV myths hub", href: "/ownership-guides/ev-myths" },
  { step: 2, label: "Battery myth", href: "/ownership-guides/myth-battery-dies-quickly" },
  { step: 3, label: "Apartment charging myth", href: "/ownership-guides/myth-apartment-charging-impossible" },
  { step: 4, label: "Highway myth", href: "/ownership-guides/myth-highway-practicality" },
  { step: 5, label: "Compare with context", href: "/compare" },
]);

const PATHWAY_BY_ID = {
  [LEARNING_PATHWAY_ID.BEGINNER]: BEGINNER_LEARNING_PATHWAY,
  [LEARNING_PATHWAY_ID.CHARGING]: CHARGING_LEARNING_PATHWAY,
  [LEARNING_PATHWAY_ID.OWNERSHIP]: OWNERSHIP_LEARNING_PATHWAY,
  [LEARNING_PATHWAY_ID.EV_MYTHS]: EV_MYTHS_PATHWAY,
};

/**
 * @param {string} pathwayId
 * @param {string} [currentHref]
 */
export function getLearningPathway(pathwayId, currentHref = "") {
  const steps = PATHWAY_BY_ID[pathwayId] || [];
  const continueLearning = steps
    .filter((s) => s.href !== currentHref)
    .slice(0, 4);
  return { pathwayId, steps, continueLearning };
}

export function resolvePathwayForTopic(topic = {}) {
  if (topic.cluster === "ev_myths" || topic.learningPathwayId === "ev_myths") {
    return LEARNING_PATHWAY_ID.EV_MYTHS;
  }
  if (topic.cluster === "charging_guides") return LEARNING_PATHWAY_ID.CHARGING;
  if (topic.cluster === "ownership_explainers") return LEARNING_PATHWAY_ID.OWNERSHIP;
  return LEARNING_PATHWAY_ID.BEGINNER;
}
