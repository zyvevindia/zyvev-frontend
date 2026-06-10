/**
 * SEO Agent v1 — deterministic content from catalog + Score Engine.
 */
import { scoreVehicle, rankByCategory } from "../../scoring/index.js";
import { enrichSeoPageMetadata, formatInr } from "./seoMetadataGenerator.js";
import {
  SEO_CONTENT_TYPES,
  slugToDisplay,
  getCategoryLabel,
} from "./seoTemplates.js";

function scoreKeyForSort(sortKey) {
  const map = {
    overall: (e) => e.scored?.overall?.score ?? 0,
    charging: (e) => e.scored?.breakdown?.charging?.score ?? 0,
    range: (e) => e.scored?.breakdown?.range?.score ?? 0,
    safety: (e) => e.scored?.breakdown?.safety?.score ?? 0,
    value: (e) => e.scored?.breakdown?.value?.score ?? 0,
  };
  return map[sortKey] || map.overall;
}

export function buildVehicleEntries(vehicles = []) {
  return (vehicles || [])
    .filter(Boolean)
    .map((vehicle) => {
      const scored = scoreVehicle(vehicle);
      const familySlug =
        vehicle.familySlug ||
        vehicle.fields?.familySlug ||
        vehicle.id;
      const displayName =
        vehicle.displayName ||
        `${vehicle.fields?.brand || ""} ${vehicle.fields?.model || ""}`.trim() ||
        slugToDisplay(familySlug);
      const startingPrice =
        vehicle.fields?.startingPrice ??
        vehicle.startingPrice ??
        null;
      const claimedRangeKm =
        vehicle.fields?.claimedRangeKm ??
        scored?.breakdown?.range?.signals?.claimedRangeKm ??
        null;

      return {
        vehicle,
        scored,
        familySlug,
        displayName,
        startingPrice,
        claimedRangeKm,
      };
    })
    .filter((e) => e.scored?.hasData || e.scored?.overall?.score != null);
}

function confidenceFromScore(score) {
  if (score == null) return "limited";
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "limited";
}

function buildRankedItem(entry, rank, score, explanation, spec) {
  const price = formatInr(entry.startingPrice);
  const range = entry.claimedRangeKm;
  return {
    rank,
    slug: entry.familySlug,
    displayName: entry.displayName,
    exShowroom: entry.startingPrice ?? undefined,
    claimedRangeKm: range ?? undefined,
    compositeScore: score ?? undefined,
    confidence: confidenceFromScore(score),
    explanation,
    tradeoff: buildTradeoff(entry, spec),
    detailPath: `/cars/${entry.familySlug}`,
  };
}

function buildTradeoff(entry, spec) {
  const weaknesses = entry.scored?.explanation?.weaknesses || [];
  const strengths = entry.scored?.explanation?.strengths || [];
  const weak = weaknesses[0]?.reason;
  const strong = strengths[0]?.reason;
  const parts = [];
  if (strong) parts.push(`Strength from score data: ${strong}`);
  if (weak) parts.push(`Tradeoff to weigh: ${weak}`);
  if (!parts.length) {
    parts.push(
      `EVSavari overall score ${entry.scored?.overall?.score ?? "—"}/100 (${entry.scored?.overall?.grade ?? "—"}).`
    );
  }
  return parts.join(" ");
}

function rankBuyingGuide(spec, entries) {
  let pool = [...entries];
  if (spec.priceMaxInr != null) {
    pool = pool.filter(
      (e) =>
        e.startingPrice == null || e.startingPrice <= spec.priceMaxInr
    );
  }

  const ranked = rankByCategory(
    pool.map((e) => ({ vehicle: e.vehicle, scored: e.scored })),
    spec.categoryId,
    { limit: spec.limit || 10 }
  );

  return ranked.map((row) => {
    const slug =
      row.vehicle?.familySlug ||
      row.vehicle?.id ||
      row.vehicle?.fields?.familySlug;
    const entry =
      entries.find((e) => e.familySlug === slug) || {
        familySlug: slug,
        displayName: slugToDisplay(slug),
        startingPrice: row.vehicle?.fields?.startingPrice,
        claimedRangeKm: row.vehicle?.fields?.claimedRangeKm,
        scored: row.scored,
      };
    return buildRankedItem(
      entry,
      row.rank,
      row.score,
      `${entry.displayName} — ${getCategoryLabel(spec.categoryId)} score ${row.score}/100. ${row.reason}`,
      spec
    );
  });
}

