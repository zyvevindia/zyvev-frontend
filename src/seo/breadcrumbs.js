/**
 * Discovery + vehicle breadcrumb trails for UI and JSON-LD.
 */
import { PAGE_TYPES } from "./registry.js";

const BRAND_NAME_TO_SLUG = Object.freeze({
  Tata: "tata",
  MG: "mg",
  Mahindra: "mahindra",
  Hyundai: "hyundai",
  Kia: "kia",
  BYD: "byd",
  Citroen: "citroen",
  BMW: "bmw",
  "Mercedes-Benz": "mercedes-benz",
  Volvo: "volvo",
});

/**
 * @param {string} brandName
 * @returns {string | null}
 */
export function resolveBrandHubPath(brandName) {
  const slug = BRAND_NAME_TO_SLUG[String(brandName || "").trim()];
  return slug ? `/brands/${slug}` : null;
}

/**
 * @param {object} options
 * @param {string} options.pageType
 * @param {object} options.seoPage
 * @param {object} [options.routeContext]
 * @param {string} options.canonical
 * @param {(title: string) => string} options.stripTitle
 * @returns {{ name: string, url: string }[]}
 */
export function buildDiscoveryBreadcrumbs({
  pageType,
  seoPage,
  routeContext,
  canonical,
  stripTitle,
}) {
  const title = stripTitle(seoPage?.title || "");
  const crumbs = [{ name: "Home", url: "/" }];

  switch (pageType) {
    case PAGE_TYPES.BRAND:
      crumbs.push({ name: "Brands", url: "/guides" });
      crumbs.push({ name: title, url: canonical });
      break;

    case PAGE_TYPES.COMPARE_GUIDE:
      crumbs.push({ name: "Guides", url: "/guides" });
      crumbs.push({ name: "Compare", url: "/compare" });
      crumbs.push({ name: title, url: canonical });
      break;

    case PAGE_TYPES.BEST_EVS:
      crumbs.push({ name: "Guides", url: "/guides" });
      crumbs.push({ name: "Best EVs", url: "/guides" });
      crumbs.push({ name: title, url: canonical });
      break;

    case PAGE_TYPES.OWNERSHIP_GUIDE:
      crumbs.push({ name: "Guides", url: "/guides" });
      crumbs.push({ name: "Ownership", url: "/guides" });
      crumbs.push({ name: title, url: canonical });
      break;

    case PAGE_TYPES.CHARGING_GUIDE:
      crumbs.push({ name: "Guides", url: "/guides" });
      crumbs.push({ name: "Charging", url: "/guides" });
      crumbs.push({ name: title, url: canonical });
      break;

    case PAGE_TYPES.CITY_EVS:
    case PAGE_TYPES.CITY_CHARGING: {
      const city = routeContext?.params?.city || "";
      const cityLabel = city
        ? city.charAt(0).toUpperCase() + city.slice(1)
        : "Cities";
      crumbs.push({ name: "Guides", url: "/guides" });
      crumbs.push({ name: "Cities", url: "/guides" });
      if (city) {
        crumbs.push({
          name: cityLabel,
          url: `/cities/${city}/evs`,
        });
      }
      crumbs.push({ name: title, url: canonical });
      break;
    }

    default:
      crumbs.push({ name: "Guides", url: "/guides" });
      crumbs.push({ name: title, url: canonical });
  }

  return crumbs;
}

/**
 * @param {{ name: string, url: string }[]} breadcrumbs
 */
export function renderBreadcrumbNav(breadcrumbs) {
  return breadcrumbs;
}
