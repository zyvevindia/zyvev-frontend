/**
 * Compare navigation — storage-backed destination for navbar CTAs.
 */

import { loadCompareCarsFromStorage } from "./compareCarsStorage.js";

export {
  COMPARE_DISCOVERY_PATH,
  COMPARE_HUB_PATH,
  getCompareNavDestinationFromCount,
  isCompareNavActive,
} from "./compareNavTargets.js";

import { getCompareNavDestinationFromCount } from "./compareNavTargets.js";

/**
 * @returns {string}
 */
export function getCompareNavDestination() {
  return getCompareNavDestinationFromCount(loadCompareCarsFromStorage().length);
}
