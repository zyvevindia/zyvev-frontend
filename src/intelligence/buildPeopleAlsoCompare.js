import {
  GENERATED_TIER1_DEFINITIONS,
  listGeneratedTier1DefinitionSlugs,
} from "../backend/catalog/generated/index.js";
import { scoreVehicle } from "../scoring/scoreEngine.js";
import { extractFamilySlug } from "../utils/modelFamily.js";
import { normalizeVehicleSlug } from "../utils/vehicleRoutes.js";
import { buildHighwayConfidenceScore } from "./buildHighwayConfidenceScore.js";
import { buildPersonas } from "./buildPersonas.js";

const MAX_COMPARISONS = 3;
const RIVAL_BOOST = 0.12;

const WEIGHTS = Object.freeze({
  price: 0.25,
  bodyStyle: 0.2,
  battery: 0.15,
  highway: 0.15,
  personas: 0.15,
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

function resolveBatteryKwh(vehicle) {
  const variant = vehicle?.variants?.[0];
  const specs = vehicle?.specifications || variant?.specifications || {};
  const meta = vehicle?.catalogMeta || variant?.catalogMeta || {};

  const values = [
    parseNumber(vehicle?.specifications?.batteryPack),
    parseNumber(variant?.batteryKwh),
    parseNumber(variant?.compareSpecs?.batteryKwh),
    parseNumber(meta.batteryCapacityKwh),
    parseNumber(specs.batteryPack),
    parseNumber(specs.batteryCapacity),
    parseNumber(vehicle?.battery),
  ].filter((value) => value != null && value > 0);

  if (!values.length) return null;
  return Math.max(...values);
}

function resolveBodyStyle(vehicle) {
  return String(
    vehicle?.bodyType ||
      vehicle?.category ||
      vehicle?.catalogMeta?.bodyType ||
      ""
  )
    .trim()
    .toLowerCase();
}

function normalizeBodyStyle(style) {
  const value = String(style || "").toLowerCase();
  if (value.includes("suv")) return "suv";
  if (value.includes("hatch")) return "hatchback";
  if (value.includes("sedan")) return "sedan";
  if (value.includes("mpv")) return "mpv";
  if (value.includes("coupe")) return "coupe";
  return value || "unknown";
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
      compareRivals: definition.compare?.segmentRivalSlugs || [],
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
    bodyType:
      vehicle.bodyType ||
      vehicle.category ||
      tier1Profile.bodyType,
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

function scorePriceSimilarity(sourcePrice, candidatePrice) {
  if (!sourcePrice || !candidatePrice) return 0.35;
  const diff = Math.abs(sourcePrice - candidatePrice);
  const band = Math.max(sourcePrice * 0.35, 350000);
  return Math.max(0, 1 - diff / band);
}

function scoreBodyStyleSimilarity(sourceStyle, candidateStyle) {
  const source = normalizeBodyStyle(sourceStyle);
  const candidate = normalizeBodyStyle(candidateStyle);
  if (source === "unknown" || candidate === "unknown") return 0.4;
  return source === candidate ? 1 : 0.25;
}

function scoreBatterySimilarity(sourceBattery, candidateBattery) {
  if (!sourceBattery || !candidateBattery) return 0.35;
  const diff = Math.abs(sourceBattery - candidateBattery);
  const scale = Math.max(sourceBattery, candidateBattery, 1);
  return Math.max(0, 1 - diff / scale);
}

function scoreHighwaySimilarity(sourceVehicle, candidateVehicle) {
  const sourceScore = buildHighwayConfidenceScore(sourceVehicle).score ?? 0;
  const candidateScore =
    buildHighwayConfidenceScore(candidateVehicle).score ?? 0;
  return Math.max(0, 1 - Math.abs(sourceScore - candidateScore) / 100);
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

function formatComparisonTitle(definition) {
  if (!definition) return "";

  const brand = String(definition.brand || "").trim();
  const name = String(definition.name || "").trim();

  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
    return name;
  }

  return [brand, name].filter(Boolean).join(" ");
}

function scoreCandidate(sourceProfile, candidate, rivalSlugs) {
  const sourcePrice = resolveStartingPrice(sourceProfile);
  const candidatePrice = resolveStartingPrice(candidate);
  const sourceBattery = resolveBatteryKwh(sourceProfile);
  const candidateBattery = resolveBatteryKwh(candidate);
  const overallScore = resolveOverallScore(candidate) ?? 0;

  const weightedScore =
    scorePriceSimilarity(sourcePrice, candidatePrice) * WEIGHTS.price +
    scoreBodyStyleSimilarity(
      resolveBodyStyle(sourceProfile),
      resolveBodyStyle(candidate)
    ) *
      WEIGHTS.bodyStyle +
    scoreBatterySimilarity(sourceBattery, candidateBattery) * WEIGHTS.battery +
    scoreHighwaySimilarity(sourceProfile, candidate) * WEIGHTS.highway +
    scorePersonaSimilarity(sourceProfile, candidate) * WEIGHTS.personas +
    (overallScore / 100) * WEIGHTS.overall;

  const rivalBoost = rivalSlugs.has(candidate.slug) ? RIVAL_BOOST : 0;

  return weightedScore + rivalBoost;
}

/**
 * Rank cross-shop alternatives for a vehicle detail page.
 * @param {object|null|undefined} vehicle
 * @param {{ limit?: number }} [options]
 * @returns {{ comparisons: Array<{ slug: string, title: string }> }}
 */
export function buildPeopleAlsoCompare(vehicle, options = {}) {
  if (!vehicle || typeof vehicle !== "object") {
    return { comparisons: [] };
  }

  const limit = Math.min(
    MAX_COMPARISONS,
    Math.max(1, Number(options.limit) || MAX_COMPARISONS)
  );

  const sourceSlug = normalizeVehicleSlug(
    extractFamilySlug(vehicle.slug || vehicle.familySlug || "")
  );
  if (!sourceSlug) return { comparisons: [] };

  const rivalSlugs = new Set(
    (vehicle.catalogMeta?.compareRivals || [])
      .map(normalizeVehicleSlug)
      .filter(Boolean)
  );

  const candidateSlugs = [
    ...rivalSlugs,
    ...listGeneratedTier1DefinitionSlugs(),
  ];

  const sourceProfile = resolveSourceProfile(vehicle, sourceSlug);
  const seen = new Set([sourceSlug]);
  const scored = [];

  for (const rawSlug of candidateSlugs) {
    const slug = normalizeVehicleSlug(rawSlug);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const definition = GENERATED_TIER1_DEFINITIONS[slug];
    if (!definition || definition.compareReady === false) continue;

    const candidate = tier1DefinitionToVehicle(slug, definition);
    if (!candidate) continue;

    scored.push({
      slug,
      title: formatComparisonTitle(definition),
      score: scoreCandidate(sourceProfile, candidate, rivalSlugs),
    });
  }

  return {
    comparisons: scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ slug, title }) => ({ slug, title })),
  };
}
