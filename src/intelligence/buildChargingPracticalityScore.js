import {
  CHARGING_PRACTICALITY_ASSUMPTIONS,
  CHARGING_PRACTICALITY_LABELS,
} from "./constants.js";
import {
  isPresent,
  parseKwhFromText,
  parseMinutesFromText,
  pickFirstPresent,
} from "./governance.js";

const MIN_SCORE = 0;
const MAX_SCORE = 100;

/** @type {ReadonlyArray<{ maxHours: number, label: string }>} */
const AC_EXPERIENCE_RULES = [
  { maxHours: 7, label: "Excellent overnight charging" },
  { maxHours: 10, label: "Good overnight charging" },
  { maxHours: 12, label: "Moderate overnight charging" },
  { maxHours: Infinity, label: "Slow home charging" },
];

/** @type {ReadonlyArray<{ maxMinutes: number, label: string }>} */
const DC_EXPERIENCE_RULES = [
  { maxMinutes: 40, label: "Excellent highway charging" },
  { maxMinutes: 60, label: "Strong highway charging support" },
  { maxMinutes: 90, label: "Moderate highway charging" },
  { maxMinutes: Infinity, label: "Long charging stops" },
];

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseAcHoursValue(value) {
  const direct = parseNumber(value);
  if (direct != null && direct > 0) return direct;

  if (value == null || value === "") return null;
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*h(?:r|our)?s?/i);
  return match ? Number(match[1]) : null;
}

function parseKwValue(value) {
  const direct = parseNumber(value);
  if (direct != null && direct > 0) return direct;

  if (value == null || value === "") return null;
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*kw/i);
  return match ? Number(match[1]) : null;
}

function clampScore(n) {
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.min(MAX_SCORE, Math.max(MIN_SCORE, n)));
}

function pickRepresentativeVariant(vehicle) {
  const variants = vehicle?.variants;
  if (!Array.isArray(variants) || !variants.length) return null;

  return (
    variants.find((variant) => {
      const charging = variant?.chargingMeta || variant?.charging || {};
      return (
        isPresent(charging.dcTime10to80Minutes) ||
        isPresent(charging.dcMinutes) ||
        isPresent(variant?.compareSpecs?.dcChargingTimeMinutes)
      );
    }) || variants[0]
  );
}

function readChargingMeta(vehicle, variant) {
  return {
    vehicle: vehicle?.chargingMeta || {},
    variant: variant?.chargingMeta || variant?.charging || {},
    intel: vehicle?.catalogMeta?.chargingIntelligence || {},
    variantIntel: variant?.catalogMeta?.chargingIntelligence || {},
    prac: vehicle?.catalogMeta?.chargingPracticality || {},
    variantPrac: variant?.catalogMeta?.chargingPracticality || {},
    existing: vehicle?.evIntelligence?.charging || {},
  };
}

function resolveBatteryKwh(vehicle, variant) {
  const specs = vehicle?.specifications || variant?.specifications || {};
  const meta = vehicle?.catalogMeta || variant?.catalogMeta || {};

  return (
    parseNumber(variant?.batteryKwh) ??
    parseNumber(variant?.compareSpecs?.batteryKwh) ??
    parseNumber(meta.batteryCapacityKwh) ??
    parseKwhFromText(variant?.battery) ??
    parseKwhFromText(specs.batteryPack || specs.batteryCapacity || vehicle?.battery) ??
    parseKwhFromText(meta.ownershipWarranty?.batteryCapacity)
  );
}

function resolveAcChargingKw(vehicle, variant, sources) {
  const specs = vehicle?.specifications || variant?.specifications || {};

  return (
    parseKwValue(sources.variant.acKw) ??
    parseKwValue(sources.vehicle.acKw) ??
    parseKwValue(sources.variantIntel.acKw) ??
    parseKwValue(sources.intel.acKw) ??
    parseKwValue(specs.acChargingKw || specs.acFastChargingKw) ??
    parseKwValue(vehicle?.acChargingKw)
  );
}

function resolveDcChargingKw(vehicle, variant, sources) {
  const specs = vehicle?.specifications || variant?.specifications || {};

  return (
    parseKwValue(sources.variant.dcKw) ??
    parseKwValue(sources.vehicle.dcKw) ??
    parseKwValue(sources.variantIntel.dcKw) ??
    parseKwValue(sources.intel.dcKw) ??
    parseKwValue(variant?.compareSpecs?.dcChargingKw) ??
    parseKwValue(specs.dcChargingKw || specs.dcFastChargingKw) ??
    parseKwValue(vehicle?.dcChargingKw)
  );
}

