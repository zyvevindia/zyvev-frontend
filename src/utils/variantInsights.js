import {
  extractFamilySlug,
  filterComparableVariants,
} from "./modelFamily";
import { formatChargingDurationDisplay } from "./formatChargingDuration.js";
import { formatRangeBand } from "../intelligence/rangeConfidence.js";
import {
  extractVariantMetricValues,
  formatVariantAcChargingDisplay,
  formatVariantDcChargingDisplay,
  formatVariantPowerDisplay,
} from "./familyAggregateMetrics.js";

/**
 * Variant-level heuristics for trim selection UX (detail page).
 */

function numericPrice(v) {
  return Number(v?.price ?? v?.startingPrice ?? 0) || 0;
}

function numericRange(v) {
  return Number(v?.range ?? v?.specifications?.range ?? 0) || 0;
}

function confidenceScore(v) {
  const meta = v?.catalogMeta || {};
  return (
    meta.dataQualityScore ??
    meta.compareValueScore ??
    null
  );
}

function drivetrainTag(v) {
  const perf =
    v?.performance?.driveType ||
    v?.catalogMeta?.driveType ||
    v?.specifications?.driveType;
  if (perf) return String(perf).toUpperCase();
  return null;
}

function chargingMinutes(v) {
  const raw =
    v?.chargingTime ||
    v?.specifications?.chargingTime ||
    "";
  const match = String(raw).match(/(\d+)\s*min/i);
  return match ? Number(match[1]) : null;
}

const FALLBACK_CHARGING = "Fast charging supported";
const FALLBACK_PERFORMANCE = "—";
const FALLBACK_BATTERY = "EV battery pack";

/**
 * Shared hero/gallery fallback for trims missing media.
 */
export function resolveFamilyMediaFallback(
  family,
  variants = []
) {
  const fromFamily =
    family?.heroImage ||
    family?.image ||
    family?.defaultVariant?.heroImage;
  if (fromFamily) return fromFamily;

  for (const v of variants) {
    const candidate = v?.heroImage || v?.image;
    if (candidate) return candidate;
  }
  return null;
}

export function applyFamilyMediaFallback(
  variants = [],
  fallbackUrl
) {
  if (!fallbackUrl) return variants;

  return variants.map((v) => {
    const hero =
      v.heroImage || v.image || fallbackUrl;
    const gallery =
      Array.isArray(v.galleryImages) &&
      v.galleryImages.length > 0
        ? v.galleryImages
        : [hero];

    return {
      ...v,
      heroImage: hero,
      image: v.image || hero,
      galleryImages: gallery,
    };
  });
}

/**
 * Normalized specs — never undefined blocks on trim switch.
 */
export function resolveVariantSpecs(
  variant,
  familyFallback = null
) {
  const specs = variant?.specifications || {};
  const familySpecs =
    familyFallback?.specifications || {};

  const range =
    Number(
      variant?.range ??
        specs.range ??
        familySpecs.range ??
        familyFallback?.range
    ) || 0;

  const price =
    numericPrice(variant) ||
    numericPrice(familyFallback);

  return {
    price,
    range,
    battery:
      variant?.batteryPack ||
      specs.batteryPack ||
      familySpecs.batteryPack ||
      FALLBACK_BATTERY,
    charging:
      variant?.chargingTime ||
      specs.chargingTime ||
      familySpecs.chargingTime ||
      FALLBACK_CHARGING,
    topSpeed:
      specs.topSpeed ||
      familySpecs.topSpeed ||
      FALLBACK_PERFORMANCE,
  };
}

export function preloadVariantGallery(
  images = []
) {
  if (typeof window === "undefined") return;

  const unique = [
    ...new Set(
      images.filter((url) => typeof url === "string" && url)
    ),
  ];

  for (const url of unique.slice(0, 8)) {
    const img = new window.Image();
    img.decoding = "async";
    img.src = url;
  }
}

export const BEST_FOR_LABELS = {
  best_value: "Best value",
  long_range: "Long range",
  city_use: "City use",
  family_use: "Family use",
  fast_charging: "Fast charging",
  recommended: "Recommended",
};

/**
 * Default trim when no ?variant= — featured, else best value (lowest price).
 */
export function pickDefaultVariantForDetail(variants = []) {
  if (!variants.length) return null;
  const featured = variants.find((v) => v.isFeatured);
  if (featured) return featured;

  return [...variants].sort(
    (a, b) => numericPrice(a) - numericPrice(b)
  )[0];
}

/**
 * @returns {Record<string, string[]>} variantSlug -> badge keys
 */
