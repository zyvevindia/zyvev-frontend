/**
 * True when Playwright visual regression init script has run (browser test-only).
 *
 * @returns {boolean}
 */
export function isVisualRegressionMode() {
  return (
    typeof window !== "undefined" &&
    window.__EVSAVARI_VISUAL_REGRESSION__ === true
  );
}