function rankTopList(spec, entries) {
  const sortFn = scoreKeyForSort(spec.sortKey);
  return [...entries]
    .sort((a, b) => sortFn(b) - sortFn(a))
    .slice(0, spec.limit || 10)
    .map((entry, i) => {
      const score = sortFn(entry);
      return buildRankedItem(
        entry,
        i + 1,
        score,
        `Ranked by ${spec.sortKey} score (${score}/100) from EVSavari Score Engine.`,
        spec
      );
    });
}

function buildComparePage(spec, entries) {
  const slugs = spec.compareSlugs || [];
  const matched = slugs.map((slug) =>
    entries.find((e) => e.familySlug === slug)
  );

  return matched.map((entry, i) => {
    if (!entry) {
      return {
        rank: i + 1,
        slug: slugs[i],
        displayName: slugToDisplay(slugs[i]),
        explanation: `Catalog data pending for ${slugToDisplay(slugs[i])}.`,
        detailPath: `/cars/${slugs[i]}`,
      };
    }
    const score = entry.scored?.overall?.score;
    return buildRankedItem(
      entry,
      i + 1,
      score,
      `${entry.displayName} — overall score ${score ?? "—"}/100. Range ${entry.claimedRangeKm ?? "—"} km, from ${formatInr(entry.startingPrice) || "catalog pricing"}.`,
      spec
    );
  });
}

function variantRoleKey(role) {
  const map = {
    bestValue: "bestValue",
    fastestCharging: "fastestCharging",
    longestRange: "longestRange",
  };
  return map[role] || "recommended";
}

function buildVariantPages(spec, entries) {
  const role = variantRoleKey(spec.variantRole);
  let pool = entries;

  if (spec.familySlug) {
    pool = entries.filter((e) => e.familySlug === spec.familySlug);
  }

  const rows = [];
  for (const entry of pool) {
    const variants = entry.scored?.variants;
    if (!variants?.hasData) continue;

    const pick = variants[role];
    if (pick) {
      rows.push({
        rank: rows.length + 1,
        slug: entry.familySlug,
        displayName: `${entry.displayName} — ${pick.variantName}`,
        exShowroom: pick.signals?.priceInr ?? entry.startingPrice,
        claimedRangeKm: pick.signals?.rangeKm ?? entry.claimedRangeKm,
        compositeScore: pick.scores?.value ?? entry.scored?.overall?.score,
        confidence: confidenceFromScore(pick.scores?.value),
        explanation: pick.reason || `Selected as ${role} variant from deterministic scoring.`,
        tradeoff: buildTradeoff(entry, spec),
        detailPath: `/cars/${entry.familySlug}`,
        variantName: pick.variantName,
      });
    }
  }

  if (spec.familySlug && rows.length === 0 && pool[0]) {
    const entry = pool[0];
    rows.push({
      rank: 1,
      slug: entry.familySlug,
      displayName: entry.displayName,
      explanation: "Variant-level data insufficient — family-level score shown.",
      compositeScore: entry.scored?.overall?.score,
      detailPath: `/cars/${entry.familySlug}`,
    });
  }

  return rows.slice(0, spec.limit || 10);
}

