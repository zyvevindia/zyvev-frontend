/**
 * Browser golden catalog loader for Score 2.0 profiles.
 */

import { loadGoldenDossierByFamilySlug } from "../catalogAcquisition/benchmark/goldenLoader.js";
import { dossierToIntelligenceCar } from "./dossierToIntelligenceCar.js";

/**
 * @param {string} slug
 * @returns {Promise<{ intelligenceCar: object, variants: object[] }|null>}
 */
export async function loadIntelligenceCarForSlugAsync(slug) {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;

  const result = await loadGoldenDossierByFamilySlug(key);
  if (!result?.dossier) return null;

  return {
    intelligenceCar: dossierToIntelligenceCar(result.dossier),
    variants: result.dossier.variants || [],
  };
}
