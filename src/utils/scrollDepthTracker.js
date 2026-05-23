/**
 * Lightweight scroll-depth approximation for ops buffer (no PII).
 */

import { appendUsageLearningEvent } from "../ops/usageLearningBuffer.js";
import { getClientDeviceClass } from "../ops/analyticsMaturityOps.js";

const fired = new Set();

/**
 * @param {string} pageKey — e.g. compare, car_detail
 * @param {number[]} thresholds — percent depths 25,50,75
 */
export function attachScrollDepthTracker(pageKey, thresholds = [25, 50, 75]) {
  if (typeof window === "undefined") return () => {};

  const keyPrefix = `${pageKey}:`;
  const device = getClientDeviceClass();

  function onScroll() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const height = doc.scrollHeight - window.innerHeight;
    if (height <= 0) return;
    const pct = Math.round((scrollTop / height) * 100);

    for (const t of thresholds) {
      const id = `${keyPrefix}${t}`;
      if (pct >= t && !fired.has(id)) {
        fired.add(id);
        appendUsageLearningEvent({
          type: "scroll_depth",
          meta: { pageKey, percent: t, device },
        });
      }
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  return () => window.removeEventListener("scroll", onScroll);
}
