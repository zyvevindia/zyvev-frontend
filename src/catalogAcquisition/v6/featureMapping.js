/**
 * v6 — evidence → feature mapping before generic LLM extraction.
 */

import { createEvidenceRecord } from "../evidenceRecord.js";
import { EVIDENCE_SOURCE_TYPE, EVIDENCE_TRUST_SCORE } from "../constants.js";

export const V6_TARGET_FEATURES = Object.freeze([
  "sunroof",
  "camera360",
  "ventilatedSeats",
  "adas",
  "v2l",
  "connectedCar",
]);

/** Positive / negative patterns per feature. */
const FEATURE_RULES = Object.freeze({
  sunroof: {
    positive: [
      /\bsunroof\b/i,
      /\bpanoramic\s+(?:sky\s+)?roof\b/i,
      /\bsky\s+roof\b/i,
      /\bsingle\s+pane\s+sky\b/i,
      /\bdual\s+pane\s+panoramic\b/i,
    ],
    negative: [/without\s+sunroof/i, /no\s+sunroof/i],
  },
  camera360: {
    positive: [
      /\b360\s*[-]?\s*(?:view|camera)\b/i,
      /\bsurround\s+view\b/i,
      /\baround\s+view\s+monitor\b/i,
      /\bavm\b/i,
    ],
    negative: [],
  },
  ventilatedSeats: {
    positive: [
      /\bventilated\s+seats?\b/i,
      /\bcooled\s+seats?\b/i,
      /\bventilated\s+front\s+seats?\b/i,
    ],
    negative: [/without\s+ventilated/i],
  },
  adas: {
    positive: [
      /\badas\b/i,
      /\badvanced\s+driver\s+assistance\b/i,
      /\bautonomous\s+emergency\s+braking\b/i,
      /\blane\s+keep\s+assist\b/i,
      /\badaptive\s+cruise\b/i,
      /\bforward\s+collision\b/i,
    ],
    negative: [/no\s+adas/i, /without\s+adas/i],
  },
  v2l: {
    positive: [
      /\bv2l\b/i,
      /\bvehicle\s+to\s+load\b/i,
      /\bvehicle-to-load\b/i,
      /\bv2l\s+outside\b/i,
      /\bdischarge\s+port\b/i,
    ],
    negative: [],
  },
  connectedCar: {
    positive: [
      /\bconnected\s+car\b/i,
      /\bconnected\s+suv\b/i,
      /\bi[\s-]?link\b/i,
      /\badrenox\b/i,
      /\bconnected\s+vehicle\b/i,
      /\bota\s+update/i,
      /\bmy\s+mg\s+app\b/i,
      /\bbluelink\b/i,
    ],
    negative: [/not\s+connected/i],
  },
});

function stripHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectFeatureInText(featureKey, text) {
  const rules = FEATURE_RULES[featureKey];
  if (!rules || !text) return null;
  const hay = text.length > 500_000 ? text.slice(0, 500_000) : text;
  if (rules.negative?.some((re) => re.test(hay))) return false;
  if (rules.positive.some((re) => re.test(hay))) return true;
  return null;
}

/**
 * Scan acquisition sources and emit feature evidence records.
 * @param {object[]} sources
 * @param {object} meta
 */
export function mapFeaturesFromSources(sources = [], meta = {}) {
  const records = [];
  const detected = {};

  for (const source of sources) {
    if (!source?.content) continue;
    const text = source.content.includes("<") ? stripHtml(source.content) : source.content;
    const trustScore = source.type === EVIDENCE_SOURCE_TYPE.OEM_PDF
      ? EVIDENCE_TRUST_SCORE[EVIDENCE_SOURCE_TYPE.OEM_PDF] ?? 90
      : source.type === EVIDENCE_SOURCE_TYPE.OEM_WEBSITE
        ? EVIDENCE_TRUST_SCORE[EVIDENCE_SOURCE_TYPE.OEM_WEBSITE] ?? 85
        : EVIDENCE_TRUST_SCORE[EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE] ?? 70;

    for (const featureKey of V6_TARGET_FEATURES) {
      const val = detectFeatureInText(featureKey, text);
      if (val === null) continue;

      const prev = detected[featureKey];
      const score = trustScore + (val ? 5 : 0);
      if (!prev || score > prev.score) {
        detected[featureKey] = { value: val, score, source };
      }
    }
  }

  for (const [fieldName, hit] of Object.entries(detected)) {
    records.push(
      createEvidenceRecord({
        importId: meta.importId,
        fieldName,
        fieldValue: hit.value,
        sourceType: hit.source?.type || EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
        sourceName: hit.source?.name || "v6-feature-mapping",
        sourceUrl: hit.source?.url || null,
        trustScore: hit.score,
        extractionConfidence: Math.min(94, hit.score),
        extractionMethod: "v6-feature-mapping",
        sourceSnippet: `feature:${fieldName}=${hit.value}`,
      })
    );
  }

  return records;
}

/**
 * Apply feature detections to merged fields.
 */
export function applyFeaturesToMergedFields(mergedFields, featureRecords = []) {
  const out = { ...mergedFields };
  for (const rec of featureRecords) {
    if (!V6_TARGET_FEATURES.includes(rec.fieldName)) continue;
    const boolVal = rec.fieldValue === true || rec.fieldValue === "true";
    const cur = out[rec.fieldName];
    const missing = !cur?.value && cur?.value !== false;
    if (missing) {
      out[rec.fieldName] = {
        fieldName: rec.fieldName,
        value: boolVal,
        confidence: rec.extractionConfidence ?? 85,
        status: "agreement",
        manualReview: false,
        sources: [{ sourceType: rec.sourceType, sourceUrl: rec.sourceUrl }],
        sourceValues: [{ value: boolVal }],
      };
    }
  }
  return out;
}
