/**
 * Static deployment readiness — no network. Validates repo artifacts before push.
 * Usage: npm run deploy:repo-check
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const issues = [];
const ok = [];

function pass(m) {
  ok.push(m);
  console.log(`✅ ${m}`);
}
function fail(m) {
  issues.push(m);
  console.log(`❌ ${m}`);
}

function read(p) {
  try {
    return readFileSync(join(root, p), "utf8");
  } catch {
    return null;
  }
}

function main() {
  console.log("\n=== EVSavari deployment repo validation (static) ===\n");

  if (!existsSync(join(root, "vercel.json"))) fail("vercel.json missing");
  else {
    const v = read("vercel.json");
    if (!v || !/"destination"\s*:\s*"\/?index\.html"/.test(v))
      fail("vercel.json: expected SPA rewrite to index.html");
    else pass("vercel.json present + SPA rewrite");
    if (v && /www\.evsavari\.com/.test(v) && /evsavari\.com/.test(v))
      pass("vercel.json: www → apex redirect configured");
    else fail("vercel.json: missing www → apex redirect (canonical consistency)");
  }

  const ci = read(".github/workflows/ci.yml");
  if (!ci) fail(".github/workflows/ci.yml missing");
  else {
    if (!/post-launch:smoke/.test(ci)) fail("CI: post-launch:smoke not wired");
    else pass("CI: post-launch:smoke");
    if (!/ingestion:smoke/.test(ci)) fail("CI: ingestion:smoke not wired");
    else pass("CI: ingestion:smoke");
    if (!/npm run build/.test(ci)) fail("CI: production build step missing");
    else pass("CI: production build");
  }

  const robots = read("public/robots.txt");
  if (!robots) fail("public/robots.txt missing");
  else if (!/Sitemap:\s*https?:\/\//i.test(robots))
    fail("robots.txt: no Sitemap: URL");
  else pass("robots.txt: Sitemap directive");

  const idx = read("index.html");
  if (!idx) fail("index.html missing");
  else if (!/id=["']root["']/i.test(idx)) fail("index.html: missing #root mount");
  else pass("index.html: SPA #root");

  const pkg = read("package.json");
  if (!pkg) fail("package.json missing");
  else {
    const j = JSON.parse(pkg);
    if (!j.scripts?.["deploy:smoke"]) fail("package.json: deploy:smoke script missing");
    else pass("package.json: deploy:smoke");
    if (!j.scripts?.["post-launch:smoke"]) fail("package.json: post-launch:smoke missing");
    else pass("package.json: post-launch:smoke");
  }

  const cfg = read("src/config.js");
  if (cfg && /domain:\s*["']evsavari\.com["']/.test(cfg))
    pass("src/config.js: APP domain evsavari.com");
  else fail("src/config.js: expected domain evsavari.com");

  const renderEx = read("docs/deploy/examples/render-backend.service.yaml");
  if (renderEx && /healthCheckPath/.test(renderEx))
    pass("docs/deploy/examples/render-backend.service.yaml present");
  else fail("Render example blueprint missing or incomplete");

  const publishedManifest = join(root, "public/catalog/published/manifest.json");
  if (!existsSync(publishedManifest)) {
    fail("public/catalog/published/manifest.json missing — run npm run catalog:publish");
  } else {
    try {
      const manifest = JSON.parse(read("public/catalog/published/manifest.json"));
      if (!manifest.snapshotId || !manifest.familyCount) {
        fail("catalog published manifest.json: missing snapshotId or familyCount");
      } else {
        pass(
          `catalog published manifest (${manifest.familyCount} families, snapshot ${String(manifest.snapshotId).slice(0, 24)}…)`
        );
      }
    } catch {
      fail("catalog published manifest.json: invalid JSON");
    }
  }

  if (!existsSync(join(root, "api/health.js"))) {
    fail("api/health.js missing — frontend health endpoint required for PCS");
  } else {
    pass("api/health.js present (Vercel liveness)");
  }

  if (ci && !/catalog:certify:strict/.test(ci)) {
    fail("CI: catalog:certify:strict not wired");
  } else if (ci) {
    pass("CI: catalog:certify:strict");
  }

  console.log("");
  if (issues.length) {
    console.log("Failures:\n", issues.map((m) => ` - ${m}`).join("\n"));
    process.exit(1);
  }
  console.log(`All static checks passed (${ok.length}).\n`);
}

main();
