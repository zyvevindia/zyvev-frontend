export {
  COMPARE_INTELLIGENCE_MODULE_VERSION,
  COMPARISON_DIMENSIONS,
  DIMENSION_OUTCOMES,
  ARCHETYPE_COMPARISON_DEFS,
  KNOWN_VEHICLE_NAMES,
} from "./constants.js";

export { buildVehicleComparisonProfile } from "./buildVehicleComparisonProfile.js";
export { buildDimensionComparisons } from "./buildDimensionComparisons.js";
export { buildTradeOffAnalysis } from "./buildTradeOffAnalysis.js";
export { buildComparisonNarrative } from "./buildComparisonNarrative.js";
export { buildArchetypeComparison } from "./buildArchetypeComparison.js";
export {
  getVehicleComparisonProfile,
  listComparisonProfiles,
} from "./comparisonRegistry.js";
export { resolveVehicleName } from "./resolveVehicleName.js";
