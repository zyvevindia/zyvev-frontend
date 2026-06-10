/**
 * Shared photo replacement sprint — download, WebP conversion, tracker updates.
 */

import { mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

import {
  TRACKER_IMAGE_TYPES,
  displayNameForSlug,
  formatPhotoReplacementMarkdown,
} from "./photoReplacementTracker.mjs";
import { commonsDirectUrl, downloadBuffer } from "./wikimediaCommons.mjs";

export const TARGET_WIDTH = 1600;
export const WEBP_QUALITY = 82;

const downloadCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function loadPhotoReplacementSeed(root, seedFilename) {
  const seedPath = join(root, "scripts", "lib", seedFilename);
  const raw = JSON.parse(readFileSync(seedPath, "utf8"));
  const { _comment, ...seed } = raw;
  return seed;
}

async function fetchSourceBuffer(filename) {
  if (downloadCache.has(filename)) {
    return downloadCache.get(filename);
  }
  await sleep(750);
  const url = commonsDirectUrl(filename);
  const buffer = await downloadBuffer(url);
  downloadCache.set(filename, buffer);
  return buffer;
}

async function applyDashboardCrop(image) {
  const meta = await image.metadata();
  const width = meta.width || 1;
  const height = meta.height || 1;
  const cropWidth = Math.round(width * 0.92);
  const cropHeight = Math.round(height * 0.55);
  const left = Math.round((width - cropWidth) / 2);
  return image.extract({ left, top: 0, width: cropWidth, height: cropHeight });
}

export async function processPhotoToWebp({ filename, imageType, dashboardCrop }) {
  let pipeline = sharp(await fetchSourceBuffer(filename));

  if (dashboardCrop || imageType === "dashboard") {
    pipeline = await applyDashboardCrop(pipeline);
  }

  return pipeline
    .resize(TARGET_WIDTH, null, {
      fit: "inside",
      withoutEnlargement: false,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

export async function writeReplacementAsset({ root, slug, imageType, seedEntry }) {
  const outDir = join(root, "public", "images", "cars", slug);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${imageType}.webp`);

  const webpBuffer = await processPhotoToWebp({
    filename: seedEntry.filename,
    imageType,
    dashboardCrop: Boolean(seedEntry.dashboardCrop),
  });

  writeFileSync(outPath, webpBuffer);
  const stat = statSync(outPath);

  return {
    slug,
    imageType,
    outPath,
    bytes: stat.size,
    sourceUrl: commonsDirectUrl(seedEntry.filename),
    sourceFilename: seedEntry.filename,
    license: seedEntry.license,
    author: seedEntry.author,
  };
}

export function recalculateTrackerSummary(tracker) {
  const byStatus = {
    placeholder: 0,
    in_progress: 0,
    replaced: 0,
    approved: 0,
  };

  for (const vehicle of tracker.vehicles) {
    for (const type of TRACKER_IMAGE_TYPES) {
      const status = vehicle.assets[type]?.status || "placeholder";
      if (byStatus[status] !== undefined) {
        byStatus[status] += 1;
      }
    }
  }

  tracker.summary.byStatus = byStatus;
  tracker.generatedAt = new Date().toISOString();
  return tracker;
}

export function updatePhotoReplacementTracker(root, slugs, batchResults, replacedAt, batchLabel) {
  const trackerPath = join(root, "docs", "media", "photo-replacement-tracker.json");
  const tracker = JSON.parse(readFileSync(trackerPath, "utf8"));

  for (const slug of slugs) {
    const vehicle = tracker.vehicles.find((v) => v.slug === slug);
    if (!vehicle) continue;

    for (const imageType of TRACKER_IMAGE_TYPES) {
      const result = batchResults.find(
        (r) => r.slug === slug && r.imageType === imageType
      );
      if (!result) continue;

      vehicle.assets[imageType] = {
        ...vehicle.assets[imageType],
        status: "replaced",
        replacedAt,
        notes: `${batchLabel} — ${result.sourceFilename} (${result.license})`,
      };
    }
  }

  recalculateTrackerSummary(tracker);

  writeFileSync(trackerPath, `${JSON.stringify(tracker, null, 2)}\n`, "utf8");
  writeFileSync(
    join(root, "docs", "media", "photo-replacement-tracker.md"),
    `${formatPhotoReplacementMarkdown(tracker)}\n`,
    "utf8"
  );

  return tracker;
}

export function formatBatchMarkdown(report) {
  const lines = [
    `# EVSavari Photo Replacement — Batch ${report.batch}`,
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Vehicles: **${report.summary.vehicleCount}**`,
    `- Images replaced: **${report.summary.imagesReplaced}**`,
    `- Target width: **${report.processing.targetWidth}px** (preserve aspect ratio)`,
    `- WebP quality: **${report.processing.webpQuality}**`,
    `- Source priority: Wikimedia Commons → OEM press → licensed press`,
    "",
    "## Vehicles completed",
    "",
  ];

  for (const slug of report.slugs) {
    lines.push(`- \`${slug}\` — ${displayNameForSlug(slug)}`);
  }

  lines.push("", "## Assets", "");
  lines.push("| Vehicle | Type | Source file | License | Output bytes |");
  lines.push("| --- | --- | --- | --- | --- |");

  for (const row of report.assets) {
    lines.push(
      `| ${row.slug} | ${row.imageType} | ${row.sourceFilename} | ${row.license} | ${row.bytes.toLocaleString()} |`
    );
  }

  if (report.placeholderAudit) {
    const auditSummary =
      report.placeholderAudit.summary ?? report.placeholderAudit;
    lines.push("", "## Post-run placeholder audit", "");
    lines.push(`- Total images scanned: **${auditSummary.totalImages}**`);
    lines.push(`- Real photos: **${auditSummary.realImages}**`);
    lines.push(`- Placeholders remaining: **${auditSummary.placeholderImages}**`);
    lines.push(`- Fleet coverage: **${auditSummary.coveragePct}%**`);
  }

  if (report.buildResult) {
    lines.push("", "## Build", "");
    lines.push(
      `- \`npm run build\`: **${report.buildResult.success ? "PASS" : "FAIL"}** (exit ${report.buildResult.exitCode})`
    );
  }

  lines.push("", "## Files modified", "");
  for (const path of report.filesModified) {
    lines.push(`- \`${path}\``);
  }

  return lines.join("\n");
}

export async function runPhotoReplacementBatch({
  root,
  seed,
  slugs,
  batchNumber,
  reportBasename,
}) {
  downloadCache.clear();
  const replacedAt = new Date().toISOString();
  const batchLabel = `Batch ${batchNumber}`;
  const assets = [];

  for (const slug of slugs) {
    const vehicleSeed = seed[slug];
    if (!vehicleSeed) {
      throw new Error(`Missing seed for ${slug}`);
    }

    for (const imageType of TRACKER_IMAGE_TYPES) {
      const entry = vehicleSeed[imageType];
      if (!entry?.filename) {
        continue;
      }

      const result = await writeReplacementAsset({
        root,
        slug,
        imageType,
        seedEntry: entry,
      });
      assets.push(result);
      console.log(`  ✓ ${slug}/${imageType}.webp (${result.bytes} bytes)`);
    }
  }

  updatePhotoReplacementTracker(root, slugs, assets, replacedAt, batchLabel);

  const filesModified = [
    ...assets.map((a) => `public/images/cars/${a.slug}/${a.imageType}.webp`),
    "docs/media/photo-replacement-tracker.json",
    "docs/media/photo-replacement-tracker.md",
    `docs/media/${reportBasename}.json`,
    `docs/media/${reportBasename}.md`,
  ];

  return {
    version: `photo-replacement-batch${batchNumber}-v1`,
    generatedAt: replacedAt,
    replacedAt,
    batch: batchNumber,
    slugs: [...slugs],
    processing: {
      targetWidth: TARGET_WIDTH,
      webpQuality: WEBP_QUALITY,
      fit: "inside",
    },
    summary: {
      vehicleCount: slugs.length,
      imagesReplaced: assets.length,
    },
    assets,
    filesModified,
  };
}
