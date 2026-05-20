/**
 * Soft Launch Execution + Validation smoke checks.
 */
import { buildLeadRoutingPlan } from "../src/utils/leadRouting.js";
import { buildContentOpsSummary } from "../src/intelligence/contentOpsAudit.js";
import { ANALYTICS_EVENTS } from "../src/analytics/events.js";

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const routing = buildLeadRoutingPlan({
  city: "Mumbai",
  state: "Maharashtra",
  familySlug: "tata-nexon-ev",
  brand: "Tata",
});
assert("lead routing plan", routing.plan.dealerId != null);
assert("routing log", routing.log.length > 0);

const ops = buildContentOpsSummary([
  {
    slug: "tata-nexon-ev",
    name: "Tata Nexon EV",
    startingPrice: 1499000,
    specifications: { range: 465, batteryPack: "40.5 kWh" },
    catalogMeta: {},
  },
]);
assert("content ops summary", ops.totalVehicles === 1);
assert("content ops block", ops.contentOps != null);

assert("analytics compare abandoned", ANALYTICS_EVENTS.COMPARE_ABANDONED != null);
assert("analytics usefulness", ANALYTICS_EVENTS.USEFULNESS_FEEDBACK != null);
assert("analytics lead abandon", ANALYTICS_EVENTS.LEAD_FORM_ABANDONED != null);

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll soft-launch smoke checks passed.");
