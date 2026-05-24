/**
 * Smoke tests for compare state hydration (malformed localStorage shapes).
 */
import assert from "node:assert/strict";

import {
  ensureArray,
  normalizeComparePairs,
} from "../src/utils/compareArrayUtils.js";

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

ok("null -> []", () => {
  assert.deepEqual(ensureArray(null), []);
});

ok("undefined -> []", () => {
  assert.deepEqual(ensureArray(undefined), []);
});

ok("object {} -> []", () => {
  assert.deepEqual(ensureArray({}), []);
});

ok('string "{}" -> []', () => {
  assert.deepEqual(ensureArray("{}"), []);
});

ok("non-array number -> []", () => {
  assert.deepEqual(ensureArray(42), []);
});

ok("indexed object with car-like values", () => {
  const out = ensureArray({
    0: { slug: "tata-nexon-ev", _id: "tata-nexon-ev", name: "Nexon" },
  });
  assert.equal(out.length, 1);
});

ok("(value || []).slice pattern safe via ensureArray", () => {
  const corrupted = { pairSlug: "a-vs-b" };
  const sliced = ensureArray(corrupted).slice(0, 10);
  assert.deepEqual(sliced, []);
});

ok("normalizeComparePairs filters objects only", async () => {
  const { normalizeComparePairs } = await import(
    "../src/utils/compareArrayUtils.js"
  );
  assert.equal(normalizeComparePairs({ a: 1 }).length, 0);
  assert.equal(
    normalizeComparePairs([{ pairSlug: "a-vs-b" }]).length,
    1
  );
});

if (process.exitCode) {
  console.error("\ncompare-hydration-smoke FAILED");
  process.exit(1);
}

console.log("\ncompare-hydration-smoke passed");
