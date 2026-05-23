/**
 * Post-deploy smoke — HTTP checks against a live site + optional API probe.
 * Safe production checks only (GET/HEAD, read-only). Exits 1 on hard failures.
 *
 * Usage:
 *   EVSAVARI_SITE_ORIGIN=https://evsavari.com npm run deploy:smoke
 *   npm run deploy:smoke -- https://staging.evsavari.com
 *
 * Optional API (defaults to VITE_API_URL or production fallback):
 *   EVSAVARI_API_URL=https://evsavari-api.onrender.com npm run deploy:smoke
 *
 * Optional Cloudinary sample (defaults match launch-validate):
 *   EVSAVARI_CLOUDINARY_NAME=dznvmumze npm run deploy:smoke
 */

const SITE =
  process.argv[2]?.replace(/\/$/, "") ||
  process.env.EVSAVARI_SITE_ORIGIN?.replace(/\/$/, "") ||
  "https://evsavari.com";

const API_URL = (
  process.env.EVSAVARI_API_URL ||
  process.env.VITE_API_URL ||
  "https://evsavari-api.onrender.com"
).replace(/\/$/, "");

const CLOUD_NAME =
  process.env.EVSAVARI_CLOUDINARY_NAME ||
  process.env.VITE_CLOUDINARY_CLOUD_NAME ||
  "dznvmumze";

/** Stable deep paths (must resolve to SPA shell on Vercel rewrite) */
const DEEP_COMPARE_PATH =
  process.env.EVSAVARI_DEPLOY_SMOKE_COMPARE_PATH ||
  "/compare/tata-nexon-ev-vs-mg-zs-ev";
const DEEP_DISCOVER_PATH =
  process.env.EVSAVARI_DEPLOY_SMOKE_DISCOVER_PATH || "/discover/city-driving";

/** Must exist in the live main JS bundle (guards stale frontend deploys) */
const REQUIRED_ADMIN_BUNDLE_PATHS = [
  "/admin/public-beta-ops",
  "/admin/recommendation-refinement",
  "/admin/content-usefulness",
  "/admin/conversion-refinement",
  "/admin/media-health",
  "/admin/seo-authority",
];

const issues = [];
const ok = [];
const warnings = [];

function pass(msg) {
  ok.push(msg);
  console.log(`✅ ${msg}`);
}

function fail(msg) {
  issues.push(msg);
  console.log(`❌ ${msg}`);
}

function warn(msg) {
  warnings.push(msg);
  console.log(`⚠️  ${msg}`);
}

function errMsg(e) {
  return e?.cause?.message || e?.message || String(e);
}

