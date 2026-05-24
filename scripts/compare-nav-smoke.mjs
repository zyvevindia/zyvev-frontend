/**
 * Smoke tests for unified Compare navbar routing.
 */
import assert from "node:assert/strict";

import {
  COMPARE_DISCOVERY_PATH,
  COMPARE_HUB_PATH,
  getCompareNavDestinationFromCount,
  isCompareNavActive,
} from "../src/utils/compareNavTargets.js";

function ok(label, fn) {
  try {
    fn();
    console.log(`  ok ${label}`);
  } catch (err) {
    console.error(`  FAIL ${label}:`, err.message);
    process.exitCode = 1;
  }
}

console.log("compare-nav-smoke");

ok("0 selections → discovery (matches Home body CTA)", () => {
  assert.equal(getCompareNavDestinationFromCount(0), COMPARE_DISCOVERY_PATH);
  assert.equal(COMPARE_DISCOVERY_PATH, "/cars?compareMode=true");
});

ok("1 selection → compare hub", () => {
  assert.equal(getCompareNavDestinationFromCount(1), COMPARE_HUB_PATH);
});

ok("2+ selections → compare hub", () => {
  assert.equal(getCompareNavDestinationFromCount(2), COMPARE_HUB_PATH);
});

ok("active on /compare", () => {
  assert.equal(isCompareNavActive("/compare"), true);
});

ok("active on /cars?compareMode=true", () => {
  assert.equal(isCompareNavActive("/cars", "?compareMode=true"), true);
});

ok("inactive on plain /cars browse", () => {
  assert.equal(isCompareNavActive("/cars", ""), false);
});

if (process.exitCode) {
  console.error("\ncompare-nav-smoke FAILED");
  process.exit(1);
}

console.log("\ncompare-nav-smoke passed");
