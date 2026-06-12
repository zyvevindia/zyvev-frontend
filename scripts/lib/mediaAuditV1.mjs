/**
 * Media Audit v1 — image completeness for golden-dataset catalog vehicles.
 * Required types: listing, compare, front, rear, side, interior, dashboard.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { PRODUCTION_FAMILY_MEDIA } from "../../src/media/familyMediaManifest.js";
import { isCloudinaryUrl } from "../../src/media/cloudinary.js";
import { isProductionFamilySlug } from "../../src/media/productionFamilies.js";
import {
  buildLocalCarMediaBlock,
  isLocalCarMediaFamily,
  LOCAL_CAR_IMAGE_TYPES,
} from "../../src/media/localCarMediaManifest.js";
import { loadGeneratedVerifiedDossier } from "../../src/data/catalog/generated/index.js";

export const AUDIT_IMAGE_TYPES = Object.freeze([
  "listing",
  "compare",
  "front",
  "rear",
  "side",
  "interior",
  "dashboard",
]);

const VERIFIED_FAMILY_MEDIA = Object.freeze({
  "tata-nexon-ev": loadGeneratedVerifiedDossier("tata-nexon-ev")?.media || null,
  "tata-punch-ev": loadGeneratedVerifiedDossier("tata-punch-ev")?.media || null,
  "tata-tiago-ev": loadGeneratedVerifiedDossier("tata-tiago-ev")?.media || null,
});

/** Canonical seed / ops role → audit column. */
const SEED_ROLE_TO_TYPE = Object.freeze({
  "listing-thumb": "listing",
  listing: "listing",
  "compare-thumb": "compare",
  compare: "compare",
  hero: "front",
  front: "front",
  "exterior-1": "front",
  rear: "rear",
  "exterior-3": "rear",
  side: "side",
  "exterior-2": "side",
  interior: "interior",
  "interior-1": "interior",
  dashboard: "dashboard",
  "interior-dashboard": "dashboard",
});

const LOCAL_FILENAMES = Object.freeze({
  listing: ["listing-thumb.jpg", "listing.jpg", "listing.png", "listing.webp"],
  compare: ["compare-thumb.jpg", "compare.jpg", "compare.png", "compare.webp"],
  front: ["hero.jpg", "front.jpg", "exterior-1.jpg", "exterior-1.png"],
  rear: ["rear.webp", "rear.jpg", "exterior-3.jpg", "exterior-3.png"],
  side: ["side.webp", "side.jpg", "exterior-2.jpg", "exterior-2.png"],
  interior: [
    "interior.webp",
    "interior-1.jpg",
    "interior.jpg",
    "interior.png",
  ],
  dashboard: [
    "dashboard.webp",
    "dashboard.jpg",
    "dashboard.png",
    "interior-dashboard.jpg",
  ],
});

const IMAGE_URL_RE =
  /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif)(\?.*)?$/i;
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp|avif|gif)$/i;

function isNonEmptyImageRef(value) {
  if (value == null) return false;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("/") && IMAGE_EXT_RE.test(trimmed)) return true;
    if (IMAGE_URL_RE.test(trimmed)) return true;
    if (isCloudinaryUrl(trimmed)) return true;
    return false;
  }
  return false;
}

