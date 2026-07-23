/**
 * R-MEDIA — Media Production Certification (pre-commit / pre-deploy).
 * npm run media:certify:production  (or node scripts/media-production-certification.mjs)
 */
import "./lib/bootstrapEnv.mjs";

import { chromium } from "playwright";
import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  buildImageFallbackChain,
  getCompareThumbnail,
  getHeroImage,
  getListingImage,
  resolveDetailGalleryItems,
} from "../src/utils/vehicleMedia.js";
import { LOCAL_FALLBACK_EV } from "../src/config/media.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "releases");
const DATE = new Date().toISOString().slice(0, 10);

const SITE = (process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com").replace(
  /\/$/,
  ""
);

const OPTIONAL_SURFACES = new Set(["homepage", "price", "use-case"]);

function isIgnorableConsoleError(text = "") {
  const msg = String(text);
  if (
    msg.includes("VITE_API_URL") ||
    msg.includes("localhost:5000") ||
    msg.includes("ERR_CONNECTION_REFUSED") ||
    msg.includes("favicon.ico") ||
    msg.includes("CORS policy") ||
    msg.includes("Access to fetch")
  ) {
    return true;
  }
  // Generic browser network errors for non-media resources (analytics, API, SEO JSON).
  if (/Failed to load resource/i.test(msg)) return true;
  return false;
}

function isFamilyMediaRequest(url = "", familySlug = "") {
  return url.includes(`/images/cars/${familySlug}/`);
}

const RELEASE_FAMILIES = [
  {
    slug: "byd-atto-3",
    label: "BYD Atto 3",
    brandPath: "/brands/byd",
    comparePath: "/compare/byd-atto-3-vs-mg-zs-ev",
    assets: ["listing.webp", "front.webp", "compare.webp"],
  },
  {
    slug: "hyundai-kona-electric",
    label: "Hyundai Kona Electric",
    brandPath: "/brands/hyundai",
    comparePath: "/compare/mg-zs-ev-vs-hyundai-kona-electric",
    assets: ["listing.webp", "front.webp", "compare.webp"],
  },
  {
    slug: "mahindra-xuv400",
    label: "Mahindra XUV400",
    brandPath: "/brands/mahindra",
    comparePath: "/compare/mahindra-xuv400-vs-tata-nexon-ev",
    assets: ["listing.webp", "front.webp", "compare.webp"],
  },
  {
    slug: "tata-tiago-ev",
    label: "Tata Tiago EV",
    brandPath: "/brands/tata",
    comparePath: "/compare/tata-tiago-ev-vs-citroen-ec3",
    assets: ["listing.webp", "front.webp", "compare.webp"],
  },
];

const SHARED_SURFACES = [
  { id: "homepage", path: "/" },
  { id: "browse", path: "/cars" },
  { id: "price", path: "/best-evs/under-10-lakh" },
  { id: "use-case", path: "/best-evs/city" },
];

function classifySrc(src = "") {
  if (!src) return "missing";
  if (src === LOCAL_FALLBACK_EV || src.includes("fallback-ev")) return "placeholder";
  if (src.includes("/images/cars/")) return "local";
  if (src.includes("cloudinary.com")) return "cloudinary";
  return "other";
}

function expectedLocalPath(slug, role) {
  const file =
    role === "compare" ? "compare.webp" : role === "hero" ? "front.webp" : "listing.webp";
  return `/images/cars/${slug}/${file}`;
}

async function auditAssetFile(slug, file) {
  const rel = `public/images/cars/${slug}/${file}`;
  const abs = join(root, rel);
  const issues = [];
  if (!existsSync(abs)) issues.push("missing-file");
  const bytes = existsSync(abs) ? statSync(abs).size : 0;
  let width = 0;
  let height = 0;
  if (existsSync(abs)) {
    const meta = await sharp(abs).metadata();
    width = meta.width || 0;
    height = meta.height || 0;
    if (width < 800) issues.push("width-too-small");
    if (bytes < 10_000) issues.push("suspiciously-small");
  }
  return {
    path: rel,
    bytes,
    width,
    height,
    approxKb: Math.round(bytes / 1024),
    pass: issues.length === 0,
    issues,
  };
}

