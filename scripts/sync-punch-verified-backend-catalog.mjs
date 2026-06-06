#!/usr/bin/env node
/**
 * Phase 2 — sync verified Punch dossier variants to backend tier-1 file catalog.
 * Source: src/data/catalog/verified/tataPunchEvVerified.js
 * Target: zyvev-backend/docs/architecture/catalog/tier-1/variants/*.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TATA_PUNCH_FAMILY_MEDIA,
  TATA_PUNCH_VERIFIED_VARIANTS,
  VERIFICATION_OWNER,
  VERIFICATION_SOURCE,
  DOSSIER_VERSION,
} from "../src/data/catalog/verified/tataPunchEvVerified.js";
import { PUNCH_DOSSIER_SLUG_ALIASES } from "../src/data/catalog/verified/punchSlugAliases.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND_CATALOG = join(
  ROOT,
  "../zyvev-backend/docs/architecture/catalog/tier-1"
);
const VARIANTS_DIR = join(BACKEND_CATALOG, "variants");
const MANIFEST_PATH = join(BACKEND_CATALOG, "manifest.json");
const TEMPLATE_PATH = join(VARIANTS_DIR, "tata-punch-ev-smart-plus.json");

function loadTemplate() {
  if (!existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template missing: ${TEMPLATE_PATH}`);
  }
  return JSON.parse(readFileSync(TEMPLATE_PATH, "utf8"));
}

function patchVariantRecord(template, variant, { legacySlug = null } = {}) {
  const slug = legacySlug || variant.slug;
  const charging = variant.charging || {};
  const record = structuredClone(template);

  record.identity = {
    ...record.identity,
    slug,
    variantName: variant.trimLabel || variant.name,
    canonicalSlug: variant.slug,
    legacyAliases: legacySlug ? [legacySlug] : [],
  };

  record.pricing = {
    ...record.pricing,
    exShowroom: variant.priceInr,
    priceLastUpdated: new Date().toISOString(),
  };

  record.battery = {
    ...record.battery,
    capacityKwh: variant.batteryKwh,
    usableKwh: Math.round(variant.batteryKwh * 0.94 * 10) / 10,
  };

  record.range = {
    claimedKm: variant.rangeKmClaimed,
    claimedStandard: variant.rangeStandard || "MIDC",
    realWorldKm: {
      min: variant.rangeKmRealWorldMin,
      max: variant.rangeKmRealWorldMax,
      methodology: VERIFICATION_SOURCE,
    },
  };

  record.charging = {
    ...record.charging,
    acKw: charging.acKw || 7.2,
    acTime0to100Hours: charging.acTime0to100Hours,
    dcKw: charging.dcKw,
    dcTime10to80Minutes:
      charging.dcTime10to80Minutes || charging.dcTime20to80Minutes,
    standards: [charging.port || "CCS2"],
    portableChargerIncluded: charging.portableChargerIncluded === true,
    fastChargingSupported: charging.fastChargingSupported === true,
  };

  record.performance = {
    ...record.performance,
    powerKw: variant.powerKw,
    powerHp: variant.powerBhp,
    torqueNm: variant.torqueNm,
    acceleration0to100: variant.accel0To100Sec,
  };

  record.media = {
    ...record.media,
    heroImage: TATA_PUNCH_FAMILY_MEDIA.heroImage,
    listingThumbnail: TATA_PUNCH_FAMILY_MEDIA.listingImage,
    compareThumbnail: TATA_PUNCH_FAMILY_MEDIA.compareImage,
    ogImage: TATA_PUNCH_FAMILY_MEDIA.heroImage,
  };

  record.governance = {
    ...record.governance,
    status: "published",
    dataQualityScore: 95,
    confidence: "high",
    source: "verified-dossier",
  };

  record.verification = {
    ...record.verification,
    dataQualityScore: 95,
    confidence: "high",
    verificationSource: VERIFICATION_SOURCE,
    verificationOwner: VERIFICATION_OWNER,
    dossierVersion: DOSSIER_VERSION,
    verified: true,
  };

  return record;
}

function writeVariantFile(slug, record) {
  mkdirSync(VARIANTS_DIR, { recursive: true });
  const path = join(VARIANTS_DIR, `${slug}.json`);
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
  return path;
}

function updateManifest(punchSlugs) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const slugs = manifest.slugs || [];
  const withoutPunch = slugs.filter(
    (s) => !String(s).startsWith("tata-punch-ev")
  );
  manifest.slugs = [...withoutPunch, ...punchSlugs];
  manifest.variantCount = manifest.slugs.length;
  manifest.generatedAt = new Date().toISOString();
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export function syncPunchVerifiedBackendCatalog() {
  if (!existsSync(BACKEND_CATALOG)) {
    throw new Error(`Backend catalog dir missing: ${BACKEND_CATALOG}`);
  }

  const template = loadTemplate();
  const written = [];

  for (const variant of TATA_PUNCH_VERIFIED_VARIANTS) {
    const record = patchVariantRecord(template, variant);
    written.push(writeVariantFile(variant.slug, record));
  }

  for (const [legacySlug, canonicalSlug] of Object.entries(
    PUNCH_DOSSIER_SLUG_ALIASES
  )) {
    const legacySource = TATA_PUNCH_VERIFIED_VARIANTS.find(
      (v) => v.slug === canonicalSlug
    );
    if (legacySource) {
      const legacyRecord = patchVariantRecord(template, legacySource, {
        legacySlug,
      });
      written.push(writeVariantFile(legacySlug, legacyRecord));
    }
  }

  const manifestSlugs = TATA_PUNCH_VERIFIED_VARIANTS.map((v) => v.slug);
  const manifest = updateManifest(manifestSlugs);

  return {
    variantFilesWritten: written.length,
    manifestVariantCount: manifest.slugs.length,
    punchManifestSlugs: manifestSlugs,
    legacyAliases: PUNCH_DOSSIER_SLUG_ALIASES,
  };
}

async function main() {
  console.log("\n=== Sync Punch verified dossier → backend tier-1 ===\n");
  const result = syncPunchVerifiedBackendCatalog();
  console.log(`Variant JSON files written: ${result.variantFilesWritten}`);
  console.log(`Punch slugs in manifest: ${result.punchManifestSlugs.length}`);
  console.log("\nDone.\n");
}

if (process.argv[1]?.endsWith("sync-punch-verified-backend-catalog.mjs")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
