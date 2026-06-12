/**
 * Generate src/backend/catalog/generated/*.js from public golden vehicle JSON.
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
  goldenDossierToTier1Definition,
  serializeTier1Module,
} from "./lib/goldenToTier1Definition.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "src/backend/catalog/generated");
const INDEX_FILE = path.join(OUT_DIR, "index.js");

function writeIndex(familySlugs) {
  const imports = familySlugs
    .map(
      (slug) =>
        `import { TIER1_DEFINITION as tier1_${slug.replace(/-/g, "_")} } from "./${slug}.js";`
    )
    .join("\n");

  const registryEntries = familySlugs
    .map(
      (slug) =>
        `  "${slug}": tier1_${slug.replace(/-/g, "_")},`
    )
    .join("\n");

  const content = `/**
 * AUTO-GENERATED — do not edit manually.
 * Regenerate: npm run catalog:generate-tier1
 */

${imports}

const GENERATED_TIER1_DEFINITIONS = Object.freeze({
${registryEntries}
});

function normalizeSlug(slug = "") {
  return String(slug || "").trim().toLowerCase();
}

/**
 * @param {string} slug
 * @returns {boolean}
 */
export function hasGeneratedTier1Definition(slug = "") {
  const key = normalizeSlug(slug);
  return Boolean(key && GENERATED_TIER1_DEFINITIONS[key]);
}

/**
 * @param {string} slug
 * @returns {object | null}
 */
export function loadGeneratedTier1Definition(slug = "") {
  const key = normalizeSlug(slug);
  return GENERATED_TIER1_DEFINITIONS[key] || null;
}

export function listGeneratedTier1DefinitionSlugs() {
  return Object.keys(GENERATED_TIER1_DEFINITIONS).sort();
}

export function getGeneratedTier1Definition(slug = "") {
  return loadGeneratedTier1Definition(slug);
}

export { GENERATED_TIER1_DEFINITIONS };
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
    const definition = goldenDossierToTier1Definition(dossier);
    const outPath = path.join(OUT_DIR, `${familySlug}.js`);
    fs.writeFileSync(outPath, serializeTier1Module(definition), "utf8");
    written.push(familySlug);
  }

  writeIndex(written.sort((a, b) => a.localeCompare(b)));

  console.log(
    `Generated ${written.length} tier-1 definition module(s) → ${OUT_DIR}`
  );
}

main();
