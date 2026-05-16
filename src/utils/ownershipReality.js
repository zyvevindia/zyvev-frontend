/**
 * Ownership reality UI helpers (feature-flagged via catalogIntelligence).
 */

import { CATALOG_INTELLIGENCE } from "./catalogIntelligence";

export function hasOwnershipReality(car) {
  if (!CATALOG_INTELLIGENCE) return false;
  const meta = car?.catalogMeta;
  return Boolean(
    meta?.rangeReality ||
      meta?.chargingReality ||
      meta?.buyerAssurance ||
      meta?.ownershipTradeoffs
  );
}

export function formatRangeBand(band) {
  if (!band?.min && band?.min !== 0) return null;
  return `${band.min}–${band.max} km`;
}

export function getRangeRealitySnippet(catalogMeta) {
  const rr = catalogMeta?.rangeReality;
  if (!rr) return null;
  const city = formatRangeBand(rr.citySummerKm);
  const highway = formatRangeBand(rr.highwayKm);
  if (!city && !highway) return null;
  return {
    city,
    highway,
    claimed: rr.claimedKm,
    disclaimer:
      rr.citySummerKm?.disclaimer ||
      "Planning estimates — not ARAI certified.",
  };
}

export function pickOwnershipChips(catalogMeta, max = 3) {
  if (!catalogMeta) return [];
  const chips = [];
  const cr = catalogMeta.chargingReality;
  const ba = catalogMeta.buyerAssurance;

  if (cr?.overnightFriendly) {
    chips.push({
      id: "overnight",
      label: "Overnight charging friendly",
    });
  }
  if (cr?.chargingStressLevel === "low") {
    chips.push({
      id: "stress",
      label: "Low charging stress",
    });
  } else if (cr?.chargingStressLevel === "medium") {
    chips.push({
      id: "stress",
      label: "Moderate charging planning",
    });
  }
  if (cr?.roadTripConfidence === "high") {
    chips.push({
      id: "roadtrip",
      label: "Road-trip practical",
    });
  }
  if (ba?.firstEVFriendly?.score >= 80) {
    chips.push({
      id: "firstev",
      label: "First EV friendly",
    });
  }
  if (ba?.dailyUseConfidence?.score >= 78) {
    chips.push({
      id: "daily",
      label: "Daily use confidence",
    });
  }

  return chips.slice(0, max);
}

export function pickChargingIndicators(catalogMeta) {
  const cr = catalogMeta?.chargingReality;
  if (!cr) return [];
  const items = [];
  if (cr.apartmentFriendly) {
    items.push({ label: "Apartment charging viable", tone: "neutral" });
  } else {
    items.push({
      label: "Home charger access important",
      tone: "caution",
    });
  }
  if (cr.officeChargingFriendly) {
    items.push({ label: "Office charging helps", tone: "neutral" });
  }
  if (cr.societyApprovalRisk !== "low") {
    items.push({
      label: `Society approval: ${cr.societyApprovalRisk}`,
      tone: "caution",
    });
  }
  return items.slice(0, 2);
}

/**
 * Best aligned car per scenario among compare set (client-side).
 */
export function pickScenarioLeaders(cars) {
  const keys = [
    "dailyOfficeCommute",
    "familyWeekendTrips",
    "budgetOwnership",
    "highwayConfidence",
    "firstTimeEVOwnership",
  ];
  const labels = {
    dailyOfficeCommute: "Daily commute",
    familyWeekendTrips: "Family weekends",
    budgetOwnership: "Budget ownership",
    highwayConfidence: "Highway confidence",
    firstTimeEVOwnership: "First EV",
  };

  const leaders = [];
  for (const key of keys) {
    let best = null;
    for (const car of cars) {
      const entry = car.catalogMeta?.scenarioCompare?.[key];
      if (!entry?.alignmentScore) continue;
      if (!best || entry.alignmentScore > best.score) {
        best = {
          key,
          label: labels[key],
          score: entry.alignmentScore,
          carName: car.name,
          slug: car.slug,
          explanation: entry.explanation,
          tradeoff: entry.tradeoffSummary,
        };
      }
    }
    if (best) leaders.push(best);
  }
  return leaders.slice(0, 3);
}
