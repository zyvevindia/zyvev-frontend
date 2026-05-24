/**
 * Full Node env bootstrap — dotenv + Cloudinary normalization.
 * Call after bootstrapEnv.mjs (or via loadNodeEnv).
 */

import { normalizeCloudinaryEnv } from "./cloudinaryEnv.js";
import {
  findProjectRoot,
  getNodeEnvCoreLoadResult,
  isNodeEnvCoreLoaded,
  loadNodeEnvCore,
} from "./loadNodeEnvCore.js";

let cloudinaryNormalized = false;

/**
 * @param {{ root?: string, force?: boolean, diagnostics?: boolean }} [options]
 */
export function loadNodeEnv(options = {}) {
  const coreResult = isNodeEnvCoreLoaded() && !options.force
    ? getNodeEnvCoreLoadResult()
    : loadNodeEnvCore(options);

  if (!cloudinaryNormalized || options.force) {
    normalizeCloudinaryEnv();
    cloudinaryNormalized = true;
  }

  return coreResult;
}

export { findProjectRoot, getNodeEnvCoreLoadResult as getNodeEnvLoadResult, isNodeEnvCoreLoaded as isNodeEnvLoaded };
