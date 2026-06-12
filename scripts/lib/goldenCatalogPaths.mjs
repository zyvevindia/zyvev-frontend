import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

export const PUBLIC_GOLDEN = path.join(REPO_ROOT, "public/catalog/golden-dataset");
export const DOCS_GOLDEN = path.join(REPO_ROOT, "docs/catalog/golden-dataset");
export const PUBLIC_VEHICLES = path.join(PUBLIC_GOLDEN, "vehicles");
export const DOCS_VEHICLES = path.join(DOCS_GOLDEN, "vehicles");
export const PUBLIC_MANIFEST = path.join(PUBLIC_GOLDEN, "manifest.json");
export const DOCS_MANIFEST = path.join(DOCS_GOLDEN, "manifest.json");
export const PHASE0_REPORT_MD = path.join(REPO_ROOT, "docs/catalog/catalog-phase0-report.md");
export const PHASE0_REPORT_JSON = path.join(REPO_ROOT, "docs/catalog/catalog-phase0-report.json");

export function listGoldenFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  const files = [];
  const walk = (dir, prefix = "") => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, rel);
      } else {
        files.push(rel.replace(/\\/g, "/"));
      }
    }
  };
  walk(rootDir);
  return files.sort();
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function readVehicleDossiers(vehiclesDir = PUBLIC_VEHICLES) {
  if (!fs.existsSync(vehiclesDir)) return [];

  return fs
    .readdirSync(vehiclesDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(vehiclesDir, name);
      const dossier = readJson(filePath);
      const familySlug = name.replace(/\.json$/, "");
      return { familySlug, filePath, dossier };
    });
}

export function countMediaUrls(media) {
  if (!media || typeof media !== "object") return 0;

  const urls = new Set();
  for (const [key, value] of Object.entries(media)) {
    if (key === "source") continue;
    if (typeof value === "string" && value.trim()) {
      urls.add(value.trim());
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) urls.add(item.trim());
      }
    }
  }
  return urls.size;
}

export function dossierUpdatedAt(dossier) {
  return (
    dossier.verifiedAt ||
    dossier.populationMeta?.qualityConsolidationAt ||
    dossier.updatedAt ||
    null
  );
}

export function buildManifestEntry(dossier, familySlug) {
  const variants = Array.isArray(dossier.variants) ? dossier.variants : [];
  const brand =
    dossier.fields?.brand ||
    dossier.vehicle?.brand ||
    null;

  return {
    id: dossier.id || familySlug,
    displayName:
      dossier.displayName ||
      [brand, dossier.vehicle?.model || dossier.fields?.model]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      familySlug,
    familySlug: dossier.familySlug || dossier.vehicle?.familySlug || familySlug,
    brand,
    variantCount: variants.length,
    verificationLevel: dossier.verificationLevel || "manual_review",
    mediaCount: countMediaUrls(dossier.media),
    updatedAt: dossierUpdatedAt(dossier),
    sources: Array.isArray(dossier.sources) ? dossier.sources : [],
  };
}

export function normalizeJsonForCompare(value) {
  return JSON.stringify(value);
}
