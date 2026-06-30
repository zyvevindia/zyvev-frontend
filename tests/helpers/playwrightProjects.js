/**
 * Playwright project name registry — single source of truth for npm runners.
 * Project definitions (devices, testMatch) live in playwright.config.js.
 */

/** Core + responsive functional E2E projects (excludes visual-*). */
export const FUNCTIONAL_E2E_PROJECT_NAMES = [
  "chromium",
  "firefox",
  "webkit",
  "responsive-desktop-chrome",
  "responsive-iphone-14",
  "responsive-pixel-7",
  "responsive-ipad-air",
];

/** Functional projects that require WebKit (unavailable on Windows). */
export const WEBKIT_DEPENDENT_FUNCTIONAL_PROJECTS = new Set([
  "webkit",
  "responsive-iphone-14",
]);

/** All visual regression projects (requires PLAYWRIGHT_VISUAL=1 in config). */
export const ALL_VISUAL_PROJECT_NAMES = [
  "visual-chromium",
  "visual-firefox",
  "visual-webkit",
  "visual-laptop-chromium",
  "visual-laptop-firefox",
  "visual-laptop-webkit",
  "visual-tablet-chromium",
  "visual-tablet-firefox",
  "visual-tablet-webkit",
  "visual-mobile-chromium",
  "visual-mobile-firefox",
  "visual-mobile-webkit",
];

export const WEBKIT_VISUAL_PROJECT_NAMES = ALL_VISUAL_PROJECT_NAMES.filter((name) =>
  name.includes("webkit")
);

/**
 * Functional E2E projects for the current platform.
 * Windows skips WebKit-dependent projects; Linux CI runs the full matrix (98 tests).
 * @param {string} [platform]
 */
export function getFunctionalE2eProjectNames(platform = process.platform) {
  if (platform === "win32") {
    return FUNCTIONAL_E2E_PROJECT_NAMES.filter(
      (name) => !WEBKIT_DEPENDENT_FUNCTIONAL_PROJECTS.has(name)
    );
  }
  return [...FUNCTIONAL_E2E_PROJECT_NAMES];
}

/**
 * Visual regression projects for the current platform.
 * @param {string} [platform]
 * @param {{ webkitOnly?: boolean }} [options]
 */
export function getVisualProjectNames(
  platform = process.platform,
  { webkitOnly = false } = {}
) {
  if (webkitOnly) {
    return [...WEBKIT_VISUAL_PROJECT_NAMES];
  }
  if (platform === "win32") {
    return ALL_VISUAL_PROJECT_NAMES.filter((name) => !name.includes("webkit"));
  }
  return [...ALL_VISUAL_PROJECT_NAMES];
}
