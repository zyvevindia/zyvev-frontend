/**
 * Load golden dataset manifest and vehicle dossiers (browser fetch or Node fs).
 */

const MANIFEST_URL = "/catalog/golden-dataset/manifest.json";

export async function fetchGoldenManifest(baseUrl = "") {
  const url = `${baseUrl}${MANIFEST_URL}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Golden manifest fetch failed (${res.status})`);
  return res.json();
}

export async function fetchGoldenDossier(goldenId, baseUrl = "") {
  const res = await fetch(`${baseUrl}/catalog/golden-dataset/vehicles/${goldenId}.json`);
  if (!res.ok) throw new Error(`Golden dossier not found: ${goldenId}`);
  return res.json();
}

export async function loadGoldenDossierByFamilySlug(familySlug, baseUrl = "") {
  const manifest = await fetchGoldenManifest(baseUrl);
  const entry = (manifest.vehicles || []).find((v) => v.familySlug === familySlug);
  if (!entry) return null;
  const dossier = await fetchGoldenDossier(entry.id, baseUrl);
  return { entry, dossier };
}

export function resolveGoldenIdFromImport(record = {}) {
  const flat =
    record.reviewedVehicle?.vehicle?.familySlug?.value ??
    record.reviewedVehicle?.vehicle?.familySlug ??
    record.extractedVehicle?.vehicle?.familySlug?.value ??
    record.extractedVehicle?.vehicle?.familySlug ??
    record.evidenceSummary?.familySlug?.value ??
    null;
  return flat ? String(flat) : null;
}
