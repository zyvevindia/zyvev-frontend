/**
 * v5 OEM source registry — defaults + loader (Supabase or static JSON).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCE_REGISTRY_STATUS } from "../constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REGISTRY_PATH = path.resolve(
  __dirname,
  "../../../public/catalog/source-registry.json"
);

/** @type {object[]|null} */
let cachedDefaults = null;

export function getDefaultRegistryPath() {
  return DEFAULT_REGISTRY_PATH;
}

export function loadDefaultRegistry() {
  if (cachedDefaults) return cachedDefaults;
  if (!fs.existsSync(DEFAULT_REGISTRY_PATH)) {
    cachedDefaults = [];
    return cachedDefaults;
  }
  cachedDefaults = JSON.parse(fs.readFileSync(DEFAULT_REGISTRY_PATH, "utf8"));
  return cachedDefaults;
}

export function loadRegistryEntry(familySlug) {
  const all = loadDefaultRegistry();
  return all.find((e) => e.familySlug === familySlug || e.id === familySlug) || null;
}

export function listRegistryEntries() {
  return loadDefaultRegistry();
}

export function normalizeRegistryEntry(row) {
  if (!row) return null;
  return {
    id: row.id,
    familySlug: row.family_slug || row.familySlug || row.id,
    brand: row.brand,
    model: row.model,
    officialUrl: row.official_url || row.officialUrl || null,
    brochureUrl: row.brochure_url || row.brochureUrl || null,
    referenceUrls: row.reference_urls || row.referenceUrls || [],
    vehicleKeywords: row.vehicle_keywords || row.vehicleKeywords || [],
    status: row.status || SOURCE_REGISTRY_STATUS.NEEDS_VERIFICATION,
    lastVerifiedAt: row.last_verified_at || row.lastVerifiedAt || null,
    notes: row.notes || null,
  };
}

export function registryEntryToRow(entry) {
  return {
    id: entry.id || entry.familySlug,
    family_slug: entry.familySlug,
    brand: entry.brand,
    model: entry.model,
    official_url: entry.officialUrl,
    brochure_url: entry.brochureUrl,
    reference_urls: entry.referenceUrls || [],
    vehicle_keywords: entry.vehicleKeywords || [],
    status: entry.status || SOURCE_REGISTRY_STATUS.NEEDS_VERIFICATION,
    last_verified_at: entry.lastVerifiedAt,
    notes: entry.notes || null,
  };
}
