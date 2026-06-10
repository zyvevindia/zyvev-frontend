/**
 * v7 — structured PDF/HTML table parsing for specs and features.
 */

import { createEvidenceRecord } from "../evidenceRecord.js";
import { EVIDENCE_SOURCE_TYPE, EVIDENCE_TRUST_SCORE } from "../constants.js";
import { extractTableRowsFromText } from "../acquisition/parsePdf.js";
import { V6_TARGET_FEATURES } from "../v6/featureMapping.js";
import { parseRangeTestStandard } from "./numericNormalization.js";

function stripHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractHtmlTables(html = "") {
  const tables = [];
  const re = /<table[\s\S]*?<\/table>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const rows = [];
    const rowRe = /<tr[\s\S]*?<\/tr>/gi;
    let rm;
    while ((rm = rowRe.exec(m[0])) !== null) {
      const cells = [];
      const cellRe = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
      let cm;
      while ((cm = cellRe.exec(rm[0])) !== null) {
        cells.push(stripHtml(cm[1]));
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length >= 2) tables.push(rows);
  }
  return tables;
}

const SPEC_ROW_PATTERNS = [
  { field: "airbags", re: /air\s*bags?/i, valueRe: /(\d{1,2})/ },
  { field: "acChargingKw", re: /ac\s*charg(?:ing|er)/i, valueRe: /(\d{1,3}(?:\.\d+)?)\s*kw/i },
  { field: "dcChargingKw", re: /dc\s*fast|dc\s*charg/i, valueRe: /(\d{1,3}(?:\.\d+)?)\s*kw/i },
  { field: "acChargingTimeHours", re: /ac\s*charg.*time|full\s*charge.*ac/i, valueRe: /(\d{1,2}(?:\.\d+)?)\s*(?:hours?|hrs?)/i },
  { field: "dcChargingTimeMinutes", re: /dc\s*charg.*time|20\s*[-–]\s*80|fast\s*charg/i, valueRe: /(\d{1,3})\s*(?:minutes?|mins?)/i },
  { field: "batteryCapacityKwh", re: /battery\s*(?:capacity|pack)/i, valueRe: /(\d{1,3}(?:\.\d+)?)\s*kwh/i },
  { field: "claimedRangeKm", re: /range|driving\s*range/i, valueRe: /(\d{2,4})\s*(?:–|-|to)\s*(\d{2,4})\s*km|(\d{2,4})\s*km/i },
  { field: "rangeTestStandard", re: /range|certified|as\s*per/i, valueRe: /(MIDC|ARAI|WLTP|EPA)/i },
];

const FEATURE_ROW_PATTERNS = Object.freeze({
  sunroof: /\bsunroof\b|panoramic\s+sky\s+roof/i,
  camera360: /360\s*view|360\s*camera|surround\s+view/i,
  ventilatedSeats: /ventilated\s+seats?/i,
  adas: /\badas\b|advanced\s+driver\s+assistance/i,
  v2l: /\bv2l\b|vehicle\s+to\s+load/i,
  connectedCar: /connected\s+car|i[\s-]?link|adrenox/i,
});

function parseSpecFromRow(label = "", value = "") {
  const combined = `${label} ${value}`;
  const found = [];
  for (const { field, re, valueRe } of SPEC_ROW_PATTERNS) {
    if (!re.test(combined)) continue;
    if (field === "dcChargingKw" && /ac\s*charg/i.test(combined) && !/dc|fast\s*charg/i.test(combined)) continue;
    if (field === "acChargingKw" && /dc\s*fast/i.test(combined) && !/ac/i.test(combined)) continue;
    const vm = combined.match(valueRe);
    if (!vm) continue;
    if (field === "claimedRangeKm" && vm[2]) {
      found.push({ field, value: Math.max(Number(vm[1]), Number(vm[2])) });
    } else if (field === "rangeTestStandard") {
      found.push({ field, value: parseRangeTestStandard(vm[1]) || vm[1] });
    } else {
      found.push({ field, value: vm[1] ?? vm[3] });
    }
  }
  for (const [feature, fre] of Object.entries(FEATURE_ROW_PATTERNS)) {
    if (fre.test(combined) && !/\bno\b|\bwithout\b|\bnot\b/i.test(combined)) {
      found.push({ field: feature, value: true });
    }
  }
  return found;
}

