/**
 * Trust & decision-confidence UI helpers.
 */

import { CATALOG_INTELLIGENCE } from "./catalogIntelligence";

export function hasTrustIntelligence(car) {
  if (!CATALOG_INTELLIGENCE) return false;
  const meta = car?.catalogMeta;
  return Boolean(
    meta?.trustPresentation?.indicators?.length ||
      meta?.rangeRealityExpanded ||
      meta?.chargingPracticality ||
      meta?.ownershipConfidence
  );
}

const TONE_STYLES = {
  positive: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },
  neutral: {
    background: "#eff6ff",
    color: "#1e40af",
    border: "1px solid #bfdbfe",
  },
  caution: {
    background: "#fffbeb",
    color: "#92400e",
    border: "1px solid #fde68a",
  },
};

export function trustIndicatorStyle(tone = "neutral") {
  return {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "600",
    margin: "0 8px 8px 0",
    ...TONE_STYLES[tone] || TONE_STYLES.neutral,
  };
}

export function pickCompareTrustLeaders(cars) {
  if (!cars?.length) return [];
  const dimensions = [
    { key: "apartmentFit", label: "Apartment charging fit" },
    { key: "highwayUsability", label: "Highway confidence" },
    { key: "anxietyReduction", label: "Lower charging stress" },
    { key: "familyPracticality", label: "Family practicality" },
  ];
  const rank = { strong: 3, moderate: 2, limited: 1, not_applicable: 0 };

  const leaders = [];
  for (const { key, label } of dimensions) {
    let best = null;
    for (const car of cars) {
      const entry = car.catalogMeta?.compareTrust?.[key];
      if (!entry?.strength) continue;
      const r = rank[entry.strength] ?? 0;
      if (!best || r > best.r) {
        best = {
          key,
          label,
          r,
          carName: car.name,
          slug: car.slug,
          note: entry.note,
        };
      }
    }
    if (best && best.r >= 2) leaders.push(best);
  }
  return leaders.slice(0, 4);
}

export function rangeRealityExpandedBullets(meta) {
  const rr = meta?.rangeRealityExpanded;
  if (!rr?.editorialSummaries?.length) return [];
  return rr.editorialSummaries.slice(0, 4);
}

export function chargingPracticalityBullets(meta) {
  return meta?.chargingPracticality?.editorialNotes?.slice(0, 3) || [];
}

export function ownershipGuidanceBullets(meta) {
  return meta?.ownershipConfidence?.editorialGuidance?.slice(0, 3) || [];
}
