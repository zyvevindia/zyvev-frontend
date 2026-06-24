/**
 * Deterministic narrative variant selection — no randomness.
 */

/**
 * @param {string} seed
 * @returns {number}
 */
function hashSeed(seed) {
  const value = String(seed || "");
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

/**
 * @param {string[]} variants
 * @param {string} seed
 * @returns {string}
 */
export function selectNarrativeVariation(variants = [], seed = "") {
  const cleaned = variants.map((item) => String(item || "").trim()).filter(Boolean);

  if (!cleaned.length) {
    return "";
  }

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  const index = hashSeed(seed) % cleaned.length;
  return cleaned[index];
}
