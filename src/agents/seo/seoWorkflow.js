/**
 * SEO Agent v1 — workflow helpers.
 */
import { SEO_STATUS } from "./seoStatus.js";
import { generateSeoContent } from "./seoContentGenerator.js";
import { buildSeoRecommendation } from "./seoRecommendation.js";

export function workflowStatusAfterGeneration(result) {
  if (!result?.ok) return SEO_STATUS.REJECTED;
  const rec = result.recommendation;
  if (rec?.code === "BLOCKED") return SEO_STATUS.REVIEW_REQUIRED;
  return SEO_STATUS.REVIEW_REQUIRED;
}

export function runGenerationPipeline(spec, vehicles) {
  const generated = generateSeoContent(spec, vehicles);
  if (!generated.ok) {
    return {
      ok: false,
      errors: generated.errors || ["Generation failed"],
    };
  }

  const recommendation = buildSeoRecommendation({
    missingFields: generated.missingFields,
    rankedCount: generated.seoPage?.rankedVehicles?.length ?? 0,
  });

  return {
    ok: true,
    seoPage: generated.seoPage,
    wrappedContent: generated.wrapped,
    missingFields: generated.missingFields,
    recommendation,
    candidatePoolSize: generated.candidatePoolSize,
  };
}
