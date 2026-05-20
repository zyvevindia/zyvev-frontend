import { validateImportEnvelope } from "./importSchema.js";
import { INGESTION_FORMAT } from "./constants.js";

/**
 * Split CSV respecting minimal quoting (double quotes only).
 * @param {string} line
 */
export function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

/**
 * @param {string} text
 * @returns {{ ok: boolean, rows: object[], errors: string[], header: string[] }}
 */
export function parseCsvToRows(text) {
  const errors = [];
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    errors.push("CSV needs a header row and at least one data row");
    return { ok: false, rows: [], errors, header: [] };
  }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    if (cells.length !== header.length) {
      errors.push(`Row ${i + 1}: expected ${header.length} columns, got ${cells.length}`);
      continue;
    }
    const row = {};
    header.forEach((key, j) => {
      row[key] = cells[j];
    });
    rows.push(row);
  }
  return { ok: errors.length === 0, rows, errors, header };
}

/**
 * Wrap CSV rows as ingestion envelope items (slug + snake_case keys).
 * @param {object[]} rows
 * @param {string} sourceSystem
 */
export function csvRowsToEnvelopeItems(rows, sourceSystem = "csv_upload") {
  return rows.map((r) => {
    const item = { ...r };
    const slugKey = ["slug", "family_slug", "vehicle_slug"].find((k) => item[k]);
    if (slugKey && slugKey !== "slug") {
      item.slug = item[slugKey];
      delete item[slugKey];
    }
    return item;
  });
}

/**
 * @param {string} jsonText
 * @returns {{ ok: boolean, envelope?: object, errors: string[] }}
 */
export function parseJsonImport(jsonText) {
  const errors = [];
  let body;
  try {
    body = JSON.parse(jsonText);
  } catch (e) {
    errors.push(`Invalid JSON: ${e?.message || "parse error"}`);
    return { ok: false, errors };
  }
  const v = validateImportEnvelope(body);
  if (!v.ok) return { ok: false, errors: v.errors };
  return { ok: true, envelope: v.envelope, errors: [] };
}

/**
 * Build a valid envelope from CSV parse result.
 * @param {object[]} rows
 * @param {string} sourceSystem
 */
export function buildEnvelopeFromCsvRows(rows, sourceSystem = "csv_upload") {
  const items = csvRowsToEnvelopeItems(rows, sourceSystem);
  return {
    format: INGESTION_FORMAT,
    sourceSystem,
    items,
  };
}
