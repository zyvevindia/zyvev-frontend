/**
 * AUTO-GENERATED — do not edit manually.
 * Regenerate: npm run catalog:generate-tier1
 */

import { TIER1_DEFINITION as tier1_bmw_ix1 } from "./bmw-ix1.js";
import { TIER1_DEFINITION as tier1_byd_atto_3 } from "./byd-atto-3.js";
import { TIER1_DEFINITION as tier1_byd_seal } from "./byd-seal.js";
import { TIER1_DEFINITION as tier1_citroen_ec3 } from "./citroen-ec3.js";
import { TIER1_DEFINITION as tier1_hyundai_creta_electric } from "./hyundai-creta-electric.js";
import { TIER1_DEFINITION as tier1_hyundai_ioniq_5 } from "./hyundai-ioniq-5.js";
import { TIER1_DEFINITION as tier1_hyundai_kona_electric } from "./hyundai-kona-electric.js";
import { TIER1_DEFINITION as tier1_kia_ev6 } from "./kia-ev6.js";
import { TIER1_DEFINITION as tier1_mahindra_be_6 } from "./mahindra-be-6.js";
import { TIER1_DEFINITION as tier1_mahindra_xev_9e } from "./mahindra-xev-9e.js";
import { TIER1_DEFINITION as tier1_mahindra_xuv400 } from "./mahindra-xuv400.js";
import { TIER1_DEFINITION as tier1_maruti_e_vitara } from "./maruti-e-vitara.js";
import { TIER1_DEFINITION as tier1_mercedes_eqa } from "./mercedes-eqa.js";
import { TIER1_DEFINITION as tier1_mercedes_eqb } from "./mercedes-eqb.js";
import { TIER1_DEFINITION as tier1_mg_comet_ev } from "./mg-comet-ev.js";
import { TIER1_DEFINITION as tier1_mg_windsor_ev } from "./mg-windsor-ev.js";
import { TIER1_DEFINITION as tier1_mg_zs_ev } from "./mg-zs-ev.js";
import { TIER1_DEFINITION as tier1_mini_cooper_se } from "./mini-cooper-se.js";
import { TIER1_DEFINITION as tier1_tata_curvv_ev } from "./tata-curvv-ev.js";
import { TIER1_DEFINITION as tier1_tata_harrier_ev } from "./tata-harrier-ev.js";
import { TIER1_DEFINITION as tier1_tata_nexon_ev } from "./tata-nexon-ev.js";
import { TIER1_DEFINITION as tier1_tata_punch_ev } from "./tata-punch-ev.js";
import { TIER1_DEFINITION as tier1_tata_tiago_ev } from "./tata-tiago-ev.js";
import { TIER1_DEFINITION as tier1_tata_tigor_ev } from "./tata-tigor-ev.js";
import { TIER1_DEFINITION as tier1_volvo_ex40 } from "./volvo-ex40.js";

const GENERATED_TIER1_DEFINITIONS = Object.freeze({
  "bmw-ix1": tier1_bmw_ix1,
  "byd-atto-3": tier1_byd_atto_3,
  "byd-seal": tier1_byd_seal,
  "citroen-ec3": tier1_citroen_ec3,
  "hyundai-creta-electric": tier1_hyundai_creta_electric,
  "hyundai-ioniq-5": tier1_hyundai_ioniq_5,
  "hyundai-kona-electric": tier1_hyundai_kona_electric,
  "kia-ev6": tier1_kia_ev6,
  "mahindra-be-6": tier1_mahindra_be_6,
  "mahindra-xev-9e": tier1_mahindra_xev_9e,
  "mahindra-xuv400": tier1_mahindra_xuv400,
  "maruti-e-vitara": tier1_maruti_e_vitara,
  "mercedes-eqa": tier1_mercedes_eqa,
  "mercedes-eqb": tier1_mercedes_eqb,
  "mg-comet-ev": tier1_mg_comet_ev,
  "mg-windsor-ev": tier1_mg_windsor_ev,
  "mg-zs-ev": tier1_mg_zs_ev,
  "mini-cooper-se": tier1_mini_cooper_se,
  "tata-curvv-ev": tier1_tata_curvv_ev,
  "tata-harrier-ev": tier1_tata_harrier_ev,
  "tata-nexon-ev": tier1_tata_nexon_ev,
  "tata-punch-ev": tier1_tata_punch_ev,
  "tata-tiago-ev": tier1_tata_tiago_ev,
  "tata-tigor-ev": tier1_tata_tigor_ev,
  "volvo-ex40": tier1_volvo_ex40,
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
