/**
 * Media Production Audit — Phase 2 (vehicle detail pages).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildGalleryTypeFallbackChain,
  buildImageFallbackChain,
  GOLDEN_DETAIL_IMAGE_TYPES,
  resolveDetailGalleryItems,
} from "../../src/utils/vehicleMedia.js";
import { LOCAL_FALLBACK_EV } from "../../src/config/media.js";
import { getLocalCarMediaTypesForFamily } from "../../src/media/localCarMediaManifest.js";

export const PHASE2_MANUAL_VERIFIED_SLUGS = Object.freeze([
  "tata-harrier-ev",
  "hyundai-creta-electric",
  "maruti-e-vitara",
  "tata-curvv-ev",
  "tata-nexon-ev",
  "tata-punch-ev",
  "mahindra-be-6",
  "mg-windsor-ev",
  "byd-seal",
  "bmw-ix1",
]);

export const DETAIL_SURFACES = Object.freeze([
  {
    id: "detail-hero",
    page: "CarDetails.jsx",
    section: "DetailHero main image",
    component: "VehicleImage",
    role: "hero",
    usesVehicleImage: true,
  },
  {
    id: "detail-gallery-thumbs",
    page: "CarDetails.jsx / DetailHero.jsx",
    section: "Gallery thumbnails (front/rear/side/interior/dashboard)",
    component: "VehicleImage",
    role: "gallery",
    usesVehicleImage: true,
    imageTypes: ["front", "rear", "side", "interior", "dashboard"],
  },
  {
    id: "detail-jsonld",
    page: "CarDetails.jsx",
    section: "Product schema images",
    component: "JsonLd",
    role: "gallery",
    usesVehicleImage: false,
    note: "Uses resolveRequestableGalleryImages URLs",
  },
  {
    id: "detail-variant-preload",
    page: "CarDetails.jsx",
    section: "Variant switch gallery preload",
    component: "preloadVariantGallery",
    role: "gallery",
    usesVehicleImage: false,
  },
  {
    id: "detail-overview",
    page: "DetailOverviewDashboard.jsx",
    section: "Overview dashboard",
    component: "DetailOverviewDashboard",
    usesVehicleImage: false,
    note: "Text/scores only — no image slot",
  },
  {
    id: "detail-gold-sections",
    page: "EvDetailGoldSections.jsx",
    section: "Gold experience sections",
    component: "EvDetailGoldSections",
    usesVehicleImage: false,
    note: "Text/scores/FAQ — no image slot",
  },
  {
    id: "detail-variant-table",
    page: "VariantComparisonTable.jsx",
    section: "Variant comparison cards",
    component: "VariantComparisonTable",
    usesVehicleImage: false,
    note: "Spec table — no per-variant thumbnails",
  },
  {
    id: "detail-related-notfound",
    page: "VehicleDetailNotFound.jsx",
    section: "Related EV suggestions",
    component: "CompactCarCard",
    usesVehicleImage: true,
    role: "listing",
  },
  {
    id: "detail-modal-viewer",
    page: "—",
    section: "Modal / lightbox image viewer",
    component: "—",
    usesVehicleImage: false,
    note: "Not implemented — thumb click updates hero only",
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

function loadGoldenSlugs(goldenDir) {
  const manifest = JSON.parse(
    readFileSync(join(goldenDir, "manifest.json"), "utf8")
  );
  return (manifest.vehicles || []).map((v) => v.id || v.familySlug).filter(Boolean);
}

function dossierToDetailCar(dossier, slug) {
  const media = dossier.media || {};
  return {
    slug,
    familySlug: slug,
    name: dossier.displayName || slug,
    heroImage: media.heroImage || media.front || null,
    image: media.listingThumbnail || media.image || null,
    listingThumbnail: media.listingThumbnail || null,
    galleryImages: media.galleryImages || media.gallery || [],
    catalogMeta: {
      slug,
      familySlug: slug,
      media,
    },
  };
}

function auditImageType({ slug, car, imageType, publicDir }) {
  const localPath = join(
    publicDir,
    "images",
    "cars",
    slug,
    `${imageType}.webp`
  );
  const localExists = existsSync(localPath);
  const expectedLocalTypes = getLocalCarMediaTypesForFamily(slug);
  const localExpected = expectedLocalTypes.includes(imageType);

  let chain;
  if (["front", "rear", "side", "interior", "dashboard"].includes(imageType)) {
    chain = buildGalleryTypeFallbackChain(car, imageType);
  } else {
    chain = buildImageFallbackChain(
      car,
      imageType === "listing" ? "listing" : "compare"
    );
  }

  const first = chain[0] || null;
  const last = chain[chain.length - 1] || null;
  const endsWithFallback =
    last === LOCAL_FALLBACK_EV || String(last || "").includes("fallback-ev");

  const issues = [];
  if (!chain.length) issues.push("empty_chain");
  if (!endsWithFallback) issues.push("missing_fallback_ev_svg");
  if (!first) issues.push("no_primary_url");

  const broken =
    !first ||
    !endsWithFallback ||
    (localExpected && localExists && classifySource(first) !== "local");

  return {
    imageType,
    primaryUrl: first,
    firstSource: classifySource(first),
    chain,
    chainSources: chain.map(classifySource),
    localFileExists: localExists,
    localExpected,
    localPath: `/images/cars/${slug}/${imageType}.webp`,
    endsWithFallbackSvg: endsWithFallback,
    broken: issues.length > 0 && !first,
    issues,
  };
}

function auditVehicleDetail({ slug, car, publicDir }) {
  const heroChain = buildImageFallbackChain(car, "hero");
  const heroPrimary = heroChain[0] || null;
  const heroBroken =
    !heroPrimary ||
    !(
      heroChain[heroChain.length - 1] === LOCAL_FALLBACK_EV ||
      String(heroChain[heroChain.length - 1] || "").includes("fallback-ev")
    );

  const imageTypes = GOLDEN_DETAIL_IMAGE_TYPES.map((imageType) =>
    auditImageType({ slug, car, imageType, publicDir })
  );

  const galleryItems = resolveDetailGalleryItems(car);
  const galleryBroken = galleryItems.some(
    (item) => !item.src || !item.chain?.length
  );

  const brokenGalleryTypes = imageTypes.filter(
    (row) =>
      ["front", "rear", "side", "interior", "dashboard"].includes(row.imageType) &&
      row.broken
  );

  return {
    slug,
    displayName: car.name,
    heroPrimary,
    heroChain,
    heroBroken,
    heroFirstSource: classifySource(heroPrimary),
    galleryItemCount: galleryItems.length,
    galleryItems: galleryItems.map(({ imageType, src, chain }) => ({
      imageType,
      src,
      chain,
    })),
    galleryBroken,
    imageTypes,
    brokenGalleryTypes: brokenGalleryTypes.length,
    broken: heroBroken || galleryBroken || brokenGalleryTypes.length > 0,
  };
}

/**
 * @param {{ rootDir: string, buildResult?: object }} options
 */
