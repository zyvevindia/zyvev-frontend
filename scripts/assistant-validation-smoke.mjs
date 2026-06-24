#!/usr/bin/env node
/**
 * Smoke checks for assistant validation reporting.
 */
import "./lib/bootstrapEnv.mjs";
import {
  generateContradictoryScenarios,
  generateFullValidationMatrix,
  runAssistantValidationAudit,
} from "./lib/assistantValidation.mjs";

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

console.log("Assistant validation smoke\n");

const matrix = generateFullValidationMatrix();
assert("full matrix has 720 scenarios", matrix.length === 720);

const contradictory = generateContradictoryScenarios();
assert("at least 25 contradictory scenarios", contradictory.length >= 25);

const audit = runAssistantValidationAudit();
assert("audit generates readiness scores", Boolean(audit.readiness?.overall));
assert("audit matrix count matches generator", audit.stats.matrixCount === 720);
assert("audit has diversity table", audit.diversity.table.length === 25);
assert("audit has archetype focused results", Object.keys(audit.archetypes.focused).length === 7);
assert("audit markdown generated", audit.markdown.includes("## Recommendation Diversity"));

console.log(`\nReadiness: ${audit.readiness.overall}`);
console.log(`Budget anomalies: ${audit.stats.budgetAnomalyCount}`);

if (failed) {
  console.error(`\nAssistant validation smoke: ${failed} failure(s)`);
  process.exit(1);
}

console.log("\nAssistant validation smoke: PASS");
