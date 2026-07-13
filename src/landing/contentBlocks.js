/**

 * Stable landing content block identifiers — consumed by future AI systems.

 * Maps to data-content-block attributes on landing section DOM.

 */

import { LANDING_SECTION_IDS } from "./types.js";



export const LANDING_CONTENT_BLOCK_IDS = Object.freeze({

  [LANDING_SECTION_IDS.HERO]: "hero",

  [LANDING_SECTION_IDS.INTRO]: "intro",

  [LANDING_SECTION_IDS.VEHICLE_GRID]: "vehicleGrid",

  [LANDING_SECTION_IDS.BUYING_GUIDE]: "buyingGuide",

  [LANDING_SECTION_IDS.FAQ]: "faq",

  [LANDING_SECTION_IDS.INTERNAL_LINKS]: "relatedPages",

  [LANDING_SECTION_IDS.CTA]: "cta",

});



export const LANDING_CONTENT_BLOCK_ORDER = Object.freeze([

  LANDING_CONTENT_BLOCK_IDS.hero,

  LANDING_CONTENT_BLOCK_IDS.intro,

  LANDING_CONTENT_BLOCK_IDS.vehicleGrid,

  LANDING_CONTENT_BLOCK_IDS.buyingGuide,

  LANDING_CONTENT_BLOCK_IDS.faq,

  LANDING_CONTENT_BLOCK_IDS.relatedPages,

  LANDING_CONTENT_BLOCK_IDS.cta,

]);


