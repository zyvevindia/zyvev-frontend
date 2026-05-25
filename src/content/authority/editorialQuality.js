/**
 * Editorial quality governance — calm tone, hype detection, readability.
 */

import { EDITORIAL_REQUIREMENTS } from "./editorialFramework.js";

const HYPE_PATTERNS = [
  /\bbest ev ever\b/i,
  /\bgame[- ]?changer\b/i,
  /\brevolutionary\b/i,
  /\bunbeatable\b/i,
  /\bno brainer\b/i,
  /\bguaranteed savings\b/i,
  /\bpays for itself instantly\b/i,
  /\bzero cost\b/i,
  /\bnever worry\b/i,
  /\bperfect for everyone\b/i,
];

const UNREALISTIC_PATTERNS = [
  /\bno maintenance ever\b/i,
  /\bunlimited range\b/i,
  /\bfree electricity\b/i,
  /\balways cheaper\b/i,
  /\bimpossible to fail\b/i,
];

/**
 * @param {object} seoPage
 */
export function scoreEditorialQuality(seoPage = {}) {
  const issues = [];
  const text = collectText(seoPage);

  for (const re of HYPE_PATTERNS) {
    if (re.test(text)) issues.push({ code: "hype_language", pattern: re.source });
  }
  for (const re of UNREALISTIC_PATTERNS) {
    if (re.test(text)) {
      issues.push({ code: "unrealistic_claim", pattern: re.source });
    }
  }

  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const avgWordsPerSentence =
    sentences.length > 0 ? words / sentences.length : words;
  const readabilityScore =
    avgWordsPerSentence <= 22
      ? 90
      : avgWordsPerSentence <= 28
        ? 75
        : 55;
  if (avgWordsPerSentence > 28) {
    issues.push({ code: "long_sentences", detail: Math.round(avgWordsPerSentence) });
  }

  const faq = seoPage.faq || [];
  const weakFaq = faq.filter(
    (f) => !f.answer || String(f.answer).length < 40
  );
  if (weakFaq.length) issues.push({ code: "weak_faqs", count: weakFaq.length });

  const sections = seoPage.editorialSections || [];
  if (sections.length < EDITORIAL_REQUIREMENTS.minEditorialSections) {
    issues.push({ code: "shallow_sections" });
  }

  const titles = sections.map((s) => s.title?.toLowerCase()).filter(Boolean);
  if (titles.length !== new Set(titles).size) {
    issues.push({ code: "duplicate_headings" });
  }

  const calmScore = Math.max(
    0,
    100 - issues.filter((i) => i.code === "hype_language").length * 20 -
      issues.filter((i) => i.code === "unrealistic_claim").length * 25
  );

  const qualityScore = Math.round(
    (readabilityScore * 0.3 + calmScore * 0.4 + (issues.length === 0 ? 100 : 70) * 0.3) -
      issues.length * 5
  );

  return {
    ok: !issues.some((i) =>
      ["hype_language", "unrealistic_claim", "shallow_sections"].includes(i.code)
    ),
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
    readabilityScore,
    calmToneScore: calmScore,
    issues,
    wordCount: words,
  };
}

function collectText(seoPage) {
  const parts = [seoPage.intro, ...(seoPage.tradeoffs || [])];
  for (const s of seoPage.editorialSections || []) {
    parts.push(s.title, ...(s.paragraphs || []), ...(s.bullets || []));
    for (const m of s.misconceptions || []) {
      parts.push(m.myth, m.reality);
    }
  }
  for (const f of seoPage.faq || []) {
    parts.push(f.question, f.answer);
  }
  return parts.filter(Boolean).join(" ");
}

/**
 * Detect duplicated intros across pages.
 * @param {object[]} seoPages
 */
export function detectDuplicatedCopy(seoPages = []) {
  const byIntro = new Map();
  const dupes = [];
  for (const page of seoPages) {
    const key = String(page.intro || "")
      .slice(0, 120)
      .toLowerCase();
    if (!key) continue;
    if (byIntro.has(key)) {
      dupes.push({ a: byIntro.get(key), b: page.slug });
    } else {
      byIntro.set(key, page.slug);
    }
  }
  return dupes;
}
