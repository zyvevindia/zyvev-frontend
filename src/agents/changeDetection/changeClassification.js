/**
 * Change Detection Agent v1 — change severity classification.
 */

export const CHANGE_SEVERITY = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
});

const PRICE_FIELDS = new Set(["startingPrice", "topVariantPrice", "exShowroomPrice"]);
const CHARGING_FIELDS = new Set([
  "acChargingKw",
  "dcChargingKw",
  "acChargingTimeHours",
  "dcChargingTimeMinutes",
]);
const RANGE_FIELDS = new Set(["claimedRangeKm", "rangeTestStandard"]);
const BATTERY_FIELDS = new Set(["batteryCapacityKwh", "batteryChemistry"]);
const FEATURE_FIELDS = new Set([
  "sunroof",
  "ventilatedSeats",
  "camera360",
  "connectedCar",
  "v2l",
  "v2v",
  "adas",
  "adasLevel",
]);
const MEDIA_FIELDS = new Set(["colorOptions", "heroImageCandidates"]);

export function classifyChangeSeverity(change = {}) {
  const { changeType, fieldKey, category } = change;

  if (category === "variant" || changeType === "variant_added" || changeType === "variant_removed") {
    return CHANGE_SEVERITY.HIGH;
  }

  if (BATTERY_FIELDS.has(fieldKey)) return CHANGE_SEVERITY.HIGH;
  if (PRICE_FIELDS.has(fieldKey)) return CHANGE_SEVERITY.MEDIUM;
  if (CHARGING_FIELDS.has(fieldKey)) return CHANGE_SEVERITY.MEDIUM;
  if (RANGE_FIELDS.has(fieldKey)) return CHANGE_SEVERITY.MEDIUM;
  if (FEATURE_FIELDS.has(fieldKey)) return CHANGE_SEVERITY.LOW;
  if (MEDIA_FIELDS.has(fieldKey)) return CHANGE_SEVERITY.LOW;

  if (category === "source") return CHANGE_SEVERITY.LOW;
  if (changeType === "removed") return CHANGE_SEVERITY.HIGH;
  if (changeType === "added") return CHANGE_SEVERITY.MEDIUM;

  return CHANGE_SEVERITY.LOW;
}

export function severityLabel(severity) {
  return severity || CHANGE_SEVERITY.LOW;
}
