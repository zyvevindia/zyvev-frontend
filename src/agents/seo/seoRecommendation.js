/**
 * SEO Agent v1 — generation recommendation logic.
 */
import { SEO_RECOMMENDATION } from "./seoStatus.js";

export function buildSeoRecommendation({ missingFields = [], rankedCount = 0 } = {}) {
  if (missingFields.length > 0) {
    return {
      code: SEO_RECOMMENDATION.BLOCKED,
      label: "Blocked — missing required fields",
      summary: `Missing: ${missingFields.slice(0, 5).join(", ")}${missingFields.length > 5 ? "…" : ""}`,
      missingFields,
    };
  }

  if (rankedCount < 2) {
    return {
      code: SEO_RECOMMENDATION.REVIEW_REQUIRED,
      label: "Review required — thin results",
      summary: `Only ${rankedCount} ranked item(s) — verify catalog pool before publish.`,
      missingFields: [],
    };
  }

  return {
    code: SEO_RECOMMENDATION.READY,
    label: "Ready for human review",
    summary: "Draft content complete from deterministic catalog scores — human approval required before publish.",
    missingFields: [],
  };
}

export function recommendationRequiresReview(recommendation) {
  return (
    recommendation?.code === SEO_RECOMMENDATION.REVIEW_REQUIRED ||
    recommendation?.code === SEO_RECOMMENDATION.BLOCKED
  );
}
