/**
 * Smoke tests for compare runtime normalization (malformed shapes + score insight).
 */
import assert from "node:assert/strict";

import {
  ensureArray,
  safeSlice,
  safeMap,
  normalizeComparePairs,
} from "../src/utils/compareArrayUtils.js";
import { buildCompareScoreInsight } from "../src/utils/compareConfidence.js";

function ok(label, fn) {
  try {
    fn();
    console.log(`  ok ${label}`);
  } catch (err) {
    console.error(`  FAIL ${label}:`, err.message);
    process.exitCode = 1;
  }
}

console.log("compare-hydration-smoke");

ok("null -> []", () => assert.deepEqual(ensureArray(null), []));
ok("undefined -> []", () => assert.deepEqual(ensureArray(undefined), []));
ok("object {} -> []", () => assert.deepEqual(ensureArray({}), []));
ok('string "{}" -> []', () => assert.deepEqual(ensureArray("{}"), []));
ok('string "abc" -> []', () => assert.deepEqual(ensureArray("abc"), []));
ok("non-array number -> []", () => assert.deepEqual(ensureArray(42), []));

ok("indexed object with car-like values", () => {
  const out = ensureArray({
    0: { slug: "tata-nexon-ev", _id: "tata-nexon-ev", name: "Nexon" },
  });
  assert.equal(out.length, 1);
});

ok("(value || []).slice pattern safe via safeSlice", () => {
  assert.deepEqual(safeSlice({}, 0, 10), []);
  assert.doesNotThrow(() => safeSlice({ pairSlug: "a-vs-b" }, 0, 10));
});

ok("malformed explanations object does not crash score insight", () => {
  const insight = buildCompareScoreInsight({
    evScores: { composite: 72, explanations: {} },
    catalogMeta: { confidence: "medium", dataQualityScore: 75 },
  });
  assert.equal(Array.isArray(insight.topFactors), true);
});

ok("malformed highlights object does not crash safeSlice join path", () => {
  const joined = safeSlice({ length: 2, 0: "a", 1: "b" }, 0, 4).join(" · ");
  assert.equal(typeof joined, "string");
});

ok("normalizeComparePairs filters objects only", () => {
  assert.equal(normalizeComparePairs({ a: 1 }).length, 0);
  assert.equal(normalizeComparePairs([{ pairSlug: "a-vs-b" }]).length, 1);
});

ok("safeMap on malformed strongestAdvantages", () => {
  const pills = safeMap({ foo: "bar" }, (x) => x, {
    label: "strongestAdvantages",
    subsystem: "test",
  });
  assert.equal(Array.isArray(pills), true);
});

if (process.exitCode) {
  console.error("\ncompare-hydration-smoke FAILED");
  process.exit(1);
}

console.log("\ncompare-hydration-smoke passed");
