import { validateImportEnvelope } from "./importSchema.js";
import {
  buildEnvelopeFromCsvRows,
  parseCsvToRows,
  parseJsonImport,
} from "./parseStructuredImport.js";
import { mapOemRowToNormalized, attachTaxonomyHints } from "./mapOemRowToNormalized.js";
import {
  diffNormalizedAgainstCatalog,
  maxSeverity,
} from "./diffAgainstCatalog.js";
import {
  buildIngestionHealthSummary,
  detectDangerousPriceMoves,
  detectDuplicateSlugs,
} from "./ingestionValidation.js";
import { buildIngestionAttribution } from "./sourceAttribution.js";
import { REVIEW_STATUS } from "./constants.js";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {string} kind 'json'|'csv'
 * @param {string} text
 * @param {{ sourceSystem?: string, importActor?: string }} meta
 * @param {object[]} catalogCars normalized cars from API
 */
export function runIngestionPipeline(kind, text, meta = {}, catalogCars = []) {
  const parseErrors = [];
  let envelope;
  let rawItems = [];

  if (kind === "json") {
    const parsed = parseJsonImport(text);
    if (!parsed.ok) {
      parseErrors.push(...parsed.errors);
      return { ok: false, parseErrors, session: null };
    }
    envelope = parsed.envelope;
    rawItems = envelope.items;
  } else {
    const csv = parseCsvToRows(text);
    parseErrors.push(...csv.errors);
    if (csv.rows.length === 0) {
      return { ok: false, parseErrors, session: null };
    }
    envelope = buildEnvelopeFromCsvRows(csv.rows, meta.sourceSystem || "csv_upload");
    rawItems = envelope.items;
  }

  const v = validateImportEnvelope(envelope);
  if (!v.ok) parseErrors.push(...v.errors);
  if (parseErrors.length) {
    return { ok: false, parseErrors, session: null };
  }

  const normalizedItems = rawItems.map((item) => {
    const row = mapOemRowToNormalized(item);
    row.taxonomyHints = attachTaxonomyHints(row);
    return row;
  });

  const badSlugRows = normalizedItems.filter((r) => !r.slug).length;
  if (badSlugRows) {
    parseErrors.push(`${badSlugRows} row(s) missing slug after normalization`);
    return { ok: false, parseErrors, session: null };
  }

  const duplicateSlugs = detectDuplicateSlugs(normalizedItems);
  const bySlug = new Map(
    catalogCars.map((c) => [String(c.slug || "").toLowerCase(), c])
  );
  const dangerousPrices = detectDangerousPriceMoves(normalizedItems, bySlug);

  const diffReports = normalizedItems.map((row) =>
    diffNormalizedAgainstCatalog(row, bySlug.get(row.slug))
  );

  const taxonomyHints = normalizedItems.flatMap((r) =>
    (r.taxonomyHints || []).map((h) => ({ slug: r.slug, hint: h }))
  );

  const diagnostics = {
    rowCount: rawItems.length,
    normalizedCount: normalizedItems.length,
    parseErrors,
    duplicateSlugs,
    dangerousPrices,
    taxonomyHints,
  };

  const session = {
    id: newId(),
    status: REVIEW_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewer: null,
    reviewNotes: "",
    sourceSystem: envelope.sourceSystem || meta.sourceSystem || "import",
    importActor: meta.importActor || "",
    normalizedItems,
    diffReports,
    maxSeverity: maxSeverity(diffReports),
    diagnostics,
    healthSummaryText: buildIngestionHealthSummary({
      ...diagnostics,
      parseErrors,
    }),
    attribution: buildIngestionAttribution({
      sourceSystem: envelope.sourceSystem || meta.sourceSystem,
      importActor: meta.importActor,
    }),
    publishBundle: null,
  };

  return { ok: true, parseErrors: [], session };
}
