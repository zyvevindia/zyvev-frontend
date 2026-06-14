import { CONFIDENCE_LEVELS, RANGE_SOURCES } from "./constants.js";
import { isPresent } from "./governance.js";

/** @typedef {import("./types.js").ConfidenceLabel} ConfidenceLabel */
/** @typedef {import("./types.js").ConfidenceContext} ConfidenceContext */

export const CONFIDENCE_LABELS = Object.freeze({
  VERIFIED: "verified",
  PARTIAL: "partial",
  ESTIMATED: "estimated",
  DIRECTIONAL: "directional",
  REVIEW_PENDING: "reviewPending",
});

/** @type {ReadonlyArray<ConfidenceLabel>} */
export const CONFIDENCE_LABEL_ORDER = Object.freeze([
  CONFIDENCE_LABELS.REVIEW_PENDING,
  CONFIDENCE_LABELS.DIRECTIONAL,
  CONFIDENCE_LABELS.ESTIMATED,
  CONFIDENCE_LABELS.PARTIAL,
  CONFIDENCE_LABELS.VERIFIED,
]);

/**
 * Pick the weaker of two confidence labels.
 * @param {ConfidenceLabel} current
 * @param {ConfidenceLabel} next
 * @returns {ConfidenceLabel}
 */
export function minConfidenceLabel(current, next) {
  const currentIdx = CONFIDENCE_LABEL_ORDER.indexOf(current);
  const nextIdx = CONFIDENCE_LABEL_ORDER.indexOf(next);
  return currentIdx <= nextIdx ? current : next;
}

/**
 * @param {ConfidenceLabel[]} labels
 * @returns {ConfidenceLabel}
 */
export function combineConfidenceLabels(labels) {
  if (!labels.length) return CONFIDENCE_LABELS.REVIEW_PENDING;

  return labels.reduce(
    (weakest, label) => minConfidenceLabel(weakest, label),
    CONFIDENCE_LABELS.VERIFIED
  );
}

/**
 * @param {ConfidenceContext} ctx
 * @returns {ConfidenceLabel}
 */
export function resolveOverallConfidenceLabel(ctx) {
  if (!ctx.hasVehicle) return CONFIDENCE_LABELS.REVIEW_PENDING;

  const meta = ctx.vehicle?.catalogMeta || {};
  const badge = String(
    meta.verificationBadge || ctx.vehicle?.verificationBadge || ""
  ).toLowerCase();
  const level = String(
    meta.verificationLevel || ctx.vehicle?.verificationLevel || ""
  ).toLowerCase();

  if (
    badge === "verified" ||
    badge === "official" ||
    level === "verified" ||
    level === "verified_dossier" ||
    level === "golden"
  ) {
    return CONFIDENCE_LABELS.VERIFIED;
  }

  if (
    badge === "partial" ||
    level === "partial" ||
    level === "manual_review"
  ) {
    return CONFIDENCE_LABELS.PARTIAL;
  }

  if (meta.dataOrigin === "evsavari_estimated" || meta.estimated === true) {
    return CONFIDENCE_LABELS.ESTIMATED;
  }

  if (ctx.scoreCtx.hasScoreData) return CONFIDENCE_LABELS.PARTIAL;

  const hasBrand = Boolean(ctx.vehicle?.brand);
  const hasPrice =
    isPresent(ctx.vehicle?.startingPrice) ||
    isPresent(ctx.vehicle?.price) ||
    (Array.isArray(ctx.vehicle?.variants) && ctx.vehicle.variants.length > 0);

  if (!hasBrand || !hasPrice) return CONFIDENCE_LABELS.REVIEW_PENDING;

  return CONFIDENCE_LABELS.PARTIAL;
}

/**
 * @param {ConfidenceContext} ctx
 * @returns {ConfidenceLabel}
 */
export function resolveRangeConfidenceLabel(ctx) {
  const rangeIntel = ctx.rangeIntel;
  if (!rangeIntel?.hasData) return CONFIDENCE_LABELS.REVIEW_PENDING;

  const catalogRw = ctx.vehicle?.catalogMeta?.realWorldRangeKm;
  if (
    catalogRw &&
    isPresent(catalogRw.min) &&
    isPresent(catalogRw.max)
  ) {
    if (
      rangeIntel.source === RANGE_SOURCES.REAL_WORLD_TESTED ||
      ctx.vehicle?.catalogMeta?.rangeRealityExpanded?.communityVerified === true
    ) {
      return CONFIDENCE_LABELS.VERIFIED;
    }

    return CONFIDENCE_LABELS.VERIFIED;
  }

  if (rangeIntel.confidenceLevel === CONFIDENCE_LEVELS.HIGH) {
    return CONFIDENCE_LABELS.VERIFIED;
  }

  if (rangeIntel.confidenceLevel === CONFIDENCE_LEVELS.MEDIUM) {
    return CONFIDENCE_LABELS.PARTIAL;
  }

  if (isPresent(rangeIntel.claimedRangeKm)) {
    return CONFIDENCE_LABELS.ESTIMATED;
  }

  return CONFIDENCE_LABELS.REVIEW_PENDING;
}

