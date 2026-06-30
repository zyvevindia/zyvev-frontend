/**
 * Public pages covered by visual regression snapshots.
 * Paths reflect production routes — no app code changes required.
 */

/** @typedef {{ id: string, path: string, label: string, readySelector?: string, fullPage?: boolean, maskSelectors?: string[], retryCatalog?: boolean, requireCatalogGrid?: boolean, requireHomeCatalog?: boolean, requireDiscoveryCatalog?: boolean, hashAnchor?: string, skipScrollTopWait?: boolean }} VisualPageTarget */

/** @type {readonly VisualPageTarget[]} */
export const VISUAL_PUBLIC_PAGES = Object.freeze([
  {
    id: "home",
    path: "/",
    label: "Home",
    readySelector: "h1",
    requireHomeCatalog: true,
  },
  {
    id: "ev-listing",
    path: "/cars",
    label: "EV Listing",
    readySelector: ".catalog-results-grid",
    requireCatalogGrid: true,
  },
  {
    id: "vehicle-details",
    path: "/cars/tata-nexon-ev",
    label: "Vehicle Details",
    readySelector: ".cd-page, .cd-overview-dashboard, .score2-perspective",
    retryCatalog: true,
    skipScrollTopWait: true,
  },
  {
    id: "compare",
    path: "/compare",
    label: "Compare",
    readySelector: ".compare-page, .compare-vehicle-card, h1",
  },
  {
    id: "buyer-assistant",
    path: "/assistant",
    label: "Buyer Assistant",
    readySelector: ".assistant-page, .assistant-welcome",
  },
  {
    id: "search",
    path: "/cars",
    label: "Search",
    readySelector: "#catalog-search",
    requireCatalogGrid: true,
    hashAnchor: "catalog-search",
  },
  {
    id: "budget-evs",
    path: "/discover/budget-evs",
    label: "Budget EVs",
    readySelector: ".intel-discovery-page h1",
    requireDiscoveryCatalog: true,
  },
  {
    id: "upcoming-evs",
    path: "/upcoming",
    label: "Upcoming EVs",
    readySelector: ".upcoming-car-card, .car-card, h1",
  },
  {
    id: "news",
    path: "/guides",
    label: "Guides Hub",
    readySelector: ".seo-guides-hub, h1",
  },
  {
    id: "about",
    path: "/about",
    label: "About",
    readySelector: "h1",
  },
  {
    id: "contact",
    path: "/contact",
    label: "Contact",
    readySelector: "form, h1",
  },
  {
    id: "privacy",
    path: "/privacy",
    label: "Privacy Policy",
    readySelector: "h1",
  },
  {
    id: "terms",
    path: "/terms",
    label: "Terms",
    readySelector: "h1",
  },
  {
    id: "not-found",
    path: "/this-page-does-not-exist-visual-test",
    label: "404 Page",
    readySelector: "h1",
  },
]);
