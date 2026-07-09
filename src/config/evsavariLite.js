/**
 * EVSavari Lite — public product boundary (Sprint 1.4).
 * Classifies routes and features for Layer 1 (public marketplace) vs Layer 2 (platform).
 * Routes remain registered; this config documents visibility only.
 */

/** @typedef {'ACTIVE' | 'HIDDEN' | 'FUTURE' | 'DEPRECATED'} LiteRouteStatus */

/** Public header / mobile nav (Layer 1 only). */
export const PUBLIC_NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Browse EVs", path: "/cars" },
  { label: "Compare", path: "/compare" },
  { label: "Guides", path: "/guides" },
  { label: "Search", path: "/cars#catalog-search" },
];

/** Routes that redirect to browse when visited directly (platform / hub surfaces). */
export const LITE_HIDDEN_REDIRECT_PATHS = [
  "/tools",
  "/ownership",
  "/ownership/vehicles",
  "/assistant",
  "/assistant/shortlist",
  "/playground/score2",
  "/playground/assistant",
];

export const LITE_HIDDEN_REDIRECT_FALLBACK = "/cars";

/**
 * Route inventory — status and purpose for Sprint 1.4 audit.
 * @type {Record<string, { purpose: string, status: LiteRouteStatus }>}
 */
export const ROUTE_INVENTORY = {
  "/": { purpose: "Homepage", status: "ACTIVE" },
  "/cars": { purpose: "Browse EV catalog", status: "ACTIVE" },
  "/cars/:slug": { purpose: "Car details", status: "ACTIVE" },
  "/popular": { purpose: "Popular EVs listing alias", status: "ACTIVE" },
  "/latest": { purpose: "Latest EVs listing alias", status: "ACTIVE" },
  "/upcoming": { purpose: "Upcoming EVs listing alias", status: "ACTIVE" },
  "/bikes": { purpose: "EV bikes listing alias", status: "ACTIVE" },
  "/scooters": { purpose: "EV scooters listing alias", status: "ACTIVE" },
  "/compare": { purpose: "Compare EVs", status: "ACTIVE" },
  "/compare/:compareSlug": { purpose: "SEO compare guide", status: "ACTIVE" },
  "/guides": { purpose: "Guides hub", status: "ACTIVE" },
  "/discover/:presetSlug": { purpose: "EV intelligence discovery", status: "ACTIVE" },
  "/best-evs/:useCase": { purpose: "Best EVs discovery", status: "ACTIVE" },
  "/charging-guides/:slug": { purpose: "Charging guides", status: "ACTIVE" },
  "/ownership-guides/:slug": { purpose: "Ownership guides", status: "ACTIVE" },
  "/brands/:brand": { purpose: "Brand discovery", status: "ACTIVE" },
  "/cities/:city/evs": { purpose: "City EV discovery", status: "ACTIVE" },
  "/cities/:city/charging": { purpose: "City charging discovery", status: "ACTIVE" },
  "/reviews/:slug": { purpose: "Vehicle reviews", status: "ACTIVE" },
  "/trust/scoring": { purpose: "Trust — scoring methodology", status: "ACTIVE" },
  "/trust/freshness": { purpose: "Trust — data freshness", status: "ACTIVE" },
  "/trust/ownership": { purpose: "Trust — ownership data", status: "ACTIVE" },
  "/how-evsavari-works": { purpose: "How EVSavari works", status: "ACTIVE" },
  "/about": { purpose: "About", status: "ACTIVE" },
  "/contact": { purpose: "Contact", status: "ACTIVE" },
  "/privacy": { purpose: "Privacy policy", status: "ACTIVE" },
  "/terms": { purpose: "Terms of service", status: "ACTIVE" },
  "/tools/emi": { purpose: "EMI calculator (contextual)", status: "ACTIVE" },
  "/tools/tco": { purpose: "TCO calculator (contextual)", status: "ACTIVE" },
  "/tools/cost-per-km": { purpose: "Cost per km calculator", status: "ACTIVE" },
  "/tools/savings-vs-petrol": { purpose: "Petrol savings calculator", status: "ACTIVE" },
  "/ownership/:slug/emi": { purpose: "Vehicle EMI calculator", status: "ACTIVE" },
  "/ownership/:slug/tco": { purpose: "Vehicle TCO calculator", status: "ACTIVE" },
  "/ownership/:slug/running-cost": { purpose: "Vehicle running cost", status: "ACTIVE" },
  "/ownership/:slug/petrol-savings": { purpose: "Vehicle petrol savings", status: "ACTIVE" },
  "/tools": { purpose: "Ownership tools hub", status: "HIDDEN" },
  "/tools/:toolId": { purpose: "Unshipped tool placeholder", status: "DEPRECATED" },
  "/ownership": { purpose: "Ownership hub", status: "HIDDEN" },
  "/ownership/vehicles": { purpose: "Ownership vehicle index", status: "HIDDEN" },
  "/assistant": { purpose: "Buyer AI assistant", status: "HIDDEN" },
  "/assistant/shortlist": { purpose: "Assistant shortlist", status: "HIDDEN" },
  "/playground/score2": { purpose: "Score2 playground", status: "HIDDEN" },
  "/playground/assistant": { purpose: "Assistant playground", status: "HIDDEN" },
  "/login": { purpose: "Staff login (direct URL only)", status: "HIDDEN" },
  "/dealer/login": { purpose: "Dealer portal login", status: "HIDDEN" },
  "/dealer/signup": { purpose: "Dealer onboarding", status: "HIDDEN" },
  "/dealer": { purpose: "Dealer dashboard", status: "HIDDEN" },
  "/admin": { purpose: "Admin shell", status: "HIDDEN" },
  "/admin/*": { purpose: "Admin modules", status: "HIDDEN" },
  "/sales": { purpose: "Sales CRM dashboard", status: "HIDDEN" },
  "/sales-analytics": { purpose: "Sales analytics", status: "HIDDEN" },
};

/** Feature visibility for architecture audit. */
export const FEATURE_INVENTORY = {
  ACTIVE: [
    "Homepage",
    "Browse",
    "Search",
    "Compare",
    "Car Details",
    "EMI Calculator",
    "Ownership Calculator",
    "Lead Forms",
    "Guides",
    "EV Intelligence (discovery pages)",
  ],
  HIDDEN: [
    "CRM",
    "Dealer Dashboard",
    "Dealer Portal",
    "Sales Dashboard",
    "Editorial Platform",
    "Analytics",
    "AI Modules",
    "Admin",
    "Tools Hub",
    "Ownership Hub",
    "Playgrounds",
    "Staff Login",
  ],
  FUTURE: [
    "Dealer AI",
    "OEM AI",
    "Marketplace Automation",
    "User Accounts",
    "Wishlist",
    "Saved Searches",
    "Notifications",
    "OTP",
  ],
  DEPRECATED: ["Ownership tool placeholders", "Tools nav entry"],
};
