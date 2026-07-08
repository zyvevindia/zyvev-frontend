/**
 * Lead journey smoke — API + frontend wiring (no browser).
 * Run: npm run lead:journey:smoke
 * Live API: npm run lead:journey:smoke -- --live
 */
import "./lib/bootstrapEnv.mjs";

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLeadRoutingPlan } from "../src/utils/leadRouting.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = process.argv.includes("--live");

const API_URL =
  process.env.VITE_API_URL ||
  process.env.LEAD_SMOKE_API_URL ||
  "https://evsavari-api.onrender.com";

let failed = 0;

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed += 1;
}

function assert(name, condition) {
  if (condition) {
    ok(name);
  } else {
    fail(name);
  }
}

function uniquePhone() {
  const suffix = String(Date.now()).slice(-8);
  return `98${suffix}`;
}

async function postLead(body) {
  const res = await fetch(`${API_URL}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, ok: res.ok };
}

function checkFrontendWiring() {
  const modalPath = join(ROOT, "src/components/LeadInquiryModal.jsx");
  const apiPath = join(ROOT, "src/services/leadSubmitApi.js");

  assert("LeadInquiryModal exists", existsSync(modalPath));
  assert("leadSubmitApi exists", existsSync(apiPath));

  const modal = readFileSync(modalPath, "utf8");
  assert(
    "LeadInquiryModal uses submitBuyerLead",
    modal.includes("submitBuyerLead")
  );
  assert(
    "LeadInquiryModal wires TurnstileWidget",
    modal.includes("TurnstileWidget") && modal.includes("turnstileToken")
  );
  assert(
    "Lead form has data-testid hooks",
    modal.includes('data-testid="lead-inquiry-form"')
  );

  const api = readFileSync(apiPath, "utf8");
  assert(
    "leadSubmitApi asserts Turnstile when configured",
    api.includes("assertTurnstileToken")
  );
}

function checkRouting() {
  const plan = buildLeadRoutingPlan({
    city: "Gurgaon",
    state: "Haryana",
    familySlug: "tata-nexon-ev",
    brand: "Tata",
    vehicleName: "Tata Nexon EV",
  });

  assert(
    "Gurgaon routes to pilot-ncr-01",
    plan.plan.dealerId === "pilot-ncr-01"
  );
  assert(
    "Gurgaon lead status is routed_city",
    plan.plan.leadStatusTag === "routed_city"
  );
}

async function checkLiveApi() {
  console.log("\n--- live API probes ---\n");
  console.log(`API_URL=${API_URL}`);

  const invalid = await postLead({
    name: "Smoke Test",
    phone: "123",
    city: "Gurgaon",
    state: "Haryana",
    message: "invalid phone test",
    vehicleName: "Tata Nexon EV",
    sourcePage: "/lead-smoke",
    leadSource: "form",
  });
  const phoneError =
    invalid.data?.errors?.phone ||
    (Array.isArray(invalid.data?.errors)
      ? invalid.data.errors.find((e) => /mobile|phone/i.test(String(e)))
      : null);
  assert(
    "invalid phone rejected (400)",
    invalid.status === 400 && Boolean(phoneError)
  );

  const phone = uniquePhone();
  const ts = Date.now();

  const first = await postLead({
    name: "MVP02 Journey Smoke",
    phone,
    email: `lead-smoke-${ts}@evsavari.test`,
    city: "Gurgaon",
    state: "Haryana",
    message: "MVP-02 lead journey smoke — safe to delete",
    vehicleName: "Tata Nexon EV",
    sourcePage: "/lead-smoke",
    leadSource: "form",
    assignedDealerId: "pilot-ncr-01",
    leadStatus: "routed_city",
    leadMetadata: { smokeTest: true, runId: ts },
  });

  assert("first lead accepted (201)", first.status === 201);
  assert("first lead returns leadId", Boolean(first.data?.leadId));
  console.log(
    `  leadId=${first.data?.leadId} merged=${first.data?.merged}`
  );

  const duplicate = await postLead({
    name: "MVP02 Journey Smoke Dup",
    phone,
    email: `lead-smoke-dup-${ts}@evsavari.test`,
    city: "Gurgaon",
    state: "Haryana",
    message: "duplicate probe",
    vehicleName: "Tata Nexon EV",
    sourcePage: "/lead-smoke",
    leadSource: "form",
  });

  assert("duplicate submit returns 201", duplicate.status === 201);
  assert(
    "duplicate suppression returns merged:true",
    duplicate.data?.merged === true
  );

  const dealerToken = process.env.LEAD_SMOKE_DEALER_TOKEN || "";
  if (dealerToken) {
    const dealerRes = await fetch(`${API_URL}/api/dealer/leads`, {
      headers: { Authorization: `Bearer ${dealerToken}` },
    });
    const dealerData = await dealerRes.json().catch(() => ({}));
    assert(
      "dealer leads endpoint reachable",
      dealerRes.ok && Array.isArray(dealerData?.leads ?? dealerData)
    );
  } else {
    ok("dealer leads probe skipped (set LEAD_SMOKE_DEALER_TOKEN to enable)");
  }

  const salesToken = process.env.LEAD_SMOKE_SALES_TOKEN || "";
  if (salesToken) {
    const salesRes = await fetch(`${API_URL}/api/sales/leads`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    const salesData = await salesRes.json().catch(() => ({}));
    assert(
      "sales CRM leads endpoint reachable",
      salesRes.ok && Array.isArray(salesData?.leads ?? salesData)
    );
  } else {
    ok("sales CRM probe skipped (set LEAD_SMOKE_SALES_TOKEN to enable)");
  }
}

async function main() {
  console.log("\n=== lead journey smoke ===\n");

  checkFrontendWiring();
  checkRouting();

  if (LIVE) {
    await checkLiveApi();
  } else {
    ok("live API probes skipped (pass --live to run against production API)");
  }

  console.log(`\n=== result: ${failed ? "FAILED" : "PASSED"} (${failed} failures) ===\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
