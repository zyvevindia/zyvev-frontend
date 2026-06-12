/**
 * Generate factual SEO catalog metadata from golden vehicle JSON (parallel artifacts).
 * Does not modify editorial SEO pages or runtime consumers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PUBLIC_MANIFEST,
  PUBLIC_VEHICLES,
  readJson,
} from "./lib/goldenCatalogPaths.mjs";
import {
  goldenDossierToSeoCatalogMeta,
  wrapSeoCatalogArtifact,
} from "./lib/goldenToSeoCatalogMeta.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SEO_GENERATED_ROOT = path.join(REPO_ROOT, "public/seo-data/generated");
const SEO_VEHICLES_DIR = path.join(SEO_GENERATED_ROOT, "vehicles");
const CONTENT_GENERATED_DIR = path.join(
  REPO_ROOT,
  "src/content/generated/generated"
);

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeContentIndex(vehicleSlugs, generatedAt) {
  const catalogVehicles = vehicleSlugs.map((slug) => {
    const artifact = readJson(path.join(SEO_VEHICLES_DIR, `${slug}.json`));
    return artifact.catalogMeta;
  });

  fs.mkdirSync(CONTENT_GENERATED_DIR, { recursive: true });

  writeJson(path.join(CONTENT_GENERATED_DIR, "catalog-vehicles.json"), {
    version: "seo-catalog-v1",
    generatedAt,
    count: catalogVehicles.length,
    vehicles: catalogVehicles,
  });

  const indexJs = `/**
 * AUTO-GENERATED — factual catalog metadata for SEO (no editorial copy).
 * Regenerate: npm run catalog:generate-seo
 */

import catalogBundle from "./catalog-vehicles.json";

export const GENERATED_SEO_CATALOG_AT = catalogBundle.generatedAt;

const GENERATED_SEO_CATALOG = Object.freeze(
  Object.fromEntries(
    (catalogBundle.vehicles || []).map((meta) => [meta.familySlug, meta])
  )
);

function normalizeSlug(slug = "") {
  return String(slug || "").trim().toLowerCase();
}

export function hasGeneratedSeoCatalogMeta(slug = "") {
  const key = normalizeSlug(slug);
  return Boolean(key && GENERATED_SEO_CATALOG[key]);
}

export function loadGeneratedSeoCatalogMeta(slug = "") {
  const key = normalizeSlug(slug);
  return GENERATED_SEO_CATALOG[key] || null;
}

export function listGeneratedSeoCatalogMetaSlugs() {
  return Object.keys(GENERATED_SEO_CATALOG).sort();
}

export { GENERATED_SEO_CATALOG, catalogBundle };
`;

  fs.writeFileSync(path.join(CONTENT_GENERATED_DIR, "index.js"), indexJs, "utf8");
}

function main() {
  const manifest = readJson(PUBLIC_MANIFEST);
  const generatedAt = new Date().toISOString();
  const vehicleSlugs = [];
  const manifestVehicles = [];

  for (const entry of manifest.vehicles || []) {
    const familySlug = entry.familySlug || entry.id;
    const inputPath = path.join(PUBLIC_VEHICLES, `${familySlug}.json`);

    if (!fs.existsSync(inputPath)) {
      console.warn(`Skipping missing golden file: ${familySlug}`);
      continue;
    }

    const dossier = readJson(inputPath);
    const catalogMeta = goldenDossierToSeoCatalogMeta(dossier);
    const artifact = wrapSeoCatalogArtifact(catalogMeta, generatedAt);

    writeJson(path.join(SEO_VEHICLES_DIR, `${familySlug}.json`), artifact);
    vehicleSlugs.push(familySlug);
    manifestVehicles.push({
      familySlug,
      displayName: catalogMeta.displayName,
      brand: catalogMeta.brand,
      variantCount: catalogMeta.variantCount,
      filePath: `public/seo-data/generated/vehicles/${familySlug}.json`,
    });
  }

  vehicleSlugs.sort((a, b) => a.localeCompare(b));
  manifestVehicles.sort((a, b) => a.familySlug.localeCompare(b.familySlug));

  writeJson(path.join(SEO_GENERATED_ROOT, "manifest.json"), {
    version: "seo-catalog-v1",
    generatedAt,
    count: vehicleSlugs.length,
    vehicles: manifestVehicles,
  });

  writeContentIndex(vehicleSlugs, generatedAt);

  console.log(
    `Generated ${vehicleSlugs.length} SEO catalog artifact(s) → ${SEO_GENERATED_ROOT}`
  );
  console.log(`Content index → ${CONTENT_GENERATED_DIR}`);
}

main();
