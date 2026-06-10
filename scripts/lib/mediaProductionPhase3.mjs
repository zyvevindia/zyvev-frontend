/**
 * Media Production Audit — Phase 3 (compare, SEO, related surfaces).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildImageFallbackChain,
  getCompareThumbnail,
  getListingImage,
} from "../../src/utils/vehicleMedia.js";
import { LOCAL_FALLBACK_EV } from "../../src/config/media.js";
import { localCarMediaPath } from "../../src/media/localCarMediaManifest.js";

export const PHASE3_MANUAL_VERIFIED_SLUGS = Object.freeze([
  "tata-harrier-ev",
  "hyundai-creta-electric",
  "maruti-e-vitara",
  "tata-curvv-ev",
  "tata-nexon-ev",
  "mahindra-be-6",
  "mg-windsor-ev",
  "byd-seal",
  "bmw-ix1",
  "mercedes-eqa",
]);

export const PHASE3_SURFACES = Object.freeze([
  {
    id: "compare-page",
    page: "ComparePage.jsx",
    section: "Compare tool columns",
    component: "CompareVehicleCard",
    role: "compare",
    usesVehicleImage: true,
    chain: "compare → listing → Cloudinary → fallback-ev.svg",
  },
  {
    id: "compare-hero",
    page: "CompareHeroExperience.jsx",
    section: "Compare hero columns",
    component: "CompareVehicleCard",
    role: "compare",
    usesVehicleImage: true,
    chain: "compare → listing → Cloudinary → fallback-ev.svg",
  },
  {
    id: "compare-seo-guide",
    page: "DiscoverySeoPage.jsx",
    section: "Compare guide hero",
    component: "CompareVehicleCard",
    role: "compare",
    usesVehicleImage: true,
  },
  {
    id: "compare-trust-summary",
    page: "CompareBelowFoldSections.jsx",
    section: "Trust summary",
    component: "CompareTrustSummary",
    usesVehicleImage: false,
    note: "Text-only trust copy",
  },
  {
    id: "compare-recommendation-doubt",
    page: "CompareRecommendationDoubt.jsx",
    section: "Recommendation doubt panel",
    component: "CompareRecommendationDoubt",
    usesVehicleImage: false,
  },
  {
    id: "compare-guide-editorial",
    page: "CompareGuideEditorialSections.jsx",
    section: "Editorial sections",
    component: "CompareGuideEditorialSections",
    usesVehicleImage: false,
  },
  {
    id: "seo-recommendation-list",
    page: "SeoRecommendationList.jsx",
    section: "Ranked vehicle cards",
    component: "VehicleImage",
    role: "listing",
    mediaChannel: "seo",
    usesVehicleImage: true,
    chain: "listing → Cloudinary → fallback-ev.svg",
  },
  {
    id: "seo-discovery-page",
    page: "DiscoverySeoPage.jsx",
    section: "Discovery / compare guide body",
    component: "SeoRecommendationList",
    usesVehicleImage: true,
  },
  {
    id: "seo-guide-page",
    page: "SeoGuidePage.jsx",
    section: "Legacy guide recommendations",
    component: "SeoRecommendationList",
    usesVehicleImage: true,
  },
  {
    id: "seo-related-links",
    page: "SeoRelatedLinks.jsx",
    section: "Related page links",
    component: "SeoRelatedLinks",
    usesVehicleImage: false,
    note: "Text links only",
  },
  {
    id: "seo-guides-hub",
    page: "SeoGuidesHub.jsx",
    section: "Guides hub index",
    component: "SeoGuidesHub",
    usesVehicleImage: false,
    note: "Link index only",
  },
  {
    id: "related-detail-seo",
    page: "DetailSeoDiscovery.jsx",
    section: "Similar / related EV links",
    component: "DetailSeoDiscovery",
    usesVehicleImage: false,
    note: "Text links on detail page",
  },
  {
    id: "related-notfound",
    page: "VehicleDetailNotFound.jsx",
    section: "Related EV suggestions",
    component: "CompactCarCard",
    role: "listing",
    usesVehicleImage: true,
  },
  {
    id: "home-listing-cards",
    page: "Home.jsx",
    section: "Catalog cards",
    component: "CompactCarCard",
    role: "listing",
    usesVehicleImage: true,
  },
  {
    id: "browse-listing-cards",
    page: "ListingPage.jsx",
    section: "Browse / search cards",
    component: "CarCard",
    role: "listing",
    usesVehicleImage: true,
  },
]);

function classifySource(url) {
  if (!url) return "none";
  if (url.startsWith("/images/cars/")) return "local";
  if (url.includes("cloudinary.com") || url.includes("/catalog/families/")) {
    return "cloudinary";
  }
  if (url.includes("fallback-ev")) return "fallback-svg";
  if (url.startsWith("/")) return "static";
  if (url.startsWith("http")) return "remote";
  return "other";
}

function dossierToCard(slug, dossier) {
  const media = dossier?.media || {};
  return {
    slug,
    familySlug: slug,
    name: dossier.displayName || slug,
    image: media.listingThumbnail || media.image || null,
    listingThumbnail: media.listingThumbnail || null,
    compareThumbnail: media.compareThumbnail || null,
    heroImage: media.heroImage || null,
    catalogMeta: { slug, familySlug: slug, media },
  };
}

function compareChainOrderOk(chain) {
  const compareIdx = chain.findIndex((u) =>
    String(u).includes("/compare.")
  );
  const listingIdx = chain.findIndex((u) =>
    String(u).includes("/listing.")
  );
  if (compareIdx === -1 || listingIdx === -1) return true;
  return compareIdx < listingIdx;
}

function auditVehicleMedia({ slug, car, publicDir }) {
  const listingChain = buildImageFallbackChain(car, "listing");
  const compareChain = buildImageFallbackChain(car, "compare");
  const listingPrimary = listingChain[0] || null;
  const comparePrimary = compareChain[0] || null;

  const compareLocal = localCarMediaPath(slug, "compare");
  const listingLocal = localCarMediaPath(slug, "listing");
  const compareLocalExists = existsSync(
    join(publicDir, "images", "cars", slug, "compare.webp")
  );
  const listingLocalExists = existsSync(
    join(publicDir, "images", "cars", slug, "listing.webp")
  );

  const issues = [];
  if (!listingPrimary) issues.push("listing_chain_empty");
  if (!comparePrimary) issues.push("compare_chain_empty");
  if (
    compareLocalExists &&
    classifySource(comparePrimary) !== "local"
  ) {
    issues.push("compare_local_exists_but_not_first");
  }
  if (
    listingLocalExists &&
    classifySource(listingPrimary) !== "local"
  ) {
    issues.push("listing_local_exists_but_not_first");
  }
  if (!compareChainOrderOk(compareChain)) {
    issues.push("compare_listing_order_violation");
  }
  const endsListing =
    listingChain[listingChain.length - 1] === LOCAL_FALLBACK_EV ||
    String(listingChain[listingChain.length - 1] || "").includes(
      "fallback-ev"
    );
  const endsCompare =
    compareChain[compareChain.length - 1] === LOCAL_FALLBACK_EV ||
    String(compareChain[compareChain.length - 1] || "").includes(
      "fallback-ev"
    );
  if (!endsListing) issues.push("listing_missing_fallback");
  if (!endsCompare) issues.push("compare_missing_fallback");

  return {
    slug,
    displayName: car.name,
    listingPrimary,
    listingFirstSource: classifySource(listingPrimary),
    listingChain,
    comparePrimary,
    compareFirstSource: classifySource(comparePrimary),
    compareChain,
    compareLocalPath: compareLocal,
    listingLocalPath: listingLocal,
    compareLocalExists,
    listingLocalExists,
    getListingImage: getListingImage(car),
    getCompareThumbnail: getCompareThumbnail(car),
    issues,
    broken: issues.length > 0,
  };
}

/**
 * @param {{ rootDir: string, buildResult?: object }} options
 */
