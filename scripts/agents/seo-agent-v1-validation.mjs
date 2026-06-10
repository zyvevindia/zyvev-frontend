/**
 * SEO Agent v1 validation — generate 20 pages, measure quality.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadAllGoldenDossiers,
  findGoldenDossierByFamilySlug,
} from "../../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import {
  SEO_PAGE_SPECS,
  generateSeoContent,
  validateContentCompleteness,
} from "../../src/agents/seo/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DOCS_DIR = path.join(ROOT, "docs", "agents");

const CATALOG_FIXTURES = [
  {
    id: "mg-zs-ev",
    displayName: "MG ZS EV",
    familySlug: "mg-zs-ev",
    fields: {
      brand: "MG",
      model: "ZS EV",
      familySlug: "mg-zs-ev",
      startingPrice: 1899000,
      claimedRangeKm: 461,
      batteryCapacityKwh: 50.3,
      dcChargingKw: 76,
      dcChargingTimeMinutes: 45,
      powerPs: 176,
      torqueNm: 280,
      airbags: 6,
      ncapRating: 5,
      adas: true,
    },
    features: { adas: true, connectedCar: true, camera360: true },
    variants: [
      {
        variantName: "Excite",
        priceInr: 1899000,
        rangeKm: 461,
        dcChargingKw: 76,
        features: { adas: true },
      },
      {
        variantName: "Exclusive",
        priceInr: 2249000,
        rangeKm: 461,
        dcChargingKw: 76,
        features: { adas: true, sunroof: true },
      },
    ],
  },
  {
    id: "citroen-ec3",
    displayName: "Citroen eC3",
    familySlug: "citroen-ec3",
    fields: {
      brand: "Citroen",
      model: "eC3",
      familySlug: "citroen-ec3",
      startingPrice: 1190000,
      claimedRangeKm: 320,
      batteryCapacityKwh: 29.2,
      dcChargingKw: 30,
      dcChargingTimeMinutes: 57,
      powerPs: 57,
      airbags: 2,
    },
    features: { connectedCar: true },
    variants: [
      { variantName: "Live", priceInr: 1190000, rangeKm: 320, dcChargingKw: 30 },
      { variantName: "Feel", priceInr: 1290000, rangeKm: 320, dcChargingKw: 30 },
    ],
  },
];

function loadVehiclePool() {
  const golden = loadAllGoldenDossiers().map((g) => g.dossier);
  const slugs = new Set(golden.map((d) => d.familySlug || d.id));
  const fixtures = CATALOG_FIXTURES.filter((f) => !slugs.has(f.familySlug));
  return [...golden, ...fixtures];
}

function validateMetadataQuality(seoPage) {
  const issues = [];
  if (!seoPage.title || seoPage.title.length < 20) issues.push("title_short");
  if (!seoPage.metaDescription || seoPage.metaDescription.length < 50) {
    issues.push("metaDescription_short");
  }
  if (!seoPage.canonicalUrl?.startsWith("https://")) issues.push("canonical");
  if (!seoPage.keywords?.length) issues.push("keywords");
  if (!seoPage.faq?.length) issues.push("faq");
  if (!seoPage.structuredData?.itemListElement?.length) {
    issues.push("structuredData");
  }
  if (seoPage.governance?.llmGenerated !== false) issues.push("governance");
  return issues;
}

function main() {
  const vehicles = loadVehiclePool();
  const pages = [];
  const slugsSeen = new Set();
  const duplicates = [];

  for (const spec of SEO_PAGE_SPECS) {
    const result = generateSeoContent(spec, vehicles);
    const seoPage = result.seoPage;
    const missing = result.ok ? validateContentCompleteness(seoPage) : ["generation_failed"];
    const metadataIssues = result.ok ? validateMetadataQuality(seoPage) : ["failed"];

    if (slugsSeen.has(spec.slug)) duplicates.push(spec.slug);
    slugsSeen.add(spec.slug);

    pages.push({
      specId: spec.id,
      contentType: spec.contentType,
      slug: spec.slug,
      ok: result.ok,
      rankedCount: seoPage?.rankedVehicles?.length ?? 0,
      missingFields: missing,
      metadataIssues,
      recommendation: result.ok ? "READY" : "BLOCKED",
      title: seoPage?.title,
      metaDescriptionLength: seoPage?.metaDescription?.length ?? 0,
      topVehicle: seoPage?.rankedVehicles?.[0]?.displayName,
      deterministic: seoPage?.governance?.deterministic === true,
    });
  }

  const stabilityA = generateSeoContent(SEO_PAGE_SPECS[0], vehicles);
  const stabilityB = generateSeoContent(SEO_PAGE_SPECS[0], vehicles);
  const stable =
    JSON.stringify(stabilityA.seoPage?.rankedVehicles?.map((v) => v.slug)) ===
    JSON.stringify(stabilityB.seoPage?.rankedVehicles?.map((v) => v.slug));

  const totalMissing = pages.reduce((n, p) => n + p.missingFields.length, 0);
  const allGenerated = pages.filter((p) => p.ok).length === 20;
  const noMissing = pages.every((p) => p.missingFields.length === 0);
  const allDeterministic = pages.every((p) => p.deterministic);
  const noDuplicates = duplicates.length === 0;
  const metadataOk = pages.every((p) => p.metadataIssues.length === 0);

  const ready =
    allGenerated &&
    noMissing &&
    allDeterministic &&
    noDuplicates &&
    metadataOk &&
    stable;

  const recommendation = ready
    ? "READY FOR MONITORING AGENT"
    : "NEEDS ITERATION";

  const payload = {
    generatedAt: new Date().toISOString(),
    agentVersion: 1,
    methodology:
      "Deterministic SEO generation from golden dossiers + score engine (20 page specs)",
    vehiclePoolSize: vehicles.length,
    aggregate: {
      pagesTarget: 20,
      pagesGenerated: pages.filter((p) => p.ok).length,
      totalMissingFields: totalMissing,
      duplicateSlugs: duplicates.length,
      rankingStable: stable,
      allDeterministic,
      metadataQualityPass: metadataOk,
      humanApprovalRequired: true,
      autonomousPublish: false,
    },
    recommendation,
    pages,
    sampleOutputs: SEO_PAGE_SPECS.slice(0, 3).map((spec) => {
      const r = generateSeoContent(spec, vehicles);
      return { specId: spec.id, seoPage: r.seoPage };
    }),
  };

  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DOCS_DIR, "seo-agent-v1-validation.json"),
    JSON.stringify(payload, null, 2)
  );

  const md = `# SEO Agent v1 — Validation

Generated: ${payload.generatedAt}

## Summary

| Metric | Result |
|--------|--------|
| Pages generated | ${payload.aggregate.pagesGenerated}/20 |
| Missing fields (total) | ${totalMissing} |
| Duplicate slugs | ${duplicates.length} |
| Ranking stability | ${stable ? "Stable" : "Unstable"} |
| All deterministic | ${allDeterministic ? "Yes" : "No"} |
| Metadata quality | ${metadataOk ? "Pass" : "Fail"} |
| Human approval required | Yes |
| Autonomous publish | No |

## Recommendation

**${recommendation}**

## Pages

${pages
  .map(
    (p) =>
      `### ${p.specId}\n- Slug: \`${p.slug}\`\n- Ranked: ${p.rankedCount}\n- Missing: ${p.missingFields.length ? p.missingFields.join(", ") : "none"}\n- Top: ${p.topVehicle || "—"}`
  )
  .join("\n\n")}

See [\`seo-agent-v1-validation.json\`](./seo-agent-v1-validation.json).
`;

  fs.writeFileSync(path.join(DOCS_DIR, "seo-agent-v1-validation.md"), md);

  console.log(`Generated ${payload.aggregate.pagesGenerated}/20 pages`);
  console.log(`Recommendation: ${recommendation}`);

  if (!ready) process.exit(1);
}

main();
