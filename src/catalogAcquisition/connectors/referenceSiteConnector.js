/**
 * ReferenceSiteConnector — trusted reference sites (CarDekho, ZigWheels, CarWale).
 */

import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { matchTrustedReferenceSource } from "../trustedReferenceSources.js";
import { BaseConnector } from "./baseConnector.js";

export class ReferenceSiteConnector extends BaseConnector {
  static sourceType = EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE;
  static defaultTrustScore = 80;

  /**
   * @param {{ importId: string, content: string, sourceUrl: string }} input
   */
  async acquire(input) {
    const sourceUrl = String(input.sourceUrl || "").trim();
    const matched = matchTrustedReferenceSource(sourceUrl);

    if (!matched) {
      return {
        ok: false,
        errors: [`URL is not on trusted reference allowlist: ${sourceUrl || "(empty)"}`],
      };
    }

    const content = String(input.content || "").trim();
    if (!content) {
      return { ok: false, errors: ["Reference site content is empty"] };
    }

    const { candidates, records } = this.extractRecordsFromContent(content, {
      importId: input.importId,
      sourceType: EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE,
      sourceName: matched.name,
      sourceUrl,
      trustScore: 80,
      extractionConfidence: 82,
    });

    return {
      ok: true,
      records,
      meta: { connector: "ReferenceSiteConnector", referenceId: matched.id, candidates },
    };
  }
}

export default ReferenceSiteConnector;
