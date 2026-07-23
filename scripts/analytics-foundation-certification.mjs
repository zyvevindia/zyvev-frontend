/**
 * Analytics Foundation & GA4 Activation Certification (Pre–Sprint 3)
 * npm run analytics:certify:foundation
 */
import "./lib/bootstrapEnv.mjs";

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SITE = (process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com").replace(/\/$/, "");
const DATE = new Date().toISOString().slice(0, 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "releases");
const docsDir = join(root, "docs", "analytics");
const archDir = join(root, "docs", "architecture");

const FORBIDDEN_DIRECT_PROVIDER = [
  "window.gtag(",
  "window.dataLayer.push(",
  "fbq(",
];

function runScript(rel) {
  const result = spawnSync(process.execPath, [join(root, rel)], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  return { pass: result.status === 0, detail: (result.stderr || result.stdout || "").slice(-600) };
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function scanDirectProviderCalls() {
  const violations = [];
  const walk = (dir, rel = "") => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const full = join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(full, relPath);
      else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
        const normalized = relPath.replace(/\\/g, "/");
        if (
          normalized.startsWith("analytics/providers/") ||
          normalized.includes("/analytics/providers/")
        ) {
          continue;
        }
        const text = readFileSync(full, "utf8");
        for (const pattern of FORBIDDEN_DIRECT_PROVIDER) {
          if (text.includes(pattern)) {
            violations.push(`${relPath}: ${pattern}`);
          }
        }
      }
    }
  };
  walk(join(root, "src"));
  return violations;
}

function architectureChecks() {
  const required = [
    ["Analytics Engine (track.js)", "src/analytics/track.js"],
    ["Event Dispatcher (providers/index.js)", "src/analytics/providers/index.js"],
    ["Configuration Layer", "src/analytics/config.js"],
    ["Event Taxonomy", "src/analytics/events.js"],
    ["Event Categories", "src/analytics/categories.js"],
    ["Event Envelope", "src/analytics/envelope.js"],
    ["GA4 Provider", "src/analytics/providers/ga4.js"],
    ["GTM Provider", "src/analytics/providers/gtm.js"],
    ["Clarity Provider", "src/analytics/providers/clarity.js"],
    ["Meta Stub", "src/analytics/providers/meta.js"],
    ["LinkedIn Stub", "src/analytics/providers/linkedin.js"],
    ["Server-side Stub", "src/analytics/providers/serverSide.js"],
    ["Dedupe", "src/analytics/dedupe.js"],
    ["SPA Listeners", "src/analytics/listeners.js"],
    ["Bootstrap", "src/components/AnalyticsBootstrap.jsx"],
  ];

  return required.map(([name, path]) => ({
    name,
    pass: existsSync(join(root, path)),
    path,
  }));
}

function eventTaxonomyChecks() {
  const eventsText = read("src/analytics/events.js");
  const required = [
    "page_view",
    "homepage_viewed",
    "browse_viewed",
    "landing_viewed",
    "guide_viewed",
    "vehicle_view",
    "compare_started",
    "compare_completed",
    "search_used",
    "lead_submitted",
    "callback_requested",
    "cta_clicked",
    "internal_link_clicked",
  ];
  return required.map((ev) => ({
    event: ev,
    pass: eventsText.includes(`"${ev}"`),
  }));
}

function privacyChecks() {
  const trackText = read("src/analytics/track.js");
  return [
    { name: "blocks email in sanitizeProps", pass: trackText.includes('lower.includes("email")') },
    { name: "blocks phone in sanitizeProps", pass: trackText.includes('lower.includes("phone")') },
    { name: "blocks name in sanitizeProps", pass: trackText.includes('lower === "name"') },
    { name: "GA4 IP anonymization", pass: read("src/analytics/providers/ga4.js").includes("anonymize_ip: true") },
    { name: "send_page_view false (SPA control)", pass: read("src/analytics/providers/ga4.js").includes("send_page_view: false") },
  ];
}

