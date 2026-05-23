/**
 * Media staging ops — human-governed queue (no auto-publish).
 */

import {
  PRODUCTION_FAMILY_SLUGS,
  PRODUCTION_FAMILY_MEDIA,
} from "../media/familyMediaManifest.js";
import { TIER1_FAMILY_SLUGS } from "./tier1Families.js";
import { buildTier1FamilyMediaRows, summarizeTier1MediaHealth } from "./tier1MediaHealth.js";
import { collectCoreManifestMediaUrls } from "../utils/mediaAudit.js";
import { isProductionFamilySlug } from "../media/productionFamilies.js";

export const STAGING_STATUS = Object.freeze({
  MISSING: "MISSING",
  STAGED: "STAGED",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  REVIEW: "REVIEW",
});

const QUEUE_KEY = "evsavari-media-staging-queue-v1";

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(0, 200)));
  } catch {
    /* quota */
  }
}

export function listStagingQueue() {
  return readQueue();
}

export function upsertStagingItem(item) {
  const queue = readQueue();
  const id = item.id || `${item.familySlug}-${item.role}`;
  const idx = queue.findIndex((q) => q.id === id);
  const next = {
    id,
    updatedAt: new Date().toISOString(),
    publishStatus: STAGING_STATUS.REVIEW,
    ...item,
  };
  if (idx >= 0) queue[idx] = { ...queue[idx], ...next };
  else queue.unshift(next);
  writeQueue(queue);
  return next;
}

export function approveStagingItem(id) {
  const queue = readQueue();
  const item = queue.find((q) => q.id === id);
  if (!item) return null;
  item.publishStatus = STAGING_STATUS.APPROVED;
  item.approvedAt = new Date().toISOString();
  writeQueue(queue);
  return item;
}

function detectIssuesForFamily(row) {
  const issues = [];
  const heroOk = row.roles?.hero?.status === "ok";
  const listingOk = row.roles?.listing?.status === "ok";
  const compareOk = row.roles?.compare?.status === "ok";
  if (!heroOk) issues.push("missing_hero");
  if (!listingOk) issues.push("missing_listing");
  if (!compareOk) issues.push("missing_compare");
  if (row.placeholderUsage) issues.push("placeholder_dependency");
  if (row.completenessPercent < 75) issues.push("low_completeness");
  return issues;
}

function candidateConfidence(row) {
  const heroOk = row.roles?.hero?.status === "ok";
  const listingOk = row.roles?.listing?.status === "ok";
  const compareOk = row.roles?.compare?.status === "ok";
  let score = 30;
  if (heroOk) score += 25;
  if (listingOk) score += 20;
  if (compareOk) score += 20;
  if (!row.placeholderUsage) score += 10;
  if (row.cloudinaryReady) score += 15;
  return Math.min(100, score);
}

/**
 * Build staging audit rows (CLI + admin).
 */
export function buildMediaStagingAudit() {
  const rows = buildTier1FamilyMediaRows();
  const summary = summarizeTier1MediaHealth(rows);
  const coreUrls = new Set(collectCoreManifestMediaUrls());
  const queue = readQueue();

  const families = TIER1_FAMILY_SLUGS.map((familySlug) => {
    const row = rows.find((r) => r.familySlug === familySlug) || {
      familySlug,
      roles: {},
      placeholderUsage: true,
      completenessPercent: 0,
      cloudinaryReady: false,
    };
    const issues = detectIssuesForFamily(row);
    const manifest = PRODUCTION_FAMILY_MEDIA[familySlug];
    const inManifest = isProductionFamilySlug(familySlug);
    const coreOk =
      row.roles?.hero?.status === "ok" &&
      row.roles?.listing?.status === "ok" &&
      row.roles?.compare?.status === "ok";
    const publishStatus =
      inManifest && coreOk
      ? STAGING_STATUS.PUBLISHED
      : queue.find((q) => q.familySlug === familySlug)?.publishStatus ||
        STAGING_STATUS.MISSING;

    return {
      familySlug,
      inManifest,
      publishStatus,
      candidateConfidence: candidateConfidence(row),
      issues,
      suggestedAction:
        issues.length === 0
          ? "verify_only"
          : issues.includes("missing_hero")
            ? "upload_core_assets"
            : "review_candidates",
      publicIdPrefix: `evsavari/catalog/families/${familySlug}`,
      manifestAutoReady: Boolean(manifest),
      duplicateRisk: false,
      wrongVehicleRisk: issues.includes("placeholder_dependency"),
      aspectRatioRisk:
        row.roles?.compare?.status !== "ok" &&
        row.roles?.listing?.status === "ok",
      lowResolutionRisk: row.completenessPercent < 50,
    };
  });

  const unresolved = families.filter(
    (f) => f.publishStatus !== STAGING_STATUS.PUBLISHED
  );
  const approvalQueue = queue.filter(
    (q) => q.publishStatus === STAGING_STATUS.REVIEW
  );
  const approvedQueue = queue.filter(
    (q) => q.publishStatus === STAGING_STATUS.APPROVED
  );

  return {
    families,
    summary,
    unresolvedFamilies: unresolved,
    uploadQueue: unresolved.filter((f) =>
      f.issues.some((i) => i.startsWith("missing_"))
    ),
    approvalQueue,
    approvedQueue,
    coreUrlCount: coreUrls.size,
    workflow: [
      "source",
      "staging",
      "review",
      "cloudinary",
      "manifest",
      "verify",
      "publish",
    ],
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "media-staging-audit",
      version: 1,
      humanApprovalRequired: true,
    },
  };
}

export function buildMediaStagingReport() {
  const audit = buildMediaStagingAudit();
  return {
    ...audit,
    productionFamilyCount: PRODUCTION_FAMILY_SLUGS.length,
    tier1FamilyCount: TIER1_FAMILY_SLUGS.length,
  };
}
