import { FRESHNESS_THRESHOLDS } from "./constants.js";
import { extractCatalogChangeLog, CHANGE_SEVERITY } from "./changeDetection.js";
import { buildFreshnessMetadata, daysSince, parseIsoDate } from "./freshnessMetadata.js";
import { extractCurationMetadata } from "./curationMetadata.js";
import { isPresent } from "./governance.js";

function formatMonthYear(value) {
  const d = parseIsoDate(value);
  if (!d) return null;
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatRelativeDays(days) {
  if (days == null) return null;
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/**
 * Transparency notes, badges, and "last updated" summaries — no fake timestamps.
 * @param {object} car
 */
export function buildChangeTransparency(car) {
  const meta = car?.catalogMeta || {};
  const freshness = buildFreshnessMetadata(car);
  const curation = extractCurationMetadata(car);
  const changeLog = extractCatalogChangeLog(car);

  const notes = [];
  const badges = [];

  const priceUpdated = meta.priceLastUpdated || meta.pricing?.lastUpdatedAt;
  const priceDays = daysSince(priceUpdated);
  if (isPresent(priceUpdated) && priceDays != null) {
    if (priceDays <= FRESHNESS_THRESHOLDS.priceUpdateRecentDays) {
      badges.push({
        id: "price_recent",
        label: "Price updated recently",
        relative: formatRelativeDays(priceDays),
      });
      notes.push(`Price updated ${formatRelativeDays(priceDays)}.`);
    } else {
      const when = formatMonthYear(priceUpdated);
      if (when) notes.push(`Last known price update: ${when}.`);
    }
  }

  if (curation.reviewed && curation.reviewedAt) {
    const reviewedLabel = formatMonthYear(curation.reviewedAt);
    if (reviewedLabel) {
      notes.push(`Intelligence reviewed ${reviewedLabel}.`);
      if (daysSince(curation.reviewedAt) <= FRESHNESS_THRESHOLDS.freshDays) {
        badges.push({
          id: "reviewed_recent",
          label: "Recently reviewed",
          relative: formatRelativeDays(daysSince(curation.reviewedAt)),
        });
      }
    }
  }

  const recentChanges = changeLog.recentChanges || [];
  for (const change of recentChanges.slice(0, 3)) {
    const detectedAt = change.detectedAt || change.at;
    const days = daysSince(detectedAt);
    if (days != null && days <= FRESHNESS_THRESHOLDS.specChangeRecentDays) {
      const summary =
        change.summary ||
        change.fieldLabel ||
        change.field ||
        "Specification";
      badges.push({
        id: `change_${change.field || summary}`,
        label: "Spec updated recently",
        detail: summary,
        relative: formatRelativeDays(days),
        severity: change.severity || CHANGE_SEVERITY.MINOR,
      });
      notes.push(`${summary} (${formatRelativeDays(days)}).`);
    }
  }

  if (freshness.lastVerifiedAt) {
    const verified = formatMonthYear(freshness.lastVerifiedAt);
    if (verified && freshness.state === "fresh") {
      notes.push(`Catalog verified ${verified}.`);
    }
  }

  const chargingReviewed =
    meta.chargingIntelligence?.reviewedAt ||
    meta.chargingPracticality?.reviewedAt;
  if (chargingReviewed) {
    const label = formatMonthYear(chargingReviewed);
    if (label) notes.push(`Charging specs reviewed ${label}.`);
  }

  return {
    notes: [...new Set(notes)].slice(0, 5),
    badges: badges.slice(0, 4),
    hasTransparency: notes.length > 0 || badges.length > 0,
    lastCatalogUpdate: freshness.catalogUpdatedAt || priceUpdated || null,
    showRecentlyUpdated: badges.some(
      (b) => b.id === "price_recent" || b.id?.startsWith("change_")
    ),
  };
}
