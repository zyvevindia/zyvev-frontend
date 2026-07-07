/**
 * Browser-safe sync golden dataset loader (bundled from public/catalog/golden-dataset/).
 * Mirrors goldenLoaderNode.js for client builds — no fs, path, or node:url.
 */

import goldenManifest from "../../../public/catalog/golden-dataset/manifest.json";

const bundledGoldenDossiers = import.meta.glob(
  "../../../public/catalog/golden-dataset/vehicles/*.json",
  { eager: true, import: "default" }
);

function resolveBundledGoldenDossier(goldenId) {
  const suffix = `/vehicles/${goldenId}.json`;
  const key = Object.keys(bundledGoldenDossiers).find((path) =>
    path.replace(/\\/g, "/").endsWith(suffix)
  );
  return key ? bundledGoldenDossiers[key] : null;
}

export function loadGoldenManifest() {
  return goldenManifest;
}

export function loadGoldenDossier(goldenId) {
  const dossier = resolveBundledGoldenDossier(goldenId);
  if (!dossier) throw new Error(`Golden dossier not found: ${goldenId}`);
  return dossier;
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
  const key = String(familySlug || "").trim().toLowerCase();
  const entry = (manifest.vehicles || []).find(
    (v) => String(v.familySlug || "").trim().toLowerCase() === key
  );
  if (!entry) return null;
  return loadGoldenDossier(entry.id);
}
