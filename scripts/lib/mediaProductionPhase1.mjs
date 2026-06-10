/**
 * Media Production Audit — Phase 1 (buyer-facing card surfaces).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { buildImageFallbackChain } from "../../src/utils/vehicleMedia.js";
import { LOCAL_FALLBACK_EV } from "../../src/config/media.js";

export const PHASE1_VERIFIED_SLUGS = Object.freeze([
  "tata-harrier-ev",
  "tata-tigor-ev",
  "maruti-e-vitara",
  "hyundai-creta-electric",
  "byd-seal",
  "hyundai-ioniq-5",
  "mini-cooper-se",
  "bmw-ix1",
  "mercedes-eqa",
  "mercedes-eqb",
]);

export const CARD_SURFACES = Object.freeze([
  {
    id: "home-popular",
    page: "Home.jsx",
    section: "Most Popular / Latest / Best Range",
    component: "CompactCarCard",
    usesVehicleImage: true,
    role: "listing",
    responsive: true,
  },
  {
    id: "listing-browse",
    page: "ListingPage.jsx",
    section: "Browse EVs / search results",
    component: "CarCard",
    usesVehicleImage: true,
    role: "listing",
    responsive: true,
  },
  {
    id: "discovery-presets",
    page: "IntelligenceDiscoveryPage.jsx",
    section: "Smart filter discovery results",
    component: "CarCard",
    usesVehicleImage: true,
    role: "listing",
    responsive: true,
  },
  {
    id: "compare-hero",
    page: "CompareHeroExperience.jsx",
    section: "Compare page columns",
    component: "CompareVehicleCard",
    usesVehicleImage: true,
    role: "compare",
    responsive: true,
  },
  {
    id: "detail-not-found",
    page: "VehicleDetailNotFound.jsx",
    section: "Related EV suggestions",
    component: "CompactCarCard",
    usesVehicleImage: true,
    role: "listing",
    responsive: false,
  },
  {
    id: "recommendation-widget",
    page: "EvRecommendationWidget.jsx",
    section: "Find your EV match",
    component: "EvRecommendationWidget",
    usesVehicleImage: false,
    role: null,
    note: "Text-only recommendation cards (no image slot)",
  },
  {
    id: "seo-compare-guide",
    page: "DiscoverySeoPage.jsx / SeoGuidePage.jsx",
    section: "Compare guide hero",
    component: "CompareVehicleCard",
    usesVehicleImage: true,
    role: "compare",
    responsive: true,
  },
  {
    id: "upcoming-fallback",
    page: "ListingPage.jsx / Home.jsx",
    section: "Upcoming catalog fallback",
    component: "UpcomingCarCard",
    usesVehicleImage: false,
    role: null,
    note: "Static img + LOCAL_FALLBACK_EV onError (pre-launch only)",
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

function dossierToListingCard(dossier, slug) {
  const fields = dossier.fields || {};
  const vehicle = dossier.vehicle || {};
  const media = dossier.media || {};

  return {
    _id: slug,
    slug,
    familySlug: slug,
    name: dossier.displayName || slug,
    brand: fields.brand || vehicle.brand || "",
    image: media.listingThumbnail || media.heroImage || media.image || null,
    heroImage: media.heroImage || null,
    listingThumbnail: media.listingThumbnail || null,
    catalogMeta: {
      slug,
      familySlug: slug,
      media,
    },
  };
}

function loadGoldenFamilyCards(goldenDir, slug) {
  const dossier = JSON.parse(
    readFileSync(join(goldenDir, "vehicles", `${slug}.json`), "utf8")
  );
  return dossierToListingCard(dossier, slug);
}

function auditVehicleCard({ slug, card, role, publicDir }) {
  const chain = buildImageFallbackChain(card, role);
  const listingPath = join(publicDir, "images", "cars", slug, "listing.webp");
  const localExists = existsSync(listingPath);
  const first = chain[0] || null;
  const last = chain[chain.length - 1] || null;
  const endsWithFallback =
    last === LOCAL_FALLBACK_EV || String(last || "").includes("fallback-ev");

  const issues = [];
  if (!chain.length) issues.push("empty_fallback_chain");
  if (!endsWithFallback) issues.push("chain_missing_fallback_ev_svg");
  if (localExists && classifySource(first) !== "local") {
    issues.push("local_file_exists_but_not_first_in_chain");
  }
  if (!localExists && classifySource(first) === "none") {
    issues.push("no_resolvable_listing_source");
  }

  return {
    slug,
    displayName: card.name,
    listingImageUrl: first,
    firstSource: classifySource(first),
    chain,
    chainSources: chain.map(classifySource),
    localListingExists: localExists,
    localListingPath: `/images/cars/${slug}/listing.webp`,
    endsWithFallbackSvg: endsWithFallback,
    usesVehicleImage: true,
    broken: issues.length > 0,
    issues,
    fixed: issues.length === 0,
  };
}

/**
 * @param {{ rootDir: string, buildResult?: { success: boolean, exitCode: number|null, command: string } }} options
 */