function resolveAcChargingHours(vehicle, variant, sources, batteryKwh, acKw) {
  const specs = vehicle?.specifications || variant?.specifications || {};
  const fromSpecs = pickFirstPresent(
    parseAcHoursValue(sources.variant.acTime0to100Hours),
    parseAcHoursValue(sources.vehicle.acTime0to100Hours),
    parseAcHoursValue(sources.variantIntel.acTime0to100Hours),
    parseAcHoursValue(sources.intel.acTime0to100Hours),
    parseAcHoursValue(sources.variantPrac.acFullChargeHours),
    parseAcHoursValue(sources.prac.acFullChargeHours),
    parseAcHoursValue(specs.acChargingTimeHours),
    parseAcHoursValue(vehicle?.acChargingTimeHours)
  );

  if (isPresent(fromSpecs)) {
    return { acChargingHours: Number(fromSpecs), estimated: false };
  }

  const estimated = estimateAcChargingHours(batteryKwh, acKw);
  if (estimated != null) {
    return { acChargingHours: estimated, estimated: true };
  }

  return { acChargingHours: null, estimated: false };
}

function resolveDcChargingMinutes(vehicle, variant, sources, batteryKwh, dcKw) {
  const specs = vehicle?.specifications || variant?.specifications || {};
  const fromSpecs = pickFirstPresent(
    parseNumber(sources.existing.dcMinutes),
    parseNumber(sources.variant.dcTime10to80Minutes),
    parseNumber(sources.variant.dcMinutes),
    parseNumber(sources.vehicle.dcTime10to80Minutes),
    parseNumber(sources.vehicle.dcMinutes),
    parseNumber(sources.variantIntel.dcTime10to80Minutes),
    parseNumber(sources.variantIntel.dcMinutes),
    parseNumber(sources.intel.dcTime10to80Minutes),
    parseNumber(sources.intel.dcMinutes),
    parseNumber(sources.variantPrac.dcTime10to80Minutes),
    parseNumber(sources.prac.dcTime10to80Minutes),
    parseNumber(variant?.compareSpecs?.dcChargingTimeMinutes),
    parseNumber(specs.dcChargingTimeMinutes || specs.dc10to80Minutes),
    parseNumber(vehicle?.dcChargingTimeMinutes),
    parseMinutesFromText(specs.chargingTime || vehicle?.chargingTime)
  );

  if (isPresent(fromSpecs)) {
    return { dcChargingMinutes: Number(fromSpecs), estimated: false };
  }

  const estimated = estimateDcChargingMinutes(batteryKwh, dcKw);
  if (estimated != null) {
    return { dcChargingMinutes: estimated, estimated: true };
  }

  return { dcChargingMinutes: null, estimated: false };
}

/**
 * Estimate AC 0–100% hours from battery size and onboard AC kW.
 * @param {number|null|undefined} batteryKwh
 * @param {number|null|undefined} acKw
 * @returns {number|null}
 */
export function estimateAcChargingHours(batteryKwh, acKw) {
  const battery = parseNumber(batteryKwh);
  const kw = parseKwValue(acKw);
  if (battery == null || battery <= 0 || kw == null || kw <= 0) return null;

  const hours =
    battery /
    (kw * CHARGING_PRACTICALITY_ASSUMPTIONS.acChargingEfficiency);

  return Math.round(hours * 10) / 10;
}

/**
 * Estimate DC 10–80% minutes from battery size and peak DC kW.
 * @param {number|null|undefined} batteryKwh
 * @param {number|null|undefined} dcKw
 * @returns {number|null}
 */
export function estimateDcChargingMinutes(batteryKwh, dcKw) {
  const battery = parseNumber(batteryKwh);
  const kw = parseKwValue(dcKw);
  if (battery == null || battery <= 0 || kw == null || kw <= 0) return null;

  const kwhNeeded =
    battery * CHARGING_PRACTICALITY_ASSUMPTIONS.dcSocWindow;
  const hours =
    kwhNeeded /
    (kw * CHARGING_PRACTICALITY_ASSUMPTIONS.dcChargingEfficiency);
  const minutes = hours * 60;

  return Math.round(minutes);
}

/**
 * @param {number|null|undefined} acHours
 * @returns {string}
 */
export function resolveAcChargingExperience(acHours) {
  const hours = parseNumber(acHours);
  if (hours == null) {
    return "Overnight charging details unavailable — confirm AC specs";
  }

  for (const rule of AC_EXPERIENCE_RULES) {
    if (hours <= rule.maxHours) return rule.label;
  }

  return AC_EXPERIENCE_RULES.at(-1).label;
}

/**
 * @param {number|null|undefined} dcMinutes
 * @returns {string}
 */
export function resolveDcChargingExperience(dcMinutes) {
  const minutes = parseNumber(dcMinutes);
  if (minutes == null) {
    return "Highway charging details unavailable — confirm DC specs";
  }

  for (const rule of DC_EXPERIENCE_RULES) {
    if (minutes <= rule.maxMinutes) return rule.label;
  }

  return DC_EXPERIENCE_RULES.at(-1).label;
}

