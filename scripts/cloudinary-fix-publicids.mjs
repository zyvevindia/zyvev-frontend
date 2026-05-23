/**
 * Rename Cloudinary uploads to canonical family public IDs (Upload API rename).
 *
 * Works with dynamic folder mode: UI folders use asset_folder; public_id may be random.
 *
 * Usage:
 *   npm run media:discover-cloudinary
 *   npm run media:fix-cloudinary -- --dry-run
 *   npm run media:fix-cloudinary
 *
 * Options:
 *   --discover        Full inventory under evsavari/ (asset folders + public_ids)
 *   --dry-run         Preview only
 *   --family=slug     Single family
 *   --skip-audit      Skip npm run media:audit -- --probe
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ROOT_PREFIX = "evsavari";

const FAMILIES = [
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-curvv-ev",
  "tata-tiago-ev",
  "mg-comet-ev",
  "mg-zs-ev",
  "mahindra-be-6",
  "mahindra-xev-9e",
  "mahindra-xuv400",
  "byd-atto-3",
  "hyundai-kona-electric",
];

const TARGET_ROLES = ["hero", "listing-thumb", "compare-thumb"];

const LIST_FIELDS =
  "asset_id,public_id,display_name,secure_url,created_at,asset_folder,format,width,height";

const dryRun = process.argv.includes("--dry-run");
const discoverMode = process.argv.includes("--discover");
const familyArg = process.argv.find((a) => a.startsWith("--family="))?.split("=")[1];

function loadCloudinaryV2() {
  try {
    return require("cloudinary").v2;
  } catch {
    const backendPath = join(root, "../zyvev-backend/node_modules/cloudinary");
    if (existsSync(backendPath)) {
      return require(backendPath).v2;
    }
    console.error("cloudinary package not found. Run: npm install");
    process.exit(1);
  }
}

const cloudinary = loadCloudinaryV2();

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return val;
}

function canonicalFamilyFolder(familySlug) {
  return `${ROOT_PREFIX}/catalog/families/${familySlug}`;
}

function canonicalPublicId(familySlug, role) {
  return `${canonicalFamilyFolder(familySlug)}/${role}`;
}

function folderFromPublicId(publicId) {
  const parts = String(publicId || "").split("/");
  return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
}

function leafFromPublicId(publicId) {
  const leaf = String(publicId || "").split("/").pop() || "";
  return leaf.replace(/\.(jpg|jpeg|png|webp|avif|gif)$/i, "");
}

function familyAssetFolderCandidates(familySlug) {
  return [
    `${ROOT_PREFIX}/${familySlug}`,
    `${ROOT_PREFIX}/catalog/families/${familySlug}`,
    `${ROOT_PREFIX}/families/${familySlug}`,
  ];
}

function deliveryUrl(cloudName, publicId) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit/${publicId}`;
}

function uniqueByPublicId(resources) {
  const seen = new Set();
  return resources.filter((r) => {
    if (!r?.public_id || seen.has(r.public_id)) return false;
    seen.add(r.public_id);
    return true;
  });
}

/** List images in a Media Library asset_folder (dynamic folder mode). */
async function listByAssetFolder(assetFolder) {
  const resources = [];
  let nextCursor;

  do {
    const result = await cloudinary.api.resources_by_asset_folder(assetFolder, {
      max_results: 500,
      next_cursor: nextCursor,
      fields: LIST_FIELDS,
    });
    resources.push(...(result.resources || []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return resources;
}

/** Walk evsavari/ subfolders via Admin API (asset_folder tree). */
async function listAllUnderEvsavariTree() {
  const all = [];
  const visitedFolders = new Set();
  const queue = [ROOT_PREFIX];

  while (queue.length) {
    const folder = queue.shift();
    if (!folder || visitedFolders.has(folder)) continue;
    visitedFolders.add(folder);

    try {
      const assets = await listByAssetFolder(folder);
      all.push(...assets);
    } catch (err) {
      if (!err.message?.includes("Not found")) {
        console.warn(`  list ${folder}: ${err.message}`);
      }
    }

    try {
      const subs = await cloudinary.api.sub_folders(folder);
      for (const sub of subs.folders || []) {
        const path = sub.path || `${folder}/${sub.name}`;
        if (!visitedFolders.has(path)) queue.push(path);
      }
    } catch {
      /* leaf folder */
    }
  }

  return uniqueByPublicId(all).sort((a, b) =>
    (a.asset_folder || a.public_id).localeCompare(b.asset_folder || b.public_id)
  );
}

/** Fallback: prefix search on public_id (fixed folder mode). */
async function listByPublicIdPrefix(prefix) {
  const resources = [];
  let nextCursor;
  const normalized = prefix.endsWith("/") ? prefix : `${prefix}/`;

  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: normalized,
      max_results: 500,
      next_cursor: nextCursor,
    });
    resources.push(...(result.resources || []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return resources;
}

async function listAllAssets() {
  let assets = await listAllUnderEvsavariTree();

  if (!assets.length) {
    console.warn(
      "  No assets via asset_folder tree — trying public_id prefix listing…"
    );
    assets = await listByPublicIdPrefix(ROOT_PREFIX);
  }

  return assets.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

function printAssetRow(asset, label) {
  const folder =
    asset.asset_folder || asset.folder || folderFromPublicId(asset.public_id);
  console.log(`\n  [${label}]`);
  console.log(`    asset_id:      ${asset.asset_id || "(n/a)"}`);
  console.log(`    public_id:     ${asset.public_id}`);
  console.log(
    `    display_name:  ${asset.display_name ?? asset.original_filename ?? "(n/a)"}`
  );
  console.log(`    folder:        ${folder || "(root)"}`);
  console.log(`    secure_url:    ${asset.secure_url || "(n/a)"}`);
  console.log(
    `    created_at:    ${asset.created_at || "(n/a)"}  (${asset.format || "?"}, ${asset.width || "?"}x${asset.height || "?"})`
  );
}

function printInventory(allAssets) {
  console.log(
    `\n══ Inventory: ${allAssets.length} image(s) under ${ROOT_PREFIX}/ ══\n`
  );
  allAssets.forEach((asset, i) => printAssetRow(asset, i + 1));
}

function assetsInAssetFolder(allAssets, assetFolder) {
  const prefix = assetFolder.endsWith("/")
    ? assetFolder.slice(0, -1)
    : assetFolder;

  return allAssets.filter((a) => {
    const af = a.asset_folder || folderFromPublicId(a.public_id);
    return af === prefix || af?.startsWith(`${prefix}/`);
  });
}

function resolveFamilyAssets(allAssets, familySlug) {
  let bestFolder = null;
  let bestAssets = [];

  for (const folder of familyAssetFolderCandidates(familySlug)) {
    const matches = assetsInAssetFolder(allAssets, folder);
    if (matches.length > bestAssets.length) {
      bestAssets = matches;
      bestFolder = folder;
    }
  }

  if (!bestAssets.length) {
    bestAssets = allAssets.filter((a) => {
      const hay = `${a.asset_folder || ""}/${a.public_id}`;
      return hay.includes(familySlug);
    });
    if (bestAssets.length) {
      bestFolder = bestAssets[0].asset_folder || familySlug;
    }
  }

  return { folder: bestFolder, assets: bestAssets };
}

function normalizeMediaLabel(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|avif|gif)$/i, "");
}

/** Match hero.jpg, hero_hxqhpe, listing-thumb_bqw9tf, compare-thumb_oshfyo, etc. */
function roleFromLabel(label) {
  const base = normalizeMediaLabel(label);
  if (!base) return null;

  if (base === "hero" || base === "hero-image" || /^hero([_-]|$)/.test(base)) {
    return "hero";
  }
  if (
    base === "listing" ||
    base === "listing-thumb" ||
    /^listing-thumb([_-]|$)/.test(base)
  ) {
    return "listing-thumb";
  }
  if (
    base === "compare" ||
    base === "compare-thumb" ||
    /^compare-thumb([_-]|$)/.test(base)
  ) {
    return "compare-thumb";
  }
  return null;
}

function roleForAsset(asset) {
  return (
    roleFromLabel(asset.display_name) ||
    roleFromLabel(asset.original_filename) ||
    roleFromLabel(leafFromPublicId(asset.public_id))
  );
}

function canonicalRoleSatisfied(familySlug, assets, role) {
  const targetId = canonicalPublicId(familySlug, role);
  return assets.some((a) => a.public_id === targetId);
}

function isCanonicalAsset(familySlug, asset) {
  const targetIds = new Set(
    TARGET_ROLES.map((role) => canonicalPublicId(familySlug, role))
  );
  if (targetIds.has(asset.public_id)) return true;
  const leaf = leafFromPublicId(asset.public_id);
  return (
    asset.public_id.startsWith(`${canonicalFamilyFolder(familySlug)}/`) &&
    TARGET_ROLES.includes(leaf)
  );
}

/** Prefer display_name match (hero.jpg → hero), else oldest uploads per role. */
function buildRenamePlan(familySlug, assets) {
  const plan = new Map();
  const used = new Set();

  for (const asset of assets) {
    if (isCanonicalAsset(familySlug, asset)) continue;
    const role = roleForAsset(asset);
    if (role && !plan.has(role)) {
      plan.set(role, asset);
      used.add(asset.public_id);
    }
  }

  const orphans = assets
    .filter((a) => !used.has(a.public_id) && !isCanonicalAsset(familySlug, a))
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  for (const role of TARGET_ROLES) {
    if (plan.has(role)) continue;
    if (canonicalRoleSatisfied(familySlug, assets, role)) continue;
    const next = orphans.find((a) => !used.has(a.public_id));
    if (next) {
      plan.set(role, next);
      used.add(next.public_id);
    }
  }

  return plan;
}

async function renameAsset(fromPublicId, toPublicId) {
  if (fromPublicId === toPublicId) {
    return { skipped: true };
  }

  if (dryRun) {
    console.log(`  [dry-run] rename API:`);
    console.log(`    FROM public_id: ${fromPublicId}`);
    console.log(`    TO   public_id: ${toPublicId}`);
    return { dryRun: true };
  }

  return cloudinary.uploader.rename(fromPublicId, toPublicId, {
    overwrite: true,
    invalidate: true,
  });
}

async function fixFamily(familySlug, cloudName, allAssets) {
  console.log(`\n── ${familySlug} ──`);

  const { folder, assets } = resolveFamilyAssets(allAssets, familySlug);

  if (!folder || !assets.length) {
    console.warn(`  No images in asset folders for ${familySlug}.`);
    return { familySlug, renamed: 0 };
  }

  console.log(`  asset_folder: ${folder} (${assets.length} image(s))`);

  const plan = buildRenamePlan(familySlug, assets);

  if (plan.size < TARGET_ROLES.length) {
    console.warn(
      `  Only ${plan.size} rename mapping(s); need ${TARGET_ROLES.length}.`
    );
  }

  let renamed = 0;

  for (const role of TARGET_ROLES) {
    const targetId = canonicalPublicId(familySlug, role);
    const existing = assets.find((a) => a.public_id === targetId);

    if (existing) {
      console.log(`  ✓ ${role} already public_id: ${targetId}`);
      continue;
    }

    const source = plan.get(role);
    if (!source) {
      console.warn(`  ✗ No source for ${role}`);
      continue;
    }

    console.log(`\n  Mapping → ${role}`);
    printAssetRow(source, "source");
    console.log(`    TARGET public_id: ${targetId}`);

    try {
      await renameAsset(source.public_id, targetId);
      renamed += 1;
      console.log(dryRun ? `    ✓ would rename` : `    ✓ renamed via API`);
    } catch (err) {
      console.error(`    ✗ ${err.message || err}`);
    }
  }

  console.log("\n  Delivery URLs:");
  for (const role of TARGET_ROLES) {
    console.log(`    ${role}: ${deliveryUrl(cloudName, canonicalPublicId(familySlug, role))}`);
  }

  return { familySlug, renamed };
}

async function runDiscover(cloudName) {
  console.log(`\nCloudinary discovery — cloud: ${cloudName}\n`);

  try {
    const cfg = await cloudinary.api.config();
    console.log(`  folder_mode: ${cfg.folder_mode ?? "(unknown)"}\n`);
  } catch {
    /* optional */
  }

  const all = await listAllAssets();
  printInventory(all);

  console.log("\n── Per-family mapping preview ──\n");
  for (const slug of FAMILIES) {
    const { folder, assets } = resolveFamilyAssets(all, slug);
    console.log(
      `${slug}: ${assets.length} in ${folder || "(not found)"}`
    );
    const plan = buildRenamePlan(slug, assets);
    for (const role of TARGET_ROLES) {
      const a = plan.get(role);
      if (a) {
        console.log(
          `  ${role} ← public_id ${a.public_id} (display: ${a.display_name || "—"})`
        );
      }
    }
  }

  console.log(
    "\nNext: npm run media:fix-cloudinary -- --dry-run\n      npm run media:fix-cloudinary\n"
  );
}

async function runMediaAudit() {
  console.log("\nRunning media audit with live probe…\n");
  const auditScript = join(root, "scripts", "media-audit.mjs");
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [auditScript, "--probe"], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`media:audit exited ${code}`));
    });
  });
}