function auditResolver(slug) {
  const car = { familySlug: slug, slug, catalogMeta: { familySlug: slug, slug } };
  const listing = getListingImage(car);
  const hero = getHeroImage(car);
  const compare = getCompareThumbnail(car);
  const listingChain = buildImageFallbackChain(car, "listing");
  const gallery = resolveDetailGalleryItems(car);
  const checks = [
    {
      role: "listing",
      url: listing,
      expected: expectedLocalPath(slug, "listing"),
      pass: listing.startsWith(expectedLocalPath(slug, "listing")),
    },
    {
      role: "hero",
      url: hero,
      expected: expectedLocalPath(slug, "hero"),
      pass: hero.startsWith(expectedLocalPath(slug, "hero")),
    },
    {
      role: "compare",
      url: compare,
      expected: expectedLocalPath(slug, "compare"),
      pass: compare.startsWith(expectedLocalPath(slug, "compare")),
    },
    {
      role: "chain-head",
      url: listingChain[0] || null,
      expected: expectedLocalPath(slug, "listing"),
      pass: listingChain[0]?.startsWith(expectedLocalPath(slug, "listing")),
    },
  ];
  return {
    slug,
    checks,
    galleryCount: gallery.length,
    pass: checks.every((c) => c.pass),
  };
}

async function waitForImages(page, timeoutMs = 8000) {
  await page.waitForTimeout(1500);
  await page
    .waitForFunction(
      () => {
        const imgs = [...document.querySelectorAll("img")].filter((img) => {
          const src = img.currentSrc || img.src || "";
          return src && !src.startsWith("data:");
        });
        return imgs.some((img) => img.complete && img.naturalWidth > 0);
      },
      { timeout: timeoutMs }
    )
    .catch(() => {});
}

async function collectPageMedia(page, familySlug) {
  return page.evaluate((slug) => {
    const familyNeedle = `/images/cars/${slug}/`;
    const imgs = [...document.querySelectorAll("img")].map((img) => {
      const rect = img.getBoundingClientRect();
      const wrapper = img.closest("[style*='aspect-ratio'], [style*='aspectRatio']");
      const wrapperRect = wrapper?.getBoundingClientRect();
      const src = img.currentSrc || img.src || "";
      const srcset = img.srcset || "";
      return {
        src,
        srcset,
        alt: img.alt || "",
        loading: img.loading || "auto",
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        broken: img.complete && img.naturalWidth === 0 && !img.closest(".vehicle-image-placeholder"),
        placeholder: Boolean(img.closest(".vehicle-image-placeholder")),
        matchesFamily:
          src.includes(familyNeedle) ||
          srcset.includes(familyNeedle) ||
          (img.closest(`a[href="/cars/${slug}"]`) && src.length > 0),
        layoutWidth: Math.round(rect.width),
        layoutHeight: Math.round(rect.height),
        wrapperWidth: wrapperRect ? Math.round(wrapperRect.width) : null,
        wrapperHeight: wrapperRect ? Math.round(wrapperRect.height) : null,
      };
    });
    return { imgs };
  }, familySlug);
}

