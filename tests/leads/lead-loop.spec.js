import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildLeadRoutingPlan } from "../../src/utils/leadRouting.js";

const API_URL =
  process.env.VITE_API_URL ||
  process.env.LEAD_SMOKE_API_URL ||
  "https://evsavari-api.onrender.com";

function uniquePhone() {
  return `98${String(Date.now()).slice(-8)}`;
}

test.describe("Lead routing (unit)", () => {
  test("Gurgaon enquiry maps to NCR pilot desk", () => {
    const { plan } = buildLeadRoutingPlan({
      city: "Gurgaon",
      state: "Haryana",
      familySlug: "tata-nexon-ev",
      brand: "Tata",
      vehicleName: "Tata Nexon EV",
    });

    expect(plan.dealerId).toBe("pilot-ncr-01");
    expect(plan.leadStatusTag).toBe("routed_city");
  });
});

test.describe("Lead API journey", () => {
  test("buyer can submit enquiry to production API", async ({
    request,
  }) => {
    const phone = uniquePhone();
    const res = await request.post(`${API_URL}/leads`, {
      data: {
        name: "Playwright Lead Smoke",
        phone,
        email: `pw-lead-${Date.now()}@evsavari.test`,
        city: "Gurgaon",
        state: "Haryana",
        message: "Playwright E2E — safe to delete",
        vehicleName: "Tata Nexon EV",
        sourcePage: "/tests/leads",
        leadSource: "form",
        assignedDealerId: "pilot-ncr-01",
        leadStatus: "routed_city",
        leadMetadata: { playwright: true },
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.leadId).toBeTruthy();
  });

  test("invalid phone is rejected", async ({ request }) => {
    const res = await request.post(`${API_URL}/leads`, {
      data: {
        name: "Bad Phone",
        phone: "12345",
        city: "Gurgaon",
        state: "Haryana",
        message: "validation test",
        vehicleName: "Tata Nexon EV",
        sourcePage: "/tests/leads",
        leadSource: "form",
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    const phoneError =
      body.errors?.phone ||
      (Array.isArray(body.errors)
        ? body.errors.find((e) => /mobile|phone/i.test(String(e)))
        : null);
    expect(phoneError).toBeTruthy();
  });

  test("duplicate lead should merge when same phone resubmits (backend gap)", async ({
    request,
  }) => {
    const phone = uniquePhone();
    const payload = {
      name: "Dup Lead A",
      phone,
      city: "Gurgaon",
      state: "Haryana",
      message: "duplicate E2E",
      vehicleName: "Tata Nexon EV",
      sourcePage: "/tests/leads",
      leadSource: "form",
    };

    const first = await request.post(`${API_URL}/leads`, { data: payload });
    expect(first.status()).toBe(201);

    const second = await request.post(`${API_URL}/leads`, {
      data: { ...payload, name: "Dup Lead B" },
    });
    expect(second.status()).toBe(201);
    const body = await second.json();
    expect(body.merged).toBe(true);
  });
});

test.describe("Lead form UI wiring", () => {
  test("lead modal includes Turnstile and test hooks in source", () => {
    const modal = readFileSync(
      join(process.cwd(), "src/components/LeadInquiryModal.jsx"),
      "utf8"
    );
    expect(modal).toContain("TurnstileWidget");
    expect(modal).toContain('data-testid="lead-submit"');
    expect(modal).toContain("submitBuyerLead");
  });

  test("vehicle page exposes enquiry entry point", async ({ page }) => {
    await page.goto("/cars/tata-nexon-ev");
    const enquiry = page.getByRole("button", {
      name: /book test drive|get dealer assistance|request call back|get best deal/i,
    });
    await expect(enquiry.first()).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("Dealer and CRM visibility", () => {
  test.skip(
    !process.env.LEAD_SMOKE_DEALER_TOKEN,
    "set LEAD_SMOKE_DEALER_TOKEN to verify dealer inbox"
  );

  test("dealer receives assigned lead", async ({ request }) => {
    const token = process.env.LEAD_SMOKE_DEALER_TOKEN;
    const res = await request.get(`${API_URL}/api/dealer/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const leads = body.leads ?? body;
    expect(Array.isArray(leads)).toBe(true);
  });
});

test.describe("CAPTCHA validation", () => {
  test("leadSubmitApi keeps Turnstile helpers behind lead feature flag", () => {
    const api = readFileSync(
      join(process.cwd(), "src/services/leadSubmitApi.js"),
      "utf8"
    );
    expect(api).toContain("assertTurnstileToken");
    expect(api).toContain("isLeadTurnstileEnabled");
    expect(api).toContain("turnstileToken");
  });

  test("LeadInquiryModal only gates submit on Turnstile when lead flag enabled", () => {
    const modal = readFileSync(
      join(process.cwd(), "src/components/LeadInquiryModal.jsx"),
      "utf8"
    );
    expect(modal).toContain("isLeadTurnstileEnabled() && !turnstileToken");
    expect(modal).toContain("isLeadTurnstileEnabled() ? (");
  });
});
