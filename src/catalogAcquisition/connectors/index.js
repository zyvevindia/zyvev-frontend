/**
 * Connector registry — pluggable evidence acquisition.
 */

import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { isTrustedReferenceUrl } from "../trustedReferenceSources.js";
import { PdfConnector } from "./pdfConnector.js";
import { OemWebsiteConnector } from "./oemWebsiteConnector.js";
import { ReferenceSiteConnector } from "./referenceSiteConnector.js";
import { SearchConnector } from "./searchConnector.js";

export const CONNECTOR_REGISTRY = Object.freeze({
  [EVIDENCE_SOURCE_TYPE.OEM_PDF]: PdfConnector,
  [EVIDENCE_SOURCE_TYPE.OEM_WEBSITE]: OemWebsiteConnector,
  [EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE]: ReferenceSiteConnector,
  [EVIDENCE_SOURCE_TYPE.SEARCH_RESULT]: SearchConnector,
});

export {
  PdfConnector,
  OemWebsiteConnector,
  ReferenceSiteConnector,
  SearchConnector,
};
export { BaseConnector } from "./baseConnector.js";

/**
 * Resolve connector class for a source input descriptor.
 * @param {{ type: string, url?: string }} sourceInput
 */
export function resolveConnectorForInput(sourceInput = {}) {
  if (sourceInput.type === EVIDENCE_SOURCE_TYPE.OEM_PDF) {
    return PdfConnector;
  }
  if (sourceInput.type === EVIDENCE_SOURCE_TYPE.OEM_WEBSITE) {
    return OemWebsiteConnector;
  }
  if (sourceInput.type === EVIDENCE_SOURCE_TYPE.SEARCH_RESULT) {
    return SearchConnector;
  }
  if (
    sourceInput.type === EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE ||
    (sourceInput.url && isTrustedReferenceUrl(sourceInput.url))
  ) {
    return ReferenceSiteConnector;
  }
  return null;
}

/**
 * Run all configured source inputs through connectors.
 * @param {object} params
 * @param {string} params.importId
 * @param {object[]} params.sources — { type, content, url?, name? }
 * @param {string[]} [params.missingFields] — for search connector filtering
 */
export async function acquireEvidenceFromSources({
  importId,
  sources = [],
  missingFields = [],
}) {
  const allRecords = [];
  const diagnostics = [];

  for (const source of sources) {
    const Connector = resolveConnectorForInput(source);
    if (!Connector) {
      diagnostics.push({
        source,
        ok: false,
        error: "No connector for source type",
      });
      continue;
    }

    const connector = new Connector();
    const input = {
      importId,
      content: source.content,
      sourceUrl: source.url,
      sourceName: source.name,
      missingFields:
        source.type === EVIDENCE_SOURCE_TYPE.SEARCH_RESULT ? missingFields : undefined,
    };

    const result = await connector.acquire(input);
    diagnostics.push({
      connector: Connector.name,
      sourceType: Connector.sourceType,
      ok: result.ok,
      recordCount: result.records?.length ?? 0,
      errors: result.errors,
      meta: result.meta,
    });

    if (result.ok && result.records?.length) {
      allRecords.push(...result.records);
    }
  }

  return { records: allRecords, diagnostics };
}

/**
 * Register a custom connector for future agents/extensions.
 * @param {string} sourceType
 * @param {typeof BaseConnector} ConnectorClass
 */
export function registerConnector(sourceType, ConnectorClass) {
  CONNECTOR_REGISTRY[sourceType] = ConnectorClass;
}
