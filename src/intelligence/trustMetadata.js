import { CONFIDENCE_LEVELS } from "./constants.js";
import { isPresent } from "./governance.js";
import { buildFreshnessMetadata } from "./freshnessMetadata.js";
import {
  adjustConfidenceForFreshness,
  buildFreshnessConfidenceExplanation,
  computeFreshnessScore,
} from "./freshnessScoring.js";
import { buildChangeTransparency } from "./changeTransparency.js";

/**
 * Central trust / provenance taxonomy for intelligence fields.
 */

export const DATA_ORIGIN = Object.freeze({
  OEM_OFFICIAL: "oem_official",
  EVSAVARI_ESTIMATED: "evsavari_estimated",
  CATALOG_INTELLIGENCE: "catalog_intelligence",
  COMMUNITY_OBSERVED: "community_observed",
  REAL_WORLD_TESTED: "real_world_tested",
  INCOMPLETE: "incomplete_data",
  CURATED: "curated_review",
});

export const DATA_ORIGIN_LABELS = Object.freeze({
  [DATA_ORIGIN.OEM_OFFICIAL]: "OEM claimed",
  [DATA_ORIGIN.EVSAVARI_ESTIMATED]: "EVSavari estimated",
  [DATA_ORIGIN.CATALOG_INTELLIGENCE]: "Catalog intelligence",
  [DATA_ORIGIN.COMMUNITY_OBSERVED]: "Community observed",
  [DATA_ORIGIN.REAL_WORLD_TESTED]: "Real-world tested",
  [DATA_ORIGIN.INCOMPLETE]: "Data unavailable",
  [DATA_ORIGIN.CURATED]: "Editorially reviewed",
});

export const VERIFICATION_BADGE = Object.freeze({
  OFFICIAL: "official",
  ESTIMATED: "estimated",
  VERIFIED: "verified",
  PARTIAL: "partial",
  UNAVAILABLE: "unavailable",
});

/**
 * @param {object} opts
 * @returns {object} trust field descriptor for UI
 */
export function buildTrustField({
  label,
  value,
  origin = DATA_ORIGIN.EVSAVARI_ESTIMATED,
  confidenceLevel = CONFIDENCE_LEVELS.MEDIUM,
  estimated = true,
  explanation = "",
  available = true,
}) {
  const badge =
    !available || !isPresent(value)
      ? VERIFICATION_BADGE.UNAVAILABLE
      : origin === DATA_ORIGIN.OEM_OFFICIAL && !estimated
        ? VERIFICATION_BADGE.OFFICIAL
        : origin === DATA_ORIGIN.CURATED ||
            origin === DATA_ORIGIN.REAL_WORLD_TESTED
          ? VERIFICATION_BADGE.VERIFIED
          : VERIFICATION_BADGE.ESTIMATED;

  return {
    label,
    value,
    origin,
    originLabel: DATA_ORIGIN_LABELS[origin] || "Unknown",
    confidenceLevel,
    estimated,
    explanation,
    available: available && isPresent(value),
    badge,
  };
}

/**
 * Vehicle-level trust summary for detail / compare / discovery.
 */
export function buildVehicleTrustBundle(car, intelligence = null, curation = null) {
  const meta = car?.catalogMeta || {};
  const intel = intelligence;
  const partialSections = [];
  const availableSections = [];

  if (intel?.range?.hasData) availableSections.push("range");
  else partialSections.push("range");

  if (intel?.charging?.hasData) availableSections.push("charging");
  else partialSections.push("charging");

  if (intel?.ownership?.hasData) availableSections.push("ownership");
  else partialSections.push("ownership");

  const freshness = buildFreshnessMetadata(car);
  const freshnessScore = computeFreshnessScore(freshness);
  const transparency = buildChangeTransparency(car);

  const dataQualityScore = meta.dataQualityScore ?? null;
  const governanceStatus = meta.governanceStatus ?? null;

  let overallConfidence = CONFIDENCE_LEVELS.ESTIMATED;
  if (curation?.reviewed) {
    overallConfidence = CONFIDENCE_LEVELS.HIGH;
  } else if (intel?.range?.confidenceLevel === CONFIDENCE_LEVELS.HIGH) {
    overallConfidence = CONFIDENCE_LEVELS.HIGH;
  } else if (
    intel?.range?.confidenceLevel === CONFIDENCE_LEVELS.MEDIUM ||
    dataQualityScore >= 80
  ) {
    overallConfidence = CONFIDENCE_LEVELS.MEDIUM;
  }

  overallConfidence = adjustConfidenceForFreshness(
    overallConfidence,
    freshness
  );

  const freshnessExplanation = buildFreshnessConfidenceExplanation(
    freshness,
    freshnessScore
  );

  const editorialNotes = [
    ...(curation?.editorialNotes || []),
    ...(curation?.notes || []),
    ...(curation?.reviewNotes || []),
  ].filter(Boolean);

  return {
    overallConfidence,
    dataQualityScore,
    governanceStatus,
    partialIntelligence: partialSections.length > 0,
    partialSections,
    availableSections,
    editorialNotes: editorialNotes.slice(0, 4),
    reviewed: Boolean(curation?.reviewed),
    verificationStatus: freshness.verificationStatus,
    freshness,
    freshnessScore,
    freshnessExplanation,
    transparency,
    transparencyIntro:
      "Est. figures use documented EVSavari assumptions — not OEM quotes. Where data is missing we say so instead of guessing.",
    faqAnchors: buildTrustFaqAnchors(),
  };
}

export function buildTrustFaqAnchors() {
  return [
    {
      id: "range_realism",
      question: "Why is real-world range lower than ARAI?",
      answer:
        "ARAI uses lab cycles; real driving (traffic, AC, speed) uses more energy. We publish bands and confidence — not a single guaranteed km figure.",
    },
    {
      id: "charging_practicality",
      question: "Can I charge at home in an apartment?",
      answer:
        "Often yes with AC charging if you have a dedicated parking point and society approval. We flag apartment practicality where data exists — confirm with your RWA and electrician.",
    },
    {
      id: "ownership_estimates",
      question: "Are savings vs petrol guaranteed?",
      answer:
        "No. Savings use transparent assumptions (tariff, km/year). Treat them as directional — your bill depends on how and where you drive.",
    },
    {
      id: "data_freshness",
      question: "How fresh is this EV's data?",
      answer:
        "We track verification and catalog changes. If freshness is needs review or potentially stale, double-check price and charging with a dealer before deciding.",
    },
    {
      id: "catalog_updates",
      question: "What does 'recently updated' mean?",
      answer:
        "We detected a material catalog change in our window (e.g. price or charging). It does not mean every field was re-tested on the road.",
    },
  ];
}

export function getConfidenceLabel(level) {
  const map = {
    [CONFIDENCE_LEVELS.HIGH]: "High confidence",
    [CONFIDENCE_LEVELS.MEDIUM]: "Medium confidence",
    [CONFIDENCE_LEVELS.ESTIMATED]: "Estimated",
  };
  return map[level] || "Estimated";
}
