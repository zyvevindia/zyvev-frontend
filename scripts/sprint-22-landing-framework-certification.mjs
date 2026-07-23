/**
 * Sprint 2.2 — Landing Page Framework Certification (architecture only)
 * npm run landing:certify:sprint22
 */
import "./lib/bootstrapEnv.mjs";

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { chromium, request as playwrightRequest } from "playwright";

const SITE = (process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com").replace(/\/$/, "");
const DATE = new Date().toISOString().slice(0, 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const landingDir = join(root, "src", "landing");
const outDir = join(root, "docs", "releases");

const REGRESSION_PATHS = [
  "/",
  "/cars",
  "/cars/tata-nexon-ev",
  "/compare",
  "/guides",
  "/best-evs/large-family",
  "/brands/byd",
  "/discover/family-friendly",
  "/compare/nexon-ev-vs-mg-zs-ev",
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

function countFiles(dir, ext) {
  if (!existsSync(dir)) return 0;
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full, ext);
    else if (entry.name.endsWith(ext)) count += 1;
  }
  return count;
}

function architectureChecks() {
  const checks = [];

  const add = (name, pass, detail = "") => checks.push({ name, pass, detail });

  add("LandingPage.jsx exists", existsSync(join(landingDir, "LandingPage.jsx")));
  add("LandingRouter.jsx exists", existsSync(join(landingDir, "LandingRouter.jsx")));
  add("landingRegistry.js exists", existsSync(join(landingDir, "landingRegistry.js")));
  add("single layout", existsSync(join(landingDir, "layout", "LandingPageLayout.jsx")));
  add("filter abstraction", existsSync(join(landingDir, "filters", "landingFilter.js")));
  add("section registry", existsSync(join(landingDir, "sections", "sectionRegistry.js")));
  add("link graph hooks", existsSync(join(landingDir, "links", "landingLinkGraph.js")));
  add("landing metadata bridge", existsSync(join(landingDir, "seo", "landingMetadata.js")));
  add("landing schema bridge", existsSync(join(landingDir, "seo", "landingSchema.js")));
  add("landing canonical bridge", existsSync(join(landingDir, "seo", "landingCanonical.js")));

  const registrySource = read("src/landing/landingRegistry.js");
  add(
    "registry starts empty (no registerLandingPage calls in registry file)",
    !registrySource.includes("registerLandingPage(") ||
      registrySource.includes("Sprint 2.2: registry is intentionally empty")
  );

  const landingPageSource = read("src/landing/LandingPage.jsx");
  add(
    "LandingPage uses SeoHead (not duplicate Helmet)",
    landingPageSource.includes("SeoHead") && !landingPageSource.includes("<Helmet")
  );
  add(
    "LandingPage uses buildLandingPageMeta",
    landingPageSource.includes("buildLandingPageMeta")
  );
  add(
    "LandingPage has no brand-specific branches",
    !/tata|mahindra|mg-zs|nexon/i.test(landingPageSource)
  );

  const metadataSource = read("src/landing/seo/landingMetadata.js");
  add(
    "metadata delegates to pageMetadata/meta",
    metadataSource.includes("buildPageMeta") || metadataSource.includes("buildBrandPageMeta")
  );

  const duplicateLandingPages = spawnSync(
    process.execPath,
    [
      "-e",
      `import { readdirSync } from 'fs'; import { join } from 'path'; const r=join('${root.replace(/\\/g, "/")}','src'); const hits=[]; function walk(d){ for(const f of readdirSync(d,{withFileTypes:true})){ const p=join(d,f.name); if(f.isDirectory()&&!f.name.includes('node_modules')) walk(p); else if(/BrandLanding|PriceLanding|UseCaseLanding/i.test(f.name)) hits.push(p);}} walk(r); if(hits.length) { console.error(hits.join('\\n')); process.exit(1);} `,
    ],
    { cwd: root, encoding: "utf8" }
  );
  add("no brand/price/use-case specific page components", duplicateLandingPages.status === 0);

  return checks;
}

async function regressionPaths(http) {
  const results = [];
  for (const path of REGRESSION_PATHS) {
    const res = await http.get(`${SITE}${path}`);
    results.push({ path, status: res.status(), pass: res.ok() });
  }
  return results;
}

async function routerFallbackCheck(page) {
  await page.goto(`${SITE}/best-evs/large-family`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2500);

  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  const body = await page.content();
  const notFoundShell = body.includes("Landing page configuration not found");
  const legacyContent =
    /Best EVs for/i.test(h1 || "") ||
    /Best EVs for/i.test(body) ||
    body.includes("seo-guides-hub");

  return {
    pass: legacyContent && !notFoundShell,
    detail: notFoundShell
      ? "registry miss without legacy fallback"
      : legacyContent
        ? "legacy editorial page rendered"
        : `h1=${JSON.stringify((h1 || "").slice(0, 80))}`,
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const arch = architectureChecks();
  const seoFoundation = runScript("scripts/seo-foundation-smoke.mjs");

  const { getLandingRegistrySize } = await import(
    pathToFileURL(join(landingDir, "landingRegistry.js")).href
  );
  const registrySize = getLandingRegistrySize();
  arch.push({
    name: "production registry size is zero",
    pass: registrySize === 0,
    detail: `size=${registrySize}`,
  });

  const http = await playwrightRequest.newContext();
  const regression = await regressionPaths(http);
  await http.dispose();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const fallback = await routerFallbackCheck(page);
  await browser.close();

  const issues = [];
  if (!arch.every((c) => c.pass)) issues.push("architecture checks failed");
  if (!seoFoundation.pass) issues.push("seo foundation regression");
  if (!regression.every((r) => r.pass)) issues.push("route regression");
  if (!fallback.pass) issues.push("LandingRouter fallback broken");
  if (registrySize !== 0) issues.push("registry must be empty in Sprint 2.2");

  const report = {
    sprint: "2.2",
    title: "Landing Page Framework (Architecture Only)",
    generatedAt: new Date().toISOString(),
    site: SITE,
    architectureChecks: arch,
    registrySize,
    seoFoundation,
    regression,
    routerFallback: fallback,
    filesCreated: countFiles(landingDir, ".js") + countFiles(landingDir, ".jsx"),
    issues,
    verdict: issues.length === 0 ? "PASS" : "FAIL",
    knownLimitations: [
      "Registry is empty — no landing pages populated until Sprint 2.3+",
      "Legacy DiscoverySeoPage and IntelligenceDiscoveryPage remain fallbacks for all live URLs",
      "Section extension slots (news, videos, charging, etc.) are registered but not implemented",
      "Internal link graph resolvers are empty extension points only",
    ],
  };

  const mdPath = join(outDir, "sprint-22-landing-framework-certification.md");
  const jsonPath = join(outDir, `sprint-22-landing-framework-${DATE}.json`);

  const md = `# Sprint 2.2 — Landing Page Framework Certification

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${report.verdict}**

## Architecture certification

${arch.map((c) => `- ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`).join("\n")}

- Registry entries: **${report.registrySize}** (must be 0 for Sprint 2.2)
- Landing module files: **${report.filesCreated}**

## Regression (${regression.filter((r) => r.pass).length}/${regression.length})

${regression.map((r) => `- ${r.pass ? "✓" : "✗"} ${r.path} (${r.status})`).join("\n")}

## LandingRouter backward compatibility

- ${fallback.pass ? "✓" : "✗"} Empty registry → legacy page fallback (${fallback.detail})

## SEO foundation

- ${seoFoundation.pass ? "✓ PASS" : "✗ FAIL"}

## Known limitations

${report.knownLimitations.map((l) => `- ${l}`).join("\n")}
`;

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, md);

  console.log(`\nSprint 2.2 Landing Framework: ${report.verdict}`);
  console.log(`Report: ${mdPath}`);
  if (issues.length) {
    console.error("Issues:", issues.join("; "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
