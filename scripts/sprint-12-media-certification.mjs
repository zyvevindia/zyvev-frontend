/**
 * Sprint 1.2 — production media certification (runtime resolver audit).
 * npm run media:certify:sprint12
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PRODUCTION_FAMILY_SLUGS } from "../src/media/productionFamilies.js";
import {
  buildImageFallbackChain,
  getHeroImage,
  getListingImage,
} from "../src/utils/vehicleMedia.js";
import { LOCAL_FALLBACK_EV } from "../src/config/media.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "releases");
const date = new Date().toISOString().slice(0, 10);

const OEM_BY_PREFIX = [
  ["tata-", "Tata"],
  ["mg-", "MG"],
  ["mahindra-", "Mahindra"],
  ["byd-", "BYD"],
  ["hyundai-", "Hyundai"],
  ["kia-", "Kia"],
  ["bmw-", "BMW"],
  ["mercedes-", "Mercedes-Benz"],
  ["citroen-", "Citroen"],
  ["volvo-", "Volvo"],
  ["mini-", "MINI"],
  ["maruti-", "Maruti Suzuki"],
];

function oemForFamily(slug) {
  for (const [prefix, oem] of OEM_BY_PREFIX) {
    if (slug.startsWith(prefix)) return oem;
  }
  return "Other";
}

function classifyUrl(url) {
  if (!url) return "missing";
  if (url === LOCAL_FALLBACK_EV || url.includes("fallback-ev")) return "placeholder";
  if (url.startsWith("/images/cars/")) return "local";
  if (url.includes("cloudinary.com")) return "cloudinary";
  return "other";
}

function auditFamily(familySlug) {
  const car = { familySlug, slug: familySlug, catalogMeta: { familySlug, slug: familySlug } };
  const listing = getListingImage(car);
  const hero = getHeroImage(car);
  const listingChain = buildImageFallbackChain(car, "listing");
  const listingClass = classifyUrl(listing);
  const heroClass = classifyUrl(hero);
  const chainStartsLocal = listingChain[0]?.startsWith("/images/cars/");
  const pass =
    listingClass === "local" &&
    heroClass === "local" &&
    chainStartsLocal &&
    listing !== LOCAL_FALLBACK_EV;

  return {
    familySlug,
    oem: oemForFamily(familySlug),
    listing,
    hero,
    listingClass,
    heroClass,
    chainHead: listingChain[0] || null,
    pass,
  };
}

const families = PRODUCTION_FAMILY_SLUGS.map(auditFamily);
const byOem = new Map();

for (const row of families) {
  if (!byOem.has(row.oem)) {
    byOem.set(row.oem, { oem: row.oem, models: 0, pass: 0, fail: 0, families: [] });
  }
  const bucket = byOem.get(row.oem);
  bucket.models += 1;
  bucket.families.push(row);
  if (row.pass) bucket.pass += 1;
  else bucket.fail += 1;
}

const oemRows = [...byOem.values()].sort((a, b) => a.oem.localeCompare(b.oem));
const failed = families.filter((f) => !f.pass);
const verdict = failed.length === 0 ? "PASS" : "FAIL";

const report = {
  sprint: "1.2",
  title: "Media Stabilization & Production Certification",
  generatedAt: new Date().toISOString(),
  verdict,
  productionFamilyCount: families.length,
  passCount: families.filter((f) => f.pass).length,
  failCount: failed.length,
  oemSummary: oemRows.map((row) => ({
    oem: row.oem,
    models: row.models,
    status: row.fail === 0 ? "PASS" : "FAIL",
  })),
  families,
  architecture: {
    singleResolver: "src/utils/vehicleMedia.js",
    fallbackOrder: ["local-webp", "cloudinary", "placeholder"],
    manifestSource: "src/media/familyMediaManifest.js + src/media/localCarMediaManifest.js",
  },
};

mkdirSync(outDir, { recursive: true });
const jsonPath = join(outDir, `sprint-12-media-certification-${date}.json`);
const mdPath = join(outDir, "sprint-12-media-certification.md");

const md = `# Sprint 1.2 — Media Production Certification

**Generated:** ${report.generatedAt}  
**Verdict:** **${verdict}**

## OEM certification

| OEM | Models | Status |
|-----|--------|--------|
${oemRows
  .map(
    (row) =>
      `| ${row.oem} | ${row.models} | ${row.fail === 0 ? "PASS ✅" : "FAIL ❌"} |`
  )
  .join("\n")}

## Production families

| Family | Listing | Hero | Status |
|--------|---------|------|--------|
${families
  .map(
    (f) =>
      `| ${f.familySlug} | ${f.listingClass} | ${f.heroClass} | ${f.pass ? "PASS ✅" : "FAIL ❌"} |`
  )
  .join("\n")}

## Architecture

- **Single resolver:** \`src/utils/vehicleMedia.js\` (\`buildImageFallbackChain\`, \`getListingImage\`, \`getHeroImage\`)
- **Fallback order:** Local optimized WebP → Cloudinary → Placeholder
- **Manifest:** \`familyMediaManifest.js\` + \`localCarMediaManifest.js\`

## Failed families

${
  failed.length
    ? failed.map((f) => `- ${f.familySlug}: listing=${f.listing}, hero=${f.hero}`).join("\n")
    : "_None — all production families resolve to local WebP for listing and hero._"
}
`;

writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdPath, md, "utf8");

console.log("\n=== Sprint 1.2 Media Certification ===\n");
console.log(`Verdict: ${verdict}`);
console.log(`Production families: ${report.passCount}/${report.productionFamilyCount} PASS\n`);
for (const row of oemRows) {
  console.log(`  ${row.oem.padEnd(16)} ${row.models} models  ${row.fail === 0 ? "PASS" : "FAIL"}`);
}
console.log(`\nWrote:\n  ${mdPath}\n  ${jsonPath}\n`);

process.exit(verdict === "PASS" ? 0 : 1);
