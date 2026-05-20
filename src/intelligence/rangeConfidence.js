import {
  CONFIDENCE_LEVELS,
  RANGE_CONFIDENCE_THRESHOLDS,
  RANGE_SOURCES,
  REAL_WORLD_RANGE_FACTORS,
  RANGE_CITY_FACTORS,
  RANGE_HIGHWAY_FACTORS,
  RANGE_ESTIMATE_METHODS,
  SEASONAL_RANGE_NOTES,
} from "./constants.js";
import { isPresent, pickFirstPresent, UNAVAILABLE } from "./governance.js";
import { DATA_ORIGIN } from "./trustMetadata.js";

function scoreFromLevel(level) {
  if (level === CONFIDENCE_LEVELS.HIGH) return 88;
  if (level === CONFIDENCE_LEVELS.MEDIUM) return 68;
  return 48;
}

function bandFromClaimed(claimed, factors) {
  const c = Number(claimed);
  if (!c || c <= 0) return UNAVAILABLE;
  return {
    min: Math.round(c * factors.min),
    max: Math.round(c * factors.max),
  };
}

function mapSourceToOrigin(source) {
  const map = {
    [RANGE_SOURCES.OEM_CLAIMED]: DATA_ORIGIN.OEM_OFFICIAL,
    [RANGE_SOURCES.INTERNAL_ESTIMATE]: DATA_ORIGIN.EVSAVARI_ESTIMATED,
    [RANGE_SOURCES.CATALOG]: DATA_ORIGIN.CATALOG_INTELLIGENCE,
    [RANGE_SOURCES.REAL_WORLD_TESTED]: DATA_ORIGIN.REAL_WORLD_TESTED,
    [RANGE_SOURCES.COMMUNITY_VERIFIED]: DATA_ORIGIN.COMMUNITY_OBSERVED,
  };
  return map[source] || DATA_ORIGIN.EVSAVARI_ESTIMATED;
}

/**
 * @param {object} car
 */
