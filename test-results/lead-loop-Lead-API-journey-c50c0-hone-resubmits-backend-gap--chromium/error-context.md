# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lead-loop.spec.js >> Lead API journey >> duplicate lead should merge when same phone resubmits (backend gap)
- Location: tests\leads\lead-loop.spec.js:82:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  5   | 
  6   | const API_URL =
  7   |   process.env.VITE_API_URL ||
  8   |   process.env.LEAD_SMOKE_API_URL ||
  9   |   "https://evsavari-api.onrender.com";
  10  | 
  11  | function uniquePhone() {
  12  |   return `98${String(Date.now()).slice(-8)}`;
  13  | }
  14  | 
  15  | test.describe("Lead routing (unit)", () => {
  16  |   test("Gurgaon enquiry maps to NCR pilot desk", () => {
  17  |     const { plan } = buildLeadRoutingPlan({
  18  |       city: "Gurgaon",
  19  |       state: "Haryana",
  20  |       familySlug: "tata-nexon-ev",
  21  |       brand: "Tata",
  22  |       vehicleName: "Tata Nexon EV",
  23  |     });
  24  | 
  25  |     expect(plan.dealerId).toBe("pilot-ncr-01");
  26  |     expect(plan.leadStatusTag).toBe("routed_city");
  27  |   });
  28  | });
  29  | 
  30  | test.describe("Lead API journey", () => {
  31  |   test("buyer can submit enquiry to production API", async ({
  32  |     request,
  33  |   }) => {
  34  |     const phone = uniquePhone();
  35  |     const res = await request.post(`${API_URL}/leads`, {
  36  |       data: {
  37  |         name: "Playwright Lead Smoke",
  38  |         phone,
  39  |         email: `pw-lead-${Date.now()}@evsavari.test`,
  40  |         city: "Gurgaon",
  41  |         state: "Haryana",
  42  |         message: "Playwright E2E — safe to delete",
  43  |         vehicleName: "Tata Nexon EV",
  44  |         sourcePage: "/tests/leads",
  45  |         leadSource: "form",
  46  |         assignedDealerId: "pilot-ncr-01",
  47  |         leadStatus: "routed_city",
  48  |         leadMetadata: { playwright: true },
  49  |       },
  50  |     });
  51  | 
  52  |     expect(res.status()).toBe(201);
  53  |     const body = await res.json();
  54  |     expect(body.success).toBe(true);
  55  |     expect(body.leadId).toBeTruthy();
  56  |   });
  57  | 
  58  |   test("invalid phone is rejected", async ({ request }) => {
  59  |     const res = await request.post(`${API_URL}/leads`, {
  60  |       data: {
  61  |         name: "Bad Phone",
  62  |         phone: "12345",
  63  |         city: "Gurgaon",
  64  |         state: "Haryana",
  65  |         message: "validation test",
  66  |         vehicleName: "Tata Nexon EV",
  67  |         sourcePage: "/tests/leads",
  68  |         leadSource: "form",
  69  |       },
  70  |     });
  71  | 
  72  |     expect(res.status()).toBe(400);
  73  |     const body = await res.json();
  74  |     const phoneError =
  75  |       body.errors?.phone ||
  76  |       (Array.isArray(body.errors)
  77  |         ? body.errors.find((e) => /mobile|phone/i.test(String(e)))
  78  |         : null);
  79  |     expect(phoneError).toBeTruthy();
  80  |   });
  81  | 
  82  |   test("duplicate lead should merge when same phone resubmits (backend gap)", async ({
  83  |     request,
  84  |   }) => {
  85  |     const phone = uniquePhone();
  86  |     const payload = {
  87  |       name: "Dup Lead A",
  88  |       phone,
  89  |       city: "Gurgaon",
  90  |       state: "Haryana",
  91  |       message: "duplicate E2E",
  92  |       vehicleName: "Tata Nexon EV",
  93  |       sourcePage: "/tests/leads",
  94  |       leadSource: "form",
  95  |     };
  96  | 
  97  |     const first = await request.post(`${API_URL}/leads`, { data: payload });
  98  |     expect(first.status()).toBe(201);
  99  | 
  100 |     const second = await request.post(`${API_URL}/leads`, {
  101 |       data: { ...payload, name: "Dup Lead B" },
  102 |     });
  103 |     expect(second.status()).toBe(201);
  104 |     const body = await second.json();
> 105 |     expect(body.merged).toBe(true);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  106 |   });
  107 | });
  108 | 
  109 | test.describe("Lead form UI wiring", () => {
  110 |   test("lead modal includes Turnstile and test hooks in source", () => {
  111 |     const modal = readFileSync(
  112 |       join(process.cwd(), "src/components/LeadInquiryModal.jsx"),
  113 |       "utf8"
  114 |     );
  115 |     expect(modal).toContain("TurnstileWidget");
  116 |     expect(modal).toContain('data-testid="lead-submit"');
  117 |     expect(modal).toContain("submitBuyerLead");
  118 |   });
  119 | 
  120 |   test("vehicle page exposes enquiry entry point", async ({ page }) => {
  121 |     await page.goto("/cars/tata-nexon-ev");
  122 |     const enquiry = page.getByRole("button", {
  123 |       name: /book test drive|get dealer assistance|request call back|get best deal/i,
  124 |     });
  125 |     await expect(enquiry.first()).toBeVisible({ timeout: 20_000 });
  126 |   });
  127 | });
  128 | 
  129 | test.describe("Dealer and CRM visibility", () => {
  130 |   test.skip(
  131 |     !process.env.LEAD_SMOKE_DEALER_TOKEN,
  132 |     "set LEAD_SMOKE_DEALER_TOKEN to verify dealer inbox"
  133 |   );
  134 | 
  135 |   test("dealer receives assigned lead", async ({ request }) => {
  136 |     const token = process.env.LEAD_SMOKE_DEALER_TOKEN;
  137 |     const res = await request.get(`${API_URL}/api/dealer/leads`, {
  138 |       headers: { Authorization: `Bearer ${token}` },
  139 |     });
  140 |     expect(res.ok()).toBeTruthy();
  141 |     const body = await res.json();
  142 |     const leads = body.leads ?? body;
  143 |     expect(Array.isArray(leads)).toBe(true);
  144 |   });
  145 | });
  146 | 
  147 | test.describe("CAPTCHA validation", () => {
  148 |   test("leadSubmitApi enforces Turnstile token when site key configured", () => {
  149 |     const api = readFileSync(
  150 |       join(process.cwd(), "src/services/leadSubmitApi.js"),
  151 |       "utf8"
  152 |     );
  153 |     expect(api).toContain("assertTurnstileToken");
  154 |     expect(api).toContain("turnstileToken");
  155 |   });
  156 | 
  157 |   test("LeadInquiryModal disables submit until Turnstile solved", () => {
  158 |     const modal = readFileSync(
  159 |       join(process.cwd(), "src/components/LeadInquiryModal.jsx"),
  160 |       "utf8"
  161 |     );
  162 |     expect(modal).toContain("isTurnstileConfigured() && !turnstileToken");
  163 |   });
  164 | });
  165 | 
```