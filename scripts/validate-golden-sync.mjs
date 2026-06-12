/**
 * Validate public ↔ docs golden dataset sync and manifest consistency.
 * Writes docs/catalog/catalog-phase0-report.{md,json} and exits non-zero on failure.
 */

import fs from "node:fs";
import path from "node:path";

import {
  DOCS_GOLDEN,
  DOCS_MANIFEST,
  DOCS_VEHICLES,
  PHASE0_REPORT_JSON,
  PHASE0_REPORT_MD,
  PUBLIC_GOLDEN,
  PUBLIC_MANIFEST,
  PUBLIC_VEHICLES,
  buildManifestEntry,
  listGoldenFiles,
  normalizeJsonForCompare,
  readJson,
  readVehicleDossiers,
} from "./lib/goldenCatalogPaths.mjs";

function compareTrees() {
  const publicFiles = listGoldenFiles(PUBLIC_GOLDEN);
  const docsFiles = listGoldenFiles(DOCS_GOLDEN);
  const publicSet = new Set(publicFiles);
  const docsSet = new Set(docsFiles);

  const missingInDocs = publicFiles.filter((file) => !docsSet.has(file));
  const missingInPublic = docsFiles.filter((file) => !publicSet.has(file));
  const contentMismatches = [];

  for (const rel of publicFiles) {
    if (!docsSet.has(rel)) continue;

    const publicPath = path.join(PUBLIC_GOLDEN, rel);
    const docsPath = path.join(DOCS_GOLDEN, rel);

    if (rel.endsWith(".json")) {
      const publicJson = readJson(publicPath);
      const docsJson = readJson(docsPath);
      if (normalizeJsonForCompare(publicJson) !== normalizeJsonForCompare(docsJson)) {
        contentMismatches.push(rel);
      }
    } else {
      const publicBuf = fs.readFileSync(publicPath);
      const docsBuf = fs.readFileSync(docsPath);
      if (!publicBuf.equals(docsBuf)) {
        contentMismatches.push(rel);
      }
    }
  }

  return {
    inSync:
      missingInDocs.length === 0 &&
      missingInPublic.length === 0 &&
      contentMismatches.length === 0,
    missingInDocs,
    missingInPublic,
    contentMismatches,
    publicFileCount: publicFiles.length,
    docsFileCount: docsFiles.length,
  };
}

function validateManifest() {
  const errors = [];
  const warnings = [];
  const duplicateSlugs = [];
  const missingFiles = [];
  const missingMedia = [];
  const variantCountMismatches = [];

  const dossiers = readVehicleDossiers(PUBLIC_VEHICLES);
  const dossierBySlug = new Map(dossiers.map((item) => [item.familySlug, item]));

  const slugCounts = new Map();
  for (const { familySlug, dossier } of dossiers) {
    const slug = dossier.familySlug || dossier.vehicle?.familySlug || familySlug;
    slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) duplicateSlugs.push({ slug, count });
  }

  for (const { familySlug, dossier } of dossiers) {
    if (!dossier.media || typeof dossier.media !== "object") {
      missingMedia.push({ familySlug, issue: "missing media block" });
      continue;
    }

    const hasImage =
      Boolean(dossier.media.heroImage) ||
      Boolean(dossier.media.listingThumbnail) ||
      (Array.isArray(dossier.media.gallery) && dossier.media.gallery.length > 0) ||
      (Array.isArray(dossier.media.galleryImages) && dossier.media.galleryImages.length > 0);

    if (!hasImage) {
      missingMedia.push({ familySlug, issue: "media block has no image URLs" });
    }
  }

  if (!fs.existsSync(PUBLIC_MANIFEST)) {
    errors.push("public manifest.json is missing");
    return {
      errors,
      warnings,
      duplicateSlugs,
      missingFiles,
      missingMedia,
      variantCountMismatches,
      vehicleCount: dossiers.length,
      manifestCount: 0,
    };
  }

  const manifest = readJson(PUBLIC_MANIFEST);
  const manifestVehicles = Array.isArray(manifest.vehicles) ? manifest.vehicles : [];
  const manifestIds = new Set();

  for (const entry of manifestVehicles) {
    const id = entry.id || entry.familySlug;
    if (!id) {
      errors.push("manifest entry missing id/familySlug");
      continue;
    }

    if (manifestIds.has(id)) {
      duplicateSlugs.push({ slug: id, count: 2, source: "manifest" });
    }
    manifestIds.add(id);

    const dossierItem = dossierBySlug.get(id) || dossierBySlug.get(entry.familySlug);
    if (!dossierItem) {
      missingFiles.push({ type: "vehicle-json", slug: id });
      errors.push(`manifest entry "${id}" has no vehicles/${id}.json`);
      continue;
    }

    const expected = buildManifestEntry(dossierItem.dossier, dossierItem.familySlug);
    if (entry.variantCount !== expected.variantCount) {
      variantCountMismatches.push({
        slug: id,
        manifest: entry.variantCount,
        actual: expected.variantCount,
      });
      errors.push(
        `variantCount mismatch for "${id}": manifest=${entry.variantCount}, actual=${expected.variantCount}`,
      );
    }

    if (entry.familySlug && entry.familySlug !== expected.familySlug) {
      errors.push(
        `familySlug mismatch for "${id}": manifest=${entry.familySlug}, dossier=${expected.familySlug}`,
      );
    }
  }

  for (const { familySlug } of dossiers) {
    if (!manifestIds.has(familySlug)) {
      missingFiles.push({ type: "manifest-entry", slug: familySlug });
      errors.push(`vehicle file "${familySlug}.json" is missing from manifest`);
    }
  }

  if (manifest.count !== manifestVehicles.length) {
    errors.push(
      `manifest count field (${manifest.count}) does not match vehicles array length (${manifestVehicles.length})`,
    );
  }

  if (fs.existsSync(DOCS_MANIFEST)) {
    const docsManifest = readJson(DOCS_MANIFEST);
    if (
      normalizeJsonForCompare(manifest) !== normalizeJsonForCompare(docsManifest)
    ) {
      errors.push("docs manifest.json does not match public manifest.json");
    }
  } else {
    errors.push("docs manifest.json is missing");
  }

  if (missingMedia.length > 0) {
    warnings.push(`${missingMedia.length} vehicle(s) reported with missing/incomplete media`);
  }

  return {
    errors,
    warnings,
    duplicateSlugs,
    missingFiles,
    missingMedia,
    variantCountMismatches,
    vehicleCount: dossiers.length,
    manifestCount: manifestVehicles.length,
  };
}

