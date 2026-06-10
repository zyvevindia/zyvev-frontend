/**
 * Evidence grounding — verify source snippets and reject hallucinated fields.
 */

import { ALL_SCALAR_FIELD_KEYS } from "../extractionSchema.js";

export function normalizeForSnippetMatch(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[₹,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactForMatch(text = "") {
  return normalizeForSnippetMatch(text).replace(/\s/g, "");
}

/**
 * Check whether a verbatim snippet is supported by source content.
 */
export function snippetSupportedInContent(snippet, sourceContent) {
  if (!snippet || !String(snippet).trim()) return false;
  if (!sourceContent || !String(sourceContent).trim()) return false;

  const ns = normalizeForSnippetMatch(snippet);
  const nc = normalizeForSnippetMatch(sourceContent);
  if (ns.length >= 2 && nc.includes(ns)) return true;

  const nsc = compactForMatch(snippet);
  const ncc = compactForMatch(sourceContent);
  if (nsc.length >= 3 && ncc.includes(nsc)) return true;

  return false;
}

function isGroundedEntry(entry, defaultSourceType) {
  if (!entry || typeof entry !== "object") return false;
  if (entry.value === null || entry.value === undefined || entry.value === "") return false;
  if (!entry.sourceSnippet || !String(entry.sourceSnippet).trim()) return false;
  if (!entry.sourceType && !defaultSourceType) return false;
  return true;
}

function cleanFieldEntry(entry, sourceContent, defaultSourceType) {
  if (!isGroundedEntry(entry, defaultSourceType)) {
    return { accepted: null, rejection: { reason: "missing_source_evidence", entry } };
  }

  const sourceType = entry.sourceType || defaultSourceType;
  if (!snippetSupportedInContent(entry.sourceSnippet, sourceContent)) {
    return {
      accepted: null,
      rejection: {
        reason: "snippet_not_in_source",
        fieldValue: entry.value,
        sourceSnippet: entry.sourceSnippet,
      },
    };
  }

  return {
    accepted: {
      value: entry.value,
      confidence: Math.min(Number(entry.confidence) || 85, 98),
      sourceSnippet: entry.sourceSnippet,
      sourceType,
    },
    rejection: null,
  };
}

/**
 * Reject scalar fields lacking verifiable source evidence.
 */
export function rejectUngroundedFields(fields = {}, sourceContent, defaultSourceType = "OEM_WEBSITE") {
  const accepted = {};
  const rejected = [];

  for (const key of ALL_SCALAR_FIELD_KEYS) {
    const entry = fields[key];
    if (!entry) continue;

    const { accepted: ok, rejection } = cleanFieldEntry(entry, sourceContent, defaultSourceType);
    if (ok) {
      accepted[key] = ok;
    } else if (rejection) {
      rejected.push({ fieldKey: key, ...rejection });
    }
  }

  return { fields: accepted, rejected };
}

const VARIANT_SUBFIELDS = [
  "variantName",
  "price",
  "battery",
  "range",
  "acChargingKw",
  "dcChargingKw",
  "charging",
  "featureHighlights",
];

/**
 * Reject variant sub-fields lacking verifiable source evidence.
 */
export function rejectUngroundedVariants(variants = [], sourceContent, defaultSourceType = "OEM_WEBSITE") {
  const accepted = [];
  const rejected = [];

  for (const variant of variants || []) {
    const row = { variantName: null };
    let hasAny = false;

    for (const subKey of VARIANT_SUBFIELDS) {
      const raw = variant[subKey];
      if (!raw) continue;

      const entry =
        typeof raw === "object" && "value" in raw ?
          raw
        : { value: raw, confidence: 75, sourceSnippet: null };

      const { accepted: ok, rejection } = cleanFieldEntry(entry, sourceContent, defaultSourceType);
      if (ok) {
        row[subKey] = ok;
        hasAny = true;
      } else if (rejection) {
        rejected.push({ variantField: subKey, ...rejection });
      }
    }

    if (hasAny && row.variantName?.value) {
      accepted.push(row);
    }
  }

  return { variants: accepted, rejected };
}

/**
 * Full grounding pipeline on normalized LLM output.
 */
export function applyEvidenceGrounding(parsed = {}, sourceContent, context = {}) {
  const defaultSourceType = context.sourceType || "OEM_WEBSITE";

  const scalar = rejectUngroundedFields(parsed.fields || {}, sourceContent, defaultSourceType);
  const variant = rejectUngroundedVariants(parsed.variants || [], sourceContent, defaultSourceType);

  const allRejected = [...scalar.rejected, ...variant.rejected];

  return {
    fields: scalar.fields,
    variants: variant.variants,
    grounding: {
      acceptedFieldCount: Object.keys(scalar.fields).length,
      acceptedVariantCount: variant.variants.length,
      rejectedCount: allRejected.length,
      rejected: allRejected,
    },
  };
}

/**
 * Map grounded variant rows to draft variant shape (values only).
 */
export function groundedVariantsToDraftRows(groundedVariants = []) {
  return groundedVariants.map((v) => {
    const pick = (key) => {
      const e = v[key];
      if (!e) return undefined;
      return {
        value: e.value,
        confidence: e.confidence,
        sourceSnippet: e.sourceSnippet,
        sourceType: e.sourceType,
      };
    };
    return {
      variantName: pick("variantName")?.value ?? "Variant",
      price: pick("price"),
      battery: pick("battery"),
      range: pick("range"),
      acChargingKw: pick("acChargingKw"),
      dcChargingKw: pick("dcChargingKw"),
      charging: pick("charging"),
      featureHighlights: pick("featureHighlights"),
    };
  });
}
