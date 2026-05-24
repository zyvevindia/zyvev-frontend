/**
 * Analytics layer smoke test (no network).
 * Run: npm run ops:analytics-smoke
 */

import "./lib/bootstrapEnv.mjs";

import { ANALYTICS_EVENTS } from "../src/analytics/events.js";
import { shouldEmitEvent } from "../src/analytics/dedupe.js";

let failed = 0;

function check(name, condition) {
  if (!condition) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

check(
  "events defined",
  Boolean(ANALYTICS_EVENTS.COMPARE_STARTED) &&
    Boolean(ANALYTICS_EVENTS.LEAD_SUBMITTED)
);

check(
  "intelligence events defined",
  Boolean(ANALYTICS_EVENTS.CHARGING_SECTION_VIEWED) &&
    Boolean(ANALYTICS_EVENTS.OWNERSHIP_INSIGHT_VIEWED) &&
    Boolean(ANALYTICS_EVENTS.FEATURE_COMPARISON_VIEWED)
);

check(
  "dedupe blocks rapid duplicate",
  shouldEmitEvent("test", "a") && !shouldEmitEvent("test", "a")
);

check(
  "dedupe allows different keys",
  shouldEmitEvent("test", "b")
);

if (failed) {
  process.exit(1);
}

console.log("\nAnalytics smoke checks passed.");
