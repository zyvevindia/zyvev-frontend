/**
 * v5 hardened source acquisition — URL validation, rendered fetch, PDF discovery.
 */

import { EVIDENCE_SOURCE_TYPE, SOURCE_REGISTRY_STATUS, URL_VALIDATION_STATUS } from "../constants.js";
import { matchTrustedReferenceSource } from "../trustedReferenceSources.js";
import { fetchUrlContent, buildAcquisitionMetadata, deriveHostname } from "./fetchUrl.js";
import { fetchAndValidateUrl } from "./urlValidation.js";
import {
  acquireRenderedPage,
  acquireRawOnly,
  closeRenderedSession,
} from "./renderedAcquisition.js";
import {
  discoverPdfCandidatesFromHtml,
  discoverPdfCandidatesFromPage,
  fetchPdfBuffer,
} from "./pdfDiscovery.js";
import { buildAcquisitionMetrics } from "./acquisitionMetrics.js";
import { parsePdfBuffer, pdfParseToExtractionContent } from "./parsePdf.js";

/**
 * @param {object} config
 * @param {string} [config.oemUrl]
 * @param {string} [config.brochureUrl] — registry brochure URL (tried first)
 * @param {string[]} [config.referenceUrls]
 * @param {Buffer} [config.pdfBuffer]
 * @param {string} [config.pdfName]
 * @param {string} [config.familySlug]
 * @param {string} [config.brand]
 * @param {string} [config.model]
 * @param {string[]} [config.vehicleKeywords]
 * @param {boolean} [config.skipUrlValidation]
 * @param {boolean} [config.usePlaywright]
 * @param {Function} [config.onRegistryStatusChange] — (status) => void
 */
