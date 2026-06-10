/**
 * Node simulated runners — load golden dossiers from disk.
 */
import { AGENT_IDS } from "./agentRegistry.js";
import {
  findGoldenDossierByFamilySlug,
  loadGoldenDossier,
} from "../../catalogAcquisition/benchmark/goldenLoaderNode.js";
import {
  runScoreEngineWithDossier,
  runVehicleCreationWithGolden,
  runChangeDetectionWithGolden,
  simulatedExecutor,
} from "./orchestratorSimulatedCore.js";

async function loadGolden(familySlug) {
  return (
    findGoldenDossierByFamilySlug(familySlug) ||
    loadGoldenDossier(familySlug)
  );
}

export async function runScoreEngineSimulated(input) {
  const familySlug = input.familySlug || input.id || "tata-nexon-ev";
  const dossier = input.dossier || (await loadGolden(familySlug));
  return runScoreEngineWithDossier(dossier);
}

export async function runVehicleCreationSimulated(input) {
  const familySlug = input.familySlug || "tata-nexon-ev";
  const golden = input.dossier || (await loadGolden(familySlug));
  return runVehicleCreationWithGolden(golden, input);
}

export async function runChangeDetectionSimulated(input) {
  const familySlug = input.familySlug || "tata-nexon-ev";
  const golden = input.dossier || (await loadGolden(familySlug));
  return runChangeDetectionWithGolden(golden, input);
}

export function createSimulatedRunners() {
  return {
    [AGENT_IDS.VEHICLE_CREATION]: runVehicleCreationSimulated,
    [AGENT_IDS.CHANGE_DETECTION]: runChangeDetectionSimulated,
    [AGENT_IDS.SCORE_ENGINE]: runScoreEngineSimulated,
  };
}

export function createSimulatedExecutors() {
  return {
    [AGENT_IDS.VEHICLE_CREATION]: simulatedExecutor,
    [AGENT_IDS.CHANGE_DETECTION]: simulatedExecutor,
    [AGENT_IDS.SCORE_ENGINE]: simulatedExecutor,
  };
}

export { simulatedExecutor };
