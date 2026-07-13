import { registerLandingPage } from "../landingRegistry.js";

import { LANDING_ROUTE_FAMILIES } from "../landingRouteConfig.js";

import { LANDING_SECTION_IDS } from "../types.js";

import { formatLandingSeoTitle } from "../../seo/seoConstants.js";

import {

  BRAND_LANDING_DEFINITIONS,

} from "./brandLandingDefinitions.js";

import { getBrandLandingContent } from "./brandLandingContent.js";



/**

 * @param {typeof BRAND_LANDING_DEFINITIONS[number]} definition

 */

export function buildBrandLandingConfig(definition) {

  const { slug, label, filterBrand } = definition;

  const path = `/brands/${slug}`;

  const content = getBrandLandingContent(slug);



  const seoTitle = formatLandingSeoTitle(

    `${label} Electric Cars in India`,

    "Prices, Range & Charging"

  );

  const description =

    content?.intro?.[0] ||

    `Compare ${label} electric cars in India — ex-showroom price, certified range, DC charging, variants, and ownership costs from the live EVSavari catalog.`;



  const faq = content?.faq || [

    {

      question: `Which ${label} electric car is best in India?`,

      answer: `Use the live ${label} vehicle grid below. EVSavari ranks families using catalog intelligence — not paid placement — and updates as variants are verified.`,

    },

    {

      question: `What is the price range of ${label} EVs in India?`,

      answer:

        "Ex-showroom prices vary by variant. The hero stats and vehicle cards reflect current catalog starting prices; open any model page for full variant pricing.",

    },

    {

      question: `How do I compare ${label} EVs with other brands?`,

      answer:

        "Shortlist models from the grid, then use Compare EVs or open editorial compare guides linked below.",

    },

  ];



  const buyingAdvice = content?.buyingAdvice || null;

  const hasBuyingAdvice = Boolean(buyingAdvice?.sections?.length);



  return {

    id: `brand-${slug}`,

    type: "brand",

    slug,

    routeFamily: LANDING_ROUTE_FAMILIES.BRANDS,

    path,

    title: `${label} Electric Cars in India`,

    description,

    filters: {

      brand: filterBrand,

      sortBy: "composite",

    },

    seo: {

      title: seoTitle,

      description: description.slice(0, 160),

      keywords: `${label} EV, ${label} electric car price India, ${label} EV range, EV charging, EVSavari`,

      ogType: "website",

    },

    schema: {

      includeWebPage: false,

      includeCollectionPage: true,

      includeItemList: false,

      includeFaq: faq.length > 0,

      breadcrumbs: [

        { name: "Home", url: "/" },

        { name: "Brands", url: "/guides" },

        { name: label, url: path },

      ],

    },

    hero: {

      badge: "Brand hub",

      title: `${label} Electric Cars in India`,

      subtitle: description.slice(0, 200),

      showStats: true,

      ctaLabel: `Compare ${label} EVs`,

      ctaHref: "/compare",

    },

    introTitle: content?.introTitle || `${label} EV overview`,

    intro: content?.intro || [

      `Explore every ${label} electric vehicle currently listed in India. Compare price, battery, charging, range, and variants from the live EVSavari catalog.`,

    ],

    buyingAdvice,

    faq,

    ctaLabel: `Browse all ${label} EVs`,

    ctaHref: "/cars",

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



export function registerBrandLandingPages() {

  for (const definition of BRAND_LANDING_DEFINITIONS) {

    registerLandingPage(buildBrandLandingConfig(definition));

  }

}



export function getBrandLandingDefinitions() {

  return BRAND_LANDING_DEFINITIONS;

}


