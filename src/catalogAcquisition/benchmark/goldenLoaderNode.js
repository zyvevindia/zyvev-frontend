/**
 * Node.js golden dataset loader (reads from docs/catalog/golden-dataset/).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_ROOT = path.resolve(__dirname, "../../../docs/catalog/golden-dataset");

export function loadGoldenManifest() {
  const raw = fs.readFileSync(path.join(GOLDEN_ROOT, "manifest.json"), "utf8");
  return JSON.parse(raw);
}

export function loadGoldenDossier(goldenId) {
  const file = path.join(GOLDEN_ROOT, "vehicles", `${goldenId}.json`);
  if (!fs.existsSync(file)) throw new Error(`Golden dossier not found: ${goldenId}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function loadAllGoldenDossiers() {
  const manifest = loadGoldenManifest();
  return (manifest.vehicles || []).map((v) => ({
    entry: v,
    dossier: loadGoldenDossier(v.id),
  }));
}

export function findGoldenDossierByFamilySlug(familySlug) {
  const manifest = loadGoldenManifest();
  const entry = (manifest.vehicles || []).find((v) => v.familySlug === familySlug);
  if (!entry) return null;
  return loadGoldenDossier(entry.id);
}
