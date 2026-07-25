/**
 * Production Turnstile + lead submit verification.
 * Usage: node scripts/turnstile-lead-production-verify.mjs
 *
 * Requires: npx playwright (devDependency)
 */
import { chromium } from "playwright";

const SITE = (
  process.env.EVSAVARI_SITE_ORIGIN || "https://evsavari.com"
).replace(/\/$/, "");

function uniquePhone() {
  return `98${String(Date.now()).slice(-8)}`;
}

async function runScenario(page, label, openModal) {
  const result = {
    label,
    turnstileTokenInPayload: false,
    turnstileFieldName: null,
    turnstileTokenLength: 0,
    submitStatus: null,
    responseBody: null,
    success: false,
  };

  let leadRequest = null;
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/leads")) {
      leadRequest = req;
    }
  });

  let leadResponse = null;
  page.on("response", async (res) => {
    if (res.request().method() === "POST" && res.url().includes("/leads")) {
      leadResponse = res;
    }
  });

  await openModal(page);
  await page
    .getByTestId("lead-inquiry-form")
    .waitFor({ state: "visible", timeout: 30_000 });

  await page.getByTestId("lead-name").fill("Turnstile Verify");
  await page.getByTestId("lead-phone").fill(uniquePhone());
  await page.getByTestId("lead-email").fill(
    `turnstile-verify-${Date.now()}@evsavari.test`
  );
  await page.getByTestId("lead-state").selectOption("Haryana");
  await page.waitForFunction(
    () => {
      const city = document.querySelector('[data-testid="lead-city"]');
      return city && !city.disabled && city.options.length > 1;
    },
    { timeout: 15_000 }
  );
  await page.getByTestId("lead-city").selectOption("Gurugram");

  const submitBtn = page.getByTestId("lead-submit");
  await submitBtn.waitFor({ state: "visible", timeout: 30_000 });

  // Wait until Turnstile enables submit (token received).
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="lead-submit"]');
      return btn && !btn.disabled;
    },
    { timeout: 90_000 }
  );

  await submitBtn.click();

  await page.waitForTimeout(5_000);

  if (leadRequest) {
    const body = leadRequest.postDataJSON?.() || {};
    const token = body.turnstileToken || "";
    result.turnstileFieldName = "turnstileToken";
    result.turnstileTokenInPayload = Boolean(token);
    result.turnstileTokenLength = String(token).length;
  }

  if (leadResponse) {
    result.submitStatus = leadResponse.status();
    try {
      result.responseBody = await leadResponse.json();
      result.success =
        leadResponse.ok() && result.responseBody?.success === true;
    } catch {
      result.responseBody = null;
    }
  }

  return result;
}

async function main() {
  console.log(`\n=== Turnstile lead production verify ===`);
  console.log(`SITE=${SITE}\n`);

  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    await page.goto(`${SITE}/cars`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    results.push(
      await runScenario(page, "Request Callback (Browse EV)", async (p) => {
        await p
          .getByRole("button", { name: /callback/i })
          .first()
          .click();
      })
    );

    await page.goto(`${SITE}/cars/tata-nexon-ev`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2_000);

    results.push(
      await runScenario(page, "Get Best Deal (Car Details)", async (p) => {
        await p
          .getByRole("button", { name: /get best deal/i })
          .first()
          .click();
      })
    );
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));

  const allPass = results.every(
    (r) =>
      r.turnstileTokenInPayload &&
      r.turnstileTokenLength > 20 &&
      r.success
  );

  if (!allPass) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
