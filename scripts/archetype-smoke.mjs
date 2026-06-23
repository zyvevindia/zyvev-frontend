/**
 * Buyer archetype foundation smoke checks (no browser).
 */
import { buildArchetypeNarrative } from "../src/recommendations/buildArchetypeNarrative.js";
import { BUYER_ARCHETYPE_ID_LIST } from "../src/recommendations/constants.js";
import {
  getBuyerArchetype,
  listBuyerArchetypes,
} from "../src/recommendations/archetypeRegistry.js";

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

/**
 * @param {import("../src/recommendations/types.js").BudgetRange|null} budgetRange
 * @returns {string}
 */
function formatBudgetRange(budgetRange) {
  if (!budgetRange) return "Flexible / not specified";

  if (budgetRange.openEnded) {
    return `₹${budgetRange.minLakh} lakh+`;
  }

  return `₹${budgetRange.minLakh}–${budgetRange.maxLakh} lakh`;
}

const archetypes = listBuyerArchetypes();

assert("registry returns seven archetypes", archetypes.length === 7);
assert(
  "registry ids match canonical list",
  BUYER_ARCHETYPE_ID_LIST.every((id) => Boolean(getBuyerArchetype(id)))
);

for (const archetype of archetypes) {
  assert(`${archetype.id} has title`, Boolean(archetype.title));
  assert(`${archetype.id} has description`, Boolean(archetype.description));
  assert(`${archetype.id} has priority`, Boolean(archetype.priority));
  assert(
    `${archetype.id} narrative present`,
    Boolean(buildArchetypeNarrative(archetype))
  );
}

console.log("\n=== Buyer Archetypes ===\n");

for (const archetype of archetypes) {
  console.log(`Name: ${archetype.title}`);
  console.log(`Budget: ${formatBudgetRange(archetype.budgetRange)}`);
  console.log(`Priority: ${archetype.priority}`);
  console.log(`Description: ${archetype.description}`);
  console.log(`Narrative: ${buildArchetypeNarrative(archetype)}`);
  console.log("");
}

if (failed > 0) {
  console.error(`\nArchetype smoke: FAIL (${failed} checks)`);
  process.exit(1);
}

console.log("Archetype smoke: PASS");
