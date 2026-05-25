/**
 * Development-only catalog/compare/media diagnostics.
 */

import { devWarn } from "./devDiagnostics.js";

export function warnMalformedCatalogPayload(car, issues = []) {
  if (!import.meta.env.DEV || !issues.length) return;
  devWarn("Malformed catalog payload", {
    slug: car?.slug,
    issues,
  });
}

export function warnInvalidCompareIntelligence(pairSlug, issues = []) {
  if (!import.meta.env.DEV || !issues.length) return;
  devWarn("Compare intelligence gap", { pairSlug, issues });
}

export function warnMediaRoleConflict(conflict = {}) {
  if (!import.meta.env.DEV) return;
  devWarn("Media role conflict", conflict);
}
