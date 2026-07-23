/**
 * Recovery Sprint R1 — browser-rendered vehicle media certification.
 * npm run media:certify:recovery-r1
 */
import "./lib/bootstrapEnv.mjs";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PRODUCTION_FAMILY_SLUGS } from "../src/media/productionFamilies.js";
import { LOCAL_FALLBACK_EV } from "../src/config/media.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "releases");
const DATE = new Date().toISOString().slice(0, 10);

const SITE = (process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com").replace(
  /\/$/,
  ""
);

const PRIORITY_FAMILIES = [
  "tata-tiago-ev",
  "hyundai-kona-electric",
  "mg-comet-ev",
  "mahindra-xev-9e",
  "mahindra-xuv400",
  "byd-atto-3",
];

function isFallbackSvg(src = "") {
  return src.includes("fallback-ev.svg") || src === LOCAL_FALLBACK_EV;
}

function classifySrc(src = "") {
  if (!src) return "missing";
  if (isFallbackSvg(src)) return "placeholder";
  if (src.includes("/images/cars/")) return "local";
  if (src.includes("cloudinary.com")) return "cloudinary";
  return "other";
}

async function collectRenderedImages(page, selector = "img") {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((img) => ({
      src: img.currentSrc || img.src || "",
      alt: img.alt || "",
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      placeholderText: Boolean(
        img.closest(".vehicle-image-placeholder")
      ),
    }));
  }, selector);
}

function auditImageRow(row, { role = "listing", allowFallback = false } = {}) {
  const issues = [];
  if (!row?.src) issues.push("missing-src");
  if (row?.placeholderText) issues.push("placeholder-ui");
  if (row?.complete && row.naturalWidth === 0) issues.push("broken-render");
  if (!allowFallback && isFallbackSvg(row?.src)) issues.push("fallback-svg");
  if (classifySrc(row?.src) === "cloudinary" && row?.naturalWidth === 0) {
    issues.push("cloudinary-broken");
  }
  return {
    role,
    src: row?.src || null,
    class: classifySrc(row?.src),
    naturalWidth: row?.naturalWidth ?? 0,
    naturalHeight: row?.naturalHeight ?? 0,
    pass: issues.length === 0,
    issues,
  };
}

