/**
 * Natural-language helpers for editorial review copy.
 */

const SENTENCE_END = /[.!?]$/;

/**
 * @param {string} text
 * @returns {string}
 */
export function normalizeReviewText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\b(undefined|null)\b/gi, "")
    .trim();
}

/**
 * @param {string} fragment
 * @returns {string}
 */
function toPhraseFragment(fragment) {
  const cleaned = normalizeReviewText(fragment).replace(SENTENCE_END, "");
  if (!cleaned) return "";
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

/**
 * @param {string[]} words
 * @returns {string[]}
 */
function dedupeLeadingWords(words) {
  const seen = new Set();
  const result = [];

  for (const word of words) {
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(word);
  }

  return result;
}

/**
 * @param {string} sentence
 * @returns {string}
 */
export function buildNaturalSentence(sentence) {
  const cleaned = normalizeReviewText(sentence);
  if (!cleaned) return "";
  const words = cleaned.split(/\s+/);
  const deduped = dedupeLeadingWords(words);
  const out = deduped.join(" ");
  return SENTENCE_END.test(out) ? out : `${out}.`;
}

/**
 * Join editorial fragments into readable prose.
 * @param {string[]} fragments
 * @param {{ opener?: string, closer?: string, joiner?: string }} [options]
 * @returns {string}
 */
export function joinFragmentsNaturally(fragments = [], options = {}) {
  const phrases = fragments
    .map(toPhraseFragment)
    .filter(Boolean)
    .filter((phrase, index, list) => phrase !== list[index - 1]);

  if (!phrases.length) {
    return options.fallback ? buildNaturalSentence(options.fallback) : "";
  }

  const uniquePhrases = [];
  for (const phrase of phrases) {
    if (
      uniquePhrases.length &&
      uniquePhrases.at(-1).toLowerCase() === phrase.toLowerCase()
    ) {
      continue;
    }
    uniquePhrases.push(phrase);
  }

  if (options.opener) {
    const opener = normalizeReviewText(options.opener).replace(SENTENCE_END, "");
    if (uniquePhrases.length === 1) {
      return buildNaturalSentence(`${opener} ${uniquePhrases[0]}`);
    }
    const last = uniquePhrases.at(-1);
    const middle = uniquePhrases.slice(0, -1).join(", ");
    return buildNaturalSentence(`${opener} ${middle}, and ${last}`);
  }

  const joined = uniquePhrases
    .map((phrase, index) =>
      index === 0
        ? phrase.charAt(0).toUpperCase() + phrase.slice(1)
        : phrase
    )
    .join(". ");

  return buildNaturalSentence(joined);
}

/**
 * @param {string[]} items
 * @param {number} [limit]
 * @returns {string[]}
 */
export function dedupeReviewItems(items = [], limit = 5) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const cleaned = normalizeReviewText(item);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= limit) break;
  }

  return result;
}

/**
 * @param {string|null|undefined} body
 * @param {string} fallback
 * @returns {string}
 */
export function reviewSectionBodyOrFallback(body, fallback) {
  const cleaned = normalizeReviewText(body);
  return cleaned || buildNaturalSentence(fallback);
}
