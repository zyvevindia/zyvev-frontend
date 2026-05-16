/**
 * Internal linking mesh for discovery pages.
 */

import { SEO_PAGE_SLUGS } from "../data/seoPageSlugs";

import {
  canonicalBestEvsUrl,
  canonicalChargingGuideUrl,
  canonicalCompareGuideUrl,
  canonicalLegacyGuideUrl,
  canonicalOwnershipGuideUrl,
} from "./canonical";

import {
  BEST_EVS_USE_CASE_TO_SLUG,
  CHARGING_GUIDE_TO_SLUG,
  OWNERSHIP_GUIDE_TO_SLUG,
  COMPARE_GUIDE_SLUGS,
} from "./slugMap";

import { GENERATED_CITY_SLUGS } from "../content/generated/manifest.js";

const CATEGORY_RELATED = {
  budget: ["best-evs-under-20-lakh", "lowest-maintenance-electric-cars"],
  usage: [
    "best-evs-for-city-driving",
    "best-family-electric-cars",
    "best-evs-for-highway-driving",
  ],
  ownership: [
    "best-evs-for-first-time-buyers",
    "best-evs-for-apartment-living",
    "lowest-maintenance-electric-cars",
  ],
  charging: [
    "best-evs-for-home-charging",
    "lowest-charging-stress-evs",
    "best-evs-for-daily-commute",
  ],
  compare: [...COMPARE_GUIDE_SLUGS].slice(0, 6),
};

const CITY_DISPLAY = {
  bengaluru: "Bengaluru",
  mumbai: "Mumbai",
  delhi: "Delhi NCR",
  hyderabad: "Hyderabad",
  chennai: "Chennai",
  pune: "Pune",
  kolkata: "Kolkata",
  ahmedabad: "Ahmedabad",
  jaipur: "Jaipur",
  lucknow: "Lucknow",
  kochi: "Kochi",
  chandigarh: "Chandigarh",
  indore: "Indore",
  nagpur: "Nagpur",
  coimbatore: "Coimbatore",
  surat: "Surat",
  visakhapatnam: "Visakhapatnam",
  bhopal: "Bhopal",
  patna: "Patna",
  guwahati: "Guwahati",
  thiruvananthapuram: "Thiruvananthapuram",
  vadodara: "Vadodara",
  ludhiana: "Ludhiana",
  noida: "Noida",
  gurgaon: "Gurgaon",
};

function cityLabel(slug) {
  return CITY_DISPLAY[slug] || slug.replace(/-/g, " ");
}

function guideLink(slug, title, pathFn) {
  const useCaseEntry = Object.entries(BEST_EVS_USE_CASE_TO_SLUG).find(
    ([, s]) => s === slug
  );
  if (useCaseEntry) {
    return {
      slug,
      label: title || slug.replace(/-/g, " "),
      href: canonicalBestEvsUrl(useCaseEntry[0]).replace(/^https?:\/\/[^/]+/, ""),
    };
  }

  const chargingEntry = Object.entries(CHARGING_GUIDE_TO_SLUG).find(
    ([, s]) => s === slug
  );
  if (chargingEntry) {
    return {
      slug,
      label: title || slug.replace(/-/g, " "),
      href: canonicalChargingGuideUrl(chargingEntry[0]).replace(
        /^https?:\/\/[^/]+/,
        ""
      ),
    };
  }

  const ownershipEntry = Object.entries(OWNERSHIP_GUIDE_TO_SLUG).find(
    ([, s]) => s === slug
  );
  if (ownershipEntry) {
    return {
      slug,
      label: title || slug.replace(/-/g, " "),
      href: canonicalOwnershipGuideUrl(ownershipEntry[0]).replace(
        /^https?:\/\/[^/]+/,
        ""
      ),
    };
  }

  if (slug.includes("-vs-")) {
    return {
      slug,
      label: title || slug.replace(/-/g, " "),
      href: canonicalCompareGuideUrl(slug).replace(/^https?:\/\/[^/]+/, ""),
    };
  }

  return {
    slug,
    label: title || slug.replace(/-/g, " "),
    href: pathFn
      ? pathFn(slug).replace(/^https?:\/\/[^/]+/, "")
      : `/cars/${slug}`,
  };
}

