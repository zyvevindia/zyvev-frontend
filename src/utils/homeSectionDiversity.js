const FULL_SECTION_LIMIT = 6;
const SMALL_POOL_SECTION_LIMIT = 1;
const SMALL_POOL_MAX = 5;
const MATCHING_ONLY_MAX = 2;

function familySlug(family) {
  return family?.familySlug || family?.slug || "";
}

/**
 * Pick families for one section — globally unused slugs only. No backfill.
 * Returns empty when no unused candidates remain (section should be omitted).
 */
export function pickUniqueSectionFamilies(
  candidates,
  usedSlugs,
  { limit = FULL_SECTION_LIMIT } = {}
) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return [];
  }

  const picked = [];
  const inSection = new Set();

  for (const family of candidates) {
    if (picked.length >= limit) break;

    const slug = familySlug(family);
    if (!slug || usedSlugs.has(slug) || inSection.has(slug)) {
      continue;
    }

    picked.push(family);
    inSection.add(slug);
    usedSlugs.add(slug);
  }

  return picked;
}

export function buildPopularSectionCandidates(families) {
  const featured = families.filter((f) => f.isFeatured);
  const featuredSlugs = new Set(featured.map(familySlug));
  const rest = families.filter((f) => !featuredSlugs.has(familySlug(f)));
  return [...featured, ...rest];
}

export function buildRangeSectionCandidates(families) {
  return [...families].sort(
    (a, b) => (b.maxRange || 0) - (a.maxRange || 0)
  );
}

function subScore(family, legacyKey, v1Key) {
  const v1 = family.evSavariScores?.breakdown?.[v1Key]?.score;
  if (v1 != null) return v1;
  return family.evScores?.subScores?.[legacyKey] ?? 0;
}

export function buildValueSectionCandidates(families) {
  return [...families].sort(
    (a, b) =>
      subScore(b, "ownershipAffordability", "value") -
      subScore(a, "ownershipAffordability", "value")
  );
}

export function buildChargingSectionCandidates(families) {
  return [...families].sort(
    (a, b) =>
      subScore(b, "chargingConvenience", "charging") -
      subScore(a, "chargingConvenience", "charging")
  );
}

export function buildCitySectionCandidates(families) {
  return [...families].sort(
    (a, b) =>
      subScore(b, "cityUsability", "city") -
      subScore(a, "cityUsability", "city")
  );
}

export const HOME_INTELLIGENCE_SECTION_DEFS = Object.freeze([
  {
    id: "popular",
    title: "Most Popular EVs",
    subtitle:
      "Explore India's most loved and trending electric vehicles.",
    viewAllLink: "/popular",
    badge: (family) => (family.isFeatured ? "Popular" : "Trending"),
    buildCandidates: buildPopularSectionCandidates,
  },
  {
    id: "range",
    title: "Best Range EVs",
    subtitle:
      "Electric vehicles offering the highest driving range in India.",
    badge: () => "Long Range",
    buildCandidates: buildRangeSectionCandidates,
  },
  {
    id: "value",
    title: "Best Value EVs",
    subtitle:
      "Strong price-to-capability ratios from EVSavari value scores.",
    badge: () => "Best Value",
    buildCandidates: buildValueSectionCandidates,
  },
  {
    id: "charging",
    title: "Fast Charging EVs",
    subtitle:
      "Electric cars with the quickest charging convenience scores.",
    badge: () => "Fast Charge",
    buildCandidates: buildChargingSectionCandidates,
  },
  {
    id: "city",
    title: "City EVs",
    subtitle: "Practical picks for daily urban commutes and parking.",
    badge: () => "City Use",
    buildCandidates: buildCitySectionCandidates,
  },
]);

function sectionLimitForPoolSize(filteredCount) {
  if (filteredCount >= SMALL_POOL_MAX + 1) {
    return FULL_SECTION_LIMIT;
  }
  return SMALL_POOL_SECTION_LIMIT;
}

/**
 * Build homepage sections from filtered families.
 *
 * <= 2 vehicles: single "Matching EVs" section, all vehicles, no intelligence rows.
 * 3–5 vehicles: intelligence sections, one unique vehicle each, omit empty sections.
 * >= 6 vehicles: full intelligence sections (up to 6 unique vehicles each), omit empty.
 */
export function buildHomepageSectionLayout(families) {
  const pool = Array.isArray(families) ? families : [];
  const count = pool.length;

  if (count <= MATCHING_ONLY_MAX) {
    if (count === 0) {
      return { mode: "matching", sections: [] };
    }

    return {
      mode: "matching",
      sections: [
        {
          id: "matching",
          title: "Matching EVs",
          subtitle: "Electric vehicles matching your search and filters.",
          families: [...pool],
          badge: null,
        },
      ],
    };
  }

  const limit = sectionLimitForPoolSize(count);
  const usedSlugs = new Set();
  const sections = [];

  for (const def of HOME_INTELLIGENCE_SECTION_DEFS) {
    const candidates = def.buildCandidates(pool);
    const picked = pickUniqueSectionFamilies(candidates, usedSlugs, { limit });

    if (picked.length === 0) {
      continue;
    }

    sections.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      viewAllLink: def.viewAllLink,
      families: picked,
      badge: def.badge,
    });
  }

  return { mode: "intelligence", sections };
}
