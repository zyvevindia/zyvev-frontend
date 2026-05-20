/**
 * Source attribution for OEM / import pipeline (ops metadata — not buyer-facing by default).
 * @param {{
 *   sourceSystem?: string,
 *   oemLabel?: string,
 *   importActor?: string,
 *   reviewer?: string|null,
 * }} opts
 */
export function buildIngestionAttribution(opts = {}) {
  const now = new Date().toISOString();
  return {
    origin: "structured_import",
    sourceSystem: opts.sourceSystem || "unknown",
    oemLabel: opts.oemLabel || "",
    sourceConfidence: opts.sourceConfidence || "oem_export_unverified",
    importedAt: now,
    reviewedAt: opts.reviewedAt || null,
    reviewer: opts.reviewer || null,
    importActor: opts.importActor || "",
  };
}

/**
 * Merge attribution into catalogMeta-style provenance block (for export bundles).
 */
export function provenanceCatalogMetaPatch(attribution) {
  return {
    intelligenceGovernance: {
      lastStructuredImport: attribution.importedAt,
      importSourceSystem: attribution.sourceSystem,
      importReviewer: attribution.reviewer,
      importOrigin: attribution.origin,
    },
  };
}