function normalizeKey(key = "") {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function classifyMediaKey(key = "") {
  const k = normalizeKey(key);
  if (!k) return null;
  if (k.includes("listing")) return "listing";
  if (k.includes("compare")) return "compare";
  if (k === "dashboard" || k.includes("dashboard") || k.includes("cockpit")) {
    return "dashboard";
  }
  if (k.includes("interior") && !k.includes("dashboard")) return "interior";
  if (k === "hero" || k === "heroimage" || k === "front") return "front";
  if (k === "rear") return "rear";
  if (k === "side") return "side";
  if (k === "exterior1") return "front";
  if (k === "exterior2") return "side";
  if (k === "exterior3") return "rear";
  return null;
}

function classifyPathHint(pathHint = "") {
  const p = String(pathHint).toLowerCase();
  if (p.includes("listing")) return "listing";
  if (p.includes("compare")) return "compare";
  if (p.includes("dashboard")) return "dashboard";
  if (p.includes("interior")) return "interior";
  if (p.includes("/rear") || p.includes("rear.")) return "rear";
  if (p.includes("/side") || p.includes("side.")) return "side";
  if (p.includes("exterior-3")) return "rear";
  if (p.includes("exterior-2")) return "side";
  if (p.includes("exterior-1") || p.includes("/hero") || p.includes("front.")) {
    return "front";
  }
  return null;
}

function addHit(hits, type, entry) {
  if (!type || !AUDIT_IMAGE_TYPES.includes(type)) return;
  if (!hits[type]) {
    hits[type] = {
      present: true,
      sources: [],
      refs: [],
    };
  }
  hits[type].sources.push(entry.source);
  if (entry.ref && !hits[type].refs.includes(entry.ref)) {
    hits[type].refs.push(entry.ref);
  }
}

function collectFromObject(obj, hits, sourceLabel, pathPrefix = "") {
  if (!obj || typeof obj !== "object") return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectFromObject(item, hits, sourceLabel, pathPrefix);
    }
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    const nextPath = pathPrefix ? `${pathPrefix}.${key}` : key;

    if (typeof value === "string" && isNonEmptyImageRef(value)) {
      const type =
        classifyMediaKey(key) ||
        classifyPathHint(nextPath) ||
        classifyPathHint(value);
      if (type) {
        addHit(hits, type, { source: sourceLabel, ref: value });
      }
      continue;
    }

    if (value && typeof value === "object") {
      collectFromObject(value, hits, sourceLabel, nextPath);
    }
  }
}

function localDirsForSlug(root, familySlug) {
  return [
    join(root, "public", "images", "cars", familySlug),
    join(root, "public", "images", familySlug),
    join(root, "public", "images", "catalog", "families", familySlug),
    join(root, "public", "catalog", "families", familySlug),
    join(root, "public", "images", "vehicles", familySlug),
  ];
}

function scanLocalFiles(root, familySlug, hits) {
  for (const dir of localDirsForSlug(root, familySlug)) {
    if (!existsSync(dir)) continue;

    let entries = [];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }

    for (const name of entries) {
      const full = join(dir, name);
      let isFile = false;
      try {
        isFile = statSync(full).isFile();
      } catch {
        continue;
      }
      if (!isFile || !IMAGE_EXT_RE.test(name)) continue;

      for (const type of AUDIT_IMAGE_TYPES) {
        const candidates = LOCAL_FILENAMES[type] || [];
        if (candidates.includes(name.toLowerCase())) {
          const ref = full.replace(root, "").replace(/\\/g, "/");
          addHit(hits, type, { source: "public-images", ref });
        }
      }

      const hinted = classifyPathHint(name);
      if (hinted) {
        const ref = full.replace(root, "").replace(/\\/g, "/");
        addHit(hits, hinted, { source: "public-images", ref });
      }
    }
  }
}

function collectVerifiedDossierMedia(familySlug, hits) {
  const media = VERIFIED_FAMILY_MEDIA[familySlug];
  if (!media) return;
  collectFromObject(media, hits, "verified-dossier");

  if (isNonEmptyImageRef(media.heroImage)) {
    addHit(hits, "front", {
      source: "verified-dossier",
      ref: media.heroImage,
    });
  }
  if (isNonEmptyImageRef(media.listingImage || media.listingThumbnail)) {
    addHit(hits, "listing", {
      source: "verified-dossier",
      ref: media.listingImage || media.listingThumbnail,
    });
  }
  if (isNonEmptyImageRef(media.compareImage || media.compareThumbnail)) {
    addHit(hits, "compare", {
      source: "verified-dossier",
      ref: media.compareImage || media.compareThumbnail,
    });
  }
}

function collectProductionManifest(familySlug, hits) {
  if (!isProductionFamilySlug(familySlug)) return;
  const media = PRODUCTION_FAMILY_MEDIA[familySlug];
  if (!media) return;

  if (isNonEmptyImageRef(media.listingThumbnail)) {
    addHit(hits, "listing", {
      source: "cloudinary-manifest",
      ref: media.listingThumbnail,
    });
  }
  if (isNonEmptyImageRef(media.compareThumbnail)) {
    addHit(hits, "compare", {
      source: "cloudinary-manifest",
      ref: media.compareThumbnail,
    });
  }
  if (isNonEmptyImageRef(media.heroImage)) {
    addHit(hits, "front", {
      source: "cloudinary-manifest",
      ref: media.heroImage,
    });
  }
}

