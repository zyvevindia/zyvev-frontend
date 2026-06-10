/**
 * SEO Agent v1 — deterministic metadata generation (no LLM).
 */
import { SITE_ORIGIN, slugToDisplay, getCategoryLabel } from "./seoTemplates.js";

export function formatInr(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const n = Number(value);
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function buildTitle(spec, seoPage) {
  const base = spec.h1 || seoPage?.h1 || slugToDisplay(spec.slug);
  const title = `${base} | EVSavari`;
  return title.length > 70 ? `${base.slice(0, 55)}… | EVSavari` : title;
}

export function buildMetaDescription(spec, rankedVehicles = []) {
  const count = rankedVehicles.length;
  const top = rankedVehicles[0]?.displayName;

  switch (spec.contentType) {
    case "compare":
      return `Compare ${spec.compareSlugs?.map(slugToDisplay).join(" and ")} on EVSavari — deterministic range, charging, and value signals. No paid placement.`;
    case "variant_recommendation":
      return `Variant recommendations from EVSavari Score Engine — ${count} data-backed picks with transparent scoring. Human-reviewed catalog intelligence.`;
    case "top_list":
      return `Ranked list of ${count} EVs by ${spec.sortKey || "composite"} score — deterministic EVSavari rankings from verified catalog data.`;
    default:
      return top
        ? `${count} EVs well suited for this use case — led by ${top}. Deterministic scores from EVSavari catalog intelligence.`
        : `Deterministic EV recommendations from EVSavari catalog scores — ${getCategoryLabel(spec.categoryId) || "buyer guide"}.`;
  }
}

export function buildKeywords(spec, rankedVehicles = []) {
  const base = [
    "electric car India",
    "EV comparison",
    "EVSavari",
    spec.slug?.replace(/-agent$/, "").replace(/-/g, " "),
  ];
  if (spec.categoryId) base.push(getCategoryLabel(spec.categoryId).toLowerCase());
  if (spec.compareSlugs) base.push(...spec.compareSlugs);
  for (const v of rankedVehicles.slice(0, 5)) {
    if (v.displayName) base.push(v.displayName);
  }
  return [...new Set(base.filter(Boolean))].slice(0, 12);
}

export function buildCanonicalFields(spec) {
  const canonicalPath = spec.canonicalPath || `/guides/${spec.slug}`;
  return {
    canonicalPath,
    canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
  };
}

export function buildStructuredData(seoPage) {
  const items = (seoPage.rankedVehicles || []).map((v, i) => ({
    "@type": "ListItem",
    position: v.rank ?? i + 1,
    name: v.displayName,
    url: `${SITE_ORIGIN}${v.detailPath || `/cars/${v.slug}`}`,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: seoPage.title?.replace(/\s*\|\s*EVSavari$/, "") || seoPage.slug,
    description: seoPage.metaDescription,
    numberOfItems: items.length,
    itemListElement: items,
  };
}

export function buildFaq(spec, rankedVehicles = []) {
  const faqs = [
    {
      question: "How are these rankings generated?",
      answer:
        "Rankings use deterministic EVSavari Score Engine signals from catalog data — range, charging, safety, value, and use-case scores. No LLM opinions or paid placement.",
    },
    {
      question: "Are prices final?",
      answer:
        "Ex-showroom prices are indicative from catalog data. Confirm on-road quotes with dealers in your city.",
    },
  ];

  if (spec.contentType === "compare") {
    faqs.push({
      question: `Which is better — ${spec.compareSlugs?.map(slugToDisplay).join(" or ")}?`,
      answer:
        "Neither is a universal winner. Compare range, charging, value scores, and variant pricing for your commute and parking setup.",
    });
  }

  if (rankedVehicles[0]?.displayName) {
    faqs.push({
      question: `Why is ${rankedVehicles[0].displayName} ranked first?`,
      answer:
        rankedVehicles[0].explanation ||
        `Top rank reflects the highest deterministic score (${rankedVehicles[0].compositeScore ?? "—"}/100) for this page intent.`,
    });
  }

  return faqs;
}

export function enrichSeoPageMetadata(spec, seoPage) {
  const ranked = seoPage.rankedVehicles || [];
  const canonical = buildCanonicalFields(spec);
  return {
    ...seoPage,
    slug: spec.slug,
    title: buildTitle(spec, seoPage),
    metaDescription: buildMetaDescription(spec, ranked),
    keywords: buildKeywords(spec, ranked),
    ...canonical,
    generatedAt: new Date().toISOString(),
    structuredData: buildStructuredData({
      ...seoPage,
      metaDescription: buildMetaDescription(spec, ranked),
    }),
    faq: seoPage.faq || buildFaq(spec, ranked),
    governance: {
      source: "seo-agent-v1",
      deterministic: true,
      llmGenerated: false,
      superlativesAvoided: true,
      humanApprovalRequired: true,
    },
  };
}
