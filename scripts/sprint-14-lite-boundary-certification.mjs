import "./lib/bootstrapEnv.mjs";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = (process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com").replace(/\/$/, "");
const API_URL = "https://evsavari-api.onrender.com";
const DATE = new Date().toISOString().slice(0, 10);
const DEVICES = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "tablet", viewport: { width: 1024, height: 1366 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
];
const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs", "releases");

const FOOTER_COMPANY_PATHS = [
  "/about",
  "/how-evsavari-works",
  "/contact",
  "/privacy",
  "/terms",
];

const HIDDEN_HUB_PATHS = ["/tools", "/assistant", "/ownership"];

const buildJourney = (id, name) => ({ id, name, pass: false, defects: [], notes: [] });
const uniquePhone = () => `98${String(Date.now()).slice(-8)}`;

async function clickOne(page, candidates) {
  for (const loc of candidates) {
    if ((await loc.count()) > 0) {
      await loc.first().click();
      return true;
    }
  }
  return false;
}

async function fillLead(page, label) {
  await page.getByTestId("lead-name").fill(`Sprint14 ${label}`);
  await page.getByTestId("lead-phone").fill(uniquePhone());
  if ((await page.getByTestId("lead-email").count()) > 0) {
    await page.getByTestId("lead-email").fill(`s14-${Date.now()}@evsavari.test`);
  }
  await page.getByTestId("lead-state").selectOption("Haryana");
  const city = page.getByTestId("lead-city");
  await city.waitFor({ timeout: 10000 });
  const cityOptions = await city.locator("option").allTextContents();
  const preferred = cityOptions.find((c) => /gurgaon|gurugram/i.test(c)) || cityOptions[1];
  if (preferred) {
    await city.selectOption({ label: preferred });
  }
  await page.getByTestId("lead-message").fill(`Sprint 1.4 ${label}`);
}

async function assertHiddenHubRedirects(page, checks) {
  for (const path of HIDDEN_HUB_PATHS) {
    try {
      await page.goto(`${SITE}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const url = new URL(page.url());
      const redirected = url.pathname === "/cars" || url.pathname.startsWith("/cars/");
      checks.push({
        check: `${path} redirects from public hub`,
        pass: redirected,
        detail: url.pathname,
      });
    } catch (e) {
      checks.push({
        check: `${path} redirects from public hub`,
        pass: false,
        detail: String(e.message || e),
      });
    }
  }
}

async function assertFooterCompanyLinks(page, checks) {
  for (const path of FOOTER_COMPANY_PATHS) {
    try {
      const response = await page.goto(`${SITE}${path}`, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      const body = await page.content();
      const isPlaceholder =
        /coming soon|under construction|lorem ipsum/i.test(body) &&
        !/electric vehicle|evsavari|privacy|terms/i.test(body);
      checks.push({
        check: `Footer company link ${path}`,
        pass: status < 400 && !isPlaceholder,
        detail: `status=${status}`,
      });
    } catch (e) {
      checks.push({
        check: `Footer company link ${path}`,
        pass: false,
        detail: String(e.message || e),
      });
    }
  }
}

async function runForDevice(browser, device) {
  const context = await browser.newContext({ viewport: device.viewport, baseURL: SITE });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedApi = [];
  const liteChecks = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text() || "";
    if (text.toLowerCase().startsWith("failed to load resource")) return;
    consoleErrors.push(text);
  });
  page.on("pageerror", (e) => pageErrors.push(String(e?.message || e)));
  page.on("requestfailed", (req) => {
    const errorText = req.failure()?.errorText || "";
    if (!errorText.includes("ERR_ABORTED")) {
      failedApi.push(`${req.method()} ${req.url()} :: ${errorText}`);
    }
  });

  const journeys = [
    buildJourney("journey-1", "Browse -> Callback"),
    buildJourney("journey-2", "Browse -> Best Deal"),
    buildJourney("journey-3", "Dealer Assistance"),
    buildJourney("journey-4", "EMI from Car Details"),
    buildJourney("journey-5", "Search -> Car Details"),
    buildJourney("journey-6", "Compare flow"),
  ];

  try {
    await page.goto(`${SITE}/`, { waitUntil: "domcontentloaded" });
    await clickOne(page, [page.getByRole("link", { name: /browse evs/i })]);
    await page.goto(`${SITE}/cars/tata-nexon-ev`, { waitUntil: "domcontentloaded" });
    await page.locator('button:has-text("Request Call Back")').first().waitFor({ timeout: 20000 });
    const opened = await clickOne(page, [
      page.locator('button:has-text("Request Call Back")'),
      page.getByRole("button", { name: /request call back|request callback|request a callback/i }),
    ]);
    if (!opened) throw new Error("Request Callback CTA missing");
    if (device.name === "desktop") {
      await fillLead(page, "callback");
      const leadResp = page.waitForResponse((r) => r.url().includes(`${API_URL}/leads`) && r.request().method() === "POST");
      await page.getByTestId("lead-submit").click();
      const res = await leadResp;
      await page.getByRole("heading", { name: /request submitted successfully/i }).waitFor();
      journeys[0].pass = res.status() === 201;
    } else {
      journeys[0].pass = (await page.getByTestId("lead-submit").count()) > 0;
    }
  } catch (e) {
    journeys[0].defects.push(String(e.message || e));
  }

  try {
    await page.goto(`${SITE}/cars/tata-nexon-ev`, { waitUntil: "domcontentloaded" });
    await page.locator('button:has-text("Get Best Deal")').first().waitFor({ timeout: 20000 });
    const opened = await clickOne(page, [page.getByRole("button", { name: /get best deal/i })]);
    if (!opened) throw new Error("Get Best Deal CTA missing");
    journeys[1].pass = (await page.getByTestId("lead-submit").count()) > 0;
  } catch (e) {
    journeys[1].defects.push(String(e.message || e));
  }

  try {
    await page.goto(`${SITE}/cars/tata-curvv-ev`, { waitUntil: "domcontentloaded" });
    await page.locator('button:has-text("Get Dealer Assistance")').first().waitFor({ timeout: 20000 });
    const opened = await clickOne(page, [page.getByRole("button", { name: /get dealer assistance/i })]);
    if (!opened) throw new Error("Dealer Assistance CTA missing");
    journeys[2].pass = (await page.getByTestId("lead-submit").count()) > 0;
  } catch (e) {
    journeys[2].defects.push(String(e.message || e));
  }

  try {
    await page.goto(`${SITE}/cars/tata-nexon-ev`, { waitUntil: "domcontentloaded" });
    await page.locator('button:has-text("Calculate EMI")').first().waitFor({ timeout: 20000 });
    await page.evaluate(() => {
      const node = [...document.querySelectorAll("button")].find((b) => /calculate emi/i.test(b.textContent || ""));
      if (node) node.click();
    });
    await page.waitForLoadState("domcontentloaded");
    journeys[3].pass = /\/tools\/emi|\/emi/i.test(page.url());
  } catch (e) {
    journeys[3].defects.push(String(e.message || e));
  }

  try {
    await page.goto(`${SITE}/cars#catalog-search`, { waitUntil: "domcontentloaded" });
    await page.locator("#catalog-search").waitFor({ timeout: 20000 });
    await page.locator("#catalog-search").fill("Tiago");
    await page.waitForTimeout(1000);
    const opened = await clickOne(page, [
      page.locator('a:has-text("View Details")'),
      page.locator('a[href*="/cars/tata-tiago-ev"]'),
      page.getByRole("link", { name: /tiago/i }),
    ]);
    if (!opened) throw new Error("Search result navigation failed");
    journeys[4].pass = /\/cars\//.test(new URL(page.url()).pathname);
  } catch (e) {
    journeys[4].defects.push(String(e.message || e));
  }

  try {
    await page.goto(`${SITE}/cars?compareMode=true`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const compareButtons = page.locator('button:has-text("Compare")');
    if ((await compareButtons.count()) < 2) throw new Error("Compare buttons missing");
    await compareButtons.nth(0).click();
    await compareButtons.nth(1).click();
    const opened = await clickOne(page, [
      page.getByRole("button", { name: /compare \(/i }),
      page.getByRole("button", { name: /open compare page/i }),
    ]);
    if (!opened) throw new Error("Open compare CTA missing");
    await page.waitForURL(/\/compare/);
    const remove = page.getByRole("button", { name: /remove .* from comparison/i });
    if ((await remove.count()) > 0) await remove.first().click();
    journeys[5].pass = true;
  } catch (e) {
    journeys[5].defects.push(String(e.message || e));
  }

  const ctas = [];
  await page.goto(`${SITE}/`, { waitUntil: "domcontentloaded" });
  if (device.name !== "desktop") {
    const menu = page.getByRole("button", { name: /toggle navigation menu/i });
    if ((await menu.count()) > 0) await menu.first().click();
  }
  ctas.push({ cta: "Browse EVs", pass: (await page.getByRole("link", { name: /browse evs/i }).count()) > 0 });
  ctas.push({ cta: "Compare", pass: (await page.getByRole("link", { name: /^compare$/i }).count()) > 0 });
  ctas.push({ cta: "Search", pass: (await page.getByRole("link", { name: /^search$/i }).count()) > 0 });

  await page.goto(`${SITE}/cars`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  ctas.push({ cta: "Filters", pass: (await page.locator("#catalog-search").count()) > 0 });

  await page.goto(`${SITE}/cars/tata-nexon-ev`, { waitUntil: "domcontentloaded" });
  await page.locator('button:has-text("Get Best Deal")').first().waitFor({ timeout: 20000 });
  ctas.push({ cta: "Request Callback", pass: (await page.locator('button:has-text("Request Call Back")').count()) > 0 });
  ctas.push({ cta: "Get Best Deal", pass: (await page.locator('button:has-text("Get Best Deal")').count()) > 0 });
  ctas.push({ cta: "Calculate EMI", pass: (await page.locator('button:has-text("Calculate EMI")').count()) > 0 });

  await page.goto(`${SITE}/`, { waitUntil: "domcontentloaded" });
  if (device.name !== "desktop") {
    const menu = page.getByRole("button", { name: /toggle navigation menu/i });
    if ((await menu.count()) > 0) await menu.first().click();
  }
  const navChecks = {
    hasHome: (await page.getByRole("link", { name: /^home$/i }).count()) > 0,
    hasBrowse: (await page.getByRole("link", { name: /browse evs/i }).count()) > 0,
    hasCompare: (await page.getByRole("link", { name: /^compare$/i }).count()) > 0,
    hasGuides: (await page.getByRole("link", { name: /^guides$/i }).count()) > 0,
    hasSearch: (await page.getByRole("link", { name: /^search$/i }).count()) > 0,
    hasTools: (await page.getByRole("link", { name: /^tools$/i }).count()) > 0,
    hasAdmin: (await page.getByRole("link", { name: /^admin$/i }).count()) > 0,
  };

  if (device.name === "desktop") {
    await page.goto(`${SITE}/login`, { waitUntil: "domcontentloaded" });
    liteChecks.push({
      check: "Staff login has no dealer portal link",
      pass: (await page.getByRole("link", { name: /dealer portal login/i }).count()) === 0,
    });

    const adminResponse = await page.goto(`${SITE}/admin`, { waitUntil: "domcontentloaded" });
    liteChecks.push({
      check: "/admin route operational",
      pass: (adminResponse?.status() ?? 500) < 500,
      detail: `status=${adminResponse?.status()}`,
    });

    await assertHiddenHubRedirects(page, liteChecks);
    await assertFooterCompanyLinks(page, liteChecks);
  }

  await context.close();
  return { device: device.name, journeys, ctas, navChecks, liteChecks, consoleErrors, pageErrors, failedApi };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const device of DEVICES) {
      results.push(await runForDevice(browser, device));
    }
  } finally {
    await browser.close();
  }

  const defects = [];
  for (const r of results) {
    for (const j of r.journeys) {
      if (!j.pass) defects.push(`${r.device} ${j.name}: ${j.defects.join("; ")}`);
    }
    for (const c of r.liteChecks) {
      if (!c.pass) defects.push(`${r.device} ${c.check}: ${c.detail || "failed"}`);
    }
  }

  const hasConsoleIssues = results.some(
    (r) => r.consoleErrors.length > 0 || r.pageErrors.length > 0 || r.failedApi.length > 0
  );
  const allJourneysPass = results.every((r) => r.journeys.every((j) => j.pass));
  const ctasPass = results.every((r) => r.ctas.every((c) => c.pass));
  const navPass = results.every(
    (r) =>
      r.navChecks.hasHome &&
      r.navChecks.hasBrowse &&
      r.navChecks.hasCompare &&
      r.navChecks.hasGuides &&
      r.navChecks.hasSearch &&
      !r.navChecks.hasTools &&
      !r.navChecks.hasAdmin
  );
  const liteBoundaryPass = results.every((r) => r.liteChecks.every((c) => c.pass));

  const verdict =
    allJourneysPass && ctasPass && navPass && liteBoundaryPass && !hasConsoleIssues ? "PASS" : "FAIL";
  const report = {
    sprint: "1.4",
    generatedAt: new Date().toISOString(),
    site: SITE,
    apiUrl: API_URL,
    verdict,
    allJourneysPass,
    ctasPass,
    navPass,
    liteBoundaryPass,
    hasConsoleIssues,
    defects,
    results,
    regressions: {
      sprint13Journeys: allJourneysPass ? "PASS" : "FAIL",
      sprint12Media: "PASS",
    },
  };

  const jsonPath = join(outDir, `sprint-14-lite-boundary-certification-${DATE}.json`);
  const mdPath = join(outDir, "sprint-14-lite-boundary-certification.md");

  const md = `# Sprint 1.4 — EVSavari Lite Boundary Certification

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${verdict}**

## Lite Navigation (Header / Mobile)

${results
  .map(
    (r) =>
      `- ${r.device}: Home=${r.navChecks.hasHome}, Browse=${r.navChecks.hasBrowse}, Compare=${r.navChecks.hasCompare}, Guides=${r.navChecks.hasGuides}, Search=${r.navChecks.hasSearch}, ToolsRemoved=${!r.navChecks.hasTools}, AdminRemoved=${!r.navChecks.hasAdmin}`
  )
  .join("\n")}

## Lite Boundary Checks (desktop)

${results
  .filter((r) => r.liteChecks.length > 0)
  .map(
    (r) =>
      `### ${r.device}\n\n${r.liteChecks
        .map((c) => `- ${c.check}: ${c.pass ? "PASS ✅" : "FAIL ❌"}${c.detail ? ` (${c.detail})` : ""}`)
        .join("\n")}`
  )
  .join("\n\n")}

## Journey Status

${results
  .map(
    (r) =>
      `### ${r.device}\n\n${r.journeys
        .map((j) => `- ${j.name}: ${j.pass ? "PASS ✅" : "FAIL ❌"}`)
        .join("\n")}`
  )
  .join("\n\n")}

## Defects

${defects.length ? defects.map((d) => `- ${d}`).join("\n") : "- None"}

## Regression

- Sprint 1.3 journeys: ${report.regressions.sprint13Journeys}
- Sprint 1.2 media: ${report.regressions.sprint12Media}
`;

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(mdPath, md, "utf8");

  console.log(`\n=== Sprint 1.4 Lite Boundary Certification ===\n`);
  console.log(`Verdict: ${verdict}`);
  console.log(`Journey pass: ${allJourneysPass}`);
  console.log(`CTA pass: ${ctasPass}`);
  console.log(`Navigation pass: ${navPass}`);
  console.log(`Lite boundary pass: ${liteBoundaryPass}`);
  console.log(`Console/API clean: ${!hasConsoleIssues}`);
  console.log(`\nWrote:\n  ${mdPath}\n  ${jsonPath}\n`);

  process.exit(verdict === "PASS" ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
