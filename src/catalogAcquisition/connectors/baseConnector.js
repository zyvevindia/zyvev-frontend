/**
 * Base connector — pluggable evidence acquisition interface.
 */

import { EVIDENCE_TRUST_SCORE } from "../constants.js";
import { candidatesToEvidenceRecords } from "../evidenceRecord.js";
import { extractCandidatesFromContent } from "../extractFromText.js";

export class BaseConnector {
  /** @type {string} */
  static sourceType = "UNKNOWN";

  /** @type {number} */
  static defaultTrustScore = 60;

  /**
   * @param {object} input
   * @returns {Promise<{ ok: boolean, records?: object[], errors?: string[], meta?: object }>}
   */
  async acquire(input) {
    throw new Error(`${this.constructor.name}.acquire() not implemented`);
  }

  /**
   * Shared extraction path: raw content → candidates → evidence records.
   * @protected
   */
  extractRecordsFromContent(content, meta = {}) {
    const candidates = extractCandidatesFromContent(content, {
      sourceType: meta.sourceType,
      sourceUrl: meta.sourceUrl,
    });

    const records = candidatesToEvidenceRecords(candidates, {
      importId: meta.importId,
      sourceType: meta.sourceType || this.constructor.sourceType,
      sourceName: meta.sourceName,
      sourceUrl: meta.sourceUrl,
      trustScore: meta.trustScore ?? this.constructor.defaultTrustScore,
      extractionConfidence: meta.extractionConfidence ?? 85,
    });

    return { candidates, records };
  }
}

export function defineConnector(sourceType, defaultTrustScore, acquireFn) {
  return class extends BaseConnector {
    static sourceType = sourceType;
    static defaultTrustScore = defaultTrustScore;

    async acquire(input) {
      return acquireFn.call(this, input);
    }
  };
}

export { EVIDENCE_TRUST_SCORE };
