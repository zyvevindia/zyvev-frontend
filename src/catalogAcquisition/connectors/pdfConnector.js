/**
 * PdfConnector — OEM PDF / brochure text → evidence records.
 */

import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { BaseConnector } from "./baseConnector.js";

export class PdfConnector extends BaseConnector {
  static sourceType = EVIDENCE_SOURCE_TYPE.OEM_PDF;
  static defaultTrustScore = 100;

  /**
   * @param {{ importId: string, content: string, sourceName?: string, sourceUrl?: string }} input
   */
  async acquire(input) {
    const content = String(input.content || "").trim();
    if (!content) {
      return { ok: false, errors: ["PDF content is empty"] };
    }

    const { candidates, records } = this.extractRecordsFromContent(content, {
      importId: input.importId,
      sourceType: EVIDENCE_SOURCE_TYPE.OEM_PDF,
      sourceName: input.sourceName || "OEM PDF Brochure",
      sourceUrl: input.sourceUrl || null,
      trustScore: 100,
      extractionConfidence: 90,
    });

    return {
      ok: true,
      records,
      meta: { connector: "PdfConnector", candidateCount: records.length, candidates },
    };
  }
}

export default PdfConnector;
