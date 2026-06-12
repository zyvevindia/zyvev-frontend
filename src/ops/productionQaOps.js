/**
 * Production QA audit — runtime readiness checks (static + catalog-derived).
 */

import { DETAIL_SECTION_DEFS } from "../utils/detailPageNav.js";
import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest.js";
import { LOCAL_FALLBACK_EV } from "../config/media.js";
import {
  buildImageFallbackChain,
  resolveCatalogImageUrl,
  resolveRequestableGalleryImages,
} from "../utils/vehicleMedia.js";
import { isPlaceholderMediaUrl } from "../media/cloudinary.js";
import { auditVehicleCompleteness } from "./catalogCompletenessOps.js";
import { detectMediaRoleConflicts } from "./tier1MediaHealth.js";

function isFallbackUrl(url = "") {
  return (
    !url ||
    url === LOCAL_FALLBACK_EV ||
    url.includes("fallback-ev") ||
    isPlaceholderMediaUrl(url)
  );
}

const REQUIRED_DETAIL_SECTION_IDS = DETAIL_SECTION_DEFS.map(
  (section) => section.id
);

/**
 * @param {{ cars?: object[]; compareSlugs?: string[] }} [options]
 */
export function runProductionQaAudit(options = {}) {
  const cars = options.cars || [];
  const compareSlugs =
    options.compareSlugs || GENERATED_COMPARE_SLUGS.slice(0, 30);

  const checks = [];
  const failures = [];
  const warnings = [];

  function pass(id, detail = "") {
    checks.push({ id, status: "pass", detail });
  }
  function fail(id, detail = "") {
    checks.push({ id, status: "fail", detail });
    failures.push({ id, detail });
  }
  function warn(id, detail = "") {
    checks.push({ id, status: "warn", detail });
    warnings.push({ id, detail });
  }

  if (DETAIL_SECTION_DEFS.length >= 8) {
    pass("sticky_nav_sections_defined", `${DETAIL_SECTION_DEFS.length} sections`);
  } else {
    fail("sticky_nav_sections_defined", "insufficient sections");
  }

  if (REQUIRED_DETAIL_SECTION_IDS.includes("charging")) {
    pass("charging_section_id_present");
  } else {
    fail("charging_section_id_missing");
  }

  for (const section of DETAIL_SECTION_DEFS) {
    if (
      !REQUIRED_DETAIL_SECTION_IDS.includes(section.id) &&
      section.id !== "related-evs"
    ) {
      warn("section_without_anchor_id", section.id);
    }
  }

  const brokenCompareRoutes = compareSlugs.filter(
    (s) => !s || !s.includes("-vs-")
  );
  if (brokenCompareRoutes.length === 0) {
    pass("compare_deep_link_shape", `${compareSlugs.length} slugs checked`);
  } else {
    fail("compare_deep_link_shape", `${brokenCompareRoutes.length} invalid`);
  }

  let missingHero = 0;
  let missingGallery = 0;
  let placeholderHeavy = 0;

  for (const car of cars) {
    const hero =
      resolveCatalogImageUrl(car, "hero") ||
      buildImageFallbackChain(car, "hero")[0];
    const gallery = resolveRequestableGalleryImages(car);
    const completeness = auditVehicleCompleteness(car);

    if (isFallbackUrl(hero)) missingHero += 1;
    if (gallery.length <= 1) missingGallery += 1;
    if (
      buildImageFallbackChain(car, "listing")[0] === LOCAL_FALLBACK_EV &&
      buildImageFallbackChain(car, "compare")[0] === LOCAL_FALLBACK_EV
    ) {
      placeholderHeavy += 1;
    }

    if (completeness.fields?.compareReadiness === "missing") {
      warn("compare_not_ready", car.slug);
    }
  }

  if (cars.length === 0) {
    warn("no_catalog_cars_for_qa");
  } else {
    if (missingHero === 0) pass("hero_images_resolved");
    else fail("missing_hero_images", `${missingHero}/${cars.length}`);

    if (missingGallery <= cars.length * 0.8) {
      pass("gallery_coverage_acceptable", `${missingGallery} thin galleries`);
    } else {
      warn("missing_gallery_images", `${missingGallery}/${cars.length}`);
    }

    if (placeholderHeavy <= Math.ceil(cars.length * 0.3)) {
      pass("placeholder_usage_bounded", `${placeholderHeavy} full-fallback`);
    } else {
      warn("placeholder_overuse", `${placeholderHeavy}/${cars.length}`);
    }
  }

  const mediaConflicts = detectMediaRoleConflicts();
  if (mediaConflicts.length === 0) {
    pass("no_media_role_conflicts");
  } else {
    warn("media_role_conflicts", `${mediaConflicts.length} families`);
  }

  return {
    generatedAt: new Date().toISOString(),
    checks,
    failures,
    warnings,
    summary: {
      passed: checks.filter((c) => c.status === "pass").length,
      failed: failures.length,
      warnings: warnings.length,
      ok: failures.length === 0,
    },
    requiredDetailSectionIds: REQUIRED_DETAIL_SECTION_IDS,
  };
}

export function productionQaMarkdown(report) {
  const lines = [
    "# Production QA audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `**Status:** ${report.summary?.ok ? "PASS" : "NEEDS ATTENTION"}`,
    "",
    `- Passed: ${report.summary?.passed}`,
    `- Failed: ${report.summary?.failed}`,
    `- Warnings: ${report.summary?.warnings}`,
    "",
  ];
  if (report.failures?.length) {
    lines.push("## Failures", "");
    for (const f of report.failures) {
      lines.push(`- **${f.id}**: ${f.detail}`);
    }
    lines.push("");
  }
  if (report.warnings?.length) {
    lines.push("## Warnings", "");
    for (const w of report.warnings) {
      lines.push(`- **${w.id}**: ${w.detail}`);
    }
  }
  return lines.join("\n");
}
