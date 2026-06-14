import { scoreVehicle } from "../scoring/scoreEngine.js";
import { SCORE_EXPLANATION_CONFIDENCE } from "./types.js";
import { evaluateScoreExplanationRules } from "./scoreExplanationRules.js";

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseKwhFromText(text) {
  if (text == null) return null;
  if (typeof text === "number") return text;
  const match = String(text).match(/([\d.]+)/);
  return match ? Number(match[1]) : null;
}

function readDimensionScore(breakdown, dimensionKey, legacySubScores, legacyKey) {
  const fromBreakdown = parseNumber(breakdown?.[dimensionKey]?.score);
  if (fromBreakdown != null) return fromBreakdown;

  const fromLegacy = parseNumber(legacySubScores?.[legacyKey]);
  if (fromLegacy != null) return fromLegacy;

  return null;
}

function resolveBreakdown(vehicle) {
  const existing = vehicle?.evSavariScores?.breakdown;
  if (existing && Object.values(existing).some((row) => row?.score != null)) {
    return existing;
  }

  try {
    const scored = scoreVehicle(vehicle);
    return scored?.breakdown || null;
  } catch {
    return null;
  }
}

function resolveBatteryKwh(vehicle, breakdown) {
  return (
    parseNumber(breakdown?.range?.signals?.batteryCapacityKwh) ??
    parseNumber(vehicle?.catalogMeta?.batteryCapacityKwh) ??
    parseKwhFromText(
      vehicle?.specifications?.batteryPack ||
        vehicle?.specifications?.batteryCapacity ||
        vehicle?.battery
    )
  );
}

/**
 * Build normalized score context from a catalog vehicle or dossier.
 * @param {object|null|undefined} vehicle
 * @returns {import("./types.js").ScoreExplanationContext}
 */
export function buildScoreExplanationContext(vehicle) {
  if (!vehicle || typeof vehicle !== "object") {
    return {
      cityScore: null,
      valueScore: null,
      chargingScore: null,
      highwayScore: null,
      rangeScore: null,
      safetyScore: null,
      performanceScore: null,
      batteryKwh: null,
      hasScoreData: false,
    };
  }

  const breakdown = resolveBreakdown(vehicle);
  const legacySubScores =
    vehicle?.evScores?.subScores || vehicle?.evIntelligence?.scores?.subScores;

  const cityScore = readDimensionScore(
    breakdown,
    "city",
    legacySubScores,
    "cityUsability"
  );
  const valueScore = readDimensionScore(
    breakdown,
    "value",
    legacySubScores,
    "ownershipAffordability"
  );
  const chargingScore = readDimensionScore(
    breakdown,
    "charging",
    legacySubScores,
    "chargingConvenience"
  );
  const highwayScore = readDimensionScore(
    breakdown,
    "highway",
    legacySubScores,
    "highwayUsability"
  );
  const rangeScore = readDimensionScore(
    breakdown,
    "range",
    legacySubScores,
    "range"
  );
  const safetyScore = readDimensionScore(
    breakdown,
    "safety",
    legacySubScores,
    "safety"
  );
  const performanceScore = readDimensionScore(
    breakdown,
    "performance",
    legacySubScores,
    "performance"
  );
  const batteryKwh = resolveBatteryKwh(vehicle, breakdown);

  const hasScoreData = [
    cityScore,
    valueScore,
    chargingScore,
    highwayScore,
    rangeScore,
    safetyScore,
    performanceScore,
    batteryKwh,
  ].some((value) => value != null);

  return {
    cityScore,
    valueScore,
    chargingScore,
    highwayScore,
    rangeScore,
    safetyScore,
    performanceScore,
    batteryKwh,
    hasScoreData,
  };
}

/**
 * Resolve explanation confidence from catalog trust metadata.
 * @param {object|null|undefined} vehicle
 * @returns {import("./types.js").ScoreExplanationConfidence}
 */
export function resolveScoreExplanationConfidence(vehicle) {
  const meta = vehicle?.catalogMeta || {};
  const badge = String(meta.verificationBadge || "").toLowerCase();
  const level = String(meta.verificationLevel || "").toLowerCase();

  if (
    badge === "verified" ||
    badge === "official" ||
    level === "verified" ||
    level === "golden"
  ) {
    return SCORE_EXPLANATION_CONFIDENCE.VERIFIED;
  }

  if (
    badge === "partial" ||
    level === "partial" ||
    level === "manual_review"
  ) {
    return SCORE_EXPLANATION_CONFIDENCE.PARTIAL;
  }

  if (meta.dataOrigin === "evsavari_estimated" || meta.estimated === true) {
    return SCORE_EXPLANATION_CONFIDENCE.ESTIMATED;
  }

  return SCORE_EXPLANATION_CONFIDENCE.VERIFIED;
}

/**
 * Transform EVSavari scores into user-friendly strengths and weaknesses.
 * UI-agnostic — returns plain strings for any surface (compare, detail, SEO).
 *
 * @param {object|null|undefined} vehicle Catalog vehicle, family card, or golden dossier
 * @returns {import("./types.js").ScoreExplanationResult}
 */
export function buildScoreExplanation(vehicle) {
  const ctx = buildScoreExplanationContext(vehicle);
  const { strengths, weaknesses } = evaluateScoreExplanationRules(ctx);

  return {
    strengths,
    weaknesses,
    confidence: resolveScoreExplanationConfidence(vehicle),
  };
}
