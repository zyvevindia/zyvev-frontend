/**
 * Central compare runtime array normalization — never throw on malformed shapes.
 */

const COMPARE_SHAPE_LABEL = "[Compare Runtime Shape]";

function isDevCompareDiagnostics() {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
}

/**
 * Dev-only shape diagnostics (no secrets / env values logged).
 * @param {string} label
 * @param {unknown} value
 * @param {string} [subsystem]
 */
export function warnCompareShape(label, value, subsystem = "compare") {
  if (!isDevCompareDiagnostics()) return;
  if (value == null || Array.isArray(value)) return;

  console.warn(COMPARE_SHAPE_LABEL, {
    label,
    subsystem,
    typeof: typeof value,
    isArray: Array.isArray(value),
    constructor: value?.constructor?.name ?? null,
  });
}

/**
 * Coerce unknown values to a safe array (never throws).
 * @param {unknown} value
 * @param {{ label?: string, subsystem?: string }} [opts]
 * @returns {unknown[]}
 */
export function ensureArray(value, opts = {}) {
  if (value == null) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return ensureArray(JSON.parse(trimmed), opts);
    } catch {
      warnCompareShape(opts.label || "string", value, opts.subsystem);
      return [];
    }
  }

  if (typeof value === "object") {
    if (value instanceof Set) return Array.from(value);

    const keys = Object.keys(value);
    if (keys.length === 0) return [];

    const allNumeric = keys.every((k) => /^\d+$/.test(String(k)));
    if (allNumeric) {
      warnCompareShape(opts.label || "indexed-object", value, opts.subsystem);
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

    if (allCarLike) {
      warnCompareShape(opts.label || "car-map", value, opts.subsystem);
      return values;
    }

    warnCompareShape(opts.label || "object", value, opts.subsystem);
    return values.filter((v) => v != null);
  }

  warnCompareShape(opts.label || "scalar", value, opts.subsystem);
  return [];
}

/**
 * @param {unknown} value
 * @param {number} [start]
 * @param {number} [end]
 * @param {{ label?: string, subsystem?: string }} [opts]
 */
export function safeSlice(value, start, end, opts) {
  return ensureArray(value, opts).slice(start, end);
}

/**
 * @param {unknown} value
 * @param {(item: unknown, index: number, array: unknown[]) => unknown} fn
 * @param {{ label?: string, subsystem?: string }} [opts]
 */
export function safeMap(value, fn, opts) {
  return ensureArray(value, opts).map(fn);
}

/**
 * @param {unknown} value
 * @param {(item: unknown, index: number, array: unknown[]) => boolean} fn
 * @param {{ label?: string, subsystem?: string }} [opts]
 */
export function safeFilter(value, fn, opts) {
  return ensureArray(value, opts).filter(fn);
}

/**
 * @param {unknown} value
 * @param {(item: unknown, index: number, array: unknown[]) => unknown[]} fn
 * @param {{ label?: string, subsystem?: string }} [opts]
 */
export function safeFlatMap(value, fn, opts) {
  return ensureArray(value, opts).flatMap(fn);
}

/**
 * Compare pair rows for ops dashboards.
 * @param {unknown} raw
 */
export function normalizeComparePairs(raw) {
  return safeFilter(
    raw,
    (item) => item && typeof item === "object" && !Array.isArray(item),
    { label: "comparePairs", subsystem: "ops" }
  );
}