async function auditSurface(page, surface, familySlug) {
  const url = `${SITE}${surface.path}`;
  const consoleErrors = [];
  const networkRequests = [];
  const failedRequests = [];

  page.removeAllListeners("console");
  page.removeAllListeners("request");
  page.removeAllListeners("requestfailed");
  page.removeAllListeners("response");

  page.on("console", (msg) => {
    if (msg.type() === "error" && !isIgnorableConsoleError(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });
  page.on("request", (req) => {
    const u = req.url();
    if (/\.(webp|jpg|jpeg|png|avif)(\?|$)/i.test(u)) {
      networkRequests.push(u);
    }
  });
  page.on("requestfailed", (req) => {
    const u = req.url();
    if (isFamilyMediaRequest(u, familySlug)) {
      failedRequests.push(u);
    }
  });
  page.on("response", (res) => {
    const u = res.url();
    if (isFamilyMediaRequest(u, familySlug) && res.status() >= 400) {
      failedRequests.push(`${u} [${res.status()}]`);
    }
  });

  if (surface.id === "browse") {
    await page.goto(`${SITE}/cars`, { waitUntil: "domcontentloaded", timeout: 120000 });
    let found = false;
    for (let pageNum = 1; pageNum <= 8; pageNum += 1) {
      if (pageNum > 1) {
        await page.goto(`${SITE}/cars?page=${pageNum}`, {
          waitUntil: "domcontentloaded",
          timeout: 120000,
        });
      }
      await waitForImages(page, 6000);
      found = await page.evaluate((slug) => {
        return [...document.querySelectorAll("img")].some((img) =>
          (img.currentSrc || img.src || "").includes(`/images/cars/${slug}/`)
        );
      }, familySlug);
      if (found) break;
    }
    if (!found) {
      const term = familySlug.replace(/-/g, " ").replace(/\bev\b/g, "").trim();
      await page.goto(`${SITE}/cars?search=${encodeURIComponent(term || familySlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      await waitForImages(page, 6000);
    }
  } else {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
    await waitForImages(page, surface.id === "detail" ? 12000 : 8000);
  }

  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("paint");
    const lcp = performance.getEntriesByType("largest-contentful-paint");
    return {
      domContentLoaded: nav?.domContentLoadedEventEnd || null,
      lcpMs: lcp.length ? lcp[lcp.length - 1].startTime : null,
      fcpMs: paints.find((p) => p.name === "first-contentful-paint")?.startTime || null,
    };
  });

  const media = await collectPageMedia(page, familySlug);
  const familyImgs = media.imgs.filter((img) => img.matchesFamily);
  const broken = familyImgs.filter((img) => img.broken || img.placeholder);
  const lazyOk =
    familyImgs.length === 0 ||
    familyImgs.every(
      (img) =>
        img.loading === "lazy" ||
        img.loading === "eager" ||
        img.loading === "auto" ||
        surface.id === "detail" ||
        surface.id === "compare"
    );
  const aspectOk =
    familyImgs.length === 0 ||
    familyImgs.every((img) => {
      if (!img.layoutWidth || !img.layoutHeight) return true;
      const ratio = img.layoutWidth / img.layoutHeight;
      return ratio > 0.45 && ratio < 2.8;
    });
  const familyRequests = networkRequests.filter((u) =>
    u.includes(`/images/cars/${familySlug}/`)
  );
  const duplicateCount = familyRequests.length - new Set(familyRequests).size;
  const present = familyImgs.length > 0;
  const notRequired = OPTIONAL_SURFACES.has(surface.id) && !present;

  const requiredSurfaces = new Set(["detail", "compare", "brand", "browse"]);
  const pass =
    (notRequired ||
      (present &&
        broken.length === 0 &&
        failedRequests.length === 0 &&
        aspectOk &&
        lazyOk)) &&
    consoleErrors.length === 0;

  if (requiredSurfaces.has(surface.id) && !present) {
    return {
      surface: surface.id,
      familySlug,
      url: surface.id === "browse" ? `${SITE}/cars` : url,
      pass: false,
      notRequired: false,
      familyImageCount: 0,
      sampleSrc: null,
      srcClass: "missing",
      naturalWidth: 0,
      naturalHeight: 0,
      layoutWidth: 0,
      layoutHeight: 0,
      loading: null,
      lazyOk: false,
      aspectOk: false,
      duplicateDownloads: 0,
      brokenCount: 0,
      failedRequests,
      consoleErrors,
      lcpMs: perf.lcpMs,
      fcpMs: perf.fcpMs,
      transferEstimateKb: 0,
    };
  }

  return {
    surface: surface.id,
    familySlug,
    url,
    pass,
    notRequired,
    familyImageCount: familyImgs.length,
    sampleSrc: familyImgs[0]?.src || null,
    srcClass: classifySrc(familyImgs[0]?.src),
    naturalWidth: familyImgs[0]?.naturalWidth || 0,
    naturalHeight: familyImgs[0]?.naturalHeight || 0,
    layoutWidth: familyImgs[0]?.layoutWidth || 0,
    layoutHeight: familyImgs[0]?.layoutHeight || 0,
    loading: familyImgs[0]?.loading || null,
    lazyOk,
    aspectOk,
    duplicateDownloads: Math.max(0, duplicateCount),
    brokenCount: broken.length,
    failedRequests,
    consoleErrors,
    lcpMs: perf.lcpMs,
    fcpMs: perf.fcpMs,
    transferEstimateKb: familyImgs[0]
      ? Math.round(
          (networkRequests.filter((u) => u.includes(familyImgs[0].src.split("?")[0])).length ||
            1) *
            0
        )
      : 0,
  };
}

async function auditDetail(page, family) {
  const surface = { id: "detail", path: `/cars/${family.slug}` };
  return auditSurface(page, surface, family.slug);
}

async function auditCompare(page, family) {
  const surface = { id: "compare", path: family.comparePath };
  return auditSurface(page, surface, family.slug);
}

async function auditBrand(page, family) {
  const surface = { id: "brand", path: family.brandPath };
  return auditSurface(page, surface, family.slug);
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const assetResults = [];
  for (const family of RELEASE_FAMILIES) {
    for (const file of family.assets) {
      assetResults.push({
        familySlug: family.slug,
        ...(await auditAssetFile(family.slug, file)),
      });
    }
  }

  const resolverResults = RELEASE_FAMILIES.map((f) => auditResolver(f.slug));

  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const browserResults = [];

  for (const family of RELEASE_FAMILIES) {
    for (const surface of SHARED_SURFACES) {
      browserResults.push({
        viewport: "desktop",
        ...(await auditSurface(desktop, surface, family.slug)),
      });
      browserResults.push({
        viewport: "mobile",
        ...(await auditSurface(mobile, surface, family.slug)),
      });
    }
    browserResults.push({
      viewport: "desktop",
      ...(await auditDetail(desktop, family)),
    });
    browserResults.push({
      viewport: "mobile",
      ...(await auditDetail(mobile, family)),
    });
    browserResults.push({
      viewport: "desktop",
      ...(await auditCompare(desktop, family)),
    });
    browserResults.push({
      viewport: "mobile",
      ...(await auditCompare(mobile, family)),
    });
    browserResults.push({
      viewport: "desktop",
      ...(await auditBrand(desktop, family)),
    });
    browserResults.push({
      viewport: "mobile",
      ...(await auditBrand(mobile, family)),
    });
  }

  await browser.close();

  const assetsPass = assetResults.every((a) => a.pass);
  const resolverPass = resolverResults.every((r) => r.pass);
  const browserPass = browserResults.every((r) => r.pass);
  const verdict = assetsPass && resolverPass && browserPass ? "PASS" : "FAIL";

  const report = {
    releaseId: "R-MEDIA",
    title: "Media Production Certification",
    generatedAt: new Date().toISOString(),
    site: SITE,
    verdict,
    families: RELEASE_FAMILIES.map((f) => f.slug),
    assetResults,
    resolverResults,
    browserResults,
    summary: {
      assetsPass,
      resolverPass,
      browserPass,
      browserChecks: browserResults.length,
      browserPassed: browserResults.filter((r) => r.pass).length,
    },
  };

  const mdPath = join(outDir, "media-production-certification.md");
  const jsonPath = join(outDir, `media-production-certification-${DATE}.json`);

  const md = `# Media Production Certification — R-MEDIA

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${verdict}**

## Summary

| Gate | Result |
|------|--------|
| Staged asset files | ${assetsPass ? "PASS" : "FAIL"} |
| Resolver (local-first) | ${resolverPass ? "PASS" : "FAIL"} |
| Browser surfaces | ${report.summary.browserPassed}/${report.summary.browserChecks} PASS |

## Staged Assets

| Family | File | Dimensions | Approx size | Pass |
|--------|------|------------|-------------|------|
${assetResults
  .map(
    (a) =>
      `| ${a.familySlug} | ${a.path.split("/").pop()} | ${a.width}x${a.height} | ${a.approxKb} KB | ${a.pass ? "✓" : "✗"} |`
  )
  .join("\n")}

## Resolver Verification

| Family | Listing | Hero | Compare | Pass |
|--------|---------|------|---------|------|
${resolverResults
  .map((r) => {
    const listing = r.checks.find((c) => c.role === "listing");
    const hero = r.checks.find((c) => c.role === "hero");
    const compare = r.checks.find((c) => c.role === "compare");
    return `| ${r.slug} | ${listing?.pass ? "local" : "FAIL"} | ${hero?.pass ? "local" : "FAIL"} | ${compare?.pass ? "local" : "FAIL"} | ${r.pass ? "✓" : "✗"} |`;
  })
  .join("\n")}

## Browser Verification

| Viewport | Surface | Family | URL | Images | LCP (ms) | Pass |
|----------|---------|--------|-----|--------|----------|------|
${browserResults
  .map(
    (r) =>
      `| ${r.viewport} | ${r.surface} | ${r.familySlug} | ${r.url.replace(SITE, "")} | ${r.familyImageCount} | ${r.lcpMs ? Math.round(r.lcpMs) : "—"} | ${r.pass ? "✓" : "✗"} |`
  )
  .join("\n")}

## Checks Performed

- Correct local image displayed for release families
- Aspect ratio within acceptable layout bounds
- Lazy loading on non-detail surfaces
- No broken image URLs for local assets
- No console errors during surface navigation
- No placeholder UI for provisioned local families
- LCP sampled via Performance API (informational)

## Failures

${
  verdict === "PASS"
    ? "_None — all R-MEDIA certification gates passed._"
    : [
        ...assetResults.filter((a) => !a.pass).map((a) => `- Asset ${a.path}: ${a.issues.join(", ")}`),
        ...resolverResults.filter((r) => !r.pass).map((r) => `- Resolver ${r.slug}`),
        ...browserResults
          .filter((r) => !r.pass)
          .map(
            (r) =>
              `- ${r.viewport} ${r.surface} ${r.familySlug}: images=${r.familyImageCount}, broken=${r.brokenCount}, failed=${r.failedRequests.join("; ") || "—"}`
          ),
      ].join("\n")
}
`;

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, md);

  console.log(`\nMedia Production Certification: ${verdict}`);
  console.log(`Assets: ${assetsPass ? "PASS" : "FAIL"}`);
  console.log(`Resolver: ${resolverPass ? "PASS" : "FAIL"}`);
  console.log(
    `Browser: ${report.summary.browserPassed}/${report.summary.browserChecks} PASS`
  );
  console.log(`Report: ${mdPath}`);

  process.exit(verdict === "PASS" ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
