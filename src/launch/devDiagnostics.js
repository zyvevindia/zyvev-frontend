/**
 * Development-only diagnostics — no production console noise.
 * Remove or gate further after launch stabilization.
 */

const IS_DEV = import.meta.env.DEV;

export function devLog(...args) {
  if (!IS_DEV) return;
  console.log("%c[EVSavari]", "color:#2563eb;font-weight:600", ...args);
}

export function devWarn(...args) {
  if (!IS_DEV) return;
  console.warn("%c[EVSavari]", "color:#d97706;font-weight:600", ...args);
}

export function devError(...args) {
  if (!IS_DEV) return;
  console.error("%c[EVSavari]", "color:#dc2626;font-weight:600", ...args);
}
