/**
 * Compare score credibility — explanations and pill hygiene.
 */

import { CONFIDENCE_LEVELS } from "../intelligence/constants.js";
import {
  ensureArray,
  safeFlatMap,
  safeMap,
} from "./compareArrayUtils.js";

function coerceScore(car) {
  const composite =
    car?.evScores?.composite ??
    car?.evIntelligence?.scores?.composite ??
    car?.catalogMeta?.compareValueScore;
  if (composite == null || !Number.isFinite(Number(composite))) return null;
  return Math.round(Number(composite));
}

/**
 * Deduplicate strength pills (case-insensitive).
 */
export function dedupeComparePills(pills = []) {
  const seen = new Set();
  const out = [];
  for (const pill of ensureArray(pills, { label: "pills", subsystem: "compare-ui" })) {
    const text = String(pill || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

/**
 * @param {object} car
 */
export function buildCompareScoreInsight(car = {}) {
  const score = coerceScore(car);
  const meta = car?.catalogMeta || {};
  const topFactors = safeMap(
    car?.evScores?.explanations,
    (row) => row?.label || row?.text,
    { label: "evScores.explanations", subsystem: "compare-score" }
  )
    .filter(Boolean)
    .slice(0, 3);

  const dataQuality = meta.dataQualityScore;
  const reviewed = meta.governanceStatus === "published" || meta.reviewed;
  const confidence =
    meta.confidence === "high" || dataQuality >= 85
      ? "high"
      : meta.confidence === "medium" || dataQuality >= 70
        ? "medium"
        : "low";

  const whyLines = [];
  if (score != null) {
    whyLines.push(
      `Composite score ${score}/100 blends range confidence, charging practicality, and ownership signals.`
    );
  } else {
    whyLines.push("Score unavailable — catalog intelligence incomplete for this EV.");
  }
  if (topFactors.length) {
    whyLines.push(`Top factors: ${topFactors.join(" · ")}.`);
  }
  if (reviewed) {
    whyLines.push("Published catalog governance supports this score band.");
  } else if (confidence === "low") {
    whyLines.push("Treat as directional — specs may be estimated or awaiting review.");
  }

  if (dataQuality != null && dataQuality < 80) {
    whyLines.push(
      "Data quality impacts score confidence — missing or estimated fields lower the band."
    );
  }

  const estimatedLabel =
    meta.estimated !== false && confidence !== "high"
      ? "Includes EVSavari-estimated fields"
      : null;

  const ownershipConfidence =
    meta.confidence === "high" && meta.estimated !== true
      ? "high"
      : meta.estimated === true
        ? "low"
        : confidence;

  const chargingPracticalityConfidence =
    car?.evIntelligence?.charging?.hasData &&
    (car?.evIntelligence?.chargingPracticality?.convenienceLevelLabel ||
      car?.evIntelligence?.charging?.convenienceScore >= 60)
      ? confidence === "low"
        ? "medium"
        : "high"
      : "low";

  const recommendationMaturity =
    meta.governanceStatus === "published" && reviewed
      ? "mature"
      : reviewed
        ? "developing"
        : "early";

  const ownershipConfidenceMaturity =
    ownershipConfidence === "high" && meta.estimated !== true ? 85 : 55;
  const chargingRealismMaturity =
    chargingPracticalityConfidence === "high"
      ? 80
      : chargingPracticalityConfidence === "medium"
        ? 62
        : 42;
  const compareRealismMaturity = score != null ? Math.min(100, score) : 45;
  const trustVolatility =
    confidence === "low"
      ? 72
      : meta.estimated === true
        ? 48
        : dataQuality != null && dataQuality < 75
          ? 38
          : 18;

  return {
    score,
    confidence,
    ownershipConfidence,
    chargingPracticalityConfidence,
    recommendationMaturity,
    ownershipConfidenceMaturity,
    chargingRealismMaturity,
    compareRealismMaturity,
    trustVolatility,
    confidenceLabel:
      confidence === "high"
        ? "High confidence"
        : confidence === "medium"
          ? "Medium confidence"
          : "Directional estimate",
    whySummary: whyLines.join(" "),
    estimatedLabel,
    estimateTransparency:
      meta.estimated === true
        ? "Includes estimated catalog fields"
        : meta.confidence === "high"
          ? "Mostly verified catalog fields"
          : "Mixed verified and directional fields",
    dataQualityScore: dataQuality,
    topFactors,
  };
}

/**
 * Cross-vehicle compare set sanity (gap + contradictions).
 * @param {object[]} cars
 */
export function auditCompareSetCredibility(cars = []) {
  const scores = safeMap(cars, coerceScore, {
    label: "compareCars",
    subsystem: "compare-audit",
  }).filter((s) => s != null);
  const warnings = [];
  if (scores.length >= 2) {
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    if (max - min > 35) {
      warnings.push({
        code: "large_score_gap",
        message: `Score spread ${max - min} pts — verify editorial picks match scores.`,
      });
    }
  }

  const allPills = safeFlatMap(
    cars,
    (car) => {
      const meta = car?.catalogMeta || {};
      return safeMap(
        meta.strongestAdvantages,
        (a) => (typeof a === "string" ? a : a?.label),
        { label: "strongestAdvantages", subsystem: "compare-audit" }
      );
    },
    { label: "compareCars", subsystem: "compare-audit" }
  );
  const normalized = allPills.map((p) => String(p || "").toLowerCase()).filter(Boolean);
  const dupAcross = normalized.filter(
    (p, i) => normalized.indexOf(p) !== i
  );
  if (dupAcross.length) {
    warnings.push({
      code: "duplicate_strengths",
      message: "Duplicate “better at” labels across vehicles in this compare.",
    });
  }

  return { warnings, scores };
}

export { CONFIDENCE_LEVELS };