function parseTablesForSpecs(tables = []) {
  const specs = new Map();
  for (const table of tables) {
    for (const row of table) {
      if (row.length < 2) continue;
      const label = row[0] || "";
      const value = row.slice(1).join(" ");
      for (const hit of parseSpecFromRow(label, value)) {
        if (!specs.has(hit.field)) specs.set(hit.field, hit.value);
      }
      if (row.length >= 3) {
        for (let i = 0; i < row.length - 1; i += 2) {
          for (const hit of parseSpecFromRow(row[i], row[i + 1])) {
            if (!specs.has(hit.field)) specs.set(hit.field, hit.value);
          }
        }
      }
    }
  }
  return specs;
}

function inferRangeStandardFromText(text = "") {
  const upper = text.toUpperCase();
  if (/\bMIDC\b/.test(upper)) return "MIDC";
  if (/\bARAI\b/.test(upper)) return "ARAI";
  if (/\bWLTP\b/.test(upper)) return "WLTP";
  return null;
}

/**
 * Extract evidence records from structured tables in sources.
 */
export function extractStructuredEvidenceFromSources(sources = [], meta = {}) {
  const records = [];
  const specHits = new Map();

  for (const source of sources) {
    if (!source?.content) continue;
    const isPdf = source.type === EVIDENCE_SOURCE_TYPE.OEM_PDF;
    const tables = source.content.includes("<table")
      ? extractHtmlTables(source.content)
      : extractTableRowsFromText(source.content);

    if (source.pdfParse?.tables?.length) {
      tables.push(...source.pdfParse.tables);
    }

    const specs = parseTablesForSpecs(tables);
    const trust = isPdf
      ? EVIDENCE_TRUST_SCORE[EVIDENCE_SOURCE_TYPE.OEM_PDF]
      : source.type === EVIDENCE_SOURCE_TYPE.OEM_WEBSITE
        ? EVIDENCE_TRUST_SCORE[EVIDENCE_SOURCE_TYPE.OEM_WEBSITE]
        : EVIDENCE_TRUST_SCORE[EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE];

    for (const [field, value] of specs.entries()) {
      const prev = specHits.get(field);
      const score = trust + (isPdf ? 10 : 0);
      if (!prev || score > prev.score) {
        specHits.set(field, { value, score, source });
      }
    }

    const rts = inferRangeStandardFromText(source.content);
    if (rts && (!specHits.has("rangeTestStandard") || isPdf)) {
      specHits.set("rangeTestStandard", { value: rts, score: trust + 5, source });
    }
  }

  for (const [fieldName, hit] of specHits.entries()) {
    records.push(
      createEvidenceRecord({
        importId: meta.importId,
        fieldName,
        fieldValue: hit.value,
        sourceType: hit.source.sourceType,
        sourceName: hit.source.name,
        sourceUrl: hit.source.url,
        trustScore: hit.score,
        extractionConfidence: Math.min(96, hit.score),
        extractionMethod: "v7-structured-table",
        sourceSnippet: `table:${fieldName}`,
      })
    );
  }

  return records;
}

export function extractFeatureMatrixFromTables(tables = []) {
  const features = {};
  for (const table of tables) {
    const header = (table[0] || []).join(" ").toLowerCase();
    const isFeatureMatrix = /feature|equipment|comfort|safety/i.test(header);
    if (!isFeatureMatrix) continue;
    for (const row of table.slice(1)) {
      const label = row[0] || "";
      for (const key of V6_TARGET_FEATURES) {
        if (FEATURE_ROW_PATTERNS[key]?.test(label)) {
          features[key] = row.slice(1).some((c) => /yes|✓|standard|available/i.test(String(c)));
        }
      }
    }
  }
  return features;
}
