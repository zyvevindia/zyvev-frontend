import { CHARGING_SPEED_CATEGORY } from "./constants.js";
import {
  formatChargingDurationDisplay,
  formatChargingDurationNumber,
} from "../utils/formatChargingDuration.js";
import {
  inferConnectorFromText,
  isPresent,
  parseMinutesFromText,
  pickFirstPresent,
  UNAVAILABLE,
} from "./governance.js";

function dcMinutesFromMeta(meta) {
  const prac = meta?.chargingPracticality;
  if (prac?.dcTime10to80Minutes != null) {
    return Number(prac.dcTime10to80Minutes);
  }
  const reality = meta?.chargingReality;
  if (reality?.dc10to80Minutes != null) {
    return Number(reality.dc10to80Minutes);
  }
  const summary = meta?.chargingSummary || "";
  return parseMinutesFromText(summary);
}

function acLabelFromMeta(meta, specsCharging) {
  const prac = meta?.chargingPracticality;
  if (prac?.acFullChargeHours != null) {
    return `~${formatChargingDurationNumber(prac.acFullChargeHours)} hrs (0–100% AC)`;
  }
  const reality = meta?.chargingReality;
  if (reality?.acFullChargeLabel) {
    return formatChargingDurationDisplay(reality.acFullChargeLabel);
  }
  if (specsCharging && !/min/i.test(String(specsCharging))) {
    return formatChargingDurationDisplay(String(specsCharging));
  }
  return UNAVAILABLE;
}

function dcLabelFromMinutes(minutes) {
  if (!isPresent(minutes)) return UNAVAILABLE;
  return `~${minutes} min (10–80% DC)`;
}

export function classifyChargingSpeed(dcMinutes) {
  if (!isPresent(dcMinutes)) return UNAVAILABLE;
  const m = Number(dcMinutes);
  if (m <= 45) return CHARGING_SPEED_CATEGORY.ULTRA;
  if (m <= 60) return CHARGING_SPEED_CATEGORY.FAST;
  if (m <= 90) return CHARGING_SPEED_CATEGORY.MODERATE;
  return CHARGING_SPEED_CATEGORY.SLOW;
}

const SPEED_LABELS = {
  [CHARGING_SPEED_CATEGORY.ULTRA]: "Ultra-fast DC",
  [CHARGING_SPEED_CATEGORY.FAST]: "Fast DC",
  [CHARGING_SPEED_CATEGORY.MODERATE]: "Moderate DC",
  [CHARGING_SPEED_CATEGORY.SLOW]: "Slower DC",
};

export function chargingConvenienceScore(dcMinutes, homeSupported, portable) {
  let score = 50;
  if (isPresent(dcMinutes)) {
    const m = Number(dcMinutes);
    if (m <= 45) score += 35;
    else if (m <= 60) score += 25;
    else if (m <= 90) score += 12;
    else score -= 5;
  }
  if (homeSupported === true) score += 10;
  if (portable === true) score += 5;
  return Math.min(100, Math.max(0, score));
}

/**
 * @param {object} car — normalized vehicle / compare car
 */
export function buildChargingIntelligence(car) {
  const meta = car?.catalogMeta || {};
  const specs = car?.specifications || {};
  const specsCharging = specs.chargingTime || car?.chargingTime || "";
  const ecosystem = meta.chargingEcosystem || {};
  const prac = meta.chargingPracticality || {};
  const catalogCharging = meta.chargingIntelligence || {};

  const dcMinutes = pickFirstPresent(
    catalogCharging.dcTime10to80Minutes,
    dcMinutesFromMeta(meta),
    parseMinutesFromText(specsCharging)
  );

  const acChargingTime = acLabelFromMeta(meta, specsCharging);
  const dcFastChargingTime = dcLabelFromMinutes(dcMinutes);

  const connectorType = pickFirstPresent(
    catalogCharging.connectorType,
    prac.connectorType,
    ecosystem.connectorType,
    meta.chargingReality?.connectorType,
    inferConnectorFromText(meta.chargingSummary),
    inferConnectorFromText(specsCharging)
  );

  const homeChargingSupported = pickFirstPresent(
    prac.homeChargingSupported,
    ecosystem.homeChargingSupported,
    meta.chargingReality?.homeChargingSupported,
    specsCharging ? true : UNAVAILABLE
  );

  const portableChargerIncluded = pickFirstPresent(
    prac.portableChargerIncluded,
    ecosystem.portableChargerIncluded
  );

  const fastChargingSupported = pickFirstPresent(
    prac.fastChargingSupported,
    isPresent(dcMinutes) ? true : UNAVAILABLE,
    /fast|dc|ccs/i.test(String(specsCharging)) ? true : UNAVAILABLE
  );

  const speedCategory = classifyChargingSpeed(dcMinutes);
  const convenienceScore = chargingConvenienceScore(
    dcMinutes,
    homeChargingSupported === true,
    portableChargerIncluded === true
  );

  const summaryLines = [];
  if (isPresent(connectorType)) {
    summaryLines.push(`${connectorType} connector`);
  }
  if (isPresent(dcFastChargingTime)) {
    summaryLines.push(dcFastChargingTime);
  }
  if (isPresent(acChargingTime)) {
    summaryLines.push(`AC: ${acChargingTime}`);
  }
  if (homeChargingSupported === true) {
    summaryLines.push("Home charging supported");
  }
  if (portableChargerIncluded === true) {
    summaryLines.push("Portable charger included");
  } else if (portableChargerIncluded === false) {
    summaryLines.push("Portable charger not bundled (verify with dealer)");
  }

  const hasData =
    summaryLines.length > 0 ||
    isPresent(meta.chargingSummary) ||
    isPresent(specsCharging);

  return {
    acChargingTime,
    dcFastChargingTime,
    dcMinutes: isPresent(dcMinutes) ? Number(dcMinutes) : UNAVAILABLE,
    connectorType,
    homeChargingSupported,
    portableChargerIncluded,
    fastChargingSupported,
    speedCategory,
    speedCategoryLabel: isPresent(speedCategory)
      ? SPEED_LABELS[speedCategory] || speedCategory
      : UNAVAILABLE,
    convenienceScore: hasData ? convenienceScore : UNAVAILABLE,
    legacyChargingLabel: specsCharging
      ? formatChargingDurationDisplay(specsCharging)
      : UNAVAILABLE,
    catalogSummary: meta.chargingSummary
      ? formatChargingDurationDisplay(meta.chargingSummary)
      : UNAVAILABLE,
    summaryLines,
    hasData,
  };
}
