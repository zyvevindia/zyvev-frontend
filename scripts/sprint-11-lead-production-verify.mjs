/**
 * Sprint 1.1 — production lead flow verification.
 * Usage: node scripts/sprint-11-lead-production-verify.mjs
 */
import { chromium } from "playwright";

const SITE = (
  process.env.EVSAVARI_SITE_ORIGIN || "https://evsavari.com"
).replace(/\/$/, "");
const API = (
  process.env.EVSAVARI_API_URL || "https://evsavari-api.onrender.com"
).replace(/\/$/, "");

function uniquePhone() {
  return `98${String(Date.now()).slice(-8)}`;
}

function uniqueEmail(tag) {
  return `sprint11-${tag}-${Date.now()}@evsavari.test`;
}

async function fillCommonFields(page, { email }) {
  await page.getByTestId("lead-name").fill("Sprint 1.1 Verify");
  await page.getByTestId("lead-phone").fill(uniquePhone());
  if (email) {
    await page.getByTestId("lead-email").fill(email);
  }
  await page.getByTestId("lead-state").selectOption("Haryana");
  await page.waitForFunction(
    () => {
      const city = document.querySelector('[data-testid="lead-city"]');
      return city && !city.disabled && city.options.length > 1;
    },
    { timeout: 15_000 }
  );
  await page.getByTestId("lead-city").selectOption("Gurugram");
}

async function runScenario(page, config) {
  const result = {
    flow: config.label,
    modalOpened: false,
    submitStatus: null,
    responseBody: null,
    leadId: null,
    successUi: false,
    turnstileInPayload: false,
    consoleErrors: [],
    pass: false,
  };

  const consoleErrors = [];
  const onConsole = (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (
        /\/leads|turnstile|lead-inquiry|security verification/i.test(text)
      ) {
        consoleErrors.push(text);
      }
    }
  };
  page.on("console", onConsole);

  let leadRequest = null;
  let leadResponse = null;

  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/leads")) {
      leadRequest = req;
    }
  });
  page.on("response", async (res) => {
    if (res.request().method() === "POST" && res.url().includes("/leads")) {
      leadResponse = res;
    }
  });

  try {
    await page.goto(config.url, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(config.waitMs ?? 3_000);

    await config.openModal(page);
    await page
      .getByTestId("lead-inquiry-form")
      .waitFor({ state: "visible", timeout: 30_000 });
    result.modalOpened = true;

    await fillCommonFields(page, { email: config.email });
    if (config.extraFill) {
      await config.extraFill(page);
    }

    const submitBtn = page.getByTestId("lead-submit");
    await submitBtn.waitFor({ state: "visible", timeout: 30_000 });

    if (config.waitForTurnstile) {
      await page.waitForFunction(
        () => {
          const btn = document.querySelector('[data-testid="lead-submit"]');
          return btn && !btn.disabled;
        },
        { timeout: 90_000 }
      );
    }

    await submitBtn.click();
    await page.waitForTimeout(6_000);

    if (leadRequest) {
      const body = leadRequest.postDataJSON?.() || {};
      result.turnstileInPayload = Boolean(body.turnstileToken);
    }

    if (leadResponse) {
      result.submitStatus = leadResponse.status();
      try {
        result.responseBody = await leadResponse.json();
        result.leadId = result.responseBody?.leadId || null;
      } catch {
        result.responseBody = null;
      }
    }

    result.successUi = await page
      .getByText(/request submitted successfully/i)
      .isVisible()
      .catch(() => false);

    result.consoleErrors = consoleErrors;
    result.pass =
      result.submitStatus === 201 &&
      result.responseBody?.success === true &&
      Boolean(result.leadId) &&
      result.successUi &&
      !result.turnstileInPayload &&
      consoleErrors.length === 0;
  } catch (err) {
    result.error = err.message;
    result.consoleErrors = consoleErrors;
  } finally {
    page.off("console", onConsole);
  }

  return result;
}

