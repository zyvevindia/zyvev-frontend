/**
 * Compare ↔ guide authority links — controlled clusters only.
 */

import { buildComparePageAuthorityLinks } from "../content/authority/internalLinks.js";

const AUTHORITY_LINKS = Object.freeze([
  {
    id: "ownership_reality",
    label: "EV ownership reality",
    href: "/guides/ownership-running-cost",
    cluster: "ownership",
  },
  {
    id: "charging_practicality",
    label: "Charging practicality",
    href: "/charging-guides/home-charging",
    cluster: "charging",
  },
  {
    id: "apartment",
    label: "Apartment & society charging",
    href: "/guides/ownership-society-rwa",
    cluster: "apartment",
  },
  {
    id: "city_highway",
    label: "City vs highway EV use",
    href: "/discover/city-driving",
    cluster: "suitability",
  },
  {
    id: "highway",
    label: "Highway EV guidance",
    href: "/discover/highway-evs",
    cluster: "highway",
  },
  {
    id: "running_cost",
    label: "Running cost explainers",
    href: "/guides/ownership-running-cost",
    cluster: "ownership",
  },
  {
    id: "beginner",
    label: "First-time EV buyer tips",
    href: "/discover/under-15-lakh",
    cluster: "beginner",
  },
  {
    id: "family",
    label: "Family EV practicality",
    href: "/discover/family-friendly",
    cluster: "family",
  },
  {
    id: "long_trip",
    label: "Long-trip EV planning",
    href: "/guides/ownership-highway-ownership",
    cluster: "highway",
  },
  {
    id: "charging_myths",
    label: "EV charging myths",
    href: "/charging-guides/home-charging",
    cluster: "charging",
  },
  {
    id: "buying_decision",
    label: "EV buying decision guide",
    href: "/discover/under-15-lakh",
    cluster: "beginner",
  },
  {
    id: "ownership_decision",
    label: "Ownership decision support",
    href: "/guides/ownership-running-cost",
    cluster: "ownership",
  },
  {
    id: "charging_myths_detail",
    label: "Charging myths vs reality",
    href: "/charging-guides/home-charging",
    cluster: "charging",
  },
]);

const CROSS_CLUSTER_LINKS = Object.freeze({
  ownership_to_charging: {
    label: "Home & society charging",
    href: "/charging-guides/home-charging",
    cluster: "charging",
  },
  charging_to_ownership: {
    label: "Ownership cost reality",
    href: "/guides/ownership-running-cost",
    cluster: "ownership",
  },
});

/**
 * Pick 2–4 contextual guide links for a compare set (deterministic).
 * @param {object[]} cars
 * @param {string} [compareSlug] — when set, merges Track B educational mapping
 */
export function buildCompareAuthorityLinks(cars = [], compareSlug = "") {
  const picked = new Map();
  const addLink = (link) => {
    if (link?.href && !picked.has(link.href)) {
      picked.set(link.href, {
        id: link.id || link.href,
        label: link.label,
        href: link.href,
        cluster: link.cluster || "authority",
      });
    }
  };
  const add = (id) => {
    const link = AUTHORITY_LINKS.find((l) => l.id === id);
    if (link) addLink(link);
  };

  if (compareSlug) {
    for (const row of buildComparePageAuthorityLinks(compareSlug)) {
      addLink(row);
    }
  }

  add("ownership_reality");
  add("charging_practicality");

  const hasApartmentRisk = cars.some(
    (c) =>
      c?.evIntelligence?.chargingPracticality?.apartmentPracticality ===
        "limited" || c?.catalogMeta?.chargingPracticality?.apartment === "limited"
  );
  const highwayFocus = cars.some(
    (c) => (c?.evIntelligence?.scores?.highwayUsability ?? 0) >= 65
  );
  const cityFocus = cars.some(
    (c) => (c?.evIntelligence?.scores?.cityUsability ?? 0) >= 65
  );
  const familyHint = cars.some((c) =>
    String(c?.bodyType || c?.segment || "")
      .toLowerCase()
      .match(/suv|mpv|7/)
  );

  if (hasApartmentRisk) add("apartment");
  if (highwayFocus) add("long_trip");
  else if (cityFocus) add("city_highway");
  if (familyHint) add("family");
  if (cars.length >= 2 && picked.size < 4) add("beginner");
  if (hasApartmentRisk && picked.size < 4) add("charging_myths");
  if (picked.size < 4) add("buying_decision");

  return [...picked.values()].slice(0, 4);
}

/** Ownership page → charging practical guide */
export function buildOwnershipToChargingLinks() {
  return [CROSS_CLUSTER_LINKS.ownership_to_charging];
}

/** Charging page → ownership cost guide */
export function buildChargingToOwnershipLinks() {
  return [CROSS_CLUSTER_LINKS.charging_to_ownership];
}

