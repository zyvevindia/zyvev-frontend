/**
 * SearchConnector — lowest-trust fallback when info unavailable elsewhere.
 * Never overrides OEM data during merge (handled by filterRecordsForMerge).
 */

import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { BaseConnector } from "./baseConnector.js";

export class SearchConnector extends BaseConnector {
  static sourceType = EVIDENCE_SOURCE_TYPE.SEARCH_RESULT;
  static defaultTrustScore = 60;

  /**
   * @param {{ importId: string, content: string, sourceUrl?: string, sourceName?: string, missingFields?: string[] }} input
   */
  async acquire(input) {
    const content = String(input.content || "").trim();
    if (!content) {
      return { ok: false, errors: ["Search result content is empty"] };
    }

    const { candidates, records: allRecords } = this.extractRecordsFromContent(content, {
      importId: input.importId,
      sourceType: EVIDENCE_SOURCE_TYPE.SEARCH_RESULT,
      sourceName: input.sourceName || "Search Result",
      sourceUrl: input.sourceUrl || null,
      trustScore: 60,
      extractionConfidence: 65,
    });

    const missing = new Set(input.missingFields || []);
    const records =
      missing.size > 0
        ? allRecords.filter((r) => missing.has(r.fieldName))
        : allRecords;

    return {
      ok: true,
      records,
      meta: {
        connector: "SearchConnector",
        filteredToMissing: missing.size > 0,
        candidateCount: records.length,
        candidates,
      },
    };
  }
}

export default SearchConnector;
