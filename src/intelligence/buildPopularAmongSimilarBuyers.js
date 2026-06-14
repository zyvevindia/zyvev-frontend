import {
  GENERATED_TIER1_DEFINITIONS,
  listGeneratedTier1DefinitionSlugs,
} from "../backend/catalog/generated/index.js";
import { scoreVehicle } from "../scoring/scoreEngine.js";
import { extractFamilySlug } from "../utils/modelFamily.js";
import { normalizeVehicleSlug } from "../utils/vehicleRoutes.js";
import { buildChargingPracticalityScore } from "./buildChargingPracticalityScore.js";
import { buildOwnershipCostScore } from "./buildOwnershipCostScore.js";
import { buildPersonas } from "./buildPersonas.js";

const MAX_VEHICLES = 3;

const WEIGHTS = Object.freeze({
  personas: 0.4,
  price: 0.2,
  ownership: 0.15,
  charging: 0.15,
  overall: 0.1,
});

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function resolveStartingPrice(vehicle) {
  const direct = parseNumber(
    vehicle?.startingPrice ??
      vehicle?.price ??
      vehicle?.catalogMeta?.startingPrice ??
      vehicle?.catalogMeta?.exShowroomPrice
  );
  if (direct != null && direct > 0) return direct;

  const variantPrices = (vehicle?.variants || [])
    .map((variant) => parseNumber(variant?.priceInr ?? variant?.price))
    .filter((price) => price != null && price > 0);

  if (variantPrices.length === 0) return null;
  return Math.min(...variantPrices);
}

function resolveOverallScore(vehicle) {
  const existing =
    parseNumber(vehicle?.evSavariScores?.overall?.score) ??
    parseNumber(vehicle?.evSavariScores?.composite) ??
    parseNumber(vehicle?.evScores?.composite);

  if (existing != null) return existing;

  try {
    const scored = scoreVehicle(vehicle, { variants: vehicle?.variants });
    return parseNumber(scored?.overall?.score);
  } catch {
    return null;
  }
}

function tier1DefinitionToVehicle(slug, definition) {
  if (!definition) return null;

  const variants = definition.variants || [];
  const prices = variants
    .map((variant) => parseNumber(variant.priceInr))
    .filter((price) => price != null && price > 0);
  const batteries = variants
    .map((variant) => parseNumber(variant.batteryKwh))
    .filter((value) => value != null && value > 0);

  return {
    slug,
    familySlug: slug,
    brand: definition.brand,
    name: definition.name,
    bodyType: definition.category,
    category: definition.category,
    price: prices.length ? Math.min(...prices) : null,
    startingPrice: prices.length ? Math.min(...prices) : null,
    variants,
    catalogMeta: {
      bodyType: definition.category,
    },
    ownershipMeta: definition.ownershipMeta,
    chargingMeta: definition.chargingMeta,
    specifications: {
      batteryPack: batteries.length ? Math.max(...batteries) : null,
    },
  };
}

function resolveSourceProfile(vehicle, sourceSlug) {
  const tier1Profile = tier1DefinitionToVehicle(
    sourceSlug,
    GENERATED_TIER1_DEFINITIONS[sourceSlug]
  );

  if (!tier1Profile) return vehicle;

  return {
    ...tier1Profile,
    ...vehicle,
    slug: sourceSlug,
    familySlug: sourceSlug,
    brand: vehicle.brand || tier1Profile.brand,
    name: vehicle.name || tier1Profile.name,
    variants:
      vehicle.variants?.length > 0
        ? vehicle.variants
        : tier1Profile.variants,
    catalogMeta: {
      ...tier1Profile.catalogMeta,
      ...(vehicle.catalogMeta || {}),
    },
  };
}

function formatVehicleTitle(definition) {
  if (!definition) return "";

  const brand = String(definition.brand || "").trim();
  const name = String(definition.name || "").trim();

  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
    return name;
  }

  return [brand, name].filter(Boolean).join(" ");
}

