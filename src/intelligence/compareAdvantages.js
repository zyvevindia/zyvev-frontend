import { formatIndianPriceCompact } from "../utils/formatIndianPrice.js";
import { isPresent } from "./governance.js";
import { getBestForLabel } from "./scoringEngine.js";
import { ensureArray } from "../utils/compareArrayUtils.js";

/**
 * Deterministic compare advantage summary.
 * @param {object[]} cars — with evIntelligence attached
 */
export function buildCompareAdvantages(cars = []) {
  const safeCars = ensureArray(cars, { label: "compareCars", subsystem: "compare-advantages" });
  if (!safeCars.length) return { winners: {}, perCar: [], highlights: [] };

  const dimensions = [
    {
      id: "dc_charging",
      label: "Fastest DC charging",
      lowerIsBetter: true,
      getValue: (c) => c.evIntelligence?.charging?.dcMinutes,
    },
    {
      id: "charging_convenience",
      label: "Charging convenience",
      lowerIsBetter: false,
      getValue: (c) => c.evIntelligence?.charging?.convenienceScore,
    },
    {
      id: "real_world_range",
      label: "Est. real-world range",
      lowerIsBetter: false,
      getValue: (c) =>
        c.evIntelligence?.range?.estimatedRealWorldKm?.max,
    },
    {
      id: "monthly_cost",
      label: "Lower est. charging cost",
      lowerIsBetter: true,
      getValue: (c) =>
        c.evIntelligence?.ownership?.monthlyChargingCostInr,
    },
    {
      id: "city_score",
      label: "City usability",
      lowerIsBetter: false,
      getValue: (c) => c.evScores?.subScores?.cityUsability,
    },
    {
      id: "highway_score",
      label: "Highway usability",
      lowerIsBetter: false,
      getValue: (c) => c.evScores?.subScores?.highwayUsability,
    },
    {
      id: "ownership_affordability",
      label: "Ownership affordability",
      lowerIsBetter: false,
      getValue: (c) => c.evScores?.subScores?.ownershipAffordability,
    },
    {
      id: "technology",
      label: "Technology & features",
      lowerIsBetter: false,
      getValue: (c) => c.evScores?.subScores?.technologyFeatures,
    },
  ];

  const winners = {};
  const highlights = [];

  for (const dim of dimensions) {
    const values = safeCars
      .map((c) => ({
        car: c,
        value: dim.getValue(c),
      }))
      .filter((row) => isPresent(row.value));

    if (values.length < 2) continue;

    values.sort((a, b) =>
      dim.lowerIsBetter ? a.value - b.value : b.value - a.value
    );

    const best = values[0];
    const second = values[1];
    const margin = dim.lowerIsBetter
      ? second.value - best.value
      : best.value - second.value;

    if (margin <= 0) continue;

    winners[dim.id] = {
      carId: best.car._id,
      carName: best.car.name,
      label: dim.label,
      displayValue: formatDimensionValue(dim.id, best.value),
    };

    highlights.push({
      id: dim.id,
      text: `${best.car.name} — ${dim.label}`,
      carId: best.car._id,
    });
  }

  const perCar = safeCars.map((car) => {
    const advantages = [];
    const disadvantages = [];

    for (const [dimId, win] of Object.entries(winners)) {
      if (win.carId === car._id) {
        advantages.push(win.label);
      } else {
        const dim = dimensions.find((d) => d.id === dimId);
        const myVal = dim?.getValue(car);
        const winVal = safeCars.find((c) => c._id === win.carId);
        const theirVal = dim?.getValue(winVal);
        if (
          isPresent(myVal) &&
          isPresent(theirVal) &&
          ((dim.lowerIsBetter && myVal > theirVal) ||
            (!dim.lowerIsBetter && myVal < theirVal))
        ) {
          disadvantages.push(`Others lead on ${dim.label.toLowerCase()}`);
        }
      }
    }

    return {
      carId: car._id,
      carName: car.name,
      advantages: advantages.slice(0, 4),
      disadvantages: disadvantages.slice(0, 2),
      bestFor: getBestForLabel(car.evScores),
    };
  });

  const bestForRecommendations = pickBestForRecommendations(safeCars, winners);

  return {
    winners,
    perCar,
    highlights: highlights.slice(0, 6),
    bestForRecommendations,
  };
}

function formatDimensionValue(dimId, value) {
  if (dimId === "monthly_cost") {
    return `~${formatIndianPriceCompact(value)}/mo`;
  }
  if (dimId === "dc_charging") {
    return `~${value} min (10–80%)`;
  }
  if (dimId === "real_world_range") {
    return `up to ${value} km`;
  }
  if (typeof value === "number") {
    return `${Math.round(value)}/100`;
  }
  return String(value);
}

function pickBestForRecommendations(cars, winners) {
  const out = [];
  const cityWin = winners.city_score;
  const highwayWin = winners.highway_score;
  const chargingWin = winners.dc_charging || winners.charging_convenience;
  const costWin = winners.monthly_cost;

  if (cityWin) {
    out.push({
      type: "city",
      label: "Best for city",
      carName: cityWin.carName,
      carId: cityWin.carId,
    });
  }
  if (highwayWin && highwayWin.carId !== cityWin?.carId) {
    out.push({
      type: "highway",
      label: "Best for highway",
      carName: highwayWin.carName,
      carId: highwayWin.carId,
    });
  }
  if (chargingWin) {
    out.push({
      type: "charging",
      label: "Charging leader",
      carName: chargingWin.carName,
      carId: chargingWin.carId,
    });
  }
  if (costWin) {
    out.push({
      type: "ownership",
      label: "Lower est. running cost",
      carName: costWin.carName,
      carId: costWin.carId,
    });
  }

  return out.slice(0, 4);
}
