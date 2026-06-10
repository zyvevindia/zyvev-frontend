/**
 * Scan local car WebP assets for EVSavari batch placeholder imagery.
 *
 * Batch labels from populate scripts embed text such as:
 * - "EVSavari Media Day 1/2/3"
 * - "EVSavari Media Completion Sprint"
 *
 * Text is rasterized into WebP, so detection uses binary marker scan plus
 * visual heuristics (small file + high background color dominance).
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

import { TRACKER_IMAGE_TYPES, displayNameForSlug } from "./photoReplacementTracker.mjs";

/** Substrings from generation batch labels (populate-media-day*.mjs, media-completion-sprint.mjs). */
export const PLACEHOLDER_MARKERS = Object.freeze([
  "EVSavari Media Day",
  "Media Completion Sprint",
]);

const PLACEHOLDER_MAX_BYTES = 15_000;
const PLACEHOLDER_DOMINANCE_MIN = 0.5;

export function scanBinaryMarkers(buffer) {
  if (!buffer || !buffer.length) return [];
  const text = buffer.toString("latin1");
  return PLACEHOLDER_MARKERS.filter((marker) => text.includes(marker));
}

export async function analyzeImagePlaceholder(filePath) {
  const stat = statSync(filePath);
  const buffer = readFileSync(filePath);
  const binaryMarkers = scanBinaryMarkers(buffer);

  if (binaryMarkers.length > 0) {
    return {
      classification: "placeholder",
      detectionMethod: "binary-marker",
      markersFound: binaryMarkers,
      fileSizeBytes: stat.size,
      colorDominance: null,
    };
  }

  const { data, info } = await sharp(buffer)
    .resize(160, 100, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  const buckets = new Map();

  for (let i = 0; i < data.length; i += info.channels) {
    const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  let maxBucket = 0;
  for (const count of buckets.values()) {
    maxBucket = Math.max(maxBucket, count);
  }

  const colorDominance = maxBucket / pixelCount;
  const isGeneratedBatch =
    stat.size <= PLACEHOLDER_MAX_BYTES &&
    colorDominance >= PLACEHOLDER_DOMINANCE_MIN;

  if (isGeneratedBatch) {
    return {
      classification: "placeholder",
      detectionMethod: "visual-heuristic",
      markersFound: [...PLACEHOLDER_MARKERS],
      markerNote:
        "Rasterized batch label (EVSavari Media Day / Media Completion Sprint)",
      fileSizeBytes: stat.size,
      colorDominance: Number(colorDominance.toFixed(4)),
    };
  }

  return {
    classification: "real",
    detectionMethod: "visual-heuristic",
    markersFound: [],
    fileSizeBytes: stat.size,
    colorDominance: Number(colorDominance.toFixed(4)),
  };
}

function listVehicleSlugs(carsDir) {
  if (!existsSync(carsDir)) return [];
  return readdirSync(carsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function imageTypeFromFilename(filename) {
  return filename.replace(/\.webp$/i, "").toLowerCase();
}

/**
 * @param {{ rootDir: string }} options
 */
export async function runMediaPlaceholderAudit({ rootDir }) {
  const carsDir = join(rootDir, "public", "images", "cars");
  const slugs = listVehicleSlugs(carsDir);
  const vehicles = [];

  let fleetReal = 0;
  let fleetPlaceholder = 0;

  for (const slug of slugs) {
    const vehicleDir = join(carsDir, slug);
    const files = readdirSync(vehicleDir)
      .filter((name) => name.toLowerCase().endsWith(".webp"))
      .sort();

    const assets = [];
    let realImages = 0;
    let placeholderImages = 0;

    for (const filename of files) {
      const filePath = join(vehicleDir, filename);
      const analysis = await analyzeImagePlaceholder(filePath);
      const imageType = imageTypeFromFilename(filename);

      if (analysis.classification === "placeholder") {
        placeholderImages += 1;
        fleetPlaceholder += 1;
      } else {
        realImages += 1;
        fleetReal += 1;
      }

      assets.push({
        imageType,
        filename,
        path: `/images/cars/${slug}/${filename}`,
        ...analysis,
      });
    }

    const totalImages = assets.length;
    const coveragePct =
      totalImages === 0
        ? 0
        : Number(((realImages / totalImages) * 100).toFixed(1));

    vehicles.push({
      slug,
      displayName: displayNameForSlug(slug),
      realImages,
      placeholderImages,
      totalImages,
      coveragePct,
      assets,
    });
  }

  const fleetTotal = fleetReal + fleetPlaceholder;
  const fleetCoveragePct =
    fleetTotal === 0
      ? 0
      : Number(((fleetReal / fleetTotal) * 100).toFixed(1));

  return {
    generatedAt: new Date().toISOString(),
    audit: "media-placeholder-audit",
    scanRoot: "public/images/cars/**",
    markers: [...PLACEHOLDER_MARKERS],
    detection: {
      binaryMarkerScan: true,
      visualHeuristic:
        "WebP ≤15KB and dominant quantized color ≥50% (batch-generated placeholders)",
      note:
        "Batch label text is burned into WebP pixels; binary scan rarely matches.",
    },
    imageTypes: [...TRACKER_IMAGE_TYPES],
    summary: {
      vehicleCount: vehicles.length,
      totalImages: fleetTotal,
      realImages: fleetReal,
      placeholderImages: fleetPlaceholder,
      coveragePct: fleetCoveragePct,
    },
    vehicles,
  };
}

export function formatMediaPlaceholderMarkdown(report) {
  const lines = [
    "# Media Placeholder Audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Scans `public/images/cars/**` for batch-generated placeholder WebP assets.",
    "",
    "## Markers",
    "",
    ...report.markers.map((m) => `- \`${m}\` (and variants such as Media Day 1/2/3)`),
    "",
    "## Detection",
    "",
    `- ${report.detection.note}`,
    `- Visual heuristic: ${report.detection.visualHeuristic}`,
    "",
    "## Fleet summary",
    "",
    `- Vehicles: **${report.summary.vehicleCount}**`,
    `- Total images: **${report.summary.totalImages}**`,
    `- Real images: **${report.summary.realImages}**`,
    `- Placeholder images: **${report.summary.placeholderImages}**`,
    `- Real-photo coverage: **${report.summary.coveragePct}%**`,
    "",
    "## By vehicle",
    "",
    "| Vehicle | Real | Placeholder | Total | Coverage % |",
    "| --- | ---: | ---: | ---: | ---: |",
  ];

  for (const row of report.vehicles) {
    lines.push(
      `| ${row.displayName} (\`${row.slug}\`) | ${row.realImages} | ${row.placeholderImages} | ${row.totalImages} | ${row.coveragePct} |`
    );
  }

  const placeholderAssets = report.vehicles.flatMap((v) =>
    v.assets
      .filter((a) => a.classification === "placeholder")
      .map((a) => ({ ...a, slug: v.slug, displayName: v.displayName }))
  );

  if (placeholderAssets.length > 0) {
    lines.push("", "## Placeholder assets", "");
    lines.push("| Vehicle | File | Method | Size (bytes) |");
    lines.push("| --- | --- | --- | ---: |");
    for (const asset of placeholderAssets) {
      lines.push(
        `| ${asset.displayName} | \`${asset.filename}\` | ${asset.detectionMethod} | ${asset.fileSizeBytes} |`
      );
    }
  }

  lines.push("", "## Re-run", "", "```bash", "npm run media:placeholder-audit", "```");

  return lines.join("\n");
}
