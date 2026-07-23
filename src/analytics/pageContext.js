/**
 * Resolve page type from SPA path — used by trackPageView for typed events.
 * Does not import landing registry (read-only path patterns only).
 */

const GUIDE_PREFIXES = [
  "/ownership-guides/",
  "/charging-guides/",
  "/authority-guides/",
  "/compare/",
];

export function resolvePageContext(pathname = "") {
  const path = String(pathname || "").split("?")[0].replace(/\/$/, "") || "/";

  if (path === "/") {
    return { pageType: "homepage", category: "navigation" };
  }

  if (path === "/cars") {
    return { pageType: "browse", category: "catalog" };
  }

  if (path.startsWith("/cars/")) {
    return {
      pageType: "vehicle",
      category: "catalog",
      familySlug: path.replace("/cars/", ""),
    };
  }

  if (path.startsWith("/brands/")) {
    return {
      pageType: "landing",
      landingType: "brand",
      landingSlug: path.replace("/brands/", ""),
      category: "landing",
    };
  }

  if (path.startsWith("/best-evs/")) {
    const slug = path.replace("/best-evs/", "");
    const landingType = slug.includes("lakh") || slug === "premium" ? "price" : "use_case";
    return {
      pageType: "landing",
      landingType,
      landingSlug: slug,
      category: "landing",
    };
  }

  if (path === "/compare") {
    return { pageType: "compare_tool", category: "compare" };
  }

  for (const prefix of GUIDE_PREFIXES) {
    if (path.startsWith(prefix) && path.length > prefix.length) {
      return {
        pageType: "guide",
        guideType: prefix.replace(/\//g, "").replace("-guides", ""),
        guideSlug: path.slice(prefix.length),
        category: "guide",
      };
    }
  }

  if (path.startsWith("/guides")) {
    return { pageType: "guides_hub", category: "guide" };
  }

  return { pageType: "other", category: "navigation" };
}