/**
 * @param {number|null|undefined} acHours
 * @returns {number|null}
 */
export function acChargingHoursToScore(acHours) {
  const hours = parseNumber(acHours);
  if (hours == null) return null;
  if (hours <= 7) return 92;
  if (hours <= 10) return 78;
  if (hours <= 12) return 62;
  if (hours <= 15) return 48;
  return 35;
}

/**
 * @param {number|null|undefined} dcMinutes
 * @returns {number|null}
 */
export function dcChargingMinutesToScore(dcMinutes) {
  const minutes = parseNumber(dcMinutes);
  if (minutes == null) return null;
  if (minutes <= 40) return 92;
  if (minutes <= 60) return 80;
  if (minutes <= 90) return 58;
  if (minutes <= 120) return 42;
  return 30;
}

/**
 * @param {number|null|undefined} score
 * @returns {string}
 */
export function resolveChargingPracticalityLabel(score) {
  const n = parseNumber(score);
  if (n == null) return CHARGING_PRACTICALITY_LABELS.at(-1).label;

  for (const tier of CHARGING_PRACTICALITY_LABELS) {
    if (n >= tier.min) return tier.label;
  }

  return CHARGING_PRACTICALITY_LABELS.at(-1).label;
}

/**
 * @param {number|null|undefined} acScore
 * @param {number|null|undefined} dcScore
 * @returns {number|null}
 */
export function combineChargingPracticalityScore(acScore, dcScore) {
  const { acScoreWeight, dcScoreWeight } = CHARGING_PRACTICALITY_ASSUMPTIONS;
  let totalWeight = 0;
  let weighted = 0;

  if (acScore != null) {
    weighted += acScore * acScoreWeight;
    totalWeight += acScoreWeight;
  }
  if (dcScore != null) {
    weighted += dcScore * dcScoreWeight;
    totalWeight += dcScoreWeight;
  }

  if (totalWeight <= 0) return null;
  return clampScore(weighted / totalWeight);
}

/**
 * Build normalized charging practicality context from a catalog vehicle or dossier.
 * @param {object|null|undefined} vehicle
 * @param {{ acChargingHours?: number|null, dcChargingMinutes?: number|null, batteryKwh?: number|null }} [options]
 * @returns {import("./types.js").ChargingPracticalityContext}
 */
export function buildChargingPracticalityContext(vehicle, options = {}) {
  const variant = pickRepresentativeVariant(vehicle);
  const sources = readChargingMeta(vehicle, variant);

  const batteryKwh =
    parseNumber(options.batteryKwh) ?? resolveBatteryKwh(vehicle, variant);
  const acKw = resolveAcChargingKw(vehicle, variant, sources);
  const dcKw = resolveDcChargingKw(vehicle, variant, sources);

  const acOverride = parseNumber(options.acChargingHours);
  const dcOverride = parseNumber(options.dcChargingMinutes);

  const acResolved =
    acOverride != null
      ? { acChargingHours: acOverride, estimated: false }
      : resolveAcChargingHours(
          vehicle,
          variant,
          sources,
          batteryKwh,
          acKw
        );

  const dcResolved =
    dcOverride != null
      ? { dcChargingMinutes: dcOverride, estimated: false }
      : resolveDcChargingMinutes(
          vehicle,
          variant,
          sources,
          batteryKwh,
          dcKw
        );

  return {
    batteryKwh,
    acChargingHours: acResolved.acChargingHours,
    dcChargingMinutes: dcResolved.dcChargingMinutes,
    acChargingKw: acKw,
    dcChargingKw: dcKw,
    acTimeEstimated: acResolved.estimated,
    dcTimeEstimated: dcResolved.estimated,
  };
}

/**
 * Deterministic charging practicality intelligence from AC time, DC speed, and battery size.
 * @param {object|null|undefined} vehicle
 * @param {{ acChargingHours?: number|null, dcChargingMinutes?: number|null, batteryKwh?: number|null }} [options]
 * @returns {import("./types.js").ChargingPracticalityScoreResult}
 */
export function buildChargingPracticalityScore(vehicle, options = {}) {
  const ctx = buildChargingPracticalityContext(vehicle, options);

  const acChargingExperience = resolveAcChargingExperience(ctx.acChargingHours);
  const dcChargingExperience = resolveDcChargingExperience(
    ctx.dcChargingMinutes
  );

  const score = combineChargingPracticalityScore(
    acChargingHoursToScore(ctx.acChargingHours),
    dcChargingMinutesToScore(ctx.dcChargingMinutes)
  );

  return {
    score: score ?? MIN_SCORE,
    label: resolveChargingPracticalityLabel(score),
    acChargingExperience,
    dcChargingExperience,
  };
}
