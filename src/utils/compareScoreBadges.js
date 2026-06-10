/**
 * Compare column badges derived from EVSavari Score Engine (read-only consumer).
 */
import { scoreVehicle } from "../scoring/index.js";

export const COMPARE_BADGE_TYPES = Object.freeze({
  recommended: {
    label: "Recommended",
    cssClass: "compare-vehicle-card__badge--recommended",
  },
  bestValue: {
    label: "Best Value",
    cssClass: "compare-vehicle-card__badge--best-value",
  },
  longRange: {
    label: "Long Range",
    cssClass: "compare-vehicle-card__badge--long-range",
  },
  fastCharging: {
    label: "Fast Charging",
    cssClass: "compare-vehicle-card__badge--fast-charging",
  },
});

const BADGE_PRIORITY = ["recommended", "bestValue", "longRange", "fastCharging"];

function carKey(car) {
  return car?._id || car?.slug || null;
}

function pickWinner(entries, readScore) {
  let winnerKey = null;
  let bestScore = -1;

  for (const entry of entries) {
    const score = readScore(entry);
    if (score == null || !Number.isFinite(score)) continue;
    if (score > bestScore) {
      bestScore = score;
      winnerKey = entry.key;
    }
  }

  return bestScore >= 0 ? winnerKey : null;
}

/**
 * @param {object[]} cars
 * @returns {{
 *   badgeByCarId: Map<string, { type: string, label: string, cssClass: string }>,
 *   recommendedId: string|null,
 *   bestValueId: string|null,
 *   longRangeId: string|null,
 *   fastChargingId: string|null,
 * }}
 */
export function buildCompareScoreBadges(cars = []) {
  const entries = (cars || [])
    .filter(Boolean)
    .map((car) => ({
      car,
      key: carKey(car),
      scored: scoreVehicle(car),
    }))
    .filter((entry) => entry.key);

  const winners = {
    recommended: pickWinner(entries, (e) => e.scored?.overall?.score),
    bestValue: pickWinner(entries, (e) => e.scored?.breakdown?.value?.score),
    longRange: pickWinner(entries, (e) => e.scored?.breakdown?.range?.score),
    fastCharging: pickWinner(entries, (e) => e.scored?.breakdown?.charging?.score),
  };

  const badgeByCarId = new Map();

  for (const type of BADGE_PRIORITY) {
    const winnerKey = winners[type];
    if (!winnerKey || badgeByCarId.has(winnerKey)) continue;
    badgeByCarId.set(winnerKey, {
      type,
      ...COMPARE_BADGE_TYPES[type],
    });
  }

  return {
    badgeByCarId,
    recommendedId: winners.recommended,
    bestValueId: winners.bestValue,
    longRangeId: winners.longRange,
    fastChargingId: winners.fastCharging,
  };
}

/**
 * All score-derived badges per vehicle (a car may hold multiple wins).
 * @param {object[]} cars
 * @returns {{
 *   allBadgesByCarId: Map<string, { type: string, label: string, cssClass: string }[]>,
 *   recommendedId: string|null,
 *   bestValueId: string|null,
 *   longRangeId: string|null,
 *   fastChargingId: string|null,
 * }}
 */
export function buildAllCompareBadges(cars = []) {
  const entries = (cars || [])
    .filter(Boolean)
    .map((car) => ({
      car,
      key: carKey(car),
      scored: scoreVehicle(car),
    }))
    .filter((entry) => entry.key);

  const winners = {
    recommended: pickWinner(entries, (e) => e.scored?.overall?.score),
    bestValue: pickWinner(entries, (e) => e.scored?.breakdown?.value?.score),
    longRange: pickWinner(entries, (e) => e.scored?.breakdown?.range?.score),
    fastCharging: pickWinner(entries, (e) => e.scored?.breakdown?.charging?.score),
  };

  const allBadgesByCarId = new Map();

  for (const type of BADGE_PRIORITY) {
    const winnerKey = winners[type];
    if (!winnerKey) continue;
    const badge = { type, ...COMPARE_BADGE_TYPES[type] };
    const existing = allBadgesByCarId.get(winnerKey) || [];
    existing.push(badge);
    allBadgesByCarId.set(winnerKey, existing);
  }

  const primary = buildCompareScoreBadges(cars);

  return {
    allBadgesByCarId,
    badgeByCarId: primary.badgeByCarId,
    recommendedId: winners.recommended,
    bestValueId: winners.bestValue,
    longRangeId: winners.longRange,
    fastChargingId: winners.fastCharging,
  };
}
