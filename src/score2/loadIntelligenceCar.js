/**
 * Load enriched intelligence vehicles from the golden catalog (Node.js).
 */

import { findGoldenDossierByFamilySlug } from "../catalogAcquisition/benchmark/goldenLoaderNode.js";
import { dossierToIntelligenceCar } from "./dossierToIntelligenceCar.js";

/**
 * @param {string} slug
 * @returns {{ intelligenceCar: object, variants: object[] }|null}
 */
export function loadIntelligenceCarForSlug(slug) {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;

  const dossier = findGoldenDossierByFamilySlug(key);
  if (!dossier) return null;

  return {
    intelligenceCar: dossierToIntelligenceCar(dossier),
    variants: dossier.variants || [],
  };
}