/**
 * @param {ConfidenceContext} ctx
 * @returns {ConfidenceLabel}
 */
export function resolveOwnershipConfidenceLabel(ctx) {
  if (!ctx.hasVehicle) return CONFIDENCE_LABELS.REVIEW_PENDING;

  const ownershipCtx = ctx.ownershipCtx;
  if (
    !ownershipCtx?.efficiencyKmPerKwh ||
    ownershipCtx.efficiencyKmPerKwh <= 0
  ) {
    return CONFIDENCE_LABELS.REVIEW_PENDING;
  }

  if (ownershipCtx.efficiencyEstimated) {
    return CONFIDENCE_LABELS.ESTIMATED;
  }

  return CONFIDENCE_LABELS.ESTIMATED;
}

/**
 * @param {ConfidenceContext} ctx
 * @returns {ConfidenceLabel}
 */
export function resolveChargingPracticalityConfidenceLabel(ctx) {
  if (!ctx.hasVehicle) return CONFIDENCE_LABELS.REVIEW_PENDING;

  const chargingCtx = ctx.chargingCtx;
  const hasBattery = isPresent(chargingCtx?.batteryKwh);
  const hasAcKw = isPresent(chargingCtx?.acChargingKw);
  const hasDcKw = isPresent(chargingCtx?.dcChargingKw);

  if (!hasBattery && !hasAcKw && !hasDcKw) {
    return CONFIDENCE_LABELS.REVIEW_PENDING;
  }

  const acFromCatalog =
    isPresent(chargingCtx.acChargingHours) && !chargingCtx.acTimeEstimated;
  const dcFromCatalog =
    isPresent(chargingCtx.dcChargingMinutes) && !chargingCtx.dcTimeEstimated;

  if (acFromCatalog && dcFromCatalog) {
    return CONFIDENCE_LABELS.PARTIAL;
  }

  if (acFromCatalog || dcFromCatalog || hasAcKw || hasDcKw) {
    return CONFIDENCE_LABELS.PARTIAL;
  }

  if (chargingCtx.acTimeEstimated || chargingCtx.dcTimeEstimated) {
    return CONFIDENCE_LABELS.ESTIMATED;
  }

  return CONFIDENCE_LABELS.REVIEW_PENDING;
}

/**
 * @param {ConfidenceContext} ctx
 * @returns {ConfidenceLabel}
 */
export function resolveHighwayConfidenceConfidenceLabel(ctx) {
  if (!ctx.hasVehicle) return CONFIDENCE_LABELS.REVIEW_PENDING;

  const highwayCtx = ctx.highwayCtx;
  const hasRange = isPresent(highwayCtx?.highwayPlanningRangeKm);
  const hasDc = isPresent(highwayCtx?.dcChargingMinutes);
  const hasBattery = isPresent(highwayCtx?.batteryKwh);

  if (!hasRange && !hasDc && !hasBattery) {
    return CONFIDENCE_LABELS.REVIEW_PENDING;
  }

  const rangeFromCatalog =
    isPresent(highwayCtx.realWorldRangeKmMid) && !highwayCtx.rangeEstimated;
  const dcFromCatalog = hasDc && !highwayCtx.dcTimeEstimated;

  if (rangeFromCatalog && dcFromCatalog && hasBattery) {
    return CONFIDENCE_LABELS.PARTIAL;
  }

  if (hasRange || hasDc) {
    if (!highwayCtx.rangeEstimated && !highwayCtx.dcTimeEstimated) {
      return CONFIDENCE_LABELS.PARTIAL;
    }

    return CONFIDENCE_LABELS.ESTIMATED;
  }

  if (hasBattery) return CONFIDENCE_LABELS.DIRECTIONAL;

  return CONFIDENCE_LABELS.REVIEW_PENDING;
}

/**
 * @param {ConfidenceContext} ctx
 * @returns {ConfidenceLabel}
 */
export function resolveApartmentSuitabilityConfidenceLabel(ctx) {
  if (!ctx.hasVehicle) return CONFIDENCE_LABELS.REVIEW_PENDING;

  const apartmentCtx = ctx.apartmentCtx;
  const hasBattery = isPresent(apartmentCtx?.batteryKwh);
  const hasAc = isPresent(apartmentCtx?.acChargingHours);
  const hasCity = isPresent(apartmentCtx?.cityScore);

  if (!hasBattery && !hasAc && !hasCity) {
    return CONFIDENCE_LABELS.REVIEW_PENDING;
  }

  return CONFIDENCE_LABELS.DIRECTIONAL;
}

/**
 * @param {ConfidenceContext} ctx
 * @returns {import("./types.js").ConfidenceEngineResult}
 */
export function applyConfidenceRules(ctx) {
  return {
    overall: resolveOverallConfidenceLabel(ctx),
    range: resolveRangeConfidenceLabel(ctx),
    ownership: resolveOwnershipConfidenceLabel(ctx),
    chargingPracticality: resolveChargingPracticalityConfidenceLabel(ctx),
    highwayConfidence: resolveHighwayConfidenceConfidenceLabel(ctx),
    apartmentSuitability: resolveApartmentSuitabilityConfidenceLabel(ctx),
  };
}
