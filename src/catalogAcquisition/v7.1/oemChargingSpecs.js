/**
 * v7.1 stretch — charging specs from OEM PDF tables only.
 */

import { createEvidenceRecord } from "../evidenceRecord.js";
import { EVIDENCE_SOURCE_TYPE, EVIDENCE_TRUST_SCORE } from "../constants.js";
import { extractTableRowsFromText } from "../acquisition/parsePdf.js";
import {
  parseChargingKw,
  parseChargingHours,
} from "../v7/numericNormalization.js";

const CHARGING_FIELDS = Object.freeze(["acChargingKw", "dcChargingKw", "acChargingTimeHours"]);

const ROW_PATTERNS = [
  { field: "acChargingKw", re: /\bac\s*charg(?:ing|er)/i, valueRe: /(\d{1,3}(?:\.\d+)?)\s*kw/i },
  { field: "dcChargingKw", re: /\bdc\s*(?:fast\s*)?charg/i, valueRe: /(\d{1,3}(?:\.\d+)?)\s*kw/i },
  { field: "acChargingTimeHours", re: /ac\s*charg.*(?:time|duration)|full\s*charge.*ac/i, valueRe: /(\d{1,2}(?:\.\d+)?)\s*(?:hours?|hrs?)/i },
];

function parseChargingFromTables(tables = []) {
  const specs = new Map();
  for (const table of tables) {
    for (const row of table) {
      const combined = row.join(" ");
      for (const { field, re, valueRe } of ROW_PATTERNS) {
        if (!re.test(combined)) continue;
        if (field === "dcChargingKw" && /ac\s*charg/i.test(combined) && !/dc|fast/i.test(combined)) continue;
        const m = combined.match(valueRe);
        if (!m) continue;
        const val = field.includes("Hours") ? parseChargingHours(m[0]) : parseChargingKw(m[0]);
        if (val != null) specs.set(field, val);
      }
    }
  }
  return specs;
}

export function extractOemPdfChargingRecords(sources = [], meta = {}) {
  const records = [];
  const hits = new Map();

  for (const source of sources) {
    if (source.type !== EVIDENCE_SOURCE_TYPE.OEM_PDF) continue;
    const tables = [
      ...(source.pdfParse?.tables || []),
      ...extractTableRowsFromText(source.pdfParse?.text || source.content || ""),
    ];
    const specs = parseChargingFromTables(tables);
    const trust = EVIDENCE_TRUST_SCORE[EVIDENCE_SOURCE_TYPE.OEM_PDF];

    for (const [field, value] of specs.entries()) {
      if (!CHARGING_FIELDS.includes(field)) continue;
      hits.set(field, { value, source, trust });
    }
  }

  for (const [fieldName, hit] of hits.entries()) {
    records.push(
      createEvidenceRecord({
        importId: meta.importId,
        fieldName,
        fieldValue: hit.value,
        sourceType: EVIDENCE_SOURCE_TYPE.OEM_PDF,
        sourceName: hit.source.name,
        sourceUrl: hit.source.url,
        trustScore: hit.trust,
        extractionConfidence: 93,
        extractionMethod: "v7.1-oem-pdf-charging",
        sourceSnippet: `pdf-charging:${fieldName}`,
      })
    );
  }

  return records;
}