function writeReports(report) {
  fs.mkdirSync(path.dirname(PHASE0_REPORT_JSON), { recursive: true });
  fs.writeFileSync(PHASE0_REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines = [
    "# Catalog Phase 0 + Phase 1 Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Vehicle count: **${report.vehicleCount}**`,
    `- Manifest count: **${report.manifestCount}**`,
    `- Docs/public sync: **${report.docsPublicSync.inSync ? "in sync" : "OUT OF SYNC"}**`,
    `- Validation: **${report.validation.passed ? "PASSED" : "FAILED"}**`,
    "",
    "## Docs ↔ Public sync",
    "",
    `- Public files: ${report.docsPublicSync.publicFileCount}`,
    `- Docs files: ${report.docsPublicSync.docsFileCount}`,
  ];

  if (report.docsPublicSync.missingInDocs.length > 0) {
    lines.push("", "### Missing in docs", "");
    for (const file of report.docsPublicSync.missingInDocs) lines.push(`- ${file}`);
  }
  if (report.docsPublicSync.missingInPublic.length > 0) {
    lines.push("", "### Extra in docs (not in public)", "");
    for (const file of report.docsPublicSync.missingInPublic) lines.push(`- ${file}`);
  }
  if (report.docsPublicSync.contentMismatches.length > 0) {
    lines.push("", "### Content mismatches", "");
    for (const file of report.docsPublicSync.contentMismatches) lines.push(`- ${file}`);
  }

  lines.push("", "## Duplicate slugs", "");
  if (report.duplicateSlugs.length === 0) {
    lines.push("- None");
  } else {
    for (const item of report.duplicateSlugs) {
      lines.push(`- \`${item.slug}\` (${item.count} occurrences${item.source ? `, ${item.source}` : ""})`);
    }
  }

  lines.push("", "## Missing files", "");
  if (report.missingFiles.length === 0) {
    lines.push("- None");
  } else {
    for (const item of report.missingFiles) {
      lines.push(`- ${item.type}: \`${item.slug}\``);
    }
  }

  lines.push("", "## Missing / incomplete media", "");
  if (report.missingMedia.length === 0) {
    lines.push("- None");
  } else {
    for (const item of report.missingMedia) {
      lines.push(`- \`${item.familySlug}\`: ${item.issue}`);
    }
  }

  lines.push("", "## Validation errors", "");
  if (report.validation.errors.length === 0) {
    lines.push("- None");
  } else {
    for (const err of report.validation.errors) lines.push(`- ${err}`);
  }

  if (report.validation.warnings.length > 0) {
    lines.push("", "## Validation warnings", "");
    for (const warning of report.validation.warnings) lines.push(`- ${warning}`);
  }

  fs.writeFileSync(PHASE0_REPORT_MD, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const sync = compareTrees();
  const manifestValidation = validateManifest();

  const errors = [...manifestValidation.errors];
  if (!sync.inSync) {
    errors.push("public and docs golden-dataset trees are not identical");
  }

  const passed = errors.length === 0;
  const report = {
    generatedAt: new Date().toISOString(),
    phase: "0+1",
    vehicleCount: manifestValidation.vehicleCount,
    manifestCount: manifestValidation.manifestCount,
    docsPublicSync: sync,
    duplicateSlugs: manifestValidation.duplicateSlugs,
    missingFiles: manifestValidation.missingFiles,
    missingMedia: manifestValidation.missingMedia,
    variantCountMismatches: manifestValidation.variantCountMismatches,
    validation: {
      passed,
      errors,
      warnings: manifestValidation.warnings,
    },
  };

  writeReports(report);

  console.log(`Report: ${PHASE0_REPORT_MD}`);
  console.log(`Report: ${PHASE0_REPORT_JSON}`);
  console.log(`Vehicles: ${report.vehicleCount}, manifest entries: ${report.manifestCount}`);
  console.log(`Docs/public sync: ${sync.inSync ? "OK" : "FAILED"}`);
  console.log(`Validation: ${passed ? "PASSED" : "FAILED"}`);

  if (!passed) {
    for (const err of errors) console.error(`ERROR: ${err}`);
    process.exit(1);
  }
}

main();
