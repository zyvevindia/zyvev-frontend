/**
 * Upload tier-1 family media to canonical Cloudinary public IDs.
 *
 * Sources: docs/operations/tier1-cloudinary-seed.json (remote URLs).
 * Attribution: docs/operations/tier1-media-attribution.json (required for licensed families).
 *
 * Usage:
 *   npm run media:upload-tier1 -- --dry-run
 *   npm run media:upload-tier1
 *   npm run media:upload-tier1 -- --family=tata-tiago-ev
 *
 * Legacy frozen families (tata-nexon-ev, tata-punch-ev) are skipped unless --force-legacy.
 */

import "./lib/bootstrapEnv.mjs";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { configureCloudinaryOrExit } from "./lib/cloudinarySdk.mjs";
import {
  auditMediaAttribution,
  cloudinaryContextFromAttribution,
  loadAttributionRegistry,
  loadSeedManifest,
  resolveSourceAttribution,
  validateSourceRecord,
} from "./lib/mediaAttribution.mjs";
import {
  isLegacyFrozenMediaFamily,
  requiresLicensedAttribution,
} from "../src/media/mediaPolicy.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ROOT_PREFIX = "evsavari";
const CORE_ROLES = ["hero", "listing-thumb", "compare-thumb"];
const OPTIONAL_ROLES = [
  "og",
  "exterior-1",
  "exterior-2",
  "exterior-3",
  "interior-1",
  "charging-port",
];

const dryRun = process.argv.includes("--dry-run");
const coreOnly = process.argv.includes("--core-only");
const forceLegacy = process.argv.includes("--force-legacy");
const familyArg = process.argv.find((a) => a.startsWith("--family="))?.split("=")[1];

function canonicalFolder(familySlug) {
  return `${ROOT_PREFIX}/catalog/families/${familySlug}`;
}

function publicIdForRole(familySlug, role) {
  const base = `${canonicalFolder(familySlug)}/${role}`;
  if (CORE_ROLES.includes(role) || role === "og") {
    return base;
  }
  return `${base}.jpg`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadRemoteImage(remoteUrl, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(remoteUrl, {
        headers: {
          "User-Agent": "EVSavari-MediaOps/1.0 (catalog-ingest)",
        },
      });
      if (res.status === 429 && attempt < retries) {
        await sleep(5000 * attempt);
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, contentType };
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(2000 * attempt);
    }
  }
  throw new Error("download failed");
}

function resolveRoleAttribution(sources, familySlug, role, remoteUrl) {
  if (!requiresLicensedAttribution(familySlug)) {
    return null;
  }
  const { record } = resolveSourceAttribution(sources, remoteUrl);
  if (!record) {
    throw new Error(
      `missing attribution for ${familySlug}/${role} — update tier1-media-attribution.json`
    );
  }
  const missing = validateSourceRecord(record);
  if (missing.length) {
    throw new Error(
      `incomplete attribution for ${familySlug}/${role}: ${missing.join(", ")}`
    );
  }
  return record;
}

async function uploadRole(cloudinary, familySlug, role, remoteUrl, attribution) {
  const publicId = publicIdForRole(familySlug, role);
  const folder = canonicalFolder(familySlug);

  if (dryRun) {
    console.log(`  [dry-run] ${role}`);
    console.log(`    FROM: ${remoteUrl}`);
    console.log(`    TO:   public_id=${publicId}`);
    if (attribution) {
      console.log(`    ATTR: ${attribution.attributionText}`);
    }
    return { role, ok: true, dryRun: true };
  }

  const { buffer, contentType } = await downloadRemoteImage(remoteUrl);
  const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`;

  const uploadOptions = {
    public_id: publicId,
    asset_folder: folder,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  };

  if (attribution) {
    uploadOptions.context = cloudinaryContextFromAttribution(attribution, {
      familySlug,
      role,
    });
  }

  const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

  console.log(`  ✓ ${role} → ${result.public_id} (${result.width}x${result.height})`);
  await sleep(2500);
  return { role, ok: true, publicId: result.public_id };
}

async function main() {
  const { cloudinary, cloudName } = configureCloudinaryOrExit();

  const seed = loadSeedManifest();
  const registry = loadAttributionRegistry();
  const sources = registry.sources || {};

  const attributionAudit = auditMediaAttribution();
  if (!attributionAudit.ok) {
    console.error(
      "Attribution registry incomplete — run npm run media:attribution-audit and fix before upload.\n"
    );
    for (const issue of attributionAudit.issues.filter((i) => i.severity === "error")) {
      console.error(`  • ${issue.familySlug}/${issue.role || ""}: ${issue.message}`);
    }
    process.exit(1);
  }

  const families = familyArg ? [familyArg] : Object.keys(seed).filter((k) => !k.startsWith("_"));

  console.log(
    `\nTier-1 Cloudinary upload — cloud ${cloudName}, ${families.length} famil(ies)${dryRun ? " (DRY-RUN)" : ""}${coreOnly ? " (core only)" : ""}\n`
  );

  let uploaded = 0;
  let failed = 0;
  let skippedLegacy = 0;

  for (const familySlug of families) {
    const block = seed[familySlug];
    if (!block) {
      console.error(`No seed block for ${familySlug}`);
      process.exit(1);
    }

    if (isLegacyFrozenMediaFamily(familySlug) && !forceLegacy) {
      console.log(`── ${familySlug} ── skipped (legacy frozen — use --force-legacy to override)`);
      skippedLegacy += 1;
      continue;
    }

    const roles = coreOnly
      ? CORE_ROLES
      : [...CORE_ROLES, ...OPTIONAL_ROLES];

    console.log(`── ${familySlug} ──`);

    for (const role of roles) {
      const remoteUrl = block[role];
      if (!remoteUrl) {
        console.warn(`  − skip ${role} (no seed URL)`);
        continue;
      }
      try {
        const attribution = resolveRoleAttribution(
          sources,
          familySlug,
          role,
          remoteUrl
        );
        const result = await uploadRole(
          cloudinary,
          familySlug,
          role,
          remoteUrl,
          attribution
        );
        if (result.ok && !result.dryRun) uploaded += 1;
      } catch (err) {
        failed += 1;
        console.error(`  ✗ ${role}: ${err.message || err}`);
      }
    }
  }

  console.log(
    `\nDone. Uploaded: ${uploaded}, failed: ${failed}, legacy skipped: ${skippedLegacy}`
  );
  if (dryRun) {
    console.log("Re-run without --dry-run to apply.\n");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