export function generateSeoContent(spec, vehicles = []) {
  if (!spec) {
    return { ok: false, errors: ["Page spec required"] };
  }

  const entries = buildVehicleEntries(vehicles);
  if (!entries.length) {
    return { ok: false, errors: ["No scorable vehicles in catalog pool"] };
  }

  let rankedVehicles = [];
  let category = "usage";

  switch (spec.contentType) {
    case SEO_CONTENT_TYPES.COMPARE:
      rankedVehicles = buildComparePage(spec, entries);
      category = "compare";
      break;
    case SEO_CONTENT_TYPES.TOP_LIST:
      rankedVehicles = rankTopList(spec, entries);
      category = "usage";
      break;
    case SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION:
      rankedVehicles = buildVariantPages(spec, entries);
      category = "usage";
      break;
    default:
      rankedVehicles = rankBuyingGuide(spec, entries);
      category = "usage";
  }

  const intro = buildIntro(spec, rankedVehicles);
  const recommendationLogic = buildRecommendationLogic(spec, entries.length);

  const draftPage = enrichSeoPageMetadata(spec, {
    slug: spec.slug,
    pageTypeId: spec.pageTypeId,
    category,
    intro,
    recommendationLogic,
    rankedVehicles,
    tradeoffs: {
      summary:
        "Every recommendation uses deterministic EVSavari scores from catalog data — not LLM opinions or paid placement.",
      considerations: rankedVehicles.slice(0, 6).map((v) => ({
        slug: v.slug,
        tradeoff: v.tradeoff || v.explanation,
      })),
    },
  });

  const missingFields = validateContentCompleteness(draftPage);

  return {
    ok: true,
    seoPage: draftPage,
    wrapped: { seoPage: draftPage },
    missingFields,
    candidatePoolSize: entries.length,
  };
}

function buildIntro(spec, rankedVehicles) {
  const count = rankedVehicles.length;
  const label = spec.h1 || slugToDisplay(spec.slug);

  if (spec.contentType === SEO_CONTENT_TYPES.COMPARE) {
    return `${label} — side-by-side comparison using EVSavari Score Engine signals. We do not declare a universal winner; review deterministic scores and tradeoffs.`;
  }
  if (spec.contentType === SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION) {
    return `${label} — variant picks from score-engine variant analysis across ${count} data-backed entries.`;
  }
  return `${label} — ${count} EVs ranked by deterministic EVSavari ${getCategoryLabel(spec.categoryId) || spec.sortKey || "composite"} scores from verified catalog data.`;
}

function buildRecommendationLogic(spec, poolSize) {
  const base = {
    pageTypeId: spec.pageTypeId,
    methodology:
      "Deterministic EVSavari Score Engine v1 — catalog fields + category rankings. No LLM. Human approval required before publish.",
    tonePolicy: "well_suited_language_only",
    candidatePoolSize: poolSize,
    source: "seo-agent-v1",
  };

  if (spec.contentType === SEO_CONTENT_TYPES.COMPARE) {
    return {
      ...base,
      category: "compare",
      compareSlugs: spec.compareSlugs,
    };
  }

  if (spec.categoryId) {
    return {
      ...base,
      category: "usage",
      primaryScoreKey: spec.categoryId,
      categoryId: spec.categoryId,
    };
  }

  return {
    ...base,
    category: "usage",
    primaryScoreKey: spec.sortKey || "composite",
  };
}

export function validateContentCompleteness(seoPage) {
  const missing = [];
  if (!seoPage.title) missing.push("title");
  if (!seoPage.metaDescription || seoPage.metaDescription.length < 50) {
    missing.push("metaDescription");
  }
  if (!seoPage.slug) missing.push("slug");
  if (!seoPage.canonicalUrl) missing.push("canonicalUrl");
  if (!seoPage.intro) missing.push("intro");
  if (!seoPage.rankedVehicles?.length) missing.push("rankedVehicles");
  for (const v of seoPage.rankedVehicles || []) {
    if (!v.explanation) missing.push(`explanation:${v.slug}`);
    if (!v.detailPath) missing.push(`detailPath:${v.slug}`);
  }
  return missing;
}

export function wrapSeoPage(seoPage) {
  return { seoPage };
}
