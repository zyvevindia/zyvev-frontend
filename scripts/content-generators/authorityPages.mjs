import { buildTitle, buildMetaDescription, buildCanonicalFields } from "./metadata.mjs";
import {
  buildAuthorityRelatedLinks,
  buildAuthorityCompareSupportLinks,
} from "./authorityRelatedLinks.mjs";
import { buildCatalogCta } from "./cta.mjs";
import { hashPick, buildRankedVehicle, wrapSeoPage, TIER1_FAMILIES } from "./utils.mjs";
import { AUTHORITY_POPULATION_TOPICS } from "./authorityEditorialData.mjs";
import { AUTHORITY_MYTH_TOPICS } from "./authorityMythEditorialData.mjs";
import { getLearningPathway, resolvePathwayForTopic } from "../../src/content/authority/learningPathways.js";

export { AUTHORITY_POPULATION_TOPICS, AUTHORITY_MYTH_TOPICS };

export const AUTHORITY_ALL_EDITORIAL_TOPICS = [
  ...AUTHORITY_POPULATION_TOPICS,
  ...AUTHORITY_MYTH_TOPICS,
];

/**
 * @typedef {object} AuthorityTopicConfig
 * @property {string} id
 * @property {string} contentSlug
 * @property {string} segment
 * @property {'ownership'|'charging'} routeFamily
 * @property {string} path
 * @property {string} h1
 * @property {string} category
 * @property {string} vehiclePickSeed
 * @property {string} intro
 * @property {object[]} editorialSections
 * @property {string[]} tradeoffs
 * @property {{ question: string, answer: string }[]} faq
 * @property {{ label: string, href: string }[]} [relatedHrefs]
 * @property {{ label: string, href: string }[]} [compareSupportHrefs]
 */

/**
 * @param {AuthorityTopicConfig} topic
 */
export function generateAuthorityEditorialPage(topic) {
  const compareSupportLinks = buildAuthorityCompareSupportLinks(topic);
  const relatedLinks = buildAuthorityRelatedLinks(topic);
  const pathwayId = topic.learningPathwayId || resolvePathwayForTopic(topic);
  const pathway = getLearningPathway(pathwayId, topic.path);
  const continueLearning = pathway.continueLearning;

  return wrapSeoPage({
    slug: topic.contentSlug,
    category: topic.category || "authority",
    pageTypeId: "authority_editorial",
    authorityTopicId: topic.id,
    title: buildTitle(topic.h1),
    metaDescription: buildMetaDescription(
      `${topic.h1.replace(/ \| EVSavari$/, "")} — practical ${topic.routeFamily === "charging" ? "charging" : "ownership"} guidance for Indian buyers.`
    ),
    intro: topic.intro,
    editorialSections: topic.editorialSections,
    compareSupportLinks,
    continueLearning,
    learningPathwayId: pathwayId,
    recommendationLogic: {
      category: "authority",
      authorityTopicId: topic.id,
      methodology:
        "Editorial authority template — calm India-focused guidance, catalog shortlist for illustration only.",
      tonePolicy: "well_suited_language_only",
      faqSchema: "FAQPage",
    },
    rankedVehicles: hashPick(TIER1_FAMILIES, topic.vehiclePickSeed, 4).map(
      (slug, i) =>
        buildRankedVehicle(
          slug,
          i + 1,
          `Example family to evaluate alongside this guide — confirm charging and price locally.`
        )
    ),
    tradeoffs: topic.tradeoffs,
    faq: topic.faq,
    relatedLinks,
    cta: buildCatalogCta(),
    ...buildCanonicalFields(topic.path),
    generatedAt: new Date().toISOString(),
  });
}

export function authorityRegistryMeta(topic, seoPage) {
  const pageType =
    topic.routeFamily === "charging" ? "charging_guide" : "ownership_guide";
  return {
    id: `authority-${topic.id}`,
    pageType,
    path: topic.path,
    h1: topic.h1.replace(/ \| EVSavari$/, "").trim(),
    filePath: `public/seo-data/${topic.contentSlug}.json`,
  };
}
