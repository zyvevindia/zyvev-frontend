/**
 * OemWebsiteConnector — OEM vehicle pages → evidence records.
 */

import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { BaseConnector } from "./baseConnector.js";

export class OemWebsiteConnector extends BaseConnector {
  static sourceType = EVIDENCE_SOURCE_TYPE.OEM_WEBSITE;
  static defaultTrustScore = 95;

  /**
   * @param {{ importId: string, content: string, sourceUrl?: string, sourceName?: string }} input
   */
  async acquire(input) {
    const content = String(input.content || "").trim();
    if (!content) {
      return { ok: false, errors: ["OEM website content is empty"] };
    }

    const sourceName = input.sourceName || deriveHostname(input.sourceUrl) || "OEM Website";

    const { candidates, records } = this.extractRecordsFromContent(content, {
      importId: input.importId,
      sourceType: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
      sourceName,
      sourceUrl: input.sourceUrl || null,
      trustScore: 95,
      extractionConfidence: 88,
    });

    return {
      ok: true,
      records,
      meta: { connector: "OemWebsiteConnector", sourceUrl: input.sourceUrl, candidates },
    };
  }
}

function deriveHostname(url = "") {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export default OemWebsiteConnector;
