import { isPresent, UNAVAILABLE } from "./governance.js";

const LEVEL = Object.freeze({
  STRONG: "strong",
  GOOD: "good",
  MODERATE: "moderate",
  LIMITED: "limited",
});

function scoreToLevel(score) {
  if (!isPresent(score)) return LEVEL.MODERATE;
  if (score >= 80) return LEVEL.STRONG;
  if (score >= 65) return LEVEL.GOOD;
  if (score >= 45) return LEVEL.MODERATE;
  return LEVEL.LIMITED;
}

/**
 * Deterministic suitability insights — no AI generation.
 * @param {object} car
 * @param {{ charging?: object, ownership?: object, range?: object, features?: object }} deps
 */
export function buildSuitabilityInsights(car, deps = {}) {
  const meta = car?.catalogMeta || {};
  const suit = meta.suitabilityScores || {};
  const rangeKm =
    Number(car?.specifications?.range ?? car?.range) || 0;
  const charging = deps.charging || {};
  const rangeIntel = deps.range || {};

  const insights = [];

  const cityLevel = scoreToLevel(suit.city);
  if (suit.city != null || rangeKm > 0) {
    const strongCity =
      suit.city >= 75 || (rangeKm >= 250 && rangeKm < 400);
    insights.push({
      id: "city_commute",
      title: "City commuting",
      level: suit.city != null ? cityLevel : strongCity ? LEVEL.GOOD : LEVEL.MODERATE,
      explanation:
        suit.city >= 75
          ? "Well suited for daily city driving with practical range for most commutes."
          : rangeKm >= 300
            ? "Comfortable for typical urban weekday use."
            : "Fine for city use if you match range to your daily km and charging plan.",
    });
  }

  const highwayLevel = scoreToLevel(suit.highway);
  const rwMax = rangeIntel.estimatedRealWorldKm?.max;
  insights.push({
    id: "highway",
    title: "Highway driving",
    level:
      suit.highway != null
        ? highwayLevel
        : (rwMax >= 280 || rangeKm >= 350)
          ? LEVEL.GOOD
          : rangeKm >= 250
            ? LEVEL.MODERATE
            : LEVEL.LIMITED,
    explanation:
      suit.highway >= 75
        ? "Comfort and range profile suit occasional highway trips."
        : (rwMax >= 280 || rangeKm >= 350)
          ? "Real-world range supports highway legs with DC stops."
          : "Long highway stretches need more frequent fast-charging stops.",
  });

  const apartmentLevel =
    charging.homeChargingSupported === true
      ? charging.convenienceScore >= 65
        ? LEVEL.GOOD
        : LEVEL.MODERATE
      : charging.convenienceScore >= 75
        ? LEVEL.MODERATE
        : LEVEL.LIMITED;

  insights.push({
    id: "apartment",
    title: "Apartment living",
    level: apartmentLevel,
    explanation:
      charging.homeChargingSupported === true
        ? "AC home charging is supported — confirm society/RWA approval for your parking slot."
        : "Relies more on workplace or public DC charging — plan weekly top-ups.",
  });

  const familyLevel = scoreToLevel(suit.family);
  insights.push({
    id: "family",
    title: "Family-friendly",
    level: suit.family != null ? familyLevel : LEVEL.MODERATE,
    explanation:
      suit.family >= 75
        ? "A practical pick for families — check boot space and rear-seat comfort for your routine."
        : "Works for many families — compare boot space, rear seats, and safety features for your needs.",
  });

  const longDistanceLevel =
    (rwMax >= 300 || rangeKm >= 400) &&
    charging.speedCategory &&
    ["ultra", "fast"].includes(charging.speedCategory)
      ? LEVEL.STRONG
      : rwMax >= 260 || rangeKm >= 320
        ? LEVEL.GOOD
        : LEVEL.LIMITED;

  insights.push({
    id: "long_distance",
    title: "Long-distance suitability",
    level: longDistanceLevel,
    explanation:
      longDistanceLevel === LEVEL.STRONG
        ? "Range and DC speed support confident inter-city travel with planned stops."
        : longDistanceLevel === LEVEL.GOOD
          ? "Feasible for planned road trips with mapped DC networks."
          : "Best as a secondary car or with shorter inter-city legs.",
  });

  let chargingConvenienceLevel = UNAVAILABLE;
  const conv = charging.convenienceScore;
  if (isPresent(conv)) {
    if (conv >= 80) chargingConvenienceLevel = "high";
    else if (conv >= 60) chargingConvenienceLevel = "medium";
    else chargingConvenienceLevel = "low";
  }

  insights.push({
    id: "charging_convenience",
    title: "Charging convenience",
    level:
      chargingConvenienceLevel === "high"
        ? LEVEL.STRONG
        : chargingConvenienceLevel === "medium"
          ? LEVEL.GOOD
          : chargingConvenienceLevel === "low"
            ? LEVEL.LIMITED
            : LEVEL.MODERATE,
    explanation:
      chargingConvenienceLevel === "high"
        ? "Fast DC times and flexible charging options reduce day-to-day friction."
        : chargingConvenienceLevel === "medium"
          ? "Balanced charging profile — plan home or public sessions."
          : "Allow extra time for charging or choose trims with faster DC where available.",
  });

  return {
    insights,
    chargingConvenienceLevel,
    hasData: insights.length > 0,
  };
}

export { LEVEL as SUITABILITY_LEVEL };
