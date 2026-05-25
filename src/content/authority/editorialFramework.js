/**
 * Editorial page structure for authority population — QA + generators.
 */

export const EDITORIAL_SECTION_TYPES = Object.freeze([
  "introduction",
  "practical",
  "ownership_realism",
  "common_concerns",
  "misconceptions",
  "compare_support",
  "charging_safety",
  "suitability",
]);

export const EDITORIAL_REQUIREMENTS = Object.freeze({
  minFaqCount: 4,
  minEditorialSections: 4,
  minIntroLength: 80,
  minCompareSupportLinks: 2,
});

/**
 * @param {object} seoPage
 */
export function validateAuthorityEditorialPage(seoPage = {}) {
  const issues = [];
  const introLen = String(seoPage.intro || "").trim().length;
  if (introLen < EDITORIAL_REQUIREMENTS.minIntroLength) {
    issues.push({ code: "thin_intro", detail: introLen });
  }
  const sections = seoPage.editorialSections || [];
  if (sections.length < EDITORIAL_REQUIREMENTS.minEditorialSections) {
    issues.push({
      code: "weak_outline",
      detail: `${sections.length} sections`,
    });
  }
  const titles = sections.map((s) => s.title?.toLowerCase()).filter(Boolean);
  if (titles.length !== new Set(titles).size) {
    issues.push({ code: "duplicate_headings" });
  }
  const faq = seoPage.faq || [];
  if (faq.length < EDITORIAL_REQUIREMENTS.minFaqCount) {
    issues.push({ code: "missing_faqs", detail: faq.length });
  }
  const support = seoPage.compareSupportLinks || [];
  if (support.length < EDITORIAL_REQUIREMENTS.minCompareSupportLinks) {
    issues.push({ code: "missing_compare_support", detail: support.length });
  }
  const realism = sections.some(
    (s) =>
      s.type === "ownership_realism" ||
      s.id === "ownership-realism" ||
      /realism|limitation|honest/i.test(s.title || "")
  );
  if (!realism && !(seoPage.tradeoffs?.length >= 2)) {
    issues.push({ code: "missing_ownership_realism" });
  }
  return {
    ok: issues.length === 0,
    issues,
    completenessScore: Math.max(
      0,
      100 -
        issues.length * 15 -
        (faq.length < 5 ? 5 : 0) -
        (sections.length < 5 ? 10 : 0)
    ),
  };
}
