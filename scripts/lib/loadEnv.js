/**
 * @deprecated Prefer `import "./lib/bootstrapEnv.mjs"` as the first script import.
 */
export {
  loadNodeEnv,
  findProjectRoot,
  isNodeEnvLoaded,
  getNodeEnvLoadResult,
} from "../../src/backend/env/loadNodeEnv.js";

import { loadNodeEnv } from "../../src/backend/env/loadNodeEnv.js";

/** @param {string} [root] */
export function loadEnvFiles(root) {
  return loadNodeEnv(root ? { root } : {});
}
