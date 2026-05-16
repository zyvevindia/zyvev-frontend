import { buildTitle, buildMetaDescription, buildCanonicalFields } from "./metadata.mjs";
import {
  buildCityEvsFaq,
  buildCityChargingFaq,
  buildCompareFaq,
  buildOwnershipFaq,
  buildBestEvsFaq,
} from "./faq.mjs";
import {
  buildCityRelatedLinks,
  buildCompareRelatedLinks,
  buildGuideRelatedLinks,
} from "./relatedLinks.mjs";
import { buildCompareCta, buildCatalogCta } from "./cta.mjs";
import { buildComparisonSummary } from "./comparisonSummary.mjs";
import { buildOwnershipSummary } from "./ownershipSummary.mjs";
import {
  TIER1_FAMILIES,
  hashPick,
  buildRankedVehicle,
  wrapSeoPage,
  slugToDisplay,
} from "./utils.mjs";

export function generateCityEvsPage(city) {
  const path = `/cities/${city.slug}/evs`;
  const vehicles = hashPick(TIER1_FAMILIES, city.slug, 4).map((slug, i) =>
    buildRankedVehicle(
      slug,
      i + 1,
      `Well suited for ${city.name} buyers weighing daily commute distance and local charging access.`
    )
  );

  const h1 = `Electric Cars in ${city.name} — Local Picks & Buying Guide`;

  return wrapSeoPage({
    slug: `city-${city.slug}-evs`,
    category: "city",
    title: buildTitle(h1),
    metaDescription: buildMetaDescription(
      `Electric cars for ${city.name}: commute-friendly EV families, charging tips, and comparisons on EVSavari.`
    ),
    intro: `${city.name}'s ${city.descriptor || "urban driving patterns"} make EVs attractive for many commuters. This page highlights model families that fit typical ${city.name} usage and links to charging and ownership guides.`,
    recommendationLogic: {
      category: "city",
      methodology:
        "City recommendations weight city-driving and commute scores from catalog intelligence.",
    },
    rankedVehicles: vehicles,
    tradeoffs: [
      `Apartment charging access in ${city.name} varies — review our apartment-living ownership guide.`,
      "Peak-hour range can differ from lab claims; plan around your real commute distance.",
    ],
    faq: buildCityEvsFaq(city.name),
    relatedLinks: buildCityRelatedLinks(city.slug, city.name),
    cta: buildCatalogCta(),
    ...buildCanonicalFields(path),
    generatedAt: new Date().toISOString(),
  });
}

export function generateCityChargingPage(city) {
  const path = `/cities/${city.slug}/charging`;
  const h1 = `EV Charging in ${city.name} — Home, Workplace & Public`;

  return wrapSeoPage({
    slug: `city-${city.slug}-charging`,
    category: "city",
    title: buildTitle(h1),
    metaDescription: buildMetaDescription(
      `Charging guide for ${city.name} EV buyers: home AC setup, apartment constraints, and public charger planning.`
    ),
    intro: `Charging convenience in ${city.name} depends on parking type, society rules, and your daily km. Use this guide to plan home or workplace charging before you shortlist a model.`,
    recommendationLogic: {
      category: "city",
      methodology: "City charging guidance combines ownership patterns and catalog charging-stress signals.",
    },
    rankedVehicles: hashPick(TIER1_FAMILIES, `${city.slug}-charging`, 3).map(
      (slug, i) =>
        buildRankedVehicle(
          slug,
          i + 1,
          `Lower charging-stress profile for ${city.name} owners with predictable daily km.`
        )
    ),
    tradeoffs: [
      "Society approvals can delay wallbox installs — start conversations early.",
      "Public DC availability varies by locality; do not rely on it as your only plan.",
    ],
    faq: buildCityChargingFaq(city.name),
    relatedLinks: buildCityRelatedLinks(city.slug, city.name),
    cta: {
      type: "city_evs",
      label: `See EV picks in ${city.name} →`,
      href: `/cities/${city.slug}/evs`,
    },
    ...buildCanonicalFields(path),
    generatedAt: new Date().toISOString(),
  });
}

const LEGACY_COMPARE_SLUG_BY_PAIR = {
  "mg-zs-ev|tata-nexon-ev": "nexon-ev-vs-mg-zs-ev",
  "mg-comet-ev|tata-tiago-ev": "comet-ev-vs-tiago-ev",
};

function resolveCompareContentSlug(leftSlug, rightSlug) {
  const key = [leftSlug, rightSlug].sort().join("|");
  return LEGACY_COMPARE_SLUG_BY_PAIR[key] || `${leftSlug}-vs-${rightSlug}`;
}