function scorePriceSimilarity(sourcePrice, candidatePrice) {
  if (!sourcePrice || !candidatePrice) return 0.35;
  const diff = Math.abs(sourcePrice - candidatePrice);
  const band = Math.max(sourcePrice * 0.3, 300000);
  return Math.max(0, 1 - diff / band);
}

function scoreNumericSimilarity(sourceValue, candidateValue) {
  if (sourceValue == null || candidateValue == null) return 0.35;
  return Math.max(0, 1 - Math.abs(sourceValue - candidateValue) / 100);
}

function scorePersonaSimilarity(sourceVehicle, candidateVehicle) {
  const sourcePersonas = new Set(
    (buildPersonas(sourceVehicle).personas || []).map(String)
  );
  const candidatePersonas = new Set(
    (buildPersonas(candidateVehicle).personas || []).map(String)
  );

  if (!sourcePersonas.size || !candidatePersonas.size) return 0.35;

  let intersection = 0;
  for (const persona of sourcePersonas) {
    if (candidatePersonas.has(persona)) intersection += 1;
  }

  const union = sourcePersonas.size + candidatePersonas.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function scoreCandidate(sourceProfile, candidate) {
  const sourcePrice = resolveStartingPrice(sourceProfile);
  const candidatePrice = resolveStartingPrice(candidate);

  const sourceOwnership = buildOwnershipCostScore(sourceProfile).score ?? 0;
  const candidateOwnership = buildOwnershipCostScore(candidate).score ?? 0;

  const sourceCharging =
    buildChargingPracticalityScore(sourceProfile).score ?? 0;
  const candidateCharging =
    buildChargingPracticalityScore(candidate).score ?? 0;

  const sourceOverall = resolveOverallScore(sourceProfile) ?? 0;
  const candidateOverall = resolveOverallScore(candidate) ?? 0;

  return (
    scorePersonaSimilarity(sourceProfile, candidate) * WEIGHTS.personas +
    scorePriceSimilarity(sourcePrice, candidatePrice) * WEIGHTS.price +
    scoreNumericSimilarity(sourceOwnership, candidateOwnership) *
      WEIGHTS.ownership +
    scoreNumericSimilarity(sourceCharging, candidateCharging) *
      WEIGHTS.charging +
    scoreNumericSimilarity(sourceOverall, candidateOverall) * WEIGHTS.overall
  );
}

/**
 * Rank EVs popular among buyers with similar identity and needs.
 * @param {object|null|undefined} vehicle
 * @param {{ limit?: number, excludeSlugs?: string[] }} [options]
 * @returns {{ vehicles: Array<{ slug: string, title: string }> }}
 */
export function buildPopularAmongSimilarBuyers(vehicle, options = {}) {
  if (!vehicle || typeof vehicle !== "object") {
    return { vehicles: [] };
  }

  const limit = Math.min(
    MAX_VEHICLES,
    Math.max(1, Number(options.limit) || MAX_VEHICLES)
  );

  const sourceSlug = normalizeVehicleSlug(
    extractFamilySlug(vehicle.slug || vehicle.familySlug || "")
  );
  if (!sourceSlug) return { vehicles: [] };

  const extraExclude = new Set(
    (options.excludeSlugs || []).map(normalizeVehicleSlug).filter(Boolean)
  );

  const sourceProfile = resolveSourceProfile(vehicle, sourceSlug);
  const seen = new Set([sourceSlug, ...extraExclude]);
  const scored = [];

  for (const rawSlug of listGeneratedTier1DefinitionSlugs()) {
    const slug = normalizeVehicleSlug(rawSlug);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const definition = GENERATED_TIER1_DEFINITIONS[slug];
    if (!definition || definition.compareReady === false) continue;

    const candidate = tier1DefinitionToVehicle(slug, definition);
    if (!candidate) continue;

    scored.push({
      slug,
      title: formatVehicleTitle(definition),
      score: scoreCandidate(sourceProfile, candidate),
    });
  }

  return {
    vehicles: scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ slug, title }) => ({ slug, title })),
  };
}