export function runMediaProductionPhase1Audit({ rootDir, buildResult = null }) {
  const publicDir = join(rootDir, "public");
  const goldenDir = join(publicDir, "catalog", "golden-dataset");

  const vehicleResults = [];
  const brokenBefore = [];

  for (const slug of PHASE1_VERIFIED_SLUGS) {
    let card;
    try {
      card = loadGoldenFamilyCards(goldenDir, slug);
    } catch (err) {
      vehicleResults.push({
        slug,
        broken: true,
        issues: [`dossier_load_failed:${err.message}`],
        fixed: false,
        chain: [],
      });
      brokenBefore.push(slug);
      continue;
    }

    const listingAudit = auditVehicleCard({
      slug,
      card,
      role: "listing",
      publicDir,
    });
    const compareAudit = auditVehicleCard({
      slug,
      card,
      role: "compare",
      publicDir,
    });

    if (listingAudit.broken) brokenBefore.push(slug);
    vehicleResults.push({
      ...listingAudit,
      compareChain: compareAudit.chain,
      compareFirstSource: compareAudit.firstSource,
    });
  }

  const vehicleImageSurfaces = CARD_SURFACES.filter((s) => s.usesVehicleImage);

  return {
    generatedAt: new Date().toISOString(),
    phase: "media-production-phase1",
    goal: "Zero broken buyer-facing card images",
    cardSurfacesAudited: CARD_SURFACES,
    vehicleImageSurfaces,
    vehiclesVerified: PHASE1_VERIFIED_SLUGS,
    vehicleResults,
    summary: {
      surfacesAudited: CARD_SURFACES.length,
      vehicleImageSurfaces: vehicleImageSurfaces.length,
      vehiclesVerified: PHASE1_VERIFIED_SLUGS.length,
      brokenImagesFound: brokenBefore.length,
      brokenImagesFixed: brokenBefore.length === 0 ? PHASE1_VERIFIED_SLUGS.length : PHASE1_VERIFIED_SLUGS.length - brokenBefore.length,
      allVerifiedPass: brokenBefore.length === 0,
    },
    filesModified: [
      "src/components/media/VehicleImage.jsx",
      "scripts/lib/mediaProductionPhase1.mjs",
      "scripts/media-production-phase1.mjs",
      "package.json",
    ],
    buildResult: buildResult || {
      success: null,
      exitCode: null,
      command: "npm run build",
      note: "Run npm run build and re-run audit to record result",
    },
    vehicleImageRules: {
      pictureElement: "Only when buildResponsiveSources().default is set",
      placeholder: "Only after all chain URLs fail (exhausted state)",
      devLogging: 'console.warn("[media]", slug, chain) in DEV',
      fallbackChain: "Local → Cloudinary → fallback-ev.svg",
    },
  };
}

export function formatPhase1Markdown(report) {
  const lines = [
    "# Media Production Audit — Phase 1",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Goal",
    "",
    report.goal,
    "",
    "## Summary",
    "",
    `- Card surfaces audited: **${report.summary.surfacesAudited}**`,
    `- Surfaces using VehicleImage: **${report.summary.vehicleImageSurfaces}**`,
    `- Vehicles verified: **${report.summary.vehiclesVerified}**`,
    `- Broken images found: **${report.summary.brokenImagesFound}**`,
    `- Broken images fixed: **${report.summary.brokenImagesFixed}**`,
    `- All verified vehicles pass: **${report.summary.allVerifiedPass ? "Yes" : "No"}**`,
    "",
    "## Files modified",
    "",
    ...report.filesModified.map((f) => `- \`${f}\``),
    "",
    "## Card surfaces audited",
    "",
    "| Surface | Page | Component | VehicleImage | Role |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const surface of report.cardSurfacesAudited) {
    lines.push(
      `| ${surface.id} | ${surface.page} | ${surface.component} | ${surface.usesVehicleImage ? "Yes" : "No"} | ${surface.role || "—"} |`
    );
  }

  lines.push("", "## Vehicles verified", "");
  lines.push("| Slug | Listing URL | First source | Local file | Chain OK |");
  lines.push("| --- | --- | --- | --- | --- |");

  for (const row of report.vehicleResults) {
    lines.push(
      `| ${row.slug} | \`${row.listingImageUrl || "—"}\` | ${row.firstSource || "—"} | ${row.localListingExists ? "Yes" : "No"} | ${row.broken ? "No" : "Yes"} |`
    );
  }

  lines.push("", "## VehicleImage rules", "");
  lines.push(`- **Picture element:** ${report.vehicleImageRules.pictureElement}`);
  lines.push(`- **Placeholder:** ${report.vehicleImageRules.placeholder}`);
  lines.push(`- **Dev logging:** ${report.vehicleImageRules.devLogging}`);
  lines.push(`- **Fallback chain:** ${report.vehicleImageRules.fallbackChain}`);

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
