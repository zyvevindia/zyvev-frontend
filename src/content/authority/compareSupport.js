/**
 * Compare-support authority mapping — educational links per compare journey.
 */

import { GENERATED_COMPARE_SLUGS } from "../generated/manifest.js";
import { BEGINNER_EV_TOPICS } from "./beginnerTopics.js";
import { CHARGING_GUIDE_TOPICS } from "./chargingTopics.js";
import { OWNERSHIP_EXPLAINER_TOPICS } from "./ownershipGuidance.js";
import { EV_MYTH_TOPICS, EV_MYTH_HUB_TOPIC } from "./evMythTopics.js";
import { AUTHORITY_CLUSTER_ID } from "./metadata.js";

/** Concern → topic ids for deterministic mapping. */
const CONCERN_TOPIC_MAP = Object.freeze({
  apartment_charging: [
    "apartment-ev-suitability",
    "apartment-charging-setup",
    "ownership-society-rwa",
  ],
  home_charging: ["home-charging-basics", "home-charging-explained"],
  running_cost: ["ev-vs-petrol-running-cost", "ev-charging-cost-india", "ownership-running-cost-reality"],
  highway_range: ["public-charging-guide", "ownership-highway-reality", "fast-vs-slow-charging"],
  beginner_overwhelm: ["how-evs-work", "ev-ownership-for-beginners"],
  battery_anxiety: ["ev-battery-lifespan", "ownership-battery-health"],
  charging_confusion: ["ev-charging-types-explained", "fast-vs-slow-charging"],
  unsafe_charging_habits: ["extension-board-charging-risks", "overnight-charging-safety"],
  charging_anxiety: [
    "ev-charging-types-explained",
    "myth-apartment-charging-impossible",
    "myth-fire-risk",
  ],
  range_anxiety: ["myth-highway-practicality", "myth-battery-dies-quickly", "public-charging-guide"],
  safety_anxiety: ["myth-rain-flood-safety", "myth-fire-risk"],
  resale_anxiety: ["myth-resale-value-loss", "myth-battery-replacement-cost"],
  first_time_hesitation: ["ev-ownership-for-beginners", "ev-myths-hub", "how-evs-work"],
});

/** Tier-1 and high-traffic compare pairs — extend as manifest grows. */
export const PRIORITY_COMPARE_PAIRS = Object.freeze([
  "tata-nexon-ev-vs-mg-zs-ev",
  "tata-punch-ev-vs-tata-nexon-ev",
  "tata-curvv-ev-vs-byd-atto-3",
  "mg-zs-ev-vs-byd-atto-3",
  "nexon-ev-vs-mg-zs-ev",
  "byd-atto-3-vs-mg-zs-ev",
]);

function topicById(id) {
  return (
    BEGINNER_EV_TOPICS.find((t) => t.id === id) ||
    CHARGING_GUIDE_TOPICS.find((t) => t.id === id) ||
    OWNERSHIP_EXPLAINER_TOPICS.find((t) => t.id === id) ||
    EV_MYTH_TOPICS.find((t) => t.id === id) ||
    (id === EV_MYTH_HUB_TOPIC.id ? EV_MYTH_HUB_TOPIC : null) ||
    null
  );
}

function inferConcernsFromCompareSlug(slug = "") {
  const s = String(slug).toLowerCase();
  const concerns = ["running_cost", "beginner_overwhelm", "first_time_hesitation"];
  if (s.includes("punch") || s.includes("comet") || s.includes("tiago")) {
    concerns.push("apartment_charging", "home_charging");
  }
  if (s.includes("curvv") || s.includes("zs") || s.includes("atto") || s.includes("nexon")) {
    concerns.push("highway_range", "battery_anxiety", "range_anxiety");
  }
  if (s.includes("rain") || s.includes("monsoon")) {
    concerns.push("safety_anxiety");
  }
  if (s.includes("apartment") || s.includes("society")) {
    concerns.push("apartment_charging");
  }
  return [...new Set(concerns)];
}

/**
 * @param {string} compareSlug
 * @returns {{ compareSlug: string, beginner: object[], charging: object[], ownership: object[], gaps: string[] }}
 */
export function mapCompareSupportAuthority(compareSlug) {
  const concerns = inferConcernsFromCompareSlug(compareSlug);
  const topicIds = new Set();
  for (const c of concerns) {
    for (const id of CONCERN_TOPIC_MAP[c] || []) {
      topicIds.add(id);
    }
  }

  const beginner = [];
  const charging = [];
  const ownership = [];
  const gaps = [];

  for (const id of topicIds) {
    const t = topicById(id);
    if (!t) {
      gaps.push(`missing_topic:${id}`);
      continue;
    }
    const row = {
      id: t.id,
      title: t.title,
      href: t.canonicalPath || null,
      readiness: t.readiness,
      compareSupportRelevance: t.compareSupportRelevance,
    };
    if (!row.href) gaps.push(`no_path:${id}`);
    if (
      t.cluster === AUTHORITY_CLUSTER_ID.BEGINNER_EDUCATION ||
      t.cluster === AUTHORITY_CLUSTER_ID.EV_MYTHS
    ) {
      beginner.push(row);
    } else if (t.cluster === AUTHORITY_CLUSTER_ID.CHARGING_GUIDES) charging.push(row);
    else ownership.push(row);
  }

  return {
    compareSlug,
    inManifest: GENERATED_COMPARE_SLUGS.includes(compareSlug),
    beginner: beginner.slice(0, 3),
    charging: charging.slice(0, 3),
    ownership: ownership.slice(0, 3),
    gaps,
    supportScore:
      beginner.length + charging.length + ownership.length >= 4
        ? "adequate"
        : beginner.length + charging.length + ownership.length >= 2
          ? "partial"
          : "weak",
  };
}

/**
 * Audit all priority pairs + sample of manifest compares.
 */
export function buildCompareSupportAuthorityAudit() {
  const slugs = [
    ...new Set([
      ...PRIORITY_COMPARE_PAIRS,
      ...GENERATED_COMPARE_SLUGS.slice(0, 24),
    ]),
  ];
  const mappings = slugs.map(mapCompareSupportAuthority);
  const weak = mappings.filter((m) => m.supportScore === "weak");
  const unsupported = mappings.filter(
    (m) => m.gaps.length > 0 || !m.inManifest
  );

  return {
    pairCount: mappings.length,
    weakPairs: weak.map((m) => m.compareSlug),
    unsupportedConcerns: unsupported.slice(0, 12),
    mappings,
    summary: {
      adequate: mappings.filter((m) => m.supportScore === "adequate").length,
      partial: mappings.filter((m) => m.supportScore === "partial").length,
      weak: weak.length,
    },
  };
}
