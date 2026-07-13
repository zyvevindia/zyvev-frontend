/**

 * Landing adapter — delegates internal links to the Link Graph Engine.

 */



import { getRelatedPages, buildLandingPageContext } from "../../linkGraph/index.js";



/**

 * @param {import('../types.js').LandingPageConfig} config

 * @returns {import('../types.js').LandingInternalLinkGroup[]}

 */

export function resolveLandingInternalLinks(config) {

  const groups = getRelatedPages(buildLandingPageContext(config));



  return groups.map((group) => ({

    title: group.title,

    links: group.links.map(({ label, href }) => ({ label, href })),

  }));

}



/** @deprecated Use link graph domains — kept for API compatibility */

export const landingLinkResolvers = new Map();



/** @deprecated */

export function registerLandingLinkResolver(domain, resolver) {

  landingLinkResolvers.set(domain, resolver);

}



export const LANDING_LINK_DOMAINS = Object.freeze([

  "vehicles",

  "compare",

  "guides",

  "ownership",

  "charging",

  "finance",

  "cities",

  "brands",

  "dealer",

]);


