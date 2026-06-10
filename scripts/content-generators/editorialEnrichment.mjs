import { getTop20Editorial } from "../../src/content/editorial/top20Editorial.js";

/**
 * Merge human-reviewed editorial layer onto agent-generated seoPage.
 * @param {object} seoPage
 * @param {string} contentSlug
 * @returns {object}
 */
export function applyEditorialEnrichment(seoPage, contentSlug) {
  const editorial = getTop20Editorial(contentSlug);
  if (!editorial) return seoPage;

  const merged = {
    ...seoPage,
    editorial,
    governance: {
      ...(seoPage.governance || {}),
      humanReviewed: true,
      editorialEnriched: true,
      editorialReviewedAt: editorial.reviewedAt,
    },
  };

  if (editorial.relatedLinks?.length) {
    const existing = seoPage.relatedLinks || [];
    const seen = new Set(
      existing.flatMap((s) => (s.links || []).map((l) => l.href))
    );
    const extraLinks = editorial.relatedLinks.filter((l) => !seen.has(l.href));
    if (extraLinks.length) {
      merged.relatedLinks = [
        ...existing,
        {
          title: "Editorial picks",
          links: extraLinks.map((l) => ({ label: l.label, href: l.href })),
        },
      ];
    }
  }

  return merged;
}