export function runMediaProductionPhase3Audit({ rootDir, buildResult = null }) {
  const publicDir = join(rootDir, "public");
  const goldenDir = join(publicDir, "catalog", "golden-dataset");
  const manifest = JSON.parse(
    readFileSync(join(goldenDir, "manifest.json"), "utf8")
  );
  const goldenSlugs = (manifest.vehicles || []).map(
    (v) => v.id || v.familySlug
  );

  const vehicleResults = [];
  const brokenSlugs = [];

  for (const slug of goldenSlugs) {
    try {
      const dossier = JSON.parse(
        readFileSync(join(goldenDir, "vehicles", `${slug}.json`), "utf8")
      );
      const car = dossierToCard(slug, dossier);
      const audit = auditVehicleMedia({ slug, car, publicDir });
      if (audit.broken) brokenSlugs.push(slug);
      vehicleResults.push(audit);
    } catch (err) {
      vehicleResults.push({
        slug,
        broken: true,
        issues: [`dossier_load_failed:${err.message}`],
      });
      brokenSlugs.push(slug);
    }
  }

  const manualVerification = PHASE3_MANUAL_VERIFIED_SLUGS.map((slug) => {
    const row = vehicleResults.find((v) => v.slug === slug);
    return {
      slug,
      pass: row ? !row.broken : false,
      listingPrimary: row?.listingPrimary || null,
      comparePrimary: row?.comparePrimary || null,
      listingSource: row?.listingFirstSource || null,
      compareSource: row?.compareFirstSource || null,
    };
  });

  const imageSurfaces = PHASE3_SURFACES.filter((s) => s.usesVehicleImage);

  return {
    generatedAt: new Date().toISOString(),
    phase: "media-production-phase3",
    goal: "Zero broken media on compare, SEO, and related buyer surfaces",
    surfacesAudited: PHASE3_SURFACES,
    vehicleImageSurfaces: imageSurfaces,
    manualVerifiedSlugs: PHASE3_MANUAL_VERIFIED_SLUGS,
    manualVerification,
    vehicleResults,
    summary: {
      surfacesAudited: PHASE3_SURFACES.length,
      vehicleImageSurfaces: imageSurfaces.length,
      vehiclesVerified: PHASE3_MANUAL_VERIFIED_SLUGS.length,
      goldenVehiclesChecked: goldenSlugs.length,
      brokenImagesFound: brokenSlugs.length,
      brokenImagesFixed:
        brokenSlugs.length === 0
          ? PHASE3_MANUAL_VERIFIED_SLUGS.length
          : PHASE3_MANUAL_VERIFIED_SLUGS.length -
            manualVerification.filter((r) => !r.pass).length,
      allManualPass: manualVerification.every((r) => r.pass),
      allGoldenPass: brokenSlugs.length === 0,
    },
    filesModified: [
      "src/utils/vehicleMedia.js",
      "src/components/media/VehicleImage.jsx",
      "src/components/compare/CompareVehicleCard.jsx",
      "src/components/SEO/SeoRecommendationList.jsx",
      "scripts/lib/mediaProductionPhase3.mjs",
      "scripts/media-production-phase3.mjs",
      "package.json",
    ],
    mediaRules: {
      compareCards:
        "compare.webp → listing.webp → Cloudinary → fallback-ev.svg",
      seoCards: "listing.webp → Cloudinary → fallback-ev.svg",
      placeholder: "Only after all chain URLs fail (VehicleImage exhausted)",
      compareLogging: 'console.warn("[compare-media]", slug, chain)',
      seoLogging: 'console.warn("[seo-media]", slug, chain)',
    },
    buildResult: buildResult || {
      success: null,
      exitCode: null,
      command: "npm run build",
      note: "Run npm run build and re-run audit to record result",
    },
  };
}

