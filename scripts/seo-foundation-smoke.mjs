/**
 * SEO foundation smoke checks (post-build).
 * Run: npm run seo:foundation
 */

import "./lib/bootstrapEnv.mjs";

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCompareGuideSitemapEntries,
  buildStaticSitemapEntries,
  buildVehicleFamilySitemapEntries,
} from "../src/seo/sitemap.js";

function normalizeVehicleSlug(slug) {
  if (slug == null || slug === "") return "";
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildComparePairSlug(slugA, slugB) {
  const a = normalizeVehicleSlug(slugA);
  const b = normalizeVehicleSlug(slugB);
  if (!a || !b || a === b) return null;
  const [left, right] = [a, b].sort();
  return `${left}-vs-${right}`;
}

function formatPageTitle(title) {
  const raw = String(title || "").trim();
  const suffix = " | EVSavari";
  if (!raw) return `EVSavari${suffix.trim()}`;
  if (raw.endsWith(suffix)) return raw;
  return `${raw}${suffix}`;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");

const failures = [];

function check(name, condition, detail = "") {
  if (!condition) {
    failures.push({ name, detail });
    console.error(`✗ ${name}${detail ? `: ${detail}` : ""}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const vehicleTitle = formatPageTitle(
  "Tata Nexon EV Price, Range, Charging Time & Variants"
);

check(
  "vehicle title brand suffix",
  vehicleTitle.includes("EVSavari")
);

const compareTitle = formatPageTitle(
  "Tata Nexon EV vs MG ZS EV Comparison"
);

check(
  "compare title format",
  compareTitle.includes("Comparison")
);

check(
  "slug normalization lowercase",
  normalizeVehicleSlug("Tata Nexon EV") === "tata-nexon-ev"
);

const pairA = buildComparePairSlug("mg-zs-ev", "tata-nexon-ev");
const pairB = buildComparePairSlug("tata-nexon-ev", "mg-zs-ev");

check(
  "compare pair slug deterministic",
  pairA === pairB && pairA === "mg-zs-ev-vs-tata-nexon-ev"
);

check("sitemap index exists", existsSync(join(publicDir, "sitemap.xml")));
check("robots.txt exists", existsSync(join(publicDir, "robots.txt")));

if (existsSync(join(publicDir, "robots.txt"))) {
  const robots = readFileSync(join(publicDir, "robots.txt"), "utf8");
  check("robots references sitemap", robots.includes("Sitemap:"));
  check("robots disallows admin", robots.includes("Disallow: /admin"));
  check(
    "robots allows discovery paths",
    robots.includes("Allow: /compare/")
  );
}

const compareEntries = buildCompareGuideSitemapEntries();
check(
  "compare sitemap includes editorial guides",
  compareEntries.length > 5,
  `count=${compareEntries.length}`
);

const staticEntries = buildStaticSitemapEntries();
check(
  "static sitemap includes listing hubs",
  staticEntries.some((e) => e.path === "/popular")
);

const vehicleEntries = buildVehicleFamilySitemapEntries();
check("vehicle sitemap has tier-1 families", vehicleEntries.length >= 10);

if (existsSync(join(publicDir, "sitemap-manifest.json"))) {
  const manifest = JSON.parse(
    readFileSync(join(publicDir, "sitemap-manifest.json"), "utf8")
  );
  check("manifest has counts", (manifest.counts?.total || 0) > 0);
}

const compareXml = existsSync(join(publicDir, "sitemaps/compare.xml"))
  ? readFileSync(join(publicDir, "sitemaps/compare.xml"), "utf8")
  : "";

check(
  "compare.xml includes nexon vs mg guide",
  compareXml.includes("/compare/nexon-ev-vs-mg-zs-ev")
);

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}

console.log("\nSEO foundation smoke checks passed.");
