/**
 * Browser-safe source registry normalization helpers (no Node built-ins).
 */

import { SOURCE_REGISTRY_STATUS } from "../constants.js";

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
