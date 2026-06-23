/**
 * Internal linking for vehicle detail pages — crawlable, premium UX.
 */

import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest.js";

import { canonicalCompareGuideUrl } from "./canonical.js";

import {
  buildComparePairSlug,
  compareGuidePath,
  normalizeVehicleSlug,
} from "./slugs.js";

import { vehicleDetailPath } from "../utils/vehicleRoutes.js";
import { buildDetailAuthorityLinks } from "../content/authority/internalLinks.js";

function slugToLabel(slug) {
  return String(slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Editorial compare guides that include this family slug.
 */
export function findEditorialCompareLinks(familySlug, limit = 4) {
  const family = normalizeVehicleSlug(familySlug);

  if (!family) {
    return [];
  }

  return GENERATED_COMPARE_SLUGS.filter((slug) => slug.includes(family))
    .slice(0, limit)
    .map((slug) => ({
      slug,
      label: slugToLabel(slug.replace(/-vs-/g, " vs ")),
      href: compareGuidePath(slug),
      canonical: canonicalCompareGuideUrl(slug),
    }));
}

/**
 * Build link sections for DetailSeoDiscovery.
 * @param {object} params
 * @param {string} params.familySlug
 * @param {string} params.vehicleName
 * @param {string[]} [params.compareRivals]
 * @param {string} [params.brand]
 * @param {string} [params.bodyType]
 * @param {number} [params.priceInr]
 * @param {object} [params.evIntelligence]
 * @param {object} [params.catalogMeta]
 * @param {Array<{ familySlug: string, name?: string, brand?: string, price?: number, bodyType?: string }>} [params.peerFamilies]
 */
export function buildVehicleDiscoveryLinkSections({
  familySlug,
  vehicleName,
  compareRivals = [],
  brand = "",
  bodyType = "",
  priceInr = 0,
  peerFamilies = [],
  evIntelligence = null,
  catalogMeta = null,
}) {
  const family = normalizeVehicleSlug(familySlug);
  const sections = [];

  const rivals = [...new Set(compareRivals.map(normalizeVehicleSlug))]
    .filter((s) => s && s !== family)
    .slice(0, 4);

  if (rivals.length) {
    sections.push({
      id: "similar-evs",
      title: "Similar EVs",
      links: rivals.map((slug) => ({
        label: slugToLabel(slug),
        href: vehicleDetailPath(slug),
      })),
    });
  }

  const editorial = findEditorialCompareLinks(family, 4);

  if (editorial.length) {
    sections.push({
      id: "compare-guides",
      title: "Compare alternatives",
      links: editorial.map((row) => ({
        label: row.label,
        href: row.href,
      })),
    });
  }

  if (peerFamilies.length && (bodyType || priceInr > 0)) {
    const priceBand =
      priceInr > 0
        ? [priceInr * 0.75, priceInr * 1.25]
        : null;

    const sameBody = bodyType
      ? peerFamilies.filter(
          (p) =>
            p.bodyType &&
            String(p.bodyType).toLowerCase() ===
              String(bodyType).toLowerCase() &&
            normalizeVehicleSlug(p.familySlug) !== family
        )
      : [];

    const samePrice = priceBand
      ? peerFamilies.filter((p) => {
          const price = Number(p.price || 0);

          return (
            price >= priceBand[0] &&
            price <= priceBand[1] &&
            normalizeVehicleSlug(p.familySlug) !== family
          );
        })
      : [];

    const pick = (list, title, id) => {
      const links = list
        .slice(0, 4)
        .map((p) => ({
          label: p.name || slugToLabel(p.familySlug),
          href: vehicleDetailPath(p.familySlug),
        }));

      if (links.length) {
        sections.push({ id, title, links });
      }
    };

    pick(sameBody, "Same body type", "same-body-type");
    pick(samePrice, "Similar price range", "same-price");
  }

  const authorityLinks = buildDetailAuthorityLinks({
    evIntelligence,
    catalogMeta,
    familySlug: family,
  });
  if (authorityLinks.length) {
    sections.push({
      id: "authority-guides",
      title: "EV guides & ownership",
      links: authorityLinks.map((l) => ({
        label: l.label,
        href: l.href,
      })),
    });
  }

  sections.push({
    id: "ev-intelligence",
    title: "EV intelligence",
    links: [
      {
        label: "Best EVs for city driving",
        href: "/discover/city-driving",
      },
      {
        label: "Fastest-charging EVs",
        href: "/discover/fastest-charging",
      },
      {
        label: "EVs under ₹15 lakh",
        href: "/discover/under-15-lakh",
      },
      {
        label: "Home charger installation guide",
        href: "/guides/ownership-home-charger-install",
      },
      {
        label: "EV running cost & TCO",
        href: "/guides/ownership-running-cost",
      },
      {
        label: "Real-world range in rain",
        href: "/guides/ownership-rain-range",
      },
      {
        label: "Battery health & degradation",
        href: "/guides/ownership-battery-health",
      },
      {
        label: "EV warranty coverage explained",
        href: "/guides/ownership-warranty-coverage",
      },
      {
        label: "How EVSavari estimates range & costs",
        href: "/how-evsavari-works",
      },
      {
        label: "Compare EVs with confidence",
        href: "/compare",
      },
    ],
  });

  if (sections.length < 3) {
    sections.push({
      id: "explore",
      title: "Explore more",
      links: [
        { label: "Compare EVs", href: "/compare" },
        { label: "EV buying guides", href: "/guides" },
        { label: "Browse all EVs", href: "/cars" },
        ...(brand
          ? [
              {
                label: `${brand} EVs`,
                href: `/brands/${String(brand).toLowerCase().replace(/\s+/g, "-")}`,
              },
            ]
          : []),
      ],
    });
  }

  return sections.slice(0, 4);
}

/**
 * Resolve compare guide slug if both families have a generated guide.
 */
export function resolveCompareGuideSlugForPair(slugA, slugB) {
  const built = buildComparePairSlug(slugA, slugB);

  if (built && GENERATED_COMPARE_SLUGS.includes(built)) {
    return built;
  }

  return null;
}