async function getText(url, { method = "GET" } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const res = await fetch(url, {
      method,
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "evsavari-deploy-smoke/2" },
    });
    const text = method === "HEAD" ? "" : await res.text();
    return { res, text };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  console.log("\n=== EVSavari deploy smoke ===\n");
  console.log(`Site:       ${SITE}`);
  console.log(`API:        ${API_URL}`);
  console.log(`Cloudinary: ${CLOUD_NAME}\n`);

  // robots.txt
  try {
    const { res, text } = await getText(`${SITE}/robots.txt`);
    if (!res.ok) fail(`robots.txt HTTP ${res.status}`);
    else if (!/sitemap/i.test(text)) fail("robots.txt missing Sitemap reference");
    else pass(`robots.txt (${res.status})`);
  } catch (e) {
    fail(`robots.txt: ${errMsg(e)}`);
  }

  // sitemap index
  let firstChildSitemap = "";
  try {
    const { res, text } = await getText(`${SITE}/sitemap.xml`);
    if (!res.ok) fail(`sitemap.xml HTTP ${res.status}`);
    else if (!/<sitemapindex|<urlset/i.test(text))
      fail("sitemap.xml does not look like a sitemap index or urlset");
    else {
      pass(`sitemap.xml (${res.status})`);
      const m = text.match(/<loc>\s*([^<\s]+)\s*<\/loc>/i);
      if (m) firstChildSitemap = m[1].trim();
    }
  } catch (e) {
    fail(`sitemap.xml: ${errMsg(e)}`);
  }

  // First child sitemap from index (usually static.xml on this project)
  if (firstChildSitemap) {
    try {
      const { res, text } = await getText(firstChildSitemap);
      if (!res.ok)
        fail(`Child sitemap HTTP ${res.status}: ${firstChildSitemap}`);
      else if (!/<urlset/i.test(text))
        warn(`Child sitemap may be empty/unexpected: ${firstChildSitemap}`);
      else pass(`Child sitemap OK (${res.status})`);
    } catch (e) {
      fail(`Child sitemap: ${errMsg(e)}`);
    }
  }

  // HTML shell (SPA) + X-Robots-Tag safety
  try {
    const { res, text } = await getText(`${SITE}/`);
    if (!res.ok) fail(`Homepage HTTP ${res.status}`);
    else if (!/id=["']root["']/i.test(text))
      fail("Homepage HTML unexpected (missing SPA #root)");
    else pass(`Homepage HTML (${res.status})`);

    const robotsTag = res.headers.get("x-robots-tag") || "";
    if (/noindex/i.test(robotsTag))
      fail(`Homepage X-Robots-Tag blocks indexing: ${robotsTag}`);
    else if (robotsTag) pass(`Homepage X-Robots-Tag: ${robotsTag} (not noindex)`);
    else pass("Homepage: no X-Robots-Tag (OK)");
  } catch (e) {
    fail(`Homepage: ${errMsg(e)}`);
  }

  // Live bundle must include ops admin routes (client-side router paths)
  try {
    const { text: homeHtml } = await getText(`${SITE}/`);
    const indexMatch = homeHtml.match(/\/assets\/index-[^"]+\.js/);
    if (!indexMatch) {
      fail("Homepage HTML missing index-*.js script (cannot verify admin routes)");
    } else {
      const indexUrl = `${SITE}${indexMatch[0]}`;
      const { res, text: indexJs } = await getText(indexUrl);
      if (!res.ok) {
        fail(`Main bundle ${indexMatch[0]} HTTP ${res.status}`);
      } else {
        const missing = REQUIRED_ADMIN_BUNDLE_PATHS.filter((p) => !indexJs.includes(p));
        if (missing.length) {
          fail(
            `Stale frontend deploy: main bundle missing admin routes: ${missing.join(", ")}`
          );
        } else {
          pass(
            `Main bundle includes ${REQUIRED_ADMIN_BUNDLE_PATHS.length} critical admin routes`
          );
        }
      }
    }
  } catch (e) {
    fail(`Admin bundle check: ${errMsg(e)}`);
  }

  // Deep routes → SPA shell (compare list + deep compare + discover + admin)
  const spaPaths = [
    ["/compare", "compare hub"],
    [DEEP_COMPARE_PATH, "deep compare"],
    [DEEP_DISCOVER_PATH, "discovery preset"],
    ["/admin", "admin shell (auth is client-side)"],
  ];
  for (const [path, label] of spaPaths) {
    try {
      const { res, text } = await getText(`${SITE}${path}`);
      if (!res.ok)
        fail(`${path} HTTP ${res.status} (SPA rewrite may be broken) [${label}]`);
      else if (!/<html/i.test(text))
        fail(`${path} response is not HTML [${label}]`);
      else pass(`${path} SPA shell (${res.status}) [${label}]`);
    } catch (e) {
      fail(`${path}: ${errMsg(e)} [${label}]`);
    }
  }

  // SEO static JSON (sample)
  try {
    const { res } = await getText(`${SITE}/seo-data/content-manifest.json`);
    if (!res.ok)
      fail(`content-manifest.json HTTP ${res.status} (static /seo-data/ serving)`);
    else pass(`seo-data/content-manifest.json (${res.status})`);
  } catch (e) {
    fail(`content-manifest: ${errMsg(e)}`);
  }

  // API catalog
  try {
    const { res, text } = await getText(`${API_URL}/cars?limit=1`);
    if (!res.ok) fail(`API /cars HTTP ${res.status}`);
    else {
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      if (!data || !Array.isArray(data.cars))
        fail("API /cars JSON shape unexpected");
      else pass(`API GET /cars?limit=1 (${res.status})`);
    }
  } catch (e) {
    fail(`API: ${errMsg(e)}`);
  }

  // Optional API health (informational — many deployments still use /cars for health)
  for (const healthPath of ["/health", "/api/health"]) {
    try {
      const { res } = await getText(`${API_URL}${healthPath}`, { method: "GET" });
      if (res.ok) pass(`API ${healthPath} (${res.status})`);
      else warn(`API ${healthPath} HTTP ${res.status} (optional)`);
    } catch (e) {
      warn(`API ${healthPath}: ${errMsg(e)} (optional)`);
    }
  }

  // Cloudinary sample HEAD (catalog hero — read-only CDN)
  try {
    const img = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/evsavari/catalog/families/tata-nexon-ev/hero.jpg`;
    const { res } = await getText(img, { method: "HEAD" });
    if (!res.ok)
      warn(`Cloudinary HEAD ${res.status} (${CLOUD_NAME}) — check cloud name / asset`);
    else pass(`Cloudinary sample HEAD (${res.status})`);
  } catch (e) {
    warn(`Cloudinary: ${errMsg(e)}`);
  }

  // Turnstile / analytics: not asserted on static HTML (injected from app chunks).
  warn("Turnstile + GA: verify manually on a form page and Network tab (not static HTML).");

  console.log("");
  if (warnings.length) {
    console.log("Warnings:\n", warnings.map((m) => ` - ${m}`).join("\n"));
    console.log("");
  }
  if (issues.length) {
    console.log("Failures:\n", issues.map((m) => ` - ${m}`).join("\n"));
    process.exit(1);
  }
  console.log(`All required checks passed (${ok.length}).\n`);
}

main();
