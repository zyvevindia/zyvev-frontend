/**
 * Media Population Day 1 — WebP ingest for five catalog families.
 * npm run media:populate-day1
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import {
  LOCAL_CAR_IMAGE_TYPES,
  LOCAL_CAR_MEDIA_FAMILIES,
  buildLocalCarMediaBlock,
} from "../src/media/localCarMediaManifest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const seedPath = join(__dirname, "lib", "mediaPopulationDay1Seed.json");
const seed = JSON.parse(readFileSync(seedPath, "utf8"));

const TYPE_COLORS = {
  listing: { r: 30, g: 58, b: 95 },
  compare: { r: 45, g: 74, b: 111 },
  front: { r: 61, g: 90, b: 128 },
  rear: { r: 76, g: 106, b: 143 },
  side: { r: 92, g: 122, b: 158 },
  interior: { r: 52, g: 73, b: 94 },
  dashboard: { r: 68, g: 88, b: 108 },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadBuffer(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "EVSavari-MediaOps/1.0 (day1-population)",
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

async function writeGeneratedWebp(outPath, familySlug, type) {
  const rgb = TYPE_COLORS[type] || { r: 40, g: 60, b: 80 };
  const label = `${familySlug} · ${type}`;
  const svg = `
    <svg width="1280" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(${rgb.r},${rgb.g},${rgb.b})"/>
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="42" fill="#ffffff">${label}</text>
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="22" fill="#d0e4ff">EVSavari Media Day 1</text>
    </svg>`;

  await sharp(Buffer.from(svg))
    .resize(1280, 800)
    .webp({ quality: 82 })
    .toFile(outPath);
}

async function writeWebpAsset({ outPath, familySlug, type, seedUrl }) {
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

  await writeGeneratedWebp(outPath, familySlug, type);
  return "generated";
}

function patchGoldenVehicleJson(familySlug) {
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
  const media = buildLocalCarMediaBlock(familySlug);
  record.media = {
    ...media,
    listingThumbnail: media.listingThumbnail,
    compareThumbnail: media.compareThumbnail,
    heroImage: media.heroImage,
    galleryImages: media.gallery,
    interiorImages: [media.interior, media.dashboard].filter(Boolean),
  };
  writeFileSync(jsonPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return true;
}

console.log("\n=== Media Population Day 1 ===\n");

const results = [];

for (const familySlug of LOCAL_CAR_MEDIA_FAMILIES) {
  const roles = seed[familySlug];
  if (!roles) {
    console.error(`  Missing seed for ${familySlug}`);
    results.push({ familySlug, ok: false, error: "missing seed" });
    continue;
  }

  const outDir = join(root, "public", "images", "cars", familySlug);
  mkdirSync(outDir, { recursive: true });

  const written = [];
  const sources = {};
  let failed = null;

  for (const type of LOCAL_CAR_IMAGE_TYPES) {
    const outPath = join(outDir, `${type}.webp`);
    try {
      const source = await writeWebpAsset({
        outPath,
        familySlug,
        type,
        seedUrl: roles[type],
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

  const jsonOk = failed ? false : patchGoldenVehicleJson(familySlug);

  results.push({
    familySlug,
    ok: !failed && written.length === LOCAL_CAR_IMAGE_TYPES.length && jsonOk,
    written,
    sources,
    goldenJsonUpdated: jsonOk,
    error: failed,
  });
}

const okCount = results.filter((r) => r.ok).length;
console.log(`\nCompleted ${okCount}/${LOCAL_CAR_MEDIA_FAMILIES.length} families.\n`);

if (okCount !== LOCAL_CAR_MEDIA_FAMILIES.length) {
  process.exit(1);
}
