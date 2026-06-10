/**
 * v7.1 — gate optimization focused on variants, pricing, OEM charging only.
 * Skips low-ROI fields (rangeTestStandard, v2v, ncap, power/torque, negative features).
 */

import { EVIDENCE_FIELD_STATUS } from "../constants.js";
import { resolveConflictsWeighted } from "../v7/weightedConflictResolution.js";
import {
  deriveFamilyPricingFromOemVariants,
  suppressLooseTextPricing,
} from "./familyPricing.js";

export function optimizeForGateBlockersV71(mergedFields, variants = []) {
  let out = resolveConflictsWeighted(mergedFields);
  out = deriveFamilyPricingFromOemVariants(out, variants);
  out = suppressLooseTextPricing(out, variants);

  for (const key of ["acChargingKw", "dcChargingKw", "acChargingTimeHours"]) {
    const entry = out[key];
    if (!entry) continue;
    const pdfVal = (entry.sources || [])
      .filter((s) => s.sourceType === "OEM_PDF" || s.extractionMethod?.includes("v7.1-oem-pdf"))
      .map((s) => s.fieldValue)[0];
    if (pdfVal != null && (entry.status === EVIDENCE_FIELD_STATUS.CONFLICT || entry.value == null)) {
      out[key] = {
        ...entry,
        value: pdfVal,
        status: EVIDENCE_FIELD_STATUS.AGREEMENT,
        manualReview: false,
        confidence: 91,
      };
    }
  }

  if (out.claimedRangeKm?.status === EVIDENCE_FIELD_STATUS.CONFLICT) {
    const pdfVal = (out.claimedRangeKm.sources || [])
      .filter((s) => s.sourceType === "OEM_PDF")
      .map((s) => s.fieldValue)[0];
    if (pdfVal != null) {
      out.claimedRangeKm = {
        ...out.claimedRangeKm,
        value: pdfVal,
        status: EVIDENCE_FIELD_STATUS.AGREEMENT,
        manualReview: false,
        confidence: 90,
      };
    }
  }

  if (out.batteryCapacityKwh?.status === EVIDENCE_FIELD_STATUS.CONFLICT) {
    const pdfVal = (out.batteryCapacityKwh.sources || [])
      .filter((s) => s.sourceType === "OEM_PDF")
      .map((s) => s.fieldValue)[0];
    if (pdfVal != null) {
      out.batteryCapacityKwh = {
        ...out.batteryCapacityKwh,
        value: pdfVal,
        status: EVIDENCE_FIELD_STATUS.AGREEMENT,
        manualReview: false,
        confidence: 90,
      };
    }
  }

  return out;
}