async function auditBrowseCards(page) {
  const byFamily = {};
  let pagesScanned = 0;

  for (let pageNum = 1; pageNum <= 20; pageNum += 1) {
    const url =
      pageNum === 1 ? `${SITE}/cars` : `${SITE}/cars?page=${pageNum}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1200);

    const rows = await page.evaluate(() => {
      return [...document.querySelectorAll("img.car-image")].map((node) => {
        const src = node.currentSrc || node.src || "";
        const familySlug = src
          .match(/\/images\/cars\/([a-z0-9-]+)\//i)?.[1]
          ?.toLowerCase();
        if (!familySlug) return null;
        return {
          familySlug,
          src,
          alt: node.alt || "",
          naturalWidth: node.naturalWidth,
          naturalHeight: node.naturalHeight,
          complete: node.complete,
          placeholderText: Boolean(
            node.closest(".vehicle-image-placeholder")
          ),
        };
      }).filter(Boolean);
    });

    if (rows.length === 0) break;
    pagesScanned += 1;

    for (const row of rows) {
      if (!byFamily[row.familySlug]) {
        byFamily[row.familySlug] = row;
      }
    }

    if (PRODUCTION_FAMILY_SLUGS.every((slug) => byFamily[slug])) {
      break;
    }
  }

  for (const familySlug of PRODUCTION_FAMILY_SLUGS) {
    if (byFamily[familySlug]) continue;

    const searchTerm = familySlug
      .replace(/-/g, " ")
      .replace(/\bev\b/g, "")
      .trim()
      .split(/\s+/)
      .slice(-2)
      .join(" ");

    await page.goto(
      `${SITE}/cars?search=${encodeURIComponent(searchTerm || familySlug)}`,
      { waitUntil: "networkidle", timeout: 90000 }
    );
    await page.waitForTimeout(1200);

    const row = await page.evaluate((slug) => {
      const node = [...document.querySelectorAll("img.car-image")].find(
        (img) => (img.currentSrc || img.src || "").includes(`/images/cars/${slug}/`)
      );
      if (!node) return null;
      return {
        familySlug: slug,
        src: node.currentSrc || node.src || "",
        alt: node.alt || "",
        naturalWidth: node.naturalWidth,
        naturalHeight: node.naturalHeight,
        complete: node.complete,
        placeholderText: Boolean(
          node.closest(".vehicle-image-placeholder")
        ),
      };
    }, familySlug);

    if (row) byFamily[familySlug] = row;
  }

  const audited = {};
  for (const familySlug of PRODUCTION_FAMILY_SLUGS) {
    const row = byFamily[familySlug];
    audited[familySlug] = auditImageRow(row, { role: "listing" });
  }

  return {
    surface: "browse",
    url: `${SITE}/cars`,
    pagesScanned,
    cardsSeen: Object.keys(byFamily).length,
    pass: PRODUCTION_FAMILY_SLUGS.every(
      (slug) => audited[slug]?.pass === true
    ),
    families: audited,
  };
}

async function auditHomepage(page) {
  await page.goto(`${SITE}/`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.waitForTimeout(2000);
  const imgs = await collectRenderedImages(page, "img.car-image");
  const rows = imgs.map((img) => auditImageRow(img, { role: "listing" }));
  return {
    surface: "homepage",
    url: `${SITE}/`,
    cardsSeen: imgs.length,
    pass: rows.every((r) => r.pass),
    rows,
  };
}

async function auditSearch(page, query = "kona") {
  await page.goto(
    `${SITE}/cars?search=${encodeURIComponent(query)}`,
    {
      waitUntil: "networkidle",
      timeout: 90000,
    }
  );
  await page.waitForTimeout(1500);
  const imgs = await collectRenderedImages(page, "img.car-image");
  const rows = imgs.map((img) => auditImageRow(img, { role: "listing" }));
  return {
    surface: `search:${query}`,
    url: `${SITE}/cars?search=${encodeURIComponent(query)}`,
    cardsSeen: imgs.length,
    pass: rows.length > 0 && rows.every((r) => r.pass),
    rows,
  };
}

async function auditCompare(page, slugs) {
  const qs = slugs.join(",");
  await page.goto(`${SITE}/compare?cars=${qs}`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.waitForTimeout(3000);

  const rows = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].filter((img) => {
      const src = img.currentSrc || img.src || "";
      return /images\/cars|cloudinary|fallback-ev/i.test(src);
    });
    return imgs.map((img) => ({
      src: img.currentSrc || img.src || "",
      alt: img.alt || "",
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      placeholderText: Boolean(img.closest(".vehicle-image-placeholder")),
    }));
  });

  const audited = rows.map((row) =>
    auditImageRow(row, { role: "compare" })
  );

  return {
    surface: "compare",
    url: `${SITE}/compare?cars=${qs}`,
    imagesSeen: rows.length,
    pass: rows.length >= slugs.length && audited.every((r) => r.pass),
    rows: audited,
  };
}

async function auditCarDetail(page, familySlug) {
  const url = `${SITE}/cars/${familySlug}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const hero = document.querySelector(
      ".detail-hero-image-wrap img, .cd-hero__frame img"
    );
    const thumbs = [...document.querySelectorAll(".cd-hero__thumbs img")];
    const listingCards = [...document.querySelectorAll("img.car-image")];
    const compact = [...document.querySelectorAll(".compact-car-card img")];

    const mapImg = (img) =>
      img
        ? {
            src: img.currentSrc || img.src || "",
            alt: img.alt || "",
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete,
            placeholderText: Boolean(
              img.closest(".vehicle-image-placeholder")
            ),
          }
        : null;

    return {
      hero: mapImg(hero),
      thumbs: thumbs.map(mapImg),
      related: [...listingCards, ...compact].map(mapImg),
      placeholderCount: document.querySelectorAll(
        ".vehicle-image-placeholder"
      ).length,
    };
  });

  const hero = auditImageRow(data.hero, { role: "hero" });
  const thumbs = data.thumbs.map((t, i) =>
    auditImageRow(t, {
      role: `gallery-${i}`,
      allowFallback: false,
    })
  );
  const related = data.related.map((r, i) =>
    auditImageRow(r, { role: `related-${i}` })
  );

  const pass =
    hero.pass &&
    data.placeholderCount === 0 &&
    thumbs.every((t) => t.pass) &&
    related.every((r) => r.pass || !r.src);

  return {
    familySlug,
    url,
    pass,
    hero,
    thumbs,
    related,
    placeholderCount: data.placeholderCount,
  };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  const surfaces = [];
  surfaces.push(await auditHomepage(page));
  surfaces.push(await auditBrowseCards(page));
  surfaces.push(await auditSearch(page, "tiago"));
  surfaces.push(await auditSearch(page, "kona"));
  surfaces.push(await auditCompare(page, PRIORITY_FAMILIES.slice(0, 3)));

  const familyResults = [];
  for (const slug of PRODUCTION_FAMILY_SLUGS) {
    familyResults.push(await auditCarDetail(page, slug));
  }

  await browser.close();

  const failedFamilies = familyResults.filter((f) => !f.pass);
  const failedSurfaces = surfaces.filter((s) => !s.pass);
  const verdict =
    failedFamilies.length === 0 && failedSurfaces.length === 0
      ? "PASS"
      : "FAIL";

  const report = {
    sprint: "R1",
    title: "Production Media Recovery — Browser Certification",
    generatedAt: new Date().toISOString(),
    site: SITE,
    verdict,
    priorityFamilies: PRIORITY_FAMILIES,
    productionFamilyCount: PRODUCTION_FAMILY_SLUGS.length,
    passCount: familyResults.filter((f) => f.pass).length,
    failCount: failedFamilies.length,
    surfaces,
    families: familyResults,
    architecture: {
      singleResolver: "src/utils/vehicleMedia.js",
      fallbackOrder: ["local-webp", "cloudinary", "placeholder"],
      certificationMode: "browser-rendered (naturalWidth > 0, no fallback SVG for core roles)",
    },
  };

  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, `recovery-r1-media-certification-${DATE}.json`);
  const mdPath = join(outDir, "recovery-r1-media-certification.md");

  const md = `# Recovery Sprint R1 — Browser Media Certification

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${verdict}**

## Summary

- Production families browser-verified: **${report.passCount}/${report.productionFamilyCount}**
- Surfaces audited: homepage, browse, search, compare, car details (hero + gallery thumbs + related)

## Priority families

| Family | Detail pass | Hero src class |
|--------|-------------|----------------|
${PRIORITY_FAMILIES.map((slug) => {
  const row = familyResults.find((f) => f.familySlug === slug);
  return `| ${slug} | ${row?.pass ? "PASS ✅" : "FAIL ❌"} | ${row?.hero?.class || "—"} |`;
}).join("\n")}

## Failed families

${
  failedFamilies.length
    ? failedFamilies
        .map((f) => {
          const thumbFails = f.thumbs.filter((t) => !t.pass);
          return `- **${f.familySlug}**: hero=${f.hero.issues.join(",") || "ok"}; gallery fails=${thumbFails.length}; placeholders=${f.placeholderCount}`;
        })
        .join("\n")
    : "_None — all production families pass browser-rendered media checks._"
}

## Surfaces

| Surface | Pass |
|---------|------|
${surfaces.map((s) => `| ${s.surface} | ${s.pass ? "PASS ✅" : "FAIL ❌"} |`).join("\n")}
`;

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(mdPath, md, "utf8");

  console.log("\n=== Recovery R1 Browser Media Certification ===\n");
  console.log(`Site: ${SITE}`);
  console.log(`Verdict: ${verdict}`);
  console.log(
    `Families: ${report.passCount}/${report.productionFamilyCount} PASS`
  );
  console.log(`Surfaces: ${surfaces.filter((s) => s.pass).length}/${surfaces.length} PASS`);
  if (failedFamilies.length) {
    console.log("\nFailed families:");
    for (const f of failedFamilies) {
      console.log(`  - ${f.familySlug}`);
    }
  }
  console.log(`\nWrote:\n  ${mdPath}\n  ${jsonPath}\n`);

  process.exit(verdict === "PASS" ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
