/**
 * Shared local car WebP population for Media Population batches.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

import {
  LOCAL_CAR_IMAGE_TYPES,
  buildLocalCarMediaBlock,
  getLocalCarMediaTypesForFamily,
} from "../../src/media/localCarMediaManifest.js";

const TYPE_COLORS = {
  listing: { r: 30, g: 58, b: 95 },
  compare: { r: 45, g: 74, b: 111 },
  front: { r: 61, g: 90, b: 128 },
  rear: { r: 76, g: 106, b: 143 },
  side: { r: 92, g: 122, b: 158 },
  interior: { r: 52, g: 73, b: 94 },
  dashboard: { r: 68, g: 88, b: 108 },
};

async function downloadBuffer(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "EVSavari-MediaOps/1.0 (local-car-population)",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

async function writeGeneratedWebp(outPath, familySlug, type, batchLabel) {
  const rgb = TYPE_COLORS[type] || { r: 40, g: 60, b: 80 };
  const label = `${familySlug} · ${type}`;
  const svg = `
    <svg width="1280" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(${rgb.r},${rgb.g},${rgb.b})"/>
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="42" fill="#ffffff">${label}</text>
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="22" fill="#d0e4ff">${batchLabel}</text>
    </svg>`;

  await sharp(Buffer.from(svg))
    .resize(1280, 800)
    .webp({ quality: 82 })
    .toFile(outPath);
}

async function writeWebpAsset({ outPath, familySlug, type, seedUrl, batchLabel }) {
  if (seedUrl) {
    try {
      const buffer = await downloadBuffer(seedUrl);
      await sharp(buffer)
        .resize(1280, 800, { fit: "cover", position: "centre" })
        .webp({ quality: 82 })
        .toFile(outPath);
      return "wikimedia";
    } catch {
      // fall through to generated asset
    }
  }

  await writeGeneratedWebp(outPath, familySlug, type, batchLabel);
  return "generated";
}

export function patchGoldenVehicleJson(root, familySlug) {
  const jsonPath = join(
    root,
    "public",
    "catalog",
    "golden-dataset",
    "vehicles",
    `${familySlug}.json`
  );
  if (!existsSync(jsonPath)) return false;

  const record = JSON.parse(readFileSync(jsonPath, "utf8"));
  const local = buildLocalCarMediaBlock(familySlug);
  if (!local) return false;

  const prev = record.media || {};
  const galleryImages = [
    ...(local.gallery || []),
    ...(Array.isArray(prev.galleryImages) ? prev.galleryImages : []),
    ...(Array.isArray(prev.gallery) ? prev.gallery : []),
  ].filter((url, index, arr) => url && arr.indexOf(url) === index);

  const interiorImages = [
    local.interior,
    local.dashboard,
    ...(Array.isArray(prev.interiorImages) ? prev.interiorImages : []),
  ].filter(Boolean);
  const uniqueInterior = [...new Set(interiorImages)];

  record.media = {
    ...prev,
    ...local,
    listingThumbnail: local.listingThumbnail || prev.listingThumbnail,
    compareThumbnail: local.compareThumbnail || prev.compareThumbnail,
    heroImage: local.heroImage || prev.heroImage,
    front: local.front || prev.front,
    rear: local.rear || prev.rear,
    side: local.side || prev.side,
    interior: local.interior || prev.interior,
    dashboard: local.dashboard || prev.dashboard,
    galleryImages,
    interiorImages: uniqueInterior,
  };
  writeFileSync(jsonPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return true;
}

/**
 * @param {object} options
 * @param {string} options.root
 * @param {readonly string[]} options.families
 * @param {Record<string, Record<string, string>>} options.seed
 * @param {string} options.batchLabel
 * @param {Record<string, readonly string[]>} [options.typesByFamily]
 */
export async function populateLocalCarMedia({
  root,
  families,
  seed,
  batchLabel,
  typesByFamily = {},
}) {
  const results = [];

  for (const familySlug of families) {
    const roles = seed[familySlug] || {};
    const types =
      typesByFamily[familySlug] ||
      getLocalCarMediaTypesForFamily(familySlug) ||
      LOCAL_CAR_IMAGE_TYPES;
    const outDir = join(root, "public", "images", "cars", familySlug);
    mkdirSync(outDir, { recursive: true });

    const written = [];
    const sources = {};
    let failed = null;

    for (const type of types) {
      const outPath = join(outDir, `${type}.webp`);
      try {
        const source = await writeWebpAsset({
          outPath,
          familySlug,
          type,
          seedUrl: roles[type],
          batchLabel,
        });
        written.push(type);
        sources[type] = source;
        console.log(`  ${familySlug}/${type}.webp (${source})`);
      } catch (err) {
        failed = `${type}: ${err?.message || err}`;
        console.error(`  FAIL ${familySlug}/${type} — ${failed}`);
        break;
      }
    }

    const jsonOk = failed ? false : patchGoldenVehicleJson(root, familySlug);

    results.push({
      familySlug,
      ok: !failed && written.length === types.length && jsonOk,
      written,
      sources,
      goldenJsonUpdated: jsonOk,
      error: failed,
    });
  }

  return results;
}
