/**
 * Authority internal linking — detail, compare, guide cross-links (no nav redesign).
 */

import { BEGINNER_EV_TOPICS } from "./beginnerTopics.js";
import { CHARGING_GUIDE_TOPICS } from "./chargingTopics.js";
import { OWNERSHIP_EXPLAINER_TOPICS } from "./ownershipGuidance.js";
import { mapCompareSupportAuthority } from "./compareSupport.js";
import { getOwnershipFriendlinessFlags } from "./ownershipGuidance.js";

function publishedTopics(topics) {
  return topics.filter((t) => t.canonicalPath && t.readiness === "published");
}

/**
 * Detail page → charging + ownership authority links.
 * @param {object} [car]
 */
export function buildDetailAuthorityLinks(car = {}) {
  const intel = car?.evIntelligence || {};
  const charging = intel?.chargingPracticality || {};
  const scores = intel?.scores || {};
  const links = [];
  const add = (topic) => {
    if (topic?.canonicalPath && !links.some((l) => l.href === topic.canonicalPath)) {
      links.push({
        label: topic.title,
        href: topic.canonicalPath,
        cluster: topic.cluster,
      });
    }
  };

  add(
    CHARGING_GUIDE_TOPICS.find((t) => t.id === "home-charging-explained")
  );
  add(
    OWNERSHIP_EXPLAINER_TOPICS.find((t) => t.id === "ownership-running-cost-reality")
  );

  if (
    charging.apartmentPracticality === "limited" ||
    car?.catalogMeta?.chargingPracticality?.apartment === "limited"
  ) {
    add(
      CHARGING_GUIDE_TOPICS.find((t) => t.id === "apartment-charging-setup")
    );
    add(BEGINNER_EV_TOPICS.find((t) => t.id === "apartment-ev-suitability"));
  }

  if ((scores.highwayUsability ?? 0) >= 60) {
    add(
      OWNERSHIP_EXPLAINER_TOPICS.find((t) => t.id === "ownership-highway-reality")
    );
    add(CHARGING_GUIDE_TOPICS.find((t) => t.id === "public-charging-guide"));
  } else if ((scores.cityUsability ?? 0) >= 60) {
    add(BEGINNER_EV_TOPICS.find((t) => t.id === "ev-vs-petrol-running-cost"));
  }

  add(BEGINNER_EV_TOPICS.find((t) => t.id === "ev-ownership-for-beginners"));

  return links.slice(0, 5);
}

/**
 * Compare page → authority education bundle.
 * @param {string} compareSlug
 */
export function buildComparePageAuthorityLinks(compareSlug) {
  const mapped = mapCompareSupportAuthority(compareSlug);
  const out = [];
  const push = (rows, cluster) => {
    for (const r of rows) {
      if (r.href) {
        out.push({ label: r.title, href: r.href, cluster });
      }
    }
  };
  push(mapped.beginner, "beginner_education");
  push(mapped.charging, "charging_guides");
  push(mapped.ownership, "ownership_explainers");
  return out.slice(0, 4);
}

/**
 * Beginner guide → EV discovery recommendations.
 * @param {string} topicId
 */
export function buildBeginnerToDiscoveryLinks(topicId) {
  const topic = BEGINNER_EV_TOPICS.find((t) => t.id === topicId);
  const flags = getOwnershipFriendlinessFlags(topic || {});
  const links = [{ label: "Compare EVs with context", href: "/compare", cluster: "compare" }];
  if (flags.apartmentFriendly) {
    links.push({
      label: "Apartment-friendly EVs",
      href: "/discover/apartment-living",
      cluster: "discovery",
    });
  }
  if (flags.highwayFriendly) {
    links.push({
      label: "Highway-capable EVs",
      href: "/discover/highway-evs",
      cluster: "discovery",
    });
  }
  links.push({
    label: "EVs under ₹15 lakh",
    href: "/discover/under-15-lakh",
    cluster: "discovery",
  });
  return links.slice(0, 4);
}

/**
 * Charging guide → compare journeys.
 */
export function buildChargingToCompareLinks() {
  return [
    { label: "Open EV compare", href: "/compare", cluster: "compare" },
    {
      label: "Home-charging friendly EVs",
      href: "/charging-guides/home-charging",
      cluster: "charging_guides",
    },
    {
      label: "Low charging-stress EVs",
      href: "/charging-guides/low-stress",
      cluster: "charging_guides",
    },
  ];
}

/**
 * Ownership explainer → compare + charging cross-links.
 * @param {string} topicId
 */
export function buildOwnershipExplainerLinks(topicId) {
  const topic = OWNERSHIP_EXPLAINER_TOPICS.find((t) => t.id === topicId);
  const links = [
    { label: "Compare EVs", href: "/compare", cluster: "compare" },
    {
      label: "Home charging guide",
      href: "/charging-guides/home-charging",
      cluster: "charging_guides",
    },
  ];
  if (topic?.apartmentFriendly) {
    links.push({
      label: "Apartment living discovery",
      href: "/discover/apartment-living",
      cluster: "discovery",
    });
  }
  return links.slice(0, 4);
}

export function listPublishedAuthorityLinks(limit = 12) {
  return [
    ...publishedTopics(BEGINNER_EV_TOPICS),
    ...publishedTopics(CHARGING_GUIDE_TOPICS),
    ...publishedTopics(OWNERSHIP_EXPLAINER_TOPICS),
  ]
    .slice(0, limit)
    .map((t) => ({
      label: t.title,
      href: t.canonicalPath,
      cluster: t.cluster,
    }));
}