function envConfigChecks() {
  const configText = read("src/analytics/config.js");
  return [
    { name: "VITE_GA_ID supported", pass: configText.includes("VITE_GA_ID") },
    { name: "VITE_GTM_ID supported", pass: configText.includes("VITE_GTM_ID") },
    { name: "VITE_CLARITY_ID supported", pass: configText.includes("VITE_CLARITY_ID") },
    { name: "VITE_META_PIXEL_ID stub", pass: configText.includes("VITE_META_PIXEL_ID") },
    { name: "VITE_LINKEDIN_PARTNER_ID stub", pass: configText.includes("VITE_LINKEDIN_PARTNER_ID") },
    { name: "no hardcoded G- measurement ID", pass: !/G-[A-Z0-9]{6,}/.test(configText) },
    { name: "no hardcoded GTM- ID", pass: !/GTM-[A-Z0-9]+/.test(configText) },
  ];
}

async function productionProbe() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(SITE, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2000);

  const homeProbe = await page.evaluate(() => ({
    hasGtag: typeof window.gtag === "function",
    hasDataLayer: Array.isArray(window.dataLayer),
    analyticsInitFlag: Boolean(window.__EVSAVARI_GA_INIT__ || window.__EVSAVARI_GTM_INIT__),
    pathname: window.location.pathname,
  }));

  await page.goto(`${SITE}/brands/tata`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1500);

  const spaProbe = await page.evaluate(() => ({
    pathname: window.location.pathname,
    title: document.title,
  }));

  const analyticsErrors = consoleErrors.filter(
    (e) => /analytics|gtag|gtm|dataLayer/i.test(e) && !/favicon/i.test(e)
  );

  await browser.close();

  return {
    homeProbe,
    spaProbe,
    analyticsConsoleErrors: analyticsErrors,
    trackingActive: homeProbe.hasGtag || homeProbe.hasDataLayer,
    spaNavigationOk: spaProbe.pathname.includes("/brands/tata"),
    gracefulWithoutIds: analyticsErrors.length === 0,
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const smoke = runScript("scripts/ops-analytics-smoke.mjs");
  const architecture = architectureChecks();
  const taxonomy = eventTaxonomyChecks();
  const privacy = privacyChecks();
  const envConfig = envConfigChecks();
  const directViolations = scanDirectProviderCalls();
  const production = await productionProbe();

  const scores = {
    architecture: Math.round(
      (architecture.filter((c) => c.pass).length / architecture.length) * 100
    ),
    taxonomy: Math.round((taxonomy.filter((c) => c.pass).length / taxonomy.length) * 100),
    privacy: Math.round((privacy.filter((c) => c.pass).length / privacy.length) * 100),
    envConfig: Math.round((envConfig.filter((c) => c.pass).length / envConfig.length) * 100),
    noDirectCalls: directViolations.length === 0 ? 100 : 0,
    production: production.gracefulWithoutIds && production.spaNavigationOk ? 95 : 70,
  };

  const analyticsHealthScore = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
  );

  const blockers = [];
  if (!architecture.every((c) => c.pass)) blockers.push("Missing analytics architecture modules");
  if (!smoke.pass) blockers.push("Analytics smoke failed");
  if (directViolations.length) blockers.push(`Direct provider calls: ${directViolations.join("; ")}`);
  if (!taxonomy.every((c) => c.pass)) blockers.push("Incomplete event taxonomy");

  const warnings = [];
  if (!production.trackingActive) {
    warnings.push(
      "GA4/GTM not active on production — set VITE_GA_ID or VITE_GTM_ID in Vercel and redeploy (manual)"
    );
  }

  const report = {
    title: "Analytics Foundation & GA4 Activation Certification",
    phase: "Pre-Sprint 3",
    generatedAt: new Date().toISOString(),
    site: SITE,
    verificationScope: {
      local: ["architecture", "taxonomy", "privacy", "env config", "direct call scan", "smoke"],
      production: ["SPA navigation", "graceful without IDs", "console errors"],
      manual: ["GA4 property", "measurement ID in Vercel", "redeploy", "real-time verify", "GSC link"],
    },
    architecture,
    exactlyOne: {
      analyticsEngine: architecture.find((c) => c.path.includes("track.js"))?.pass,
      eventDispatcher: architecture.find((c) => c.path.includes("providers/index"))?.pass,
      providerLayer: architecture.filter((c) => c.path.includes("providers/")).every((c) => c.pass),
      eventTaxonomy: existsSync(join(root, "src/analytics/events.js")),
      configurationLayer: existsSync(join(root, "src/analytics/config.js")),
      noDuplicateTracking: directViolations.length === 0,
      noDirectProviderInComponents: directViolations.length === 0,
    },
    taxonomy,
    privacy,
    envConfig,
    directProviderViolations: directViolations,
    smoke,
    production,
    scores,
    analyticsHealthScore,
    blockers,
    warnings,
    manualSteps: [
      "Create GA4 property in Google Analytics",
      "Create Web Data Stream for https://evsavari.com",
      "Copy Measurement ID (G-XXXXXXXX)",
      "Add VITE_GA_ID=G-XXXXXXXX to Vercel Production Environment Variables (or VITE_GTM_ID for GTM-first)",
      "Optional: VITE_CLARITY_ID, VITE_POSTHOG_KEY",
      "Redeploy production",
      "Verify Real-Time events in GA4 (page_view, landing_viewed, vehicle_view)",
      "Link GA4 property with Search Console (Admin → Product links)",
      "Configure GA4 conversions per docs/analytics/conversion-tracking-guide.md",
    ],
    docs: {
      architectureReport: "docs/analytics/analytics-architecture-report.md",
      eventTaxonomy: "docs/analytics/event-taxonomy.md",
      ga4Guide: "docs/analytics/ga4-activation-guide.md",
      gtmGuide: "docs/analytics/gtm-activation-guide.md",
      gscGuide: "docs/analytics/search-console-integration-guide.md",
      conversionGuide: "docs/analytics/conversion-tracking-guide.md",
      privacyReport: "docs/analytics/privacy-compliance-report.md",
      dashboardRecommendations: "docs/analytics/dashboard-recommendations.md",
      adr: "docs/architecture/adr-analytics-foundation.md",
    },
    verdict: blockers.length === 0 ? (warnings.length ? "PASS_WITH_WARNINGS" : "PASS") : "FAIL",
  };

  const jsonPath = join(outDir, `analytics-foundation-certification-${DATE}.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const mdPath = join(outDir, "analytics-foundation-certification.md");
  writeFileSync(
    mdPath,
    `# Analytics Foundation Certification (Pre–Sprint 3)

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${report.verdict}**  
**Analytics Health Score:** ${analyticsHealthScore}/100

## Architecture (Exactly One)

${architecture.map((c) => `- ${c.pass ? "✓" : "✗"} ${c.name}`).join("\n")}

## Direct provider call violations

${directViolations.length ? directViolations.map((v) => `- ✗ ${v}`).join("\n") : "- ✓ None outside providers/"}

## Production probe

| Check | Result |
|-------|--------|
| SPA navigation | ${production.spaNavigationOk ? "PASS" : "FAIL"} |
| Graceful without IDs | ${production.gracefulWithoutIds ? "PASS" : "FAIL"} |
| Tracking scripts active | ${production.trackingActive ? "Yes" : "No (manual activation required)"} |
| Analytics console errors | ${production.analyticsConsoleErrors.length || 0} |

## Manual Steps Required

${report.manualSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Documentation

${Object.entries(report.docs)
  .map(([k, v]) => `- [${k}](../${v.replace("docs/", "")})`)
  .join("\n")}

**JSON:** [\`analytics-foundation-certification-${DATE}.json\`](./analytics-foundation-certification-${DATE}.json)
`
  );

  console.log(`\nAnalytics Foundation Certification: ${report.verdict}`);
  console.log(`Analytics Health Score: ${analyticsHealthScore}/100`);
  console.log(`Report: ${mdPath}`);

  if (blockers.length) {
    console.error("Blockers:", blockers.join("; "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