export function buildRangeConfidence(car) {
  const meta = car?.catalogMeta || {};
  const specs = car?.specifications || {};

  const claimedRangeKm = pickFirstPresent(
    meta.claimedRangeKm,
    Number(specs.range) || car?.range,
    UNAVAILABLE
  );

  let estimatedRealWorldKm = UNAVAILABLE;
  let mixedUsageRangeKm = UNAVAILABLE;
  let cityRangeKm = UNAVAILABLE;
  let highwayRangeKm = UNAVAILABLE;
  let source = RANGE_SOURCES.OEM_CLAIMED;
  let rangeConfidenceSource = DATA_ORIGIN.OEM_OFFICIAL;
  let estimateMethod = RANGE_ESTIMATE_METHODS.OEM_ONLY;
  let confidenceLevel = CONFIDENCE_LEVELS.ESTIMATED;
  let confidenceExplanation =
    "Range confidence is limited until verified real-world data is available for this model.";

  const catalogRw = meta.realWorldRangeKm;
  const expanded = meta.rangeRealityExpanded || meta.rangeReality;

  if (
    catalogRw &&
    isPresent(catalogRw.min) &&
    isPresent(catalogRw.max)
  ) {
    estimatedRealWorldKm = {
      min: Number(catalogRw.min),
      max: Number(catalogRw.max),
    };
    mixedUsageRangeKm = { ...estimatedRealWorldKm };
    source =
      expanded?.source === "tested"
        ? RANGE_SOURCES.REAL_WORLD_TESTED
        : RANGE_SOURCES.CATALOG;
    estimateMethod = RANGE_ESTIMATE_METHODS.CATALOG_BAND;
    confidenceLevel = CONFIDENCE_LEVELS.HIGH;
    confidenceExplanation =
      "Real-world range band from EVSavari catalog intelligence (mixed Indian driving; not ARAI certified).";
  } else if (isPresent(claimedRangeKm)) {
    const claimed = Number(claimedRangeKm);
    estimatedRealWorldKm = bandFromClaimed(
      claimed,
      REAL_WORLD_RANGE_FACTORS
    );
    mixedUsageRangeKm = { ...estimatedRealWorldKm };
    source = RANGE_SOURCES.INTERNAL_ESTIMATE;
    estimateMethod = RANGE_ESTIMATE_METHODS.EFFICIENCY_MODEL;
    confidenceLevel = CONFIDENCE_LEVELS.MEDIUM;
    confidenceExplanation =
      "Estimated bands use typical Indian mixed-use efficiency vs ARAI claim — not a single guaranteed range.";
  }

  if (expanded?.communityVerified) {
    source = RANGE_SOURCES.COMMUNITY_VERIFIED;
    confidenceLevel = CONFIDENCE_LEVELS.HIGH;
    confidenceExplanation =
      "Range band aligns with community-observed reports on EVSavari.";
  }

  rangeConfidenceSource = mapSourceToOrigin(source);

  if (isPresent(claimedRangeKm)) {
    const claimed = Number(claimedRangeKm);
    const base =
      mixedUsageRangeKm !== UNAVAILABLE
        ? mixedUsageRangeKm.max
        : estimatedRealWorldKm !== UNAVAILABLE
          ? estimatedRealWorldKm.max
          : claimed;

    cityRangeKm = bandFromClaimed(base, RANGE_CITY_FACTORS);
    highwayRangeKm = bandFromClaimed(claimed, RANGE_HIGHWAY_FACTORS);
  }

  const seasonalNotes = [...SEASONAL_RANGE_NOTES];
  if (highwayRangeKm !== UNAVAILABLE) {
    seasonalNotes.push(
      "Highway usage: expect lower efficiency at sustained speeds — plan DC stops on long routes."
    );
  }

  const confidenceScore = scoreFromLevel(confidenceLevel);

  const hasData =
    isPresent(claimedRangeKm) || estimatedRealWorldKm !== UNAVAILABLE;

  return {
    claimedRangeKm: isPresent(claimedRangeKm)
      ? Number(claimedRangeKm)
      : UNAVAILABLE,
    estimatedRealWorldKm,
    mixedUsageRangeKm:
      mixedUsageRangeKm !== UNAVAILABLE
        ? mixedUsageRangeKm
        : estimatedRealWorldKm,
    cityRangeKm,
    highwayRangeKm,
    confidenceLevel,
    confidenceScore,
    explanation: confidenceExplanation,
    confidenceExplanation,
    source,
    rangeConfidenceSource,
    estimateMethod,
    testingClassification:
      source === RANGE_SOURCES.REAL_WORLD_TESTED
        ? "real_world_tested"
        : source === RANGE_SOURCES.INTERNAL_ESTIMATE
          ? "internal_estimate"
          : "oem_claimed",
    seasonalNotes,
    highwayNote:
      highwayRangeKm !== UNAVAILABLE
        ? "Lower efficiency expected on highways vs city commuting."
        : null,
    estimated: estimateMethod !== RANGE_ESTIMATE_METHODS.OEM_ONLY,
    hasData,
  };
}

export function formatRangeConfidenceLabel(rangeIntel) {
  if (!rangeIntel?.hasData) return "—";
  const level = rangeIntel.confidenceLevel;
  const labels = {
    [CONFIDENCE_LEVELS.HIGH]: "High confidence",
    [CONFIDENCE_LEVELS.MEDIUM]: "Medium confidence",
    [CONFIDENCE_LEVELS.ESTIMATED]: "Estimated",
  };
  return labels[level] || "Estimated";
}

export function formatRangeBand(band) {
  if (!band?.min && !band?.max) return "—";
  return `${band.min}–${band.max} km`;
}

export function meetsConfidenceThreshold(
  score,
  min = RANGE_CONFIDENCE_THRESHOLDS.mediumMinScore
) {
  return isPresent(score) && Number(score) >= min;
}
