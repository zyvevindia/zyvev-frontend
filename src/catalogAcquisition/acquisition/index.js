/**
 * Automated source acquisition — fetch URLs + parse PDF; no manual paste required.
 */

import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { matchTrustedReferenceSource } from "../trustedReferenceSources.js";
import { fetchUrlContent, buildAcquisitionMetadata, deriveHostname } from "./fetchUrl.js";
import { parsePdfBuffer, pdfParseToExtractionContent } from "./parsePdf.js";

/**
 * @typedef {object} AcquiredSource
 * @property {string} type
 * @property {string} url
 * @property {string} name
 * @property {string} content
 * @property {object} metadata
 * @property {object} [pdfParse]
 */

/**
 * Resolve source type from URL.
 * @param {string} url
 * @param {string} [explicitType]
 */
export function resolveSourceTypeFromUrl(url, explicitType) {
  if (explicitType) return explicitType;
  if (matchTrustedReferenceSource(url)) {
    return EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE;
  }
  return EVIDENCE_SOURCE_TYPE.OEM_WEBSITE;
}

/**
 * Acquire a single URL server-side.
 * @param {{ url: string, sourceType?: string, name?: string }} input
 */
export async function acquireUrlSource(input = {}) {
  const url = String(input.url || "").trim();
  if (!url) {
    return { ok: false, errors: ["URL is required"] };
  }

  const fetched = await fetchUrlContent(url);
  const sourceType = resolveSourceTypeFromUrl(url, input.sourceType);
  const matched = matchTrustedReferenceSource(url);

  const metadata = buildAcquisitionMetadata({
    url,
    sourceType,
    fetchedAt: fetched.fetchedAt,
    contentType: fetched.contentType,
    byteLength: fetched.byteLength,
    method: "automated_url_fetch",
    ok: fetched.ok,
    errors: fetched.errors,
  });

  if (!fetched.ok) {
    return { ok: false, errors: fetched.errors, metadata };
  }

  return {
    ok: true,
    source: {
      type: sourceType,
      url,
      name: input.name || matched?.name || deriveHostname(url) || url,
      content: fetched.content,
      metadata,
    },
  };
}

/**
 * Acquire PDF from buffer (server-side).
 * @param {{ buffer: Buffer|Uint8Array, name?: string, url?: string }} input
 */
export async function acquirePdfSource(input = {}) {
  const buffer = input.buffer;
  if (!buffer?.length) {
    return { ok: false, errors: ["PDF buffer is empty"] };
  }

  const parsed = await parsePdfBuffer(buffer);
  const content = pdfParseToExtractionContent(parsed);

  const metadata = buildAcquisitionMetadata({
    url: input.url || null,
    sourceType: EVIDENCE_SOURCE_TYPE.OEM_PDF,
    method: parsed.method || "pdf_parse",
    byteLength: buffer.length,
    ok: parsed.ok,
    errors: parsed.errors,
  });

  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors, metadata };
  }

  return {
    ok: true,
    source: {
      type: EVIDENCE_SOURCE_TYPE.OEM_PDF,
      url: input.url || null,
      name: input.name || "OEM PDF Brochure",
      content,
      pdfParse: parsed,
      metadata: { ...metadata, numPages: parsed.numPages, tableCount: parsed.tables?.length ?? 0 },
    },
  };
}

/**
 * Acquire all configured sources automatically.
 * @param {object} config
 * @param {string} [config.oemUrl]
 * @param {string[]} [config.referenceUrls]
 * @param {Buffer|Uint8Array} [config.pdfBuffer]
 * @param {string} [config.pdfName]
 */
export async function acquireAllSources(config = {}) {
  const sources = [];
  const diagnostics = [];
  const snapshots = [];

  if (config.oemUrl) {
    const r = await acquireUrlSource({
      url: config.oemUrl,
      sourceType: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
      name: deriveHostname(config.oemUrl),
    });
    diagnostics.push({ step: "oem_url", ...r });
    if (r.ok && r.source) {
      sources.push(r.source);
      snapshots.push({
        type: "source_raw_html",
        url: config.oemUrl,
        contentPreview: r.source.content.slice(0, 4000),
        metadata: r.source.metadata,
      });
    }
  }

  for (const refUrl of config.referenceUrls || []) {
    if (!refUrl?.trim()) continue;
    const r = await acquireUrlSource({ url: refUrl.trim() });
    diagnostics.push({ step: "reference_url", url: refUrl, ...r });
    if (r.ok && r.source) {
      sources.push(r.source);
      snapshots.push({
        type: "source_raw_html",
        url: refUrl,
        contentPreview: r.source.content.slice(0, 4000),
        metadata: r.source.metadata,
      });
    }
  }

  if (config.pdfBuffer?.length) {
    const r = await acquirePdfSource({
      buffer: config.pdfBuffer,
      name: config.pdfName,
      url: config.pdfUrl,
    });
    diagnostics.push({ step: "pdf", ...r });
    if (r.ok && r.source) {
      sources.push(r.source);
      snapshots.push({
        type: "source_parsed_pdf",
        contentPreview: r.source.content.slice(0, 4000),
        metadata: r.source.metadata,
        pdfMeta: {
          numPages: r.source.pdfParse?.numPages,
          variantMatrixCount: r.source.pdfParse?.variantMatrix?.length ?? 0,
        },
      });
    }
  }

  const errors = diagnostics.flatMap((d) => d.errors || []).filter(Boolean);

  return {
    ok: sources.length > 0,
    sources,
    snapshots,
    diagnostics,
    errors: sources.length ? errors : errors.length ? errors : ["No sources acquired"],
    acquiredAt: new Date().toISOString(),
  };
}

export { fetchUrlContent, parsePdfBuffer, pdfParseToExtractionContent };
export { fetchAndValidateUrl, validateAcquiredUrl } from "./urlValidation.js";
export { acquireAllSourcesV5 } from "./acquireV5.js";
export {
  discoverPdfCandidatesFromHtml,
  discoverPdfCandidatesFromPage,
  fetchPdfBuffer,
} from "./pdfDiscovery.js";
export { acquireRenderedPage, acquireRawOnly } from "./renderedAcquisition.js";
export { buildAcquisitionMetrics } from "./acquisitionMetrics.js";