async function verifyApiGuards() {
  const guards = {
    validation: false,
    duplicate: false,
    rateLimitObserved: false,
  };

  const invalid = await fetch(`${API}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Invalid Phone",
      phone: "12345",
      city: "Gurugram",
      state: "Haryana",
      vehicleName: "Tata Nexon EV",
      sourcePage: "/sprint-11-guard",
      leadSource: "form",
    }),
  });
  const invalidBody = await invalid.json().catch(() => ({}));
  guards.validation =
    invalid.status === 400 && Boolean(invalidBody?.errors);

  const phone = uniquePhone();
  const payload = {
    name: "Dup Guard A",
    phone,
    email: uniqueEmail("dup-a"),
    city: "Gurugram",
    state: "Haryana",
    message: "duplicate guard",
    vehicleName: "Tata Nexon EV",
    sourcePage: "/sprint-11-guard",
    leadSource: "form",
    familySlug: "tata-nexon-ev",
  };

  const first = await fetch(`${API}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const firstBody = await first.json().catch(() => ({}));

  const second = await fetch(`${API}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      name: "Dup Guard B",
      email: uniqueEmail("dup-b"),
    }),
  });
  const secondBody = await second.json().catch(() => ({}));

  guards.duplicate =
    first.status === 201 &&
    second.status === 201 &&
    secondBody?.merged === true;

  const burst = [];
  for (let i = 0; i < 6; i++) {
    burst.push(
      fetch(`${API}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Rate ${i}`,
          phone: uniquePhone(),
          city: "Gurugram",
          state: "Haryana",
          vehicleName: "Tata Nexon EV",
          sourcePage: "/sprint-11-rate",
          leadSource: "form",
        }),
      })
    );
  }
  const burstRes = await Promise.all(burst);
  guards.rateLimitObserved = burstRes.some((r) => r.status === 429);

  return {
    guards,
    firstLeadId: firstBody?.leadId || null,
    invalidStatus: invalid.status,
    duplicateMerged: secondBody?.merged,
  };
}

async function main() {
  console.log("\n=== Sprint 1.1 production lead verify ===");
  console.log(`SITE=${SITE}`);
  console.log(`API=${API}\n`);

  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });

  const scenarios = [
    {
      label: "Request Callback",
      url: `${SITE}/cars`,
      openModal: async (p) => {
        await p.getByRole("button", { name: /callback/i }).first().click();
      },
      email: uniqueEmail("callback"),
    },
    {
      label: "Get Best Deal",
      url: `${SITE}/cars/tata-nexon-ev`,
      openModal: async (p) => {
        await p
          .getByRole("button", { name: /get best deal/i })
          .first()
          .click();
      },
      email: uniqueEmail("best-deal"),
    },
    {
      label: "Dealer Assistance",
      url: `${SITE}/cars/tata-nexon-ev`,
      openModal: async (p) => {
        await p
          .getByRole("button", { name: /get dealer assistance/i })
          .first()
          .click();
      },
      email: uniqueEmail("dealer"),
    },
    {
      label: "Book Test Drive",
      url: `${SITE}/cars/tata-nexon-ev`,
      openModal: async (p) => {
        await p
          .getByRole("button", { name: /book test drive/i })
          .first()
          .click();
      },
      email: null,
    },
  ];

  const uiResults = [];
  try {
    for (const scenario of scenarios) {
      const context = await browser.newContext();
      const page = await context.newPage();
      uiResults.push(await runScenario(page, scenario));
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const apiProbe = await verifyApiGuards();
  console.log("API guards:", JSON.stringify(apiProbe, null, 2));

  const report = {
    sprint: "1.1",
    site: SITE,
    api: API,
    apiGuards: apiProbe,
    flows: uiResults,
    allPass:
      apiProbe.guards.validation &&
      apiProbe.guards.duplicate &&
      uiResults.every((r) => r.pass),
  };

  console.log("\n", JSON.stringify(report, null, 2));

  if (!report.allPass) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
