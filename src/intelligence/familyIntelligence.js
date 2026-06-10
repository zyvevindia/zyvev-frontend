import { buildVehicleIntelligence } from "./buildVehicleIntelligence.js";
import { buildEvsavariScores } from "./scoringEngine.js";
import { scoreVehicle, toLegacyEvScores } from "../scoring/index.js";
import { parseKwhFromText } from "./governance.js";
import { classifyFamilyBodyType } from "./bodyTypeCatalog.js";
import {
  classifyRangeCategory,
  classifyBatteryCapacity,
  classifyPriceBand,
  CHARGING_SPEED_TAXONOMY,
} from "./taxonomy.js";

/**
 * Build a representative vehicle object from a model family DTO.
 */
export function familyToIntelligenceVehicle(family) {
  const rep =
    family?.defaultVariant ||
    family?.variants?.[0] ||
    family;

  return {
    _id: family.familySlug || rep._id,
    slug: family.familySlug || rep.slug,
    name: family.familyName || rep.name,
    brand: family.brand || rep.brand,
    startingPrice: family.startingPrice ?? rep.startingPrice,
    price: family.startingPrice ?? rep.price,
    range: family.maxRange ?? rep.range,
    specifications: family.specifications || rep.specifications,
    catalogMeta: family.catalogMeta || rep.catalogMeta,
    catalogSource: family.catalogSource || rep.catalogSource,
  };
}

/**
 * Attach evIntelligence + evScores + taxonomy tags to a family.
 */
export function enrichFamilyWithIntelligence(family) {
  if (!family) return family;

  const vehicle = familyToIntelligenceVehicle(family);
  const bundle = buildVehicleIntelligence(vehicle);
  let evIntelligence = null;
  let evScores = null;
  let evSavariScores = null;

  const scoringVehicle = {
    ...vehicle,
    variants: family.variants || vehicle.variants,
  };
  evSavariScores = scoreVehicle(scoringVehicle, {
    variants: family.variants,
  });
  const v1Legacy = toLegacyEvScores(evSavariScores);

  if (bundle) {
    const { scores, ...rest } = bundle;
    evIntelligence = rest;
    evScores =
      v1Legacy ||
      scores ||
      buildEvsavariScores(vehicle, rest);
  } else if (v1Legacy) {
    evScores = v1Legacy;
  }

  const batteryKwh = parseKwhFromText(
    vehicle.specifications?.batteryPack || vehicle.battery
  );

  const taxonomyTags = {
    bodyType: classifyFamilyBodyType(family),
    rangeCategory: classifyRangeCategory(
      evIntelligence?.range?.claimedRangeKm ?? vehicle.specifications?.range
    ),
    batteryCategory: classifyBatteryCapacity(batteryKwh),
    priceBand: classifyPriceBand(vehicle.startingPrice),
    chargingSpeed:
      evIntelligence?.charging?.speedCategory || null,
    connector: evIntelligence?.charging?.connectorType || null,
    homeCharging: evIntelligence?.charging?.homeChargingSupported === true,
    fastCharging: evIntelligence?.charging?.fastChargingSupported === true,
    adas: evIntelligence?.features?.adas?.supported === true,
    v2l: evIntelligence?.features?.v2l === true,
    thermalMgmt:
      evIntelligence?.features?.batteryThermalManagement === true,
    ota: evIntelligence?.features?.otaUpdates === true,
  };

  return {
    ...family,
    evIntelligence,
    evScores,
    evSavariScores,
    taxonomyTags,
  };
}

export function enrichFamiliesWithIntelligence(families = []) {
  return (families || []).map(enrichFamilyWithIntelligence);
}

export function isFastChargingFamily(family) {
  const cat = family?.taxonomyTags?.chargingSpeed;
  return (
    cat === CHARGING_SPEED_TAXONOMY.ULTRA ||
    cat === CHARGING_SPEED_TAXONOMY.FAST
  );
}