export function getRelatedGuides(seoPage, { limit = 5 } = {}) {
  const current = seoPage?.slug;
  const category = seoPage?.category || "usage";
  const pool = CATEGORY_RELATED[category] || CATEGORY_RELATED.usage;

  return pool
    .filter((slug) => slug !== current && SEO_PAGE_SLUGS.includes(slug))
    .slice(0, limit)
    .map((slug) => guideLink(slug));
}

export function getRelatedComparisons(seoPage, { limit = 3 } = {}) {
  if (seoPage?.category === "compare") {
    return CATEGORY_RELATED.compare
      .filter((slug) => slug !== seoPage.slug)
      .slice(0, limit)
      .map((slug) => guideLink(slug));
  }

  return CATEGORY_RELATED.compare
    .slice(0, limit)
    .map((slug) => guideLink(slug));
}

export function getChargingGuideLinks({ limit = 4 } = {}) {
  return Object.entries(CHARGING_GUIDE_TO_SLUG)
    .slice(0, limit)
    .map(([segment, contentSlug]) =>
      guideLink(contentSlug, null, () => canonicalChargingGuideUrl(segment))
    );
}

export function getOwnershipGuideLinks({ limit = 4 } = {}) {
  return Object.entries(OWNERSHIP_GUIDE_TO_SLUG)
    .slice(0, limit)
    .map(([segment, contentSlug]) =>
      guideLink(contentSlug, null, () => canonicalOwnershipGuideUrl(segment))
    );
}

export function getBestEvsGuideLinks({ limit = 6 } = {}) {
  return Object.entries(BEST_EVS_USE_CASE_TO_SLUG)
    .slice(0, limit)
    .map(([useCase, contentSlug]) =>
      guideLink(contentSlug, null, () => canonicalBestEvsUrl(useCase))
    );
}

export function getCityGuideLinks({ limit = 8 } = {}) {
  return GENERATED_CITY_SLUGS.slice(0, limit).map((city) => ({
    slug: city,
    label: `EVs in ${cityLabel(city)}`,
    href: `/cities/${city}/evs`,
  }));
}

export function getDiscoveryLinkSections(seoPage) {
  if (Array.isArray(seoPage?.relatedLinks) && seoPage.relatedLinks.length) {
    return seoPage.relatedLinks;
  }

  const sections = [];

  if (seoPage?.category === "city") {
    const cityMatch = seoPage.slug?.match(/^city-(.+?)-(evs|charging)$/);
    if (cityMatch) {
      const [, citySlug] = cityMatch;
      sections.push({
        title: "This city",
        links: [
          {
            slug: `${citySlug}-evs`,
            label: `EV picks in ${cityLabel(citySlug)}`,
            href: `/cities/${citySlug}/evs`,
          },
          {
            slug: `${citySlug}-charging`,
            label: `${cityLabel(citySlug)} charging`,
            href: `/cities/${citySlug}/charging`,
          },
        ],
      });
    }
    sections.push({
      title: "More cities",
      links: getCityGuideLinks({ limit: 6 }).filter(
        (l) => l.slug !== cityMatch?.[1]
      ),
    });
  }

  const related = getRelatedGuides(seoPage);
  if (related.length) {
    sections.push({
      title: "Related EV guides",
      links: related,
    });
  }

  if (seoPage?.category !== "compare") {
    const comparisons = getRelatedComparisons(seoPage);
    if (comparisons.length) {
      sections.push({
        title: "Popular comparisons",
        links: comparisons,
      });
    }
  }

  if (seoPage?.category !== "charging") {
    sections.push({
      title: "Charging guides",
      links: getChargingGuideLinks({ limit: 3 }),
    });
  }

  if (seoPage?.category !== "ownership") {
    sections.push({
      title: "Ownership guides",
      links: getOwnershipGuideLinks({ limit: 3 }),
    });
  }

  return sections;
}
