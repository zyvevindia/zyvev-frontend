/**

 * Builds price and use-case landing registry entries from declarative definitions.

 * Same schema for every /best-evs/:slug page — no page-type JSX branches.

 */



import { registerLandingPage } from "../landingRegistry.js";

import { LANDING_ROUTE_FAMILIES } from "../landingRouteConfig.js";

import { LANDING_SECTION_IDS } from "../types.js";

import { formatLandingSeoTitle } from "../../seo/seoConstants.js";

import { PRICE_LANDING_DEFINITIONS } from "./priceLandingDefinitions.js";

import { USE_CASE_LANDING_DEFINITIONS } from "./useCaseLandingDefinitions.js";

import {

  PRICE_BUYING_ADVICE,

  USE_CASE_BUYING_ADVICE,

} from "./priceUseCaseContent.js";



/**

 * @param {typeof PRICE_LANDING_DEFINITIONS[number] | typeof USE_CASE_LANDING_DEFINITIONS[number]} definition

 */

export function buildBestEvsLandingConfig(definition) {

  const {

    slug,

    category,

    h1,

    shortDescription,

    filters,

    heroBadge,

    ctaLabel,

    ctaHref,

    longDescription,

    faq: faqOverride,

  } = definition;



  const path = `/best-evs/${slug}`;

  const seoTitle = formatLandingSeoTitle(h1, "Compare Price, Range & Charging");

  const intro = longDescription

    ? Array.isArray(longDescription)

      ? longDescription

      : [longDescription]

    : [

        `${shortDescription} Rankings update automatically when new models and variants are verified in the master catalog.`,

      ];



  const buyingAdvice =

    category === "price"

      ? PRICE_BUYING_ADVICE[slug]

      : USE_CASE_BUYING_ADVICE[slug];

  const hasBuyingAdvice = Boolean(buyingAdvice?.sections?.length);



  const faq =

    faqOverride ??

    (category === "price"

      ? [

          {

            question: `Which EV is best ${h1.replace(/^Best /i, "").toLowerCase()}?`,

            answer:

              "Use the live vehicle grid below. EVSavari ranks families using catalog intelligence and verified pricing — not paid placement. Match battery size and DC charging to your longest regular trip.",

          },

          {

            question: "Are prices on this page final?",

            answer:

              "Prices are indicative ex-showroom starting prices from the live catalog. Confirm on-road quotes, insurance, and charger installation with dealers in your city.",

          },

          {

            question: "How often is this list updated?",

            answer:

              "Whenever the master catalog changes — new models, variants, or verified prices appear automatically without manual page edits.",

          },

        ]

      : [

          {

            question: `How does EVSavari rank ${h1.replace(/^Best /i, "").toLowerCase()}?`,

            answer:

              "We apply deterministic intelligence filters and suitability scores from the master catalog — not sponsored listings. See the buying advice section for methodology.",

          },

          {

            question: "Can I compare models from this page?",

            answer:

              "Yes. Shortlist from the grid below or open Compare EVs to evaluate price, range, and charging side by side.",

          },

        ]);



  return {

    id: `${category}-${slug}`,

    type: category,

    slug,

    routeFamily: LANDING_ROUTE_FAMILIES.BEST_EVS,

    path,

    title: h1,

    description: shortDescription,

    filters: { ...filters },

    seo: {

      title: seoTitle,

      description: shortDescription,

      keywords: `${h1}, electric car India, EV price range, EV charging, EVSavari`,

      ogType: "website",

    },

    schema: {

      includeWebPage: false,

      includeCollectionPage: true,

      includeItemList: false,

      includeFaq: faq.length > 0,

      breadcrumbs: [

        { name: "Home", url: "/" },

        { name: "Best EVs", url: "/best-evs/budget" },

        { name: h1.replace(/^Best /i, "").trim(), url: path },

      ],

    },

    hero: {

      badge: heroBadge,

      title: h1,

      subtitle: shortDescription,

      showStats: true,

      ctaLabel,

      ctaHref,

    },

    introTitle: category === "price" ? "Price segment overview" : "Use case overview",

    intro,

    buyingAdvice,

    faq,

    ctaLabel,

    ctaHref,

    sections: [

      { id: LANDING_SECTION_IDS.HERO, enabled: true },

      { id: LANDING_SECTION_IDS.INTRO, enabled: true },

      { id: LANDING_SECTION_IDS.VEHICLE_GRID, enabled: true },

      { id: LANDING_SECTION_IDS.BUYING_GUIDE, enabled: hasBuyingAdvice },

      { id: LANDING_SECTION_IDS.FAQ, enabled: faq.length > 0 },

      { id: LANDING_SECTION_IDS.INTERNAL_LINKS, enabled: true },

      { id: LANDING_SECTION_IDS.CTA, enabled: true },

    ],

  };

}



export function registerPriceLandingPages() {

  for (const definition of PRICE_LANDING_DEFINITIONS) {

    registerLandingPage(buildBestEvsLandingConfig(definition));

  }

}



export function registerUseCaseLandingPages() {

  for (const definition of USE_CASE_LANDING_DEFINITIONS) {

    registerLandingPage(buildBestEvsLandingConfig(definition));

  }

}



export function getPriceLandingDefinitions() {

  return PRICE_LANDING_DEFINITIONS;

}



export function getUseCaseLandingDefinitions() {

  return USE_CASE_LANDING_DEFINITIONS;

}


