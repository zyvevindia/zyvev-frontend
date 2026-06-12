/**
 * Generate public/catalog/golden-dataset/manifest.json from vehicle dossiers.
 */

import fs from "node:fs";

import {
  PUBLIC_MANIFEST,
  PUBLIC_VEHICLES,
  buildManifestEntry,
  readJson,
  readVehicleDossiers,
} from "./lib/goldenCatalogPaths.mjs";

function existingVehicleOrder() {
  if (!fs.existsSync(PUBLIC_MANIFEST)) return [];

  const manifest = readJson(PUBLIC_MANIFEST);
  if (!Array.isArray(manifest.vehicles)) return [];

  return manifest.vehicles.map((entry) => entry.id || entry.familySlug).filter(Boolean);
}

function main() {
  const dossiers = readVehicleDossiers(PUBLIC_VEHICLES);
  const entryById = new Map();

  for (const { familySlug, dossier } of dossiers) {
    const entry = buildManifestEntry(dossier, familySlug);
    entryById.set(entry.id, entry);
  }

  const priorOrder = existingVehicleOrder();
  const orderedIds = [];
  const seen = new Set();

  for (const id of priorOrder) {
    if (entryById.has(id) && !seen.has(id)) {
      orderedIds.push(id);
      seen.add(id);
    }
  }

  const remaining = [...entryById.keys()]
    .filter((id) => !seen.has(id))
    .sort((a, b) => a.localeCompare(b));

  for (const id of remaining) {
    orderedIds.push(id);
  }

  const vehicles = orderedIds.map((id) => entryById.get(id));
  const manifest = {
    version: "golden-v1",
    generatedAt: new Date().toISOString(),
    count: vehicles.length,
    vehicles,
  };

  fs.writeFileSync(PUBLIC_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    `Wrote manifest with ${vehicles.length} vehicle(s) → ${PUBLIC_MANIFEST}`,
  );
}

main();
