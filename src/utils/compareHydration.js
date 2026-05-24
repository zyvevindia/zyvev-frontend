/**
 * Compare state hydration — normalize persisted selections for UI/runtime safety.
 */

export {
  ensureArray,
  safeSlice,
  safeMap,
  safeFilter,
  safeFlatMap,
  normalizeComparePairs,
  warnCompareShape,
} from "./compareArrayUtils.js";

import { ensureArray } from "./compareArrayUtils.js";
import {
  sanitizeCompareList,
  loadCompareCarsFromStorage,
} from "./compareCarsStorage.js";

/** Legacy localStorage keys from older builds */
export const LEGACY_COMPARE_STORAGE_KEYS = [
  "compareSelections",
  "compareList",
  "compareQueue",
  "compareState",
  "evsavari:compare-cars",
];

/**
 * @param {unknown} raw
 * @returns {object[]}
 */
export function normalizeCompareSelections(raw) {
  return sanitizeCompareList(
    ensureArray(raw, { label: "compareSelections", subsystem: "storage" })
  );
}

/** @param {unknown} raw @returns {object[]} */
export function normalizeCompareState(raw) {
  return normalizeCompareSelections(raw);
}

/** @returns {object[]} */
export function loadCompareState() {
  return loadCompareCarsFromStorage();
}

/** @returns {object[]} */
export function migrateLegacyCompareStorage() {
  return loadCompareCarsFromStorage();
}
