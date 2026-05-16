export function buildCompareCta(leftSlug, rightSlug) {
  return {
    type: "open_compare_tool",
    label: "Open full compare tool →",
    vehicleSlugs: [leftSlug, rightSlug],
  };
}

export function buildCatalogCta() {
  return {
    type: "browse_catalog",
    label: "Browse all EVs →",
    href: "/cars",
  };
}

export function buildGuidesHubCta() {
  return {
    type: "guides_hub",
    label: "See all EV guides →",
    href: "/guides",
  };
}