async function main() {
  loadEnvFiles();

  const cloudName =
    process.env.VITE_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    "dznvmumze";

  requireEnv("CLOUDINARY_API_KEY");
  requireEnv("CLOUDINARY_API_SECRET");

  cloudinary.config({
    cloud_name: cloudName,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  if (discoverMode) {
    await runDiscover(cloudName);
    return;
  }

  const families = familyArg ? [familyArg] : FAMILIES;
  for (const slug of families) {
    if (!FAMILIES.includes(slug)) {
      console.error(`Unknown family: ${slug}`);
      process.exit(1);
    }
  }

  console.log(
    `\nCloudinary public_id fix — cloud ${cloudName}${dryRun ? " (DRY-RUN)" : ""}`
  );

  const allAssets = await listAllAssets();
  printInventory(allAssets);

  const results = [];
  for (const familySlug of families) {
    results.push(await fixFamily(familySlug, cloudName, allAssets));
  }

  const totalRenamed = results.reduce((n, r) => n + r.renamed, 0);
  console.log(`\nDone. Renamed ${totalRenamed} asset(s) via API.`);

  if (dryRun) {
    console.log("\nRe-run without --dry-run to apply.\n");
    process.exit(0);
  }

  if (totalRenamed === 0) {
    console.error(
      "\nNo renames applied. Run --discover to verify asset_folder paths.\n"
    );
    process.exit(1);
  }

  if (!process.argv.includes("--skip-audit")) {
    try {
      await runMediaAudit();
    } catch (err) {
      console.error(`\n${err.message}`);
      console.error(
        "Probe failed — upload missing assets or re-run: npm run media:audit -- --probe\n"
      );
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
