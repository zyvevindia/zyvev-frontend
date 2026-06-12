/**
 * AUTO-GENERATED — do not edit manually.
 * Regenerate: npm run catalog:generate-verified
 */

import * as dossier_bmw_ix1 from "./bmw-ix1.js";
import * as dossier_byd_atto_3 from "./byd-atto-3.js";
import * as dossier_byd_seal from "./byd-seal.js";
import * as dossier_citroen_ec3 from "./citroen-ec3.js";
import * as dossier_hyundai_creta_electric from "./hyundai-creta-electric.js";
import * as dossier_hyundai_ioniq_5 from "./hyundai-ioniq-5.js";
import * as dossier_hyundai_kona_electric from "./hyundai-kona-electric.js";
import * as dossier_kia_ev6 from "./kia-ev6.js";
import * as dossier_mahindra_be_6 from "./mahindra-be-6.js";
import * as dossier_mahindra_xev_9e from "./mahindra-xev-9e.js";
import * as dossier_mahindra_xuv400 from "./mahindra-xuv400.js";
import * as dossier_maruti_e_vitara from "./maruti-e-vitara.js";
import * as dossier_mercedes_eqa from "./mercedes-eqa.js";
import * as dossier_mercedes_eqb from "./mercedes-eqb.js";
import * as dossier_mg_comet_ev from "./mg-comet-ev.js";
import * as dossier_mg_windsor_ev from "./mg-windsor-ev.js";
import * as dossier_mg_zs_ev from "./mg-zs-ev.js";
import * as dossier_mini_cooper_se from "./mini-cooper-se.js";
import * as dossier_tata_curvv_ev from "./tata-curvv-ev.js";
import * as dossier_tata_harrier_ev from "./tata-harrier-ev.js";
import * as dossier_tata_nexon_ev from "./tata-nexon-ev.js";
import * as dossier_tata_punch_ev from "./tata-punch-ev.js";
import * as dossier_tata_tiago_ev from "./tata-tiago-ev.js";
import * as dossier_tata_tigor_ev from "./tata-tigor-ev.js";
import * as dossier_volvo_ex40 from "./volvo-ex40.js";

const GENERATED_DOSSIERS = Object.freeze({
  "bmw-ix1": dossier_bmw_ix1,
  "byd-atto-3": dossier_byd_atto_3,
  "byd-seal": dossier_byd_seal,
  "citroen-ec3": dossier_citroen_ec3,
  "hyundai-creta-electric": dossier_hyundai_creta_electric,
  "hyundai-ioniq-5": dossier_hyundai_ioniq_5,
  "hyundai-kona-electric": dossier_hyundai_kona_electric,
  "kia-ev6": dossier_kia_ev6,
  "mahindra-be-6": dossier_mahindra_be_6,
  "mahindra-xev-9e": dossier_mahindra_xev_9e,
  "mahindra-xuv400": dossier_mahindra_xuv400,
  "maruti-e-vitara": dossier_maruti_e_vitara,
  "mercedes-eqa": dossier_mercedes_eqa,
  "mercedes-eqb": dossier_mercedes_eqb,
  "mg-comet-ev": dossier_mg_comet_ev,
  "mg-windsor-ev": dossier_mg_windsor_ev,
  "mg-zs-ev": dossier_mg_zs_ev,
  "mini-cooper-se": dossier_mini_cooper_se,
  "tata-curvv-ev": dossier_tata_curvv_ev,
  "tata-harrier-ev": dossier_tata_harrier_ev,
  "tata-nexon-ev": dossier_tata_nexon_ev,
  "tata-punch-ev": dossier_tata_punch_ev,
  "tata-tiago-ev": dossier_tata_tiago_ev,
  "tata-tigor-ev": dossier_tata_tigor_ev,
  "volvo-ex40": dossier_volvo_ex40,
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
