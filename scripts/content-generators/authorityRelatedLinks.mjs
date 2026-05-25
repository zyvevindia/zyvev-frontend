/**
 * Authority editorial related + compare-support links.
 */

export function buildAuthorityRelatedLinks(topic) {
  const base = [
    { label: "All EV guides", href: "/guides" },
    { label: "Compare EVs", href: "/compare" },
    { label: "Browse catalog", href: "/cars" },
  ];
  const extra = topic.relatedHrefs || [];
  const links = [...extra, ...base].filter(
    (l, i, arr) => arr.findIndex((x) => x.href === l.href) === i
  );
  return [
    {
      title: "Related guides",
      links: links.filter((l) => l.href !== topic.path).slice(0, 8),
    },
    {
      title: "Discovery",
      links: [
        { label: "EVs under ₹15 lakh", href: "/discover/under-15-lakh" },
        { label: "Apartment-friendly EVs", href: "/discover/apartment-living" },
        { label: "City driving picks", href: "/discover/city-driving" },
      ],
    },
  ];
}

export function buildAuthorityCompareSupportLinks(topic) {
  return (topic.compareSupportHrefs || []).slice(0, 5);
}