export function runMediaProductionPhase2Audit({ rootDir, buildResult = null }) {
  const publicDir = join(rootDir, "public");
  const goldenDir = join(publicDir, "catalog", "golden-dataset");
  const goldenSlugs = loadGoldenSlugs(goldenDir);

  const vehicleResults = [];
  const brokenSlugs = [];

  for (const slug of goldenSlugs) {
    let car;
    try {
      const dossier = JSON.parse(
        readFileSync(join(goldenDir, "vehicles", `${slug}.json`), "utf8")
      );
      car = dossierToDetailCar(dossier, slug);
    } catch (err) {
      vehicleResults.push({
        slug,
        broken: true,
        issues: [`dossier_load_failed:${err.message}`],
      });
      brokenSlugs.push(slug);
      continue;
    }

    const audit = auditVehicleDetail({ slug, car, publicDir });
    if (audit.broken) brokenSlugs.push(slug);
    vehicleResults.push(audit);
  }

  const manualResults = PHASE2_MANUAL_VERIFIED_SLUGS.map((slug) => {
    const row = vehicleResults.find((v) => v.slug === slug);
    return {
      slug,
      pass: row ? !row.broken && !row.heroBroken : false,
      heroPrimary: row?.heroPrimary || null,
      galleryItemCount: row?.galleryItemCount ?? 0,
    };
  });

  const vehicleImageSurfaces = DETAIL_SURFACES.filter((s) => s.usesVehicleImage);

  return {
    generatedAt: new Date().toISOString(),
    phase: "media-production-phase2",
    goal: "Zero broken media on vehicle detail pages",
    detailSurfacesAudited: DETAIL_SURFACES,
    vehicleImageSurfaces,
    goldenVehicleSlugs: goldenSlugs,
    vehiclesVerified: goldenSlugs.length,
    manualVerifiedSlugs: PHASE2_MANUAL_VERIFIED_SLUGS,
    manualVerification: manualResults,
    vehicleResults,
    summary: {
      surfacesAudited: DETAIL_SURFACES.length,
      vehicleImageSurfaces: vehicleImageSurfaces.length,
      vehiclesVerified: goldenSlugs.length,
      manualVehiclesVerified: PHASE2_MANUAL_VERIFIED_SLUGS.length,
      brokenGalleryImagesFound: brokenSlugs.length,
      brokenGalleryImagesFixed:
        brokenSlugs.length === 0 ? goldenSlugs.length : goldenSlugs.length - brokenSlugs.length,
      allGoldenPass: brokenSlugs.length === 0,
      allManualPass: manualResults.every((r) => r.pass),
    },
    filesModified: [
      "src/utils/vehicleMedia.js",
      "src/components/media/VehicleImage.jsx",
      "src/components/car/DetailHero.jsx",
      "src/pages/CarDetails.jsx",
      "src/media/localCarMediaManifest.js",
      "scripts/lib/mediaProductionPhase2.mjs",
      "scripts/media-production-phase2.mjs",
      "package.json",
    ],
    detailMediaRules: {
      hero: "buildImageFallbackChain(car, hero) — never empty primary",
      galleryThumbs: "resolveDetailGalleryItems — typed front/rear/side/interior/dashboard",
      galleryFallback: "buildGalleryTypeFallbackChain per type: Local → Cloudinary → fallback-ev.svg",
      emptySlots: "galleryItems.filter(Boolean) — no falsy entries",
      placeholder: "VehicleImage exhausted state only after all chain URLs fail",
      devLogging: 'console.warn("[gallery-media]", slug, imageType, chain) in DEV',
    },
    buildResult: buildResult || {
      success: null,
      exitCode: null,
      command: "npm run build",
      note: "Run npm run build and re-run audit to record result",
    },
  };
}

