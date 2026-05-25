/**
 * Load tier-1 catalog records for operational audits (definitions-first).
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * @param {import('../../src/backend/catalog/tier1CatalogDefinitions.js').TIER1_CATALOG_DEFINITIONS[0]} def
 */
export function definitionToAuditCar(def) {
  const primary = def.variants?.[0] || {};
  const chargingMeta = def.chargingMeta || {};
  return {
    slug: def.slug,
    name: def.name,
    brand: def.brand,
    category: def.category,
    familySlug: def.slug,
    compareReady: def.compareReady !== false,
    startingPrice: primary.priceInr,
    price: primary.priceInr,
    range: primary.rangeKmClaimed,
    specifications: {
      range: primary.rangeKmClaimed,
      batteryPack: primary.batteryKwh
        ? `${primary.batteryKwh} kWh`
        : null,
      chargingTime: chargingMeta.dcKw
        ? `DC up to ${chargingMeta.dcKw} kW`
        : null,
      topSpeed: primary.accel0To100 || null,
    },
    catalogMeta: {
      slug: def.slug,
      familySlug: def.slug,
      brandSlug: String(def.brand || "")
        .toLowerCase()
        .replace(/\s+/g, "-"),
      safety: def.safetyMeta || {},
      suitabilityScores: def.suitabilityScores || {},
      governanceStatus: def.governanceStatus || "not_verified",
      seo: def.seoMeta || {},
    },
    variants: def.variants || [],
    ownershipMeta: def.ownershipMeta || {},
    chargingMeta,
  };
}

export async function loadTier1Definitions() {
  const url = pathToFileURL(
    join(ROOT, "src/backend/catalog/tier1CatalogDefinitions.js")
  ).href;
  const mod = await import(url);
  return mod.TIER1_CATALOG_DEFINITIONS || [];
}

export async function loadCatalogCarsForAudit() {
  const definitions = await loadTier1Definitions();
  return definitions.map(definitionToAuditCar);
}

export async function loadFocusProductionizationCars() {
  const url = pathToFileURL(
    join(ROOT, "src/ops/tier1ProductionizationFocus.js")
  ).href;
  const { TIER1_PRODUCTIONIZATION_SLUGS } = await import(url);
  const definitions = await loadTier1Definitions();
  return definitions
    .filter((d) => TIER1_PRODUCTIONIZATION_SLUGS.includes(d.slug))
    .map(definitionToAuditCar);
}

/**
 * Optional live API merge (non-blocking).
 */
export async function tryFetchLiveCatalogCars() {
  const apiUrl =
    process.env.VITE_API_URL ||
    process.env.API_URL ||
    "";
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/cars`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : data?.cars || null;
  } catch {
    return null;
  }
}

export function loadBackendVariantJson(slug) {
  const manifestPath = join(
    ROOT,
    "../zyvev-backend/docs/architecture/catalog/tier-1/manifest.json"
  );
  if (!existsSync(manifestPath)) return null;
  const filePath = join(
    ROOT,
    `../zyvev-backend/docs/architecture/catalog/tier-1/variants/${slug}.json`
  );
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
}