export async function acquireAllSourcesV5(config = {}) {
  const sources = [];
  const snapshots = [];
  const diagnostics = [];
  const warnings = [];
  let pdfFound = false;
  let oemAcquired = false;
  let urlValidation = null;
  let rawHtmlSize = 0;
  let renderedTextSize = 0;
  let pdfDiscovery = { candidates: [], attempts: [] };

  const usePlaywright = config.usePlaywright !== false;

  // --- OEM URL ---
  if (config.oemUrl) {
    let fetched;
    if (config.skipUrlValidation) {
      fetched = await fetchUrlContent(config.oemUrl);
      urlValidation = {
        valid: fetched.ok,
        status: fetched.ok ? URL_VALIDATION_STATUS.VALID : URL_VALIDATION_STATUS.HTTP_ERROR,
        requestedUrl: config.oemUrl,
        finalUrl: fetched.finalUrl || config.oemUrl,
        warnings: fetched.ok ? [] : [{ message: (fetched.errors || []).join("; ") }],
      };
    } else {
      const result = await fetchAndValidateUrl({
        url: config.oemUrl,
        brand: config.brand,
        model: config.model,
        vehicleKeywords: config.vehicleKeywords,
      });
      fetched = result.fetched;
      urlValidation = result.validation;
    }

    diagnostics.push({
      step: "oem_url_validation",
      requestedUrl: config.oemUrl,
      finalUrl: urlValidation?.finalUrl,
      valid: urlValidation?.valid,
      status: urlValidation?.status,
      warnings: urlValidation?.warnings,
    });

    if (!urlValidation.valid) {
      warnings.push({
        code: "INVALID_SOURCE",
        message: `OEM URL rejected: ${urlValidation.status}`,
        requestedUrl: config.oemUrl,
        finalUrl: urlValidation.finalUrl,
        details: urlValidation.warnings,
      });
      if (typeof config.onRegistryStatusChange === "function") {
        config.onRegistryStatusChange(SOURCE_REGISTRY_STATUS.NEEDS_VERIFICATION);
      }
    } else if (fetched.ok) {
      rawHtmlSize = fetched.byteLength || fetched.content?.length || 0;
      oemAcquired = true;

      snapshots.push({
        type: "source_raw_html",
        url: config.oemUrl,
        finalUrl: fetched.finalUrl,
        contentPreview: fetched.content.slice(0, 4000),
        byteLength: rawHtmlSize,
      });

      // PDF discovery on raw HTML
      const rawPdfCandidates = discoverPdfCandidatesFromHtml(
        fetched.content,
        urlValidation.finalUrl || config.oemUrl
      );
      pdfDiscovery.candidates.push(...rawPdfCandidates.map((c) => ({ ...c, pass: "raw_html" })));

      // Rendered acquisition
      let rendered = null;
      if (usePlaywright) {
        rendered = await acquireRenderedPage(urlValidation.finalUrl || config.oemUrl);
        diagnostics.push({
          step: "oem_rendered",
          ok: rendered.ok,
          playwrightAvailable: rendered.playwrightAvailable,
          errors: rendered.errors,
          visibleTextLength: rendered.visibleTextLength,
        });

        if (rendered.ok) {
          renderedTextSize = rendered.visibleTextLength || 0;
          snapshots.push({
            type: "source_rendered_html",
            url: rendered.finalUrl,
            contentPreview: rendered.renderedHtml.slice(0, 4000),
            byteLength: rendered.renderedHtmlLength,
          });
          snapshots.push({
            type: "source_visible_text",
            url: rendered.finalUrl,
            contentPreview: rendered.visibleText.slice(0, 4000),
            byteLength: renderedTextSize,
          });

          if (rendered.page) {
            const domCandidates = await discoverPdfCandidatesFromPage(
              rendered.page,
              rendered.finalUrl || config.oemUrl
            );
            pdfDiscovery.candidates.push(...domCandidates.map((c) => ({ ...c, pass: "rendered_dom" })));
            await closeRenderedSession(rendered);
          }
        }
      } else {
        const rawOnly = await acquireRawOnly(urlValidation.finalUrl || config.oemUrl);
        if (rawOnly.ok) {
          renderedTextSize = rawOnly.visibleTextLength;
        }
      }

      const extractionContent =
        rendered?.ok && rendered.visibleTextLength > 500
          ? `${rendered.visibleText}\n\n${rendered.renderedHtml.slice(0, 80_000)}`
          : fetched.content;

      sources.push({
        type: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
        url: config.oemUrl,
        finalUrl: urlValidation.finalUrl,
        name: deriveHostname(config.oemUrl),
        content: extractionContent,
        metadata: {
          ...buildAcquisitionMetadata({
            url: config.oemUrl,
            sourceType: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
            fetchedAt: fetched.fetchedAt,
            contentType: fetched.contentType,
            byteLength: rawHtmlSize,
            method: rendered?.ok ? "v5_rendered" : "v5_raw",
            ok: true,
          }),
          rawHtmlSize,
          renderedTextSize,
          urlValidation,
        },
        layers: {
          rawHtml: fetched.content,
          renderedHtml: rendered?.renderedHtml || null,
          visibleText: rendered?.visibleText || null,
        },
      });
    }
  }

  // --- PDF: registry URL, discovered candidates, or provided buffer ---
  const pdfUrlsToTry = [];
  if (config.brochureUrl) pdfUrlsToTry.push({ url: config.brochureUrl, source: "registry" });
  const seenPdf = new Set(pdfUrlsToTry.map((p) => p.url));
  for (const c of [...pdfDiscovery.candidates].sort((a, b) => b.score - a.score)) {
    if (!seenPdf.has(c.url)) {
      seenPdf.add(c.url);
      pdfUrlsToTry.push({ url: c.url, source: c.source || c.pass });
    }
  }

  let pdfBuffer = config.pdfBuffer || null;
  if (!pdfBuffer?.length) {
    for (const attempt of pdfUrlsToTry.slice(0, 5)) {
      const fetched = await fetchPdfBuffer(attempt.url);
      pdfDiscovery.attempts.push({ url: attempt.url, source: attempt.source, ...fetched });
      if (fetched.ok) {
        pdfBuffer = fetched.buffer;
        pdfFound = true;
        break;
      }
    }
  } else {
    pdfFound = true;
  }

  if (pdfBuffer?.length) {
    const parsed = await parsePdfBuffer(pdfBuffer);
    const content = pdfParseToExtractionContent(parsed);
    const pdfUrl = pdfDiscovery.attempts.find((a) => a.ok)?.url || config.brochureUrl;
    if (parsed.ok) {
      diagnostics.push({ step: "pdf", ok: true, pdfFound: true });
      sources.push({
        type: EVIDENCE_SOURCE_TYPE.OEM_PDF,
        url: pdfUrl || null,
        name: config.pdfName || "OEM PDF Brochure",
        content,
        pdfParse: parsed,
        metadata: {
          ...buildAcquisitionMetadata({
            url: pdfUrl,
            sourceType: EVIDENCE_SOURCE_TYPE.OEM_PDF,
            method: parsed.method || "pdf_parse",
            byteLength: pdfBuffer.length,
            ok: true,
          }),
          numPages: parsed.numPages,
          tableCount: parsed.tables?.length ?? 0,
        },
      });
      snapshots.push({
        type: "source_parsed_pdf",
        contentPreview: content.slice(0, 4000),
        metadata: { pdfUrl },
      });
    } else {
      diagnostics.push({ step: "pdf", ok: false, errors: parsed.errors });
    }
  }

  // --- Reference URLs (unchanged v3 behavior) ---
  for (const refUrl of config.referenceUrls || []) {
    if (!refUrl?.trim()) continue;
    const fetched = await fetchUrlContent(refUrl.trim());
    const matched = matchTrustedReferenceSource(refUrl);
    diagnostics.push({ step: "reference_url", url: refUrl, ok: fetched.ok, errors: fetched.errors });
    if (fetched.ok) {
      sources.push({
        type: EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE,
        url: refUrl,
        name: matched?.name || deriveHostname(refUrl),
        content: fetched.content,
        metadata: buildAcquisitionMetadata({
          url: refUrl,
          sourceType: EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE,
          fetchedAt: fetched.fetchedAt,
          contentType: fetched.contentType,
          byteLength: fetched.byteLength,
          method: "automated_url_fetch",
          ok: true,
        }),
      });
      snapshots.push({
        type: "source_raw_html",
        url: refUrl,
        contentPreview: fetched.content.slice(0, 4000),
        metadata: { reference: true },
      });
    }
  }

  const errors = warnings.map((w) => w.message);
  if (!sources.length) {
    errors.push("No sources acquired");
  }

  const acquisitionMetrics = buildAcquisitionMetrics({
    evidenceRecordCount: 0,
    rawHtmlSize,
    renderedTextSize,
    urlValid: urlValidation?.valid ?? false,
    pdfFound,
    oemAcquired,
  });

  return {
    ok: sources.length > 0,
    engine: "v5",
    sources,
    snapshots,
    diagnostics,
    warnings,
    errors: sources.length ? errors.filter(Boolean) : errors,
    acquiredAt: new Date().toISOString(),
    urlValidation,
    pdfDiscovery,
    pdfFound,
    oemAcquired,
    rawHtmlSize,
    renderedTextSize,
    acquisitionMetrics,
  };
}
