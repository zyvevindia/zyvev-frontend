/**
 * Array coercion for compare-related persisted/runtime values.
 */

const MAX_INDEXED_OBJECT_KEYS = 5;

/**
 * Coerce unknown values to a safe array (never throws).
 * @param {unknown} value
 * @returns {unknown[]}
 */
export function ensureArray(value) {
  if (value == null) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return ensureArray(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }

  if (typeof value === "object") {
    if (value instanceof Set) return Array.from(value);

    const keys = Object.keys(value);
    const looksLikeIndexedObject =
      keys.length > 0 &&
      keys.every((k) => /^\d+$/.test(String(k))) &&
      keys.length <= MAX_INDEXED_OBJECT_KEYS;

    if (looksLikeIndexedObject) {
      return keys
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => value[k]);
    }

    const values = Object.values(value);
    const allCarLike = values.every(
      (v) =>
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        (v.slug || v._id || v.name || v.brand)
    );

    if (allCarLike) return values;
    return [];
  }

  return [];
}

/**
 * @param {unknown} raw
 * @returns {object[]}
 */
export function normalizeComparePairs(raw) {
  return ensureArray(raw).filter(
    (item) => item && typeof item === "object" && !Array.isArray(item)
  );
}
