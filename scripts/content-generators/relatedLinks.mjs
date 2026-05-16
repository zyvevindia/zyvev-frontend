/**
 * Related link blocks embedded in generated page JSON for QA + optional UI fallback.
 */

export function buildCityRelatedLinks(citySlug, cityName) {
  return [
    {
      title: `${cityName} charging`,
      links: [
        {
          label: `${cityName} charging guide`,
          href: `/cities/${citySlug}/charging`,
        },
        { label: "Home charging guide", href: "/charging-guides/home-charging" },
        {
          label: "Lower charging-stress EVs",
          href: "/charging-guides/low-stress",
        },
      ],
    },
    {
      title: "Popular comparisons",
      links: [
        {
          label: "Nexon EV vs MG ZS EV",
          href: "/compare/nexon-ev-vs-mg-zs-ev",
        },
        {
          label: "Comet EV vs Tiago EV",
          href: "/compare/comet-ev-vs-tiago-ev",
        },
      ],
    },
    {
      title: "Ownership",
      links: [
        {
          label: "Apartment living",
          href: "/ownership-guides/apartment-living",
        },
        {
          label: "First-time buyers",
          href: "/ownership-guides/first-time-buyers",
        },
      ],
    },
  ];
}

export function buildCompareRelatedLinks(compareSlug) {
  return [
    {
      title: "More comparisons",
      links: [
        {
          label: "Nexon EV vs MG ZS EV",
          href: "/compare/nexon-ev-vs-mg-zs-ev",
        },
        {
          label: "Comet EV vs Tiago EV",
          href: "/compare/comet-ev-vs-tiago-ev",
        },
      ].filter((l) => !l.href.endsWith(compareSlug)),
    },
    {
      title: "Buying guides",
      links: [
        { label: "Best EVs under ₹10 lakh", href: "/best-evs/under-10-lakh" },
        { label: "City driving picks", href: "/best-evs/city-driving" },
      ],
    },
  ];
}

export function buildGuideRelatedLinks(canonicalPath) {
  return [
    {
      title: "Explore more",
      links: [
        { label: "All EV guides", href: "/guides" },
        { label: "Browse EV catalog", href: "/cars" },
        { label: "Compare tool", href: "/compare" },
      ].filter((l) => l.href !== canonicalPath),
    },
  ];
}
