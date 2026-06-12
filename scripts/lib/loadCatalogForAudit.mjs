/**
 * Load tier-1 catalog records for operational audits (definitions-first).
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * @param {import('../../src/backend/catalog/generated/index.js').GENERATED_TIER1_DEFINITIONS[string]} def
 */
export function definitionToAuditCar(def) {
  const primary = def.variants?.[0] || {};
  const chargingMeta = def.chargingMeta || {};
  const primaryCharging = primary.chargingMeta || chargingMeta;
  const chargingSummary = [
    primaryCharging.acKw ? `${primaryCharging.acKw} kW AC` : null,
    primaryCharging.dcKw ? `${primaryCharging.dcKw} kW DC` : null,
    primaryCharging.port || null,
    primaryCharging.dcTime10to80Minutes
      ? `10–80% in ~${primaryCharging.dcTime10to80Minutes} min`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    slug: def.slug,
    name: def.name,
    brand: def.brand,
    category: def.category,
    familySlug: def.slug,
    compareReady: def.compareReady !== false,
    verified: def.verified === true,
    verificationSource: def.verificationSource || null,
    verificationOwner: def.verificationOwner || null,
    dossierVersion: def.dossierVersion || null,
    heroImage: def.heroImage || def.mediaMeta?.heroImage || null,
    compareThumbnail:
      def.compareThumbnail || def.mediaMeta?.compareImage || null,
    listingThumbnail:
      def.listingThumbnail || def.mediaMeta?.listingImage || null,
    startingPrice: primary.priceInr,
    price: primary.priceInr,
    range: primary.rangeKmClaimed,
    specifications: {
      range: primary.rangeKmClaimed,
      batteryPack: primary.batteryKwh
        ? `${primary.batteryKwh} kWh`
        : null,
      chargingTime: chargingSummary || null,
      topSpeed: primary.accel0To100 || null,
      powerKw: primary.powerKw,
      torqueNm: primary.torqueNm,
    },
    catalogMeta: {
      slug: def.slug,
      familySlug: def.slug,
      brandSlug: String(def.brand || "")
        .toLowerCase()
        .replace(/\s+/g, "-"),
      verified: def.verified === true,
      verificationSource: def.verificationSource || null,
      verificationOwner: def.verificationOwner || null,
      dossierVersion: def.dossierVersion || null,
      safety: primary.safetyMeta || def.safetyMeta || {},
      suitabilityScores: def.suitabilityScores || {},
      governanceStatus: def.governanceStatus || "not_verified",
      seo: def.seoMeta || {},
      claimedRangeKm: primary.rangeKmClaimed,
      chargingSummary,
      chargingIntelligence: {
        acKw: primaryCharging.acKw,
        dcKw: primaryCharging.dcKw,
        connectorType: primaryCharging.port,
        dcTime10to80Minutes: primaryCharging.dcTime10to80Minutes,
        portableChargerIncluded: primaryCharging.portableChargerIncluded,
        homeChargingSupported: true,
        fastChargingSupported: Boolean(primaryCharging.dcKw),
      },
      chargingPracticality: {
        acFullChargeHours: primaryCharging.acTime0to100Hours,
        dcTime10to80Minutes: primaryCharging.dcTime10to80Minutes,
        connectorType: primaryCharging.port,
        homeChargingSupported: true,
        portableChargerIncluded: primaryCharging.portableChargerIncluded,
        fastChargingSupported: Boolean(primaryCharging.dcKw),
      },
    },
    variants: def.variants || [],
    ownershipMeta: def.ownershipMeta || {},
    chargingMeta: primaryCharging,
  };
}

export async function loadTier1Definitions() {
  const url = pathToFileURL(
    join(ROOT, "src/backend/catalog/generated/index.js")
  ).href;
  const mod = await import(url);
  return Object.values(mod.GENERATED_TIER1_DEFINITIONS || {});
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
