import { isPresent } from "./governance.js";
import { CHARGING_SPEED_TAXONOMY } from "./taxonomy.js";

/**
 * Configurable sub-score weights (sum used for composite).
 */
export const SCORE_WEIGHTS = Object.freeze({
  chargingConvenience: 0.2,
  cityUsability: 0.2,
  highwayUsability: 0.18,
  ownershipAffordability: 0.17,
  technologyFeatures: 0.12,
  practicality: 0.13,
});

const MIN_SCORE = 0;
const MAX_SCORE = 100;

function clampScore(n) {
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.min(MAX_SCORE, Math.max(MIN_SCORE, n)));
}

function suitScore(meta, key) {
  const v = meta?.suitabilityScores?.[key];
  return isPresent(v) ? Number(v) : null;
}

/**
 * Deterministic EVSavari sub-scores — explainable, no fake precision.
 * @param {object} car
 * @param {object|null} intelligence from buildVehicleIntelligence
 */
export function buildEvsavariScores(car, intelligence = null) {
  const meta = car?.catalogMeta || {};
  const intel = intelligence || car?.evIntelligence;

  const chargingConvenience = clampScore(
    intel?.charging?.convenienceScore ??
      meta.compareValueScore ??
      null
  );

  const cityUsability = clampScore(
    suitScore(meta, "city") ??
      insightLevelToScore(intel, "city_commute")
  );

  const highwayUsability = clampScore(
    suitScore(meta, "highway") ??
      insightLevelToScore(intel, "highway")
  );

  const ownershipAffordability = clampScore(
    deriveOwnershipAffordability(car, intel)
  );

  const technologyFeatures = clampScore(
    deriveTechnologyScore(intel)
  );

  const practicality = clampScore(
    averagePresent([
      suitScore(meta, "family"),
      insightLevelToScore(intel, "family"),
      insightLevelToScore(intel, "apartment"),
    ])
  );

  const subScores = {
    chargingConvenience,
    cityUsability,
    highwayUsability,
    ownershipAffordability,
    technologyFeatures,
    practicality,
  };

  const composite = computeComposite(subScores);
  const catalogValue = meta.compareValueScore;

  const explanations = buildExplanations(subScores, intel);

  return {
    version: 1,
    subScores,
    composite: composite ?? (isPresent(catalogValue) ? clampScore(catalogValue) : null),
    catalogValueScore: isPresent(catalogValue) ? clampScore(catalogValue) : null,
    explanations,
    hasData: Object.values(subScores).some((v) => v != null) || composite != null,
  };
}

function insightLevelToScore(intel, insightId) {
  const insight = intel?.suitability?.insights?.find(
    (i) => i.id === insightId
  );
  if (!insight) return null;
  const map = { strong: 88, good: 72, moderate: 58, limited: 42 };
  return map[insight.level] ?? null;
}

function deriveOwnershipAffordability(car, intel) {
  const price = Number(car?.startingPrice ?? car?.price) || 0;
  const monthly = intel?.ownership?.monthlyChargingCostInr;
  let score = null;
  if (price > 0) {
    if (price < 1200000) score = 85;
    else if (price < 1800000) score = 72;
    else if (price < 2800000) score = 60;
    else score = 48;
  }
  if (isPresent(monthly)) {
    const costAdj = monthly < 1500 ? 8 : monthly > 2500 ? -8 : 0;
    score = score != null ? score + costAdj : 70 + costAdj;
  }
  return score;
}

function deriveTechnologyScore(intel) {
  const features = intel?.features;
  if (!features?.hasData) return null;
  let score = 50;
  if (features.adas?.supported === true) score += 15;
  if (features.v2l === true) score += 8;
  if (features.otaUpdates === true) score += 8;
  if (features.connectedCar === true) score += 6;
  if (features.batteryThermalManagement === true) score += 6;
  const hl = features.highlights?.length || 0;
  score += Math.min(12, hl * 3);
  return score;
}

function averagePresent(values) {
  const nums = values.filter((v) => v != null);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeComposite(subScores) {
  let totalWeight = 0;
  let weighted = 0;
  for (const [key, weight] of Object.entries(SCORE_WEIGHTS)) {
    const val = subScores[key];
    if (val == null) continue;
    weighted += val * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return null;
  return clampScore(weighted / totalWeight);
}

function buildExplanations(subScores, intel) {
  const out = {};
  if (subScores.chargingConvenience != null) {
    const cat = intel?.charging?.speedCategoryLabel;
    out.chargingConvenience = cat
      ? `Charging convenience reflects ${cat.toLowerCase()} and home/public flexibility.`
      : "Charging convenience based on available charging specs and DC times.";
  }
  if (subScores.cityUsability != null) {
    out.cityUsability =
      "City score uses suitability signals and practical range for daily commutes.";
  }
  if (subScores.highwayUsability != null) {
    out.highwayUsability =
      "Highway score considers range confidence and fast-charging practicality.";
  }
  if (subScores.ownershipAffordability != null) {
    out.ownershipAffordability =
      "Affordability blends indicative price band and estimated charging costs — not an on-road quote.";
  }
  if (subScores.technologyFeatures != null) {
    out.technologyFeatures =
      "Technology score counts verified feature signals (ADAS, OTA, connectivity) — no guessed specs.";
  }
  if (subScores.practicality != null) {
    out.practicality =
      "Practicality combines family and apartment-living suitability where data exists.";
  }
  return out;
}

export function getBestForLabel(scores) {
  if (!scores?.subScores) return null;
  const entries = Object.entries(scores.subScores).filter(
    ([, v]) => v != null
  );
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const labels = {
    chargingConvenience: "Best charging convenience",
    cityUsability: "Best for city",
    highwayUsability: "Best for highway",
    ownershipAffordability: "Best value to own",
    technologyFeatures: "Most tech-loaded",
    practicality: "Most practical",
  };
  return labels[entries[0][0]] || null;
}
