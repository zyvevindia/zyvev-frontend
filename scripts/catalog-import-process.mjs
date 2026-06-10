/**
 * Server-side catalog import extraction (URL fetch — no CORS).
 * Usage: node scripts/catalog-import-process.mjs --url=https://... [--import-id=uuid]
 */

import "./lib/bootstrapEnv.mjs";

import { getSupabaseAdminClient } from "../src/backend/supabase/adminClient.js";
import {
  createCatalogImport,
  updateCatalogImport,
  insertCatalogImportSnapshot,
} from "../src/backend/services/catalogImportService.js";
import {
  IMPORT_SOURCE_TYPE,
  IMPORT_STATUS,
  SNAPSHOT_TYPE,
  normalizeExtractedContent,
  initializeReviewedVehicle,
  hashContent,
  buildSourceSnapshot,
} from "../src/catalogAcquisition/index.js";

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : null;
}

async function fetchUrl(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "EVSavari-CatalogImport/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const url = arg("url");
  const importId = arg("import-id");
  const createdBy = arg("by") || "cli";

  if (!url) {
    console.error("Usage: node scripts/catalog-import-process.mjs --url=https://...");
    process.exit(1);
  }

  console.log(`Fetching ${url}…`);
  const rawContent = await fetchUrl(url);
  const contentHash = await hashContent(rawContent);
  const normalized = normalizeExtractedContent(rawContent, {
    sourceType: IMPORT_SOURCE_TYPE.OEM_URL,
    sourceUrl: url,
  });

  const client = getSupabaseAdminClient();
  if (!client) {
    console.log("Supabase admin not configured — outputting JSON only");
    console.log(JSON.stringify({ contentHash, normalized }, null, 2));
    return;
  }

  let id = importId;
  if (!id) {
    const created = await createCatalogImport(
      {
        status: IMPORT_STATUS.DRAFT,
        sourceType: IMPORT_SOURCE_TYPE.OEM_URL,
        sourceUrl: url,
        createdBy,
      },
      client
    );
    if (!created.ok) throw new Error(created.error?.message);
    id = created.data.id;
  }

  const updated = await updateCatalogImport(
    id,
    {
      status: IMPORT_STATUS.REVIEW_REQUIRED,
      rawContent,
      rawContentHash: contentHash,
      extractedVehicle: normalized.extractedVehicle,
      reviewedVehicle: initializeReviewedVehicle(normalized.extractedVehicle),
      confidenceScore: normalized.confidenceScore,
      diagnostics: { processedBy: "catalog-import-process.mjs" },
    },
    client
  );

  if (!updated.ok) throw new Error(updated.error?.message);

  await insertCatalogImportSnapshot(
    buildSourceSnapshot(id, SNAPSHOT_TYPE.SOURCE_RAW, { url, preview: rawContent.slice(0, 1500) }, contentHash),
    client
  );
  await insertCatalogImportSnapshot(
    buildSourceSnapshot(id, SNAPSHOT_TYPE.EXTRACTED, normalized.extractedVehicle, contentHash),
    client
  );

  console.log(`Import ${id} ready for review (confidence ${normalized.confidenceScore}%)`);
  console.log(`Open: /admin/catalog/import`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
