const DEFAULT_LIMIT = 6;
const DEFAULT_MIN_CARDS = 3;

function familySlug(family) {
  return family?.familySlug || family?.slug || "";
}

/**
 * Pick families for a homepage section, preferring vehicles not yet shown
 * in earlier sections. Reuses slugs only when needed to avoid empty sections.
 *
 * @param {object[]} candidates — pre-ranked list for this section
 * @param {Set<string>} usedSlugs — slugs already shown in prior sections
 * @param {{ limit?: number, minCards?: number }} options
 */
export function pickDiverseSectionFamilies(
  candidates,
  usedSlugs,
  { limit = DEFAULT_LIMIT, minCards = DEFAULT_MIN_CARDS } = {}
) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return [];
  }

  const picked = [];
  const inSection = new Set();

  const tryAdd = (family) => {
    const slug = familySlug(family);
    if (!slug || picked.length >= limit) return false;
    if (inSection.has(slug)) return false;
    picked.push(family);
    inSection.add(slug);
    usedSlugs.add(slug);
    return true;
  };

  for (const family of candidates) {
    if (picked.length >= limit) break;
    if (usedSlugs.has(familySlug(family))) continue;
    tryAdd(family);
  }

  if (picked.length < minCards) {
    for (const family of candidates) {
      if (picked.length >= limit) break;
      tryAdd(family);
    }
  }

  for (const family of candidates) {
    if (picked.length >= limit) break;
    tryAdd(family);
  }

  return picked;
}

/**
 * Build ordered homepage sections with cross-section de-duplication.
 *
 * @param {Array<{ id: string, candidates: object[] }>} sectionDefs
 * @param {{ limit?: number, minCards?: number }} options
 */
export function buildDiverseHomeSections(
  sectionDefs,
  { limit = DEFAULT_LIMIT, minCards = DEFAULT_MIN_CARDS } = {}
) {
  const usedSlugs = new Set();
  const sections = {};

  for (const def of sectionDefs) {
    sections[def.id] = pickDiverseSectionFamilies(
      def.candidates,
      usedSlugs,
      { limit, minCards }
    );
  }

  return sections;
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
