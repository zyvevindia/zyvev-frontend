/**
 * Generate src/data/catalog/generated/*.js from public golden vehicle JSON.
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
  goldenDossierToVerifiedModule,
  serializeJsModule,
} from "./lib/goldenToVerifiedDossier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "src/data/catalog/generated");
const INDEX_FILE = path.join(OUT_DIR, "index.js");

function writeIndex(familySlugs) {
  const imports = familySlugs
    .map((slug) => `import * as dossier_${slug.replace(/-/g, "_")} from "./${slug}.js";`)
    .join("\n");

  const registryEntries = familySlugs
    .map(
      (slug) =>
        `  "${slug}": dossier_${slug.replace(/-/g, "_")},`
    )
    .join("\n");

  const content = `/**
 * AUTO-GENERATED — do not edit manually.
 * Regenerate: npm run catalog:generate-verified
 */

${imports}

const GENERATED_DOSSIERS = Object.freeze({
${registryEntries}
});

function normalizeSlug(slug = "") {
  return String(slug || "").trim().toLowerCase();
}

/**
 * @param {string} slug
 * @returns {boolean}
 */
export function hasGeneratedVerifiedDossier(slug = "") {
  const key = normalizeSlug(slug);
  return Boolean(key && GENERATED_DOSSIERS[key]);
}

/**
 * @param {string} slug
 * @returns {object | null}
 */
export function loadGeneratedVerifiedDossier(slug = "") {
  const key = normalizeSlug(slug);
  const mod = GENERATED_DOSSIERS[key];
  if (!mod) return null;

  return {
    familySlug: mod.FAMILY_SLUG,
    media: mod.FAMILY_MEDIA,
    variants: mod.VERIFIED_VARIANTS,
    brand: mod.DOSSIER_META.brand,
    familyName: mod.DOSSIER_META.familyName,
    category: mod.DOSSIER_META.category,
    displayName: mod.DOSSIER_META.displayName,
    verificationLevel: mod.DOSSIER_META.verificationLevel,
    verificationSource: mod.DOSSIER_META.verificationSource,
    verificationOwner: mod.DOSSIER_META.verificationOwner,
    dossierVersion: mod.DOSSIER_META.dossierVersion,
    sources: mod.DOSSIER_META.sources,
    verifiedAt: mod.DOSSIER_META.verifiedAt,
  };
}

export function listGeneratedVerifiedDossierSlugs() {
  return Object.keys(GENERATED_DOSSIERS).sort();
}

export { GENERATED_DOSSIERS };
`;

  fs.writeFileSync(INDEX_FILE, content, "utf8");
}

function main() {
  const manifest = readJson(PUBLIC_MANIFEST);
  const entries = manifest.vehicles || [];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const written = [];

  for (const entry of entries) {
    const familySlug = entry.familySlug || entry.id;
    const inputPath = path.join(PUBLIC_VEHICLES, `${familySlug}.json`);

    if (!fs.existsSync(inputPath)) {
      console.warn(`Skipping missing golden file: ${familySlug}`);
      continue;
    }

    const dossier = readJson(inputPath);
    const moduleData = goldenDossierToVerifiedModule(dossier);
    const outPath = path.join(OUT_DIR, `${familySlug}.js`);
    fs.writeFileSync(outPath, serializeJsModule(moduleData), "utf8");
    written.push(familySlug);
  }

  writeIndex(written.sort((a, b) => a.localeCompare(b)));

  console.log(
    `Generated ${written.length} verified dossier module(s) → ${OUT_DIR}`
  );
}

main();
