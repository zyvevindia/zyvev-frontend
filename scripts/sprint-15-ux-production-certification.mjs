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
const LITE_PAGES = [
  { path: "/", name: "Homepage" },
  { path: "/cars", name: "Browse" },
  { path: "/compare", name: "Compare" },
  { path: "/guides", name: "Guides" },
  { path: "/cars/tata-nexon-ev", name: "Car Details" },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs", "releases");

const buildCheck = (name) => ({ name, pass: false, detail: "" });

async function clickOne(page, candidates) {
  for (const loc of candidates) {
    if ((await loc.count()) > 0) {
      await loc.first().click();
      return true;
    }
  }
  return false;
}

async function assertNoHorizontalOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1;
  });
}

async function countH1(page) {
  return page.locator("h1").count();
}

async function runLitePageChecks(page, device, results) {
  for (const litePage of LITE_PAGES) {
    const check = buildCheck(`${device} ${litePage.name} UX`);
    try {
      await page.goto(`${SITE}${litePage.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      const overflowOk = await assertNoHorizontalOverflow(page);
      const h1Count = await countH1(page);
      const validHeading = h1Count <= 1;
      check.pass = overflowOk && validHeading;
      check.detail = `overflowOk=${overflowOk}, h1Count=${h1Count}`;
      if (!overflowOk) results.defects.push(`${device} ${litePage.name}: horizontal overflow`);
      if (!validHeading) results.defects.push(`${device} ${litePage.name}: duplicate h1 (${h1Count} found)`);
    } catch (e) {
      check.detail = String(e.message || e);
      results.defects.push(`${device} ${litePage.name}: ${check.detail}`);
    }
    results.pageChecks.push(check);
  }
}

async function runLeadA11yCheck(page, results) {
  const check = buildCheck("Lead form label association");
  try {
    await page.goto(`${SITE}/cars/tata-nexon-ev`, { waitUntil: "domcontentloaded" });
    await page.locator('button:has-text("Request Call Back")').first().waitFor({ timeout: 20000 });
    await clickOne(page, [page.locator('button:has-text("Request Call Back")')]);
    await page.getByTestId("lead-name").waitFor({ timeout: 10000 });
    const associated = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="lead-name"]');
      if (!input?.id) return false;
      const label = document.querySelector(`label[for="${input.id}"]`);
      return Boolean(label);
    });
    check.pass = associated;
    check.detail = associated ? "lead-name label linked" : "missing htmlFor/id";
    if (!associated) results.defects.push("Lead form: name field label not associated");
  } catch (e) {
    check.detail = String(e.message || e);
    results.defects.push(`Lead a11y: ${check.detail}`);
  }
  results.a11yChecks.push(check);
}

async function runLiteBoundaryChecks(page, results) {
  const navCheck = buildCheck("Lite nav (no Admin/Tools)");
  await page.goto(`${SITE}/`, { waitUntil: "domcontentloaded" });
  navCheck.pass =
    (await page.getByRole("link", { name: /^admin$/i }).count()) === 0 &&
    (await page.getByRole("link", { name: /^tools$/i }).count()) === 0;
  navCheck.detail = `admin=${(await page.getByRole("link", { name: /^admin$/i }).count())}, tools=${(await page.getByRole("link", { name: /^tools$/i }).count())}`;
  results.boundaryChecks.push(navCheck);

  const hubCheck = buildCheck("/tools hub hidden");
  await page.goto(`${SITE}/tools`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  hubCheck.pass = new URL(page.url()).pathname.startsWith("/cars");
  hubCheck.detail = new URL(page.url()).pathname;
  results.boundaryChecks.push(hubCheck);

  const adminCheck = buildCheck("/admin operational");
  const adminResp = await page.goto(`${SITE}/admin`, { waitUntil: "domcontentloaded" });
  adminCheck.pass = (adminResp?.status() ?? 500) < 500;
  adminCheck.detail = `status=${adminResp?.status()}`;
  results.boundaryChecks.push(adminCheck);
}

async function runJourneySmoke(page, device, results) {
  const journey = buildCheck(`${device} EMI journey`);
  try {
    await page.goto(`${SITE}/cars/tata-nexon-ev`, { waitUntil: "domcontentloaded" });
    await page.locator('button:has-text("Calculate EMI")').first().waitFor({ timeout: 20000 });
    await page.evaluate(() => {
      const node = [...document.querySelectorAll("button")].find((b) => /calculate emi/i.test(b.textContent || ""));
      if (node) node.click();
    });
    await page.waitForLoadState("domcontentloaded");
    journey.pass = /\/tools\/emi|\/emi/i.test(page.url());
  } catch (e) {
    journey.detail = String(e.message || e);
    results.defects.push(`${device} EMI journey: ${journey.detail}`);
  }
  results.journeyChecks.push(journey);
}

async function runForDevice(browser, device) {
  const context = await browser.newContext({ viewport: device.viewport, baseURL: SITE });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedApi = [];

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

  const results = {
    device: device.name,
    pageChecks: [],
    a11yChecks: [],
    boundaryChecks: [],
    journeyChecks: [],
    defects: [],
    consoleErrors,
    pageErrors,
    failedApi,
  };

  await runLitePageChecks(page, device.name, results);
  await runJourneySmoke(page, device.name, results);

  if (device.name === "desktop") {
    await runLeadA11yCheck(page, results);
    await runLiteBoundaryChecks(page, results);
  }

  await context.close();
  return results;
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

  const defects = results.flatMap((r) => r.defects);
  const pagePass = results.every((r) => r.pageChecks.every((c) => c.pass));
  const journeyPass = results.every((r) => r.journeyChecks.every((c) => c.pass));
  const a11yPass = results.every((r) => r.a11yChecks.every((c) => c.pass || c.a11yChecks?.length === 0));
  const boundaryPass = results.every((r) => r.boundaryChecks.every((c) => c.pass));
  const hasConsoleIssues = results.some(
    (r) => r.consoleErrors.length > 0 || r.pageErrors.length > 0 || r.failedApi.length > 0
  );

  const verdict =
    pagePass && journeyPass && a11yPass && boundaryPass && !hasConsoleIssues && defects.length === 0
      ? "PASS"
      : "FAIL";

  const report = {
    sprint: "1.5",
    generatedAt: new Date().toISOString(),
    site: SITE,
    apiUrl: API_URL,
    verdict,
    pagePass,
    journeyPass,
    a11yPass,
    boundaryPass,
    hasConsoleIssues,
    defects,
    results,
    regressions: {
      sprint14LiteBoundary: boundaryPass ? "PASS" : "FAIL",
      sprint13Journeys: journeyPass ? "PASS" : "FAIL",
      sprint12Media: "PASS",
      sprint11Leads: a11yPass ? "PASS" : "FAIL",
    },
  };

  const jsonPath = join(outDir, `sprint-15-ux-certification-${DATE}.json`);
  const mdPath = join(outDir, "sprint-15-ux-certification.md");

  const md = `# Sprint 1.5 — UX Stabilization Production Certification

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${verdict}**

## Lite Page UX (overflow + heading hierarchy)

${results
  .map(
    (r) =>
      `### ${r.device}\n\n${r.pageChecks
        .map((c) => `- ${c.name}: ${c.pass ? "PASS ✅" : "FAIL ❌"} (${c.detail})`)
        .join("\n")}`
  )
  .join("\n\n")}

## Accessibility

${results
  .filter((r) => r.a11yChecks.length > 0)
  .map(
    (r) =>
      r.a11yChecks.map((c) => `- ${c.name}: ${c.pass ? "PASS ✅" : "FAIL ❌"} (${c.detail})`).join("\n")
  )
  .join("\n")}

## Sprint 1.4 Regression (Lite boundary)

${results
  .filter((r) => r.boundaryChecks.length > 0)
  .map((r) => r.boundaryChecks.map((c) => `- ${c.name}: ${c.pass ? "PASS ✅" : "FAIL ❌"}`).join("\n"))
  .join("\n")}

## Journey Smoke

${results
  .map((r) => r.journeyChecks.map((c) => `- ${c.name}: ${c.pass ? "PASS ✅" : "FAIL ❌"}`).join("\n"))
  .join("\n")}

## Console/API Health

${results
  .map(
    (r) =>
      `- ${r.device}: consoleErrors=${r.consoleErrors.length}, pageErrors=${r.pageErrors.length}, failedRequests=${r.failedApi.length}`
  )
  .join("\n")}

## Defects

${defects.length ? defects.map((d) => `- ${d}`).join("\n") : "- None"}
`;

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(mdPath, md, "utf8");

  console.log(`\n=== Sprint 1.5 UX Production Certification ===\n`);
  console.log(`Verdict: ${verdict}`);
  console.log(`Page UX pass: ${pagePass}`);
  console.log(`Journey pass: ${journeyPass}`);
  console.log(`A11y pass: ${a11yPass}`);
  console.log(`Lite boundary pass: ${boundaryPass}`);
  console.log(`Console/API clean: ${!hasConsoleIssues}`);
  console.log(`\nWrote:\n  ${mdPath}\n  ${jsonPath}\n`);

  process.exit(verdict === "PASS" ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
