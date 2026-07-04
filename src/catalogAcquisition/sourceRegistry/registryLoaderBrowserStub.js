/**
 * Browser build stub — registry filesystem loader is Node-only.
 * Acquisition pipelines that need the registry run on the server, not in the client bundle.
 */

export function getDefaultRegistryPath() {
  return "/catalog/source-registry.json";
}

export function loadDefaultRegistry() {
  return [];
}

export function loadRegistryEntry() {
  return null;
}

export function listRegistryEntries() {
  return [];
}

export {
  normalizeRegistryEntry,
  registryEntryToRow,
} from "./registryNormalize.js";