export function generateComparePage(leftSlug, rightSlug) {
  const compareSlug = resolveCompareContentSlug(leftSlug, rightSlug);
  const path = `/compare/${compareSlug}`;
  const leftName = slugToDisplay(leftSlug);
  const rightName = slugToDisplay(rightSlug);
  const h1 = `${leftName} vs ${rightName} — Decision Comparison`;

  return wrapSeoPage({
    slug: compareSlug,
    pageTypeId: "head_to_head",
    category: "compare",
    title: buildTitle(h1),
    metaDescription: buildMetaDescription(
      `Side-by-side ${leftName} and ${rightName} comparison with tradeoffs — not hype rankings.`
    ),
    intro: `This comparison contrasts ${leftName} and ${rightName} on dimensions Indian buyers care about — range bands, charging, space, and indicative pricing. Review tradeoffs; we do not declare a universal winner.`,
    recommendationLogic: {
      pageTypeId: "head_to_head",
      category: "compare",
      compareSlugs: [leftSlug, rightSlug],
      methodology:
        "Deterministic catalog comparison on range, charging, and value signals — no paid placement.",
      tonePolicy: "well_suited_language_only",
    },
    rankedVehicles: [
      buildRankedVehicle(
        leftSlug,
        1,
        `${leftName} may suit buyers prioritising familiarity and service access — verify charging and boot space.`
      ),
      buildRankedVehicle(
        rightSlug,
        2,
        `${rightName} may suit buyers wanting different packaging or charging flexibility — confirm on-road price locally.`
      ),
    ],
    tradeoffs: buildComparisonSummary(leftSlug, rightSlug),
    faq: buildCompareFaq(leftName, rightName),
    relatedLinks: buildCompareRelatedLinks(compareSlug),
    cta: buildCompareCta(leftSlug, rightSlug),
    ...buildCanonicalFields(path),
    generatedAt: new Date().toISOString(),
  });
}

export function generateOwnershipPage(topic) {
  const path = `/ownership-guides/${topic.segment}`;
  const h1 = `EV Ownership: ${topic.label.charAt(0).toUpperCase()}${topic.label.slice(1)}`;

  return wrapSeoPage({
    slug: topic.contentSlug,
    category: "ownership",
    title: buildTitle(h1),
    metaDescription: buildMetaDescription(
      `Indian EV ownership guide on ${topic.label} — practical notes before you buy on EVSavari.`
    ),
    intro: `Before you shortlist a model, understand how ${topic.label} affects your EV ownership experience in India. This guide links to comparisons and use-case picks.`,
    recommendationLogic: {
      category: "ownership",
      methodology: "Editorial ownership template with catalog-backed model shortlists.",
    },
    rankedVehicles: hashPick(TIER1_FAMILIES, topic.contentSlug, 4).map(
      (slug, i) =>
        buildRankedVehicle(
          slug,
          i + 1,
          `Catalog variant to evaluate for ${topic.label} in your city.`
        )
    ),
    tradeoffs: buildOwnershipSummary(topic.label),
    faq: buildOwnershipFaq(topic.label),
    relatedLinks: buildGuideRelatedLinks(path),
    cta: buildCatalogCta(),
    ...buildCanonicalFields(path),
    generatedAt: new Date().toISOString(),
  });
}

export function generateBestEvsPage(topic) {
  const path = `/best-evs/${topic.segment}`;
  const h1 = `Best EVs for ${topic.label.charAt(0).toUpperCase()}${topic.label.slice(1)} in India`;

  return wrapSeoPage({
    slug: topic.contentSlug,
    category: "usage",
    title: buildTitle(h1),
    metaDescription: buildMetaDescription(
      `EVs well suited for ${topic.label} in India — data-driven shortlist on EVSavari.`
    ),
    intro: `This guide surfaces electric cars well suited for ${topic.label} using catalog intelligence — with tradeoffs, not a single “best EV” claim.`,
    recommendationLogic: {
      category: "usage",
      methodology:
        "Composite of usage-fit scores from catalog intelligence; no manual paid overrides.",
      tonePolicy: "well_suited_language_only",
    },
    rankedVehicles: hashPick(TIER1_FAMILIES, topic.contentSlug, 5).map(
      (slug, i) =>
        buildRankedVehicle(
          slug,
          i + 1,
          `Well suited for ${topic.label} based on catalog usage and value signals.`
        )
    ),
    tradeoffs: [
      `Match ${topic.label} needs to your real commute km and charging setup.`,
      "Confirm on-road price and variant availability with a dealer in your city.",
    ],
    faq: buildBestEvsFaq(topic.label),
    relatedLinks: buildGuideRelatedLinks(path),
    cta: buildCatalogCta(),
    ...buildCanonicalFields(path),
    generatedAt: new Date().toISOString(),
  });
}