function collectTier1Seed(familySlug, seedManifest, hits) {
  const seed = seedManifest?.[familySlug];
  if (!seed || typeof seed !== "object") return;

  for (const [role, url] of Object.entries(seed)) {
    if (role.startsWith("_") || !isNonEmptyImageRef(url)) continue;
    const type = SEED_ROLE_TO_TYPE[role] || classifyMediaKey(role);
    if (type) {
      addHit(hits, type, { source: "tier1-seed", ref: url });
    }
  }
}

function collectLocalCarManifest(familySlug, hits) {
  if (!isLocalCarMediaFamily(familySlug)) return;
  const block = buildLocalCarMediaBlock(familySlug);
  if (!block) return;

  for (const type of LOCAL_CAR_IMAGE_TYPES) {
    const ref = block[type] || block[`${type}Thumbnail`];
    if (isNonEmptyImageRef(ref)) {
      addHit(hits, type, { source: "local-car-manifest", ref });
    }
  }

  if (isNonEmptyImageRef(block.listingThumbnail)) {
    addHit(hits, "listing", {
      source: "local-car-manifest",
      ref: block.listingThumbnail,
    });
  }
  if (isNonEmptyImageRef(block.compareThumbnail)) {
    addHit(hits, "compare", {
      source: "local-car-manifest",
      ref: block.compareThumbnail,
    });
  }
  if (isNonEmptyImageRef(block.heroImage)) {
    addHit(hits, "front", {
      source: "local-car-manifest",
      ref: block.heroImage,
    });
  }
}

function collectGoldenVehicleJson(root, familySlug, hits) {
  const filePath = join(
    root,
    "public",
    "catalog",
    "golden-dataset",
    "vehicles",
    `${familySlug}.json`
  );
  if (!existsSync(filePath)) return;

  try {
    const json = JSON.parse(readFileSync(filePath, "utf8"));
    collectFromObject(json, hits, "catalog-vehicle-json");
  } catch {
    // ignore parse errors — surfaced in report meta if needed
  }
}