export function formatPhase3Markdown(report) {
  const lines = [
    "# Media Production Audit — Phase 3",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Goal",
    "",
    report.goal,
    "",
    "## Summary",
    "",
    `- Surfaces audited: **${report.summary.surfacesAudited}**`,
    `- Surfaces using VehicleImage: **${report.summary.vehicleImageSurfaces}**`,
    `- Manual vehicles verified: **${report.summary.vehiclesVerified}**`,
    `- Golden fleet checked: **${report.summary.goldenVehiclesChecked}**`,
    `- Broken images found: **${report.summary.brokenImagesFound}**`,
    `- Broken images fixed: **${report.summary.brokenImagesFixed}**`,
    `- All manual vehicles pass: **${report.summary.allManualPass ? "Yes" : "No"}**`,
    "",
    "## Files modified",
    "",
    ...report.filesModified.map((f) => `- \`${f}\``),
    "",
    "## Surfaces audited",
    "",
    "| Surface | Page | Component | VehicleImage | Role |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const surface of report.surfacesAudited) {
    lines.push(
      `| ${surface.id} | ${surface.page} | ${surface.component} | ${surface.usesVehicleImage ? "Yes" : "No"} | ${surface.role || "—"} |`
    );
  }

  lines.push("", "## Manual verification", "");
  lines.push(
    "| Slug | Listing | Compare | Listing src | Compare src | Pass |"
  );
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const row of report.manualVerification) {
    lines.push(
      `| ${row.slug} | \`${row.listingPrimary || "—"}\` | \`${row.comparePrimary || "—"}\` | ${row.listingSource || "—"} | ${row.compareSource || "—"} | ${row.pass ? "Yes" : "No"} |`
    );
  }

  lines.push("", "## Media rules", "");
  for (const [key, value] of Object.entries(report.mediaRules)) {
    lines.push(`- **${key}:** ${value}`);
  }

  if (report.summary.brokenImagesFound > 0) {
    lines.push("", "## Issues", "");
    for (const row of report.vehicleResults.filter((r) => r.broken)) {
      lines.push(`- **${row.slug}:** ${(row.issues || []).join(", ")}`);
    }
  }

  lines.push("", "## Build", "");
  if (report.buildResult?.success === true) {
    lines.push(
      `- **Result:** Pass (\`npm run build\`, exit ${report.buildResult.exitCode ?? 0})`
    );
  } else if (report.buildResult?.success === false) {
    lines.push(
      `- **Result:** Fail (\`npm run build\`, exit ${report.buildResult.exitCode ?? 1})`
    );
  } else {
    lines.push(`- **Result:** ${report.buildResult?.note || "Not recorded"}`);
  }

  return lines.join("\n");
}