export function computeVariantAwards(variants = []) {
  const awards = {};
  if (!variants.length) return awards;

  const init = () => {
    for (const v of variants) {
      awards[v.slug] = [];
    }
  };
  init();

  const byPrice = [...variants].sort(
    (a, b) => numericPrice(a) - numericPrice(b)
  );
  const byRange = [...variants].sort(
    (a, b) => numericRange(b) - numericRange(a)
  );
  const byCity = [...variants].sort((a, b) => {
    const ac =
      a.catalogMeta?.suitabilityScores?.city ?? 0;
    const bc =
      b.catalogMeta?.suitabilityScores?.city ?? 0;
    return bc - ac;
  });
  const byFamily = [...variants].sort((a, b) => {
    const af =
      a.catalogMeta?.suitabilityScores?.family ?? 0;
    const bf =
      b.catalogMeta?.suitabilityScores?.family ?? 0;
    return bf - af;
  });
  const byCharge = [...variants].sort((a, b) => {
    const ac = chargingMinutes(a) ?? 9999;
    const bc = chargingMinutes(b) ?? 9999;
    return ac - bc;
  });

  const push = (v, key) => {
    if (v?.slug && !awards[v.slug].includes(key)) {
      awards[v.slug].push(key);
    }
  };

  if (byPrice[0]) push(byPrice[0], "best_value");
  if (byRange[0]) push(byRange[0], "long_range");
  if (byCity[0]) push(byCity[0], "city_use");
  if (byFamily[0]) push(byFamily[0], "family_use");
  if (byCharge[0]) push(byCharge[0], "fast_charging");

  const featured = variants.filter((v) => v.isFeatured);
  const recommended =
    featured[0] || byPrice[0];
  if (recommended) push(recommended, "recommended");

  return awards;
}

/**
 * Verified real-world range from catalog intelligence only (no OEM estimates).
 */
export function formatVariantRealWorldRangeDisplay(variant) {
  const rw = variant?.catalogMeta?.realWorldRangeKm;
  const min = Number(rw?.min);
  const max = Number(rw?.max);
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return formatRangeBand({ min, max });
  }
  return null;
}

/**
 * Compact DC + AC charging lines for variant comparison tables.
 * @returns {string[] | null}
 */
export function formatVariantCombinedChargingLines(dcCharging, acCharging) {
  const lines = [];
  if (dcCharging && dcCharging !== "—") {
    lines.push(`DC: ${dcCharging}`);
  }
  if (acCharging && acCharging !== "—") {
    lines.push(`AC: ${acCharging}`);
  }
  return lines.length ? lines : null;
}

function dossierFeatureBadges(variant) {
  const tags =
    variant?.catalogMeta?.featureTags ||
    variant?.featureTags;
  if (!Array.isArray(tags) || !tags.length) return null;
  return tags.map((label) => ({
    key: String(label)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, ""),
    label: String(label).trim(),
  }));
}

export function enrichVariantsWithInsights(
  variants = [],
  familyFallback = null
) {
  const awards = computeVariantAwards(variants);

  return variants.map((v) => {
    const normalized = resolveVariantSpecs(
      v,
      familyFallback
    );
    const metricValues = extractVariantMetricValues(
      v,
      familyFallback
    );
    const dossierBadges = dossierFeatureBadges(v);

    return {
      ...v,
      insightBadges:
        dossierBadges ||
        (awards[v.slug] || []).map(
        (key) => ({
          key,
          label: BEST_FOR_LABELS[key] || key,
        })
      ),
      drivetrain: drivetrainTag(v),
      confidenceScore: confidenceScore(v),
      displayBattery: normalized.battery,
      displayRange:
        normalized.range > 0
          ? `${normalized.range} km`
          : "—",
      displayCharging: formatChargingDurationDisplay(normalized.charging),
      displayDcCharging:
        formatVariantDcChargingDisplay(metricValues) || "—",
      displayAcCharging:
        formatVariantAcChargingDisplay(metricValues) || "—",
      displayChargingLines: formatVariantCombinedChargingLines(
        formatVariantDcChargingDisplay(metricValues),
        formatVariantAcChargingDisplay(metricValues)
      ),
      displayRealWorldRange:
        formatVariantRealWorldRangeDisplay(v) || "—",
      displayPower: formatVariantPowerDisplay(metricValues) || "—",
      displayPerformance: normalized.topSpeed,
    };
  });
}

export function buildVariantComparisonRows(variants = []) {
  const familySlug = extractFamilySlug(
    variants[0]?.familySlug || variants[0]?.slug
  );
  const comparable = filterComparableVariants(
    variants,
    familySlug
  );

  return enrichVariantsWithInsights(comparable).map((v) => ({
    slug: v.slug,
    name: v.variantLabel || v.name,
    price: numericPrice(v),
    priceLabel:
      numericPrice(v) > 0
        ? numericPrice(v)
        : null,
    battery: v.displayBattery,
    range: numericRange(v),
    rangeLabel: v.displayRange,
    realWorldRangeLabel: v.displayRealWorldRange,
    chargingLines: v.displayChargingLines,
    power: v.displayPower,
    badges: v.insightBadges,
  }));
}

export function getActiveVariantLabel(variant, familyTitle) {
  if (variant?.variantLabel) return variant.variantLabel;
  const name = variant?.name || "";
  if (
    familyTitle &&
    name.toLowerCase().startsWith(familyTitle.toLowerCase())
  ) {
    return name.slice(familyTitle.length).trim() || name;
  }
  return name;
}
