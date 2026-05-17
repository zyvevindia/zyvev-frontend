/**
 * Google Search Console quick links and indexing checklist (admin UI).
 */

export const GSC_PROPERTY_URL =
  "https://search.google.com/search-console?resource_id=https://evsavari.com/";

export const GSC_QUICK_LINKS = [
  {
    label: "Search Console home",
    href: GSC_PROPERTY_URL,
  },
  {
    label: "Sitemaps",
    href: "https://search.google.com/search-console/sitemaps?resource_id=https://evsavari.com/",
  },
  {
    label: "URL inspection",
    href: "https://search.google.com/search-console/inspect?resource_id=https://evsavari.com/",
  },
  {
    label: "Page indexing",
    href: "https://search.google.com/search-console/index?resource_id=https://evsavari.com/",
  },
  {
    label: "Core Web Vitals",
    href: "https://search.google.com/search-console/core-web-vitals?resource_id=https://evsavari.com/",
  },
];

export const INDEXING_READINESS_CHECKLIST = [
  {
    id: "property",
    label: "Domain property verified for evsavari.com",
  },
  {
    id: "robots",
    label: "robots.txt allows / and blocks /admin, /dealer, /seo-data/",
  },
  {
    id: "sitemap-index",
    label: "sitemap.xml submitted in GSC (static, cars, seo-pages, compare)",
  },
  {
    id: "no-legacy-cars",
    label: "No legacy /cars/{guide-slug} URLs in seo-pages sitemap",
  },
  {
    id: "canonical-discovery",
    label: "Discovery guides canonical to /best-evs, /compare, /cities paths",
  },
  {
    id: "family-canonical",
    label: "Vehicle pages canonical to family slug only (no variant in canonical)",
  },
  {
    id: "post-deploy",
    label: "After content deploy: run npm run gsc:verify and spot-check 3 URLs",
  },
  {
    id: "monitor",
    label: "Week 1: check Page indexing daily for crawl errors",
  },
];

export const LIVE_SITEMAP_URLS = [
  { label: "Sitemap index", path: "/sitemap.xml" },
  { label: "Static", path: "/sitemaps/static.xml" },
  { label: "Cars (families)", path: "/sitemaps/cars.xml" },
  { label: "SEO discovery", path: "/sitemaps/seo-pages.xml" },
  { label: "Compare hub", path: "/sitemaps/compare.xml" },
  { label: "robots.txt", path: "/robots.txt" },
];