/** Practical use-case discovery bundle */
export function buildPracticalUseCaseDiscoveryLinks() {
  return AUTHORITY_LINKS.filter((l) =>
    ["apartment", "family", "beginner", "highway", "city_highway"].includes(l.id)
  ).slice(0, 5);
}

/** Practical ownership topics — editorial scope only (no mass pages). */
export const PRACTICAL_OWNERSHIP_TOPICS = Object.freeze([
  "apartment_charging",
  "ownership_practicality",
  "running_cost_reality",
  "beginner_guidance",
  "charging_expectations",
  "family_practicality",
  "long_distance_suitability",
  "buying_decisions",
  "charging_myths",
  "ownership_decision_support",
]);

/** Authority link coverage for practical topics (deterministic). */
export function buildPracticalAuthorityCoverage(cars = []) {
  const links = buildCompareAuthorityLinks(cars);
  const clusters = new Set(links.map((l) => l.cluster));
  return {
    topicsCovered: PRACTICAL_OWNERSHIP_TOPICS.filter((t) => {
      if (t.includes("charging") || t.includes("apartment")) return clusters.has("charging") || clusters.has("apartment");
      if (t.includes("ownership") || t.includes("running")) return clusters.has("ownership");
      if (t.includes("family")) return clusters.has("family");
      if (t.includes("highway") || t.includes("long")) return clusters.has("highway");
      return clusters.has("beginner") || clusters.has("suitability");
    }),
    compareSupportAuthorityPersistence: links.length >= 3 ? "present" : "early",
    authorityContentConsistency: links.length >= 3 && clusters.size >= 2 ? "consistent" : "building",
  };
}

/** Compare-support authority quality for ops (no new scoring). */
export function buildCompareSupportAuthorityQuality(cars = []) {
  const links = buildCompareAuthorityLinks(cars);
  const clusters = new Set(links.map((l) => l.cluster));
  return {
    compareSupportAuthorityQuality:
      links.length >= 3 && clusters.size >= 2 ? "strong" : "emerging",
    compareSupportAuthorityDepth: links.length >= 3 ? "adequate" : "shallow",
    strongCompareSupportAuthority: links.filter((l) =>
      ["ownership", "charging", "apartment"].includes(l.cluster)
    ),
  };
}

/** Internal discovery health — deterministic from link coverage. */
export function buildInternalDiscoveryHealth(cars = []) {
  const compareLinks = buildCompareAuthorityLinks(cars);
  const depth = compareLinks.length;
  return {
    compareSupportDepth: depth >= 3 ? "adequate" : "shallow",
    practicalDiscoveryQuality: depth >= 2 ? "healthy" : "early",
    authorityDiscoveryPersistence: depth >= 3 ? "compounding" : "building",
    authorityDiscoveryDurability: depth >= 3 ? "durable" : "developing",
    compareSupportAuthorityPersistence: depth >= 2 ? "present" : "early",
    weakDiscoveryRetention: depth < 2 ? "weak" : "adequate",
  };
}

/** Retention-oriented discovery hints for ops (no new scoring). */
export function buildAuthorityDiscoveryRetentionMap(cars = []) {
  const links = buildCompareAuthorityLinks(cars);
  const health = buildInternalDiscoveryHealth(cars);
  return {
    ...health,
    underlinkedHighRetentionGuides: links.filter((l) =>
      ["ownership", "charging", "apartment"].includes(l.cluster)
    ),
    practicalContentDiscoveryPersistence: health.practicalDiscoveryQuality,
    compareSupportAuthorityDurability: health.compareSupportAuthorityPersistence,
    weakDiscoveryRetentionPaths:
      health.weakDiscoveryRetention === "weak" ? ["shallow_compare_support"] : [],
  };
}

/** Guide pages → compare discovery (deterministic, calm). */
export function buildGuideToCompareDiscoveryLinks(cluster = "ownership") {
  const compareHub = { label: "Open EV compare", href: "/compare", cluster: "compare" };
  const byCluster = {
    ownership: [
      compareHub,
      { label: "Compare running-cost EVs", href: "/compare?focus=running-cost", cluster },
    ],
    charging: [
      compareHub,
      { label: "Compare home-charging friendly EVs", href: "/compare?focus=charging", cluster },
    ],
    apartment: [
      compareHub,
      { label: "Compare apartment-friendly EVs", href: "/discover/apartment-living", cluster },
    ],
    highway: [
      compareHub,
      { label: "Compare long-range EVs", href: "/discover/highway-evs", cluster },
    ],
    family: [
      compareHub,
      { label: "Compare family EVs", href: "/discover/family-friendly", cluster },
    ],
    beginner: [
      compareHub,
      { label: "Best EVs under ₹15 lakh", href: "/discover/under-15-lakh", cluster },
    ],
  };
  return byCluster[cluster] || [compareHub];
}