export function loadGoldenVehicles(root) {
  const manifestPath = join(
    root,
    "public",
    "catalog",
    "golden-dataset",
    "manifest.json"
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  return manifest.vehicles || [];
}

export function loadTier1SeedManifest(root) {
  const seedPath = join(root, "docs", "operations", "tier1-cloudinary-seed.json");
  if (!existsSync(seedPath)) return {};
  return JSON.parse(readFileSync(seedPath, "utf8"));
}

export function auditVehicleMediaCompleteness({
  root,
  familySlug,
  displayName,
  seedManifest,
}) {
  const hits = {};

  collectVerifiedDossierMedia(familySlug, hits);
  collectProductionManifest(familySlug, hits);
  collectLocalCarManifest(familySlug, hits);
  collectTier1Seed(familySlug, seedManifest, hits);
  collectGoldenVehicleJson(root, familySlug, hits);
  scanLocalFiles(root, familySlug, hits);

  const types = {};
  let presentCount = 0;

  for (const type of AUDIT_IMAGE_TYPES) {
    const hit = hits[type];
    const present = Boolean(hit?.present);
    if (present) presentCount += 1;

    types[type] = {
      present,
      sources: hit?.sources ? [...new Set(hit.sources)] : [],
      refs: hit?.refs || [],
    };
  }

  const coveragePct = Math.round((presentCount / AUDIT_IMAGE_TYPES.length) * 100);

  return {
    familySlug,
    displayName: displayName || familySlug,
    types,
    presentCount,
    requiredCount: AUDIT_IMAGE_TYPES.length,
    coveragePct,
    isProductionFamily: isProductionFamilySlug(familySlug),
    hasVerifiedDossier: Boolean(VERIFIED_FAMILY_MEDIA[familySlug]),
  };
}

export function buildMediaAuditV1Report(root) {
  const vehicles = loadGoldenVehicles(root);
  const seedManifest = loadTier1SeedManifest(root);

  const rows = vehicles.map((vehicle) =>
    auditVehicleMediaCompleteness({
      root,
      familySlug: vehicle.familySlug || vehicle.id,
      displayName: vehicle.displayName,
      seedManifest,
    })
  );

  const totals = rows.reduce(
    (acc, row) => {
      acc.presentSlots += row.presentCount;
      acc.requiredSlots += row.requiredCount;
      for (const type of AUDIT_IMAGE_TYPES) {
        if (row.types[type]?.present) acc.byType[type] += 1;
      }
      return acc;
    },
    {
      presentSlots: 0,
      requiredSlots: 0,
      byType: Object.fromEntries(AUDIT_IMAGE_TYPES.map((t) => [t, 0])),
    }
  );

  const fleetCoveragePct =
    totals.requiredSlots > 0
      ? Math.round((totals.presentSlots / totals.requiredSlots) * 100)
      : 0;

  return {
    version: "media-audit-v1",
    generatedAt: new Date().toISOString(),
    vehicleCount: rows.length,
    requiredImageTypes: [...AUDIT_IMAGE_TYPES],
    sourcesInspected: [
      "public/images/cars",
      "public/images",
      "local-car-manifest",
      "cloudinary-manifest",
      "tier1-cloudinary-seed",
      "verified-dossier",
      "catalog-vehicle-json",
    ],
    mappingNotes: {
      front: "hero, exterior-1, or explicit front assets",
      rear: "rear, exterior-3, or explicit rear assets",
      side: "side, exterior-2, or explicit side assets",
      interior: "interior-1 or interior gallery assets",
      dashboard: "dashboard or interior-dashboard assets (not inferred from interior alone)",
    },
    summary: {
      fleetCoveragePct,
      presentSlots: totals.presentSlots,
      requiredSlots: totals.requiredSlots,
      byType: totals.byType,
      vehiclesAt100Pct: rows.filter((r) => r.coveragePct === 100).length,
      vehiclesBelow50Pct: rows.filter((r) => r.coveragePct < 50).length,
    },
    vehicles: rows,
  };
}

function cellMark(present) {
  return present ? "✓" : "—";
}

export function mediaAuditV1Markdown(report) {
  const lines = [
    "# Media Audit v1",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Scope",
    "",
    `- **Vehicles:** ${report.vehicleCount} (golden dataset)`,
    `- **Required image types:** ${report.requiredImageTypes.join(", ")}`,
    `- **Fleet coverage:** ${report.summary.fleetCoveragePct}% (${report.summary.presentSlots}/${report.summary.requiredSlots} slots)`,
    `- **Vehicles at 100%:** ${report.summary.vehiclesAt100Pct}`,
    `- **Vehicles below 50%:** ${report.summary.vehiclesBelow50Pct}`,
    "",
    "## Type coverage (vehicles with asset present)",
    "",
    "| Type | Vehicles |",
    "|------|----------|",
  ];

  for (const type of AUDIT_IMAGE_TYPES) {
    lines.push(`| ${type} | ${report.summary.byType[type]}/${report.vehicleCount} |`);
  }

  lines.push(
    "",
    "## Vehicle matrix",
    "",
    "| Vehicle | Listing | Compare | Front | Rear | Side | Interior | Dashboard | Coverage % |",
    "|---------|---------|---------|-------|------|------|----------|-----------|------------|"
  );

  for (const row of report.vehicles) {
    const cells = AUDIT_IMAGE_TYPES.map((t) => cellMark(row.types[t].present));
    lines.push(
      `| ${row.displayName} | ${cells.join(" | ")} | ${row.coveragePct}% |`
    );
  }

  lines.push(
    "",
    "## Legend",
    "",
    "- **✓** — at least one reference found across inspected sources",
    "- **—** — no reference found",
    "",
    "## Sources inspected",
    "",
    ...report.sourcesInspected.map((s) => `- ${s}`),
    "",
    "## Asset mapping",
    "",
    ...Object.entries(report.mappingNotes).map(
      ([type, note]) => `- **${type}:** ${note}`
    ),
    ""
  );

  return lines.join("\n");
}