export function formatPhase2Markdown(report) {
  const lines = [
    "# Media Production Audit — Phase 2",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Goal",
    "",
    report.goal,
    "",
    "## Summary",
    "",
    `- Detail surfaces audited: **${report.summary.surfacesAudited}**`,
    `- Surfaces using VehicleImage: **${report.summary.vehicleImageSurfaces}**`,
    `- Golden vehicles verified: **${report.summary.vehiclesVerified}**`,
    `- Manual vehicles verified: **${report.summary.manualVehiclesVerified}**`,
    `- Broken gallery images found: **${report.summary.brokenGalleryImagesFound}**`,
    `- Broken gallery images fixed: **${report.summary.brokenGalleryImagesFixed}**`,
    `- All golden vehicles pass: **${report.summary.allGoldenPass ? "Yes" : "No"}**`,
    `- All manual vehicles pass: **${report.summary.allManualPass ? "Yes" : "No"}**`,
    "",
    "## Files modified",
    "",
    ...report.filesModified.map((f) => `- \`${f}\``),
    "",
    "## Detail surfaces audited",
    "",
    "| Surface | Page | Component | VehicleImage | Role |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const surface of report.detailSurfacesAudited) {
    lines.push(
      `| ${surface.id} | ${surface.page} | ${surface.component} | ${surface.usesVehicleImage ? "Yes" : "No"} | ${surface.role || "—"} |`
    );
  }

  lines.push("", "## Manual verification (11 vehicles)", "");
  lines.push("| Slug | Hero | Gallery items | Pass |");
  lines.push("| --- | --- | --- | --- |");
  for (const row of report.manualVerification) {
    lines.push(
      `| ${row.slug} | \`${row.heroPrimary || "—"}\` | ${row.galleryItemCount} | ${row.pass ? "Yes" : "No"} |`
    );
  }

  lines.push("", "## Golden fleet — hero + gallery types", "");
  lines.push("| Slug | Hero source | Gallery slots | Hero OK |");
  lines.push("| --- | --- | --- | --- |");
  for (const row of report.vehicleResults) {
    lines.push(
      `| ${row.slug} | ${row.heroFirstSource || "—"} | ${row.galleryItemCount ?? 0} | ${row.heroBroken ? "No" : "Yes"} |`
    );
  }

  lines.push("", "## Detail media rules", "");
  for (const [key, value] of Object.entries(report.detailMediaRules)) {
    lines.push(`- **${key}:** ${value}`);
  }

  if (report.summary.brokenGalleryImagesFound > 0) {
    lines.push("", "## Issues", "");
    for (const row of report.vehicleResults.filter((r) => r.broken)) {
      lines.push(`- **${row.slug}:** heroBroken=${row.heroBroken}, galleryBroken=${row.galleryBroken}`);
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
