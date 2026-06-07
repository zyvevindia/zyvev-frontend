/**
 * Licensed media attribution registry — load, validate, and trace seed URLs.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isAllowedLicensedIngestUrl,
  isLegacyFrozenMediaFamily,
  isProhibitedMediaSourceUrl,
  requiresLicensedAttribution,
} from "../../src/media/mediaPolicy.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");

export const ATTRIBUTION_PATH = join(
  root,
  "docs/operations/tier1-media-attribution.json"
);
export const SEED_PATH = join(root, "docs/operations/tier1-cloudinary-seed.json");

const REQUIRED_SOURCE_FIELDS = [
  "sourcePageUrl",
  "creator",
  "license",
  "attributionText",
  "sourceType",
];

/**
 * Normalize Wikimedia thumb URL to a stable lookup key (commons filename).
 * @param {string} url
 */
export function commonsFileKeyFromIngestUrl(url = "") {
  try {
    const decoded = decodeURIComponent(url);
    const thumbMatch = decoded.match(/\/(\d+px-[^/]+)$/i);
    if (thumbMatch) {
      return thumbMatch[1]
        .replace(/^\d+px-/, "")
        .replace(/\.(jpg|jpeg|png|webp|avif)$/i, "");
    }
    const directMatch = decoded.match(/\/commons\/(?:thumb\/)?(?:[^/]+\/)*([^/]+)$/i);
    if (!directMatch) return null;
    return directMatch[1].replace(/\.(jpg|jpeg|png|webp|avif)$/i, "");
  } catch {
    return null;
  }
}

export function loadAttributionRegistry() {
  if (!existsSync(ATTRIBUTION_PATH)) {
    throw new Error(`Missing attribution registry: ${ATTRIBUTION_PATH}`);
  }
  return JSON.parse(readFileSync(ATTRIBUTION_PATH, "utf8"));
}

export function loadSeedManifest() {
  if (!existsSync(SEED_PATH)) {
    throw new Error(`Missing seed manifest: ${SEED_PATH}`);
  }
  return JSON.parse(readFileSync(SEED_PATH, "utf8"));
}

/**
 * @param {object} source
 * @returns {string[]}
 */
export function validateSourceRecord(source = {}) {
  const missing = REQUIRED_SOURCE_FIELDS.filter(
    (field) => !String(source[field] || "").trim()
  );
  return missing;
}

function normalizeCommonsKey(key = "") {
  return String(key || "")
    .replace(/\.(jpg|jpeg|png|webp|avif)$/i, "")
    .toLowerCase();
}

/**
 * Resolve attribution for an ingest URL from the registry `sources` map.
 * @param {Record<string, object>} sources
 * @param {string} ingestUrl
 */
export function resolveSourceAttribution(sources, ingestUrl) {
  const key = commonsFileKeyFromIngestUrl(ingestUrl);
  if (!key) return { key: null, record: null };

  for (const [sourceKey, record] of Object.entries(sources)) {
    if (record?.ingestUrl === ingestUrl) {
      return { key: sourceKey, record };
    }
    const recordKey = commonsFileKeyFromIngestUrl(record?.ingestUrl || "");
    if (recordKey && recordKey === key) {
      return { key: sourceKey, record };
    }
    if (normalizeCommonsKey(sourceKey) === normalizeCommonsKey(key)) {
      return { key: sourceKey, record };
    }
  }

  return { key, record: null };
}

/**
 * Audit seed + attribution alignment for licensed-standard families.
 * @returns {{ ok: boolean, issues: Array<{ severity: string, familySlug?: string, role?: string, message: string }> }}
 */
export function auditMediaAttribution() {
  const registry = loadAttributionRegistry();
  const seed = loadSeedManifest();
  const sources = registry.sources || {};
  const issues = [];

  for (const [familySlug, block] of Object.entries(seed)) {
    if (familySlug.startsWith("_") || typeof block !== "object") continue;

    if (isLegacyFrozenMediaFamily(familySlug)) {
      issues.push({
        severity: "info",
        familySlug,
        message:
          "Legacy frozen family — seed/attribution changes are out of scope; keep existing Cloudinary assets.",
      });
      continue;
    }

    if (!requiresLicensedAttribution(familySlug)) continue;

    for (const [role, ingestUrl] of Object.entries(block)) {
      if (!ingestUrl || typeof ingestUrl !== "string") continue;

      if (isProhibitedMediaSourceUrl(ingestUrl)) {
        issues.push({
          severity: "error",
          familySlug,
          role,
          message: `Prohibited source URL (${ingestUrl})`,
        });
        continue;
      }

      if (!isAllowedLicensedIngestUrl(ingestUrl)) {
        issues.push({
          severity: "error",
          familySlug,
          role,
          message: `Ingest URL not on allowlist — must be Wikimedia Commons or other explicitly licensed host (${ingestUrl})`,
        });
        continue;
      }

      const { key, record } = resolveSourceAttribution(sources, ingestUrl);
      if (!key || !record) {
        issues.push({
          severity: "error",
          familySlug,
          role,
          message: `No attribution record for ingest URL (commons key: ${key || "unknown"})`,
        });
        continue;
      }

      const missing = validateSourceRecord(record);
      if (missing.length) {
        issues.push({
          severity: "error",
          familySlug,
          role,
          message: `Incomplete attribution for ${key}: missing ${missing.join(", ")}`,
        });
      }

      if (
        record.ingestUrl &&
        record.ingestUrl !== ingestUrl &&
        commonsFileKeyFromIngestUrl(record.ingestUrl) !== key
      ) {
        issues.push({
          severity: "warn",
          familySlug,
          role,
          message: `Seed URL differs from registry ingestUrl for ${key}`,
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  return { ok: errors.length === 0, issues };
}

/**
 * Cloudinary upload context from attribution record.
 * @param {object} attribution
 * @param {{ familySlug: string, role: string }} meta
 */
export function cloudinaryContextFromAttribution(attribution, meta) {
  return {
    family_slug: meta.familySlug,
    catalog_role: meta.role,
    source_type: attribution.sourceType,
    source_page_url: attribution.sourcePageUrl,
    creator: attribution.creator,
    license: attribution.license,
    attribution_text: attribution.attributionText,
  };
}
