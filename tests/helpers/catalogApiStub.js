/**
 * Playwright network stub for catalog API probes (test-only).
 *
 * Vehicle detail and related pages probe `${API_URL}/cars?limit=N` before loading
 * bundled golden data. Without a reachable backend, the probe fails and pages show
 * "Could not load this vehicle". This stub returns an empty catalog list so golden
 * fallback paths run deterministically in CI and local E2E — no live backend required.
 *
 * Host-agnostic: works whether VITE_API_URL is localhost:5000 or production API.
 */

/** @param {string} url */
function isPreviewOrigin(url) {
  try {
    const parsed = new URL(url);
    const isLocal =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const previewPort =
      parsed.port === "5173" || parsed.port === "4173" || parsed.port === "";
    return isLocal && previewPort;
  } catch {
    return false;
  }
}

/** @param {string} url */
function isCatalogListProbe(url) {
  try {
    if (isPreviewOrigin(url)) return false;
    const parsed = new URL(url);
    return parsed.pathname === "/cars" && parsed.searchParams.has("limit");
  } catch {
    return false;
  }
}

/** @param {string} url */
function isCatalogApiPath(url) {
  try {
    if (isPreviewOrigin(url)) return false;
    const parsed = new URL(url);
    return parsed.pathname.startsWith("/api/catalog/");
  } catch {
    return false;
  }
}

/**
 * Install catalog API route handlers on a Playwright page.
 *
 * @param {import("@playwright/test").Page} page
 */
export async function installCatalogApiStub(page) {
  await page.route(isCatalogListProbe, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ cars: [] }),
    });
  });

  await page.route(isCatalogApiPath, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "not_available_in_playwright_tests" }),
    });
  });
}
