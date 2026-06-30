import { expect } from "@playwright/test";

import { assertHealthyPage } from "./assertHealthyPage.js";
import { installCatalogApiStub } from "./catalogApiStub.js";
import {
  waitForCatalogGridReady,
  waitForCatalogCardImages,
  waitForDiscoveryCatalogReady,
  waitForFontsReady,
  waitForHomeCatalogReady,
  waitForLayoutStable,
  waitForScrollTop,
  waitForVisibleImagesLoaded,
} from "./playwrightSync.js";

/** CSS injected before screenshots to stabilize rendering. */
const STABILIZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
  html {
    scroll-behavior: auto !important;
  }
`;

/** Selectors for regions that change between runs (banners, counters, lazy media). */
export const DEFAULT_MASK_SELECTORS = Object.freeze([
  ".soft-launch-banner",
  "[data-testid='soft-launch-banner']",
  ".car-card-skeleton",
  ".skeleton",
  "[aria-busy='true']",
  "img[loading='lazy']:not([complete])",
]);

/**
 * @param {import("@playwright/test").Page} page
 */
export async function prepareVisualPage(page) {
  await installCatalogApiStub(page);

  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("evsavari-soft-launch-banner-dismissed", "1");
    } catch {
      /* ignore */
    }

    const eagerLoadImages = () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        img.loading = "eager";
      });
    };

    const nativeScrollTo = window.scrollTo.bind(window);
    window.scrollTo = (arg0, arg1) => {
      if (arg0 && typeof arg0 === "object") {
        nativeScrollTo({ ...arg0, behavior: "auto" });
        return;
      }
      nativeScrollTo(arg0, arg1);
    };

    eagerLoadImages();
    new MutationObserver(eagerLoadImages).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });

  await page.addStyleTag({ content: STABILIZE_CSS });
}

/**
 * Wait until the page is ready for a deterministic screenshot.
 *
 * @param {import("@playwright/test").Page} page
 * @param {import("./visualPages.js").VisualPageTarget} target
 * @param {{ timeout?: number }} [options]
 */
export async function waitForVisualStable(page, target, options = {}) {
  const { timeout = 45_000 } = options;

  await page.waitForLoadState("domcontentloaded", { timeout });

  if (target.hashAnchor) {
    await expect(page.locator(`#${target.hashAnchor}`)).toBeVisible({
      timeout: 10_000,
    });
  }

  if (target.readySelector) {
    await expect(page.locator(target.readySelector).first()).toBeVisible({
      timeout,
    });
  }

  if (target.retryCatalog) {
    await waitForCatalogContent(page, target.readySelector, timeout);
  }

  if (target.requireCatalogGrid) {
    await waitForCatalogGridReady(page, timeout);
    await waitForCatalogCardImages(page, timeout);
  }

  if (target.requireHomeCatalog) {
    await waitForHomeCatalogReady(page, timeout);
  }

  if (target.requireDiscoveryCatalog) {
    await waitForDiscoveryCatalogReady(page, timeout);
    await waitForCatalogCardImages(page, timeout);
  }

  await waitForFontsReady(page);
  await waitForVisibleImagesLoaded(page, timeout);

  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  if (!target.skipScrollTopWait) {
    await waitForScrollTop(page);
  }

  await waitForLayoutStable(page, { timeout: 20_000 });

  await page.waitForFunction(() => document.readyState === "complete", null, {
    timeout: 10_000,
  });

  await waitForLayoutStable(page, { timeout: 10_000, samples: 2 });
}

/**
 * Poll for catalog-backed pages; retries when the transient load panel appears.
 *
 * @param {import("@playwright/test").Page} page
 * @param {string | undefined} readySelector
 * @param {number} timeout
 */
async function waitForCatalogContent(page, readySelector, timeout) {
  const selector =
    readySelector || ".cd-page, .cd-overview-dashboard, .score2-perspective";

  await expect
    .poll(
      async () => {
        const ready = page.locator(selector).first();
        if (await ready.isVisible().catch(() => false)) {
          return true;
        }

        const retryButton = page.getByRole("button", { name: "Try again" });
        if (await retryButton.isVisible().catch(() => false)) {
          await retryButton.click();
        }

        return false;
      },
      {
        message: `waiting for catalog content (${selector})`,
        timeout,
        intervals: [500, 800, 1200],
      }
    )
    .toBe(true);
}

/**
 * Navigate to a public page and stabilize it for screenshot capture.
 *
 * @param {import("@playwright/test").Page} page
 * @param {import("./visualPages.js").VisualPageTarget} target
 */
export async function gotoVisualTarget(page, target) {
  await prepareVisualPage(page);

  const hashIndex = target.path.indexOf("#");
  const path = hashIndex >= 0 ? target.path.slice(0, hashIndex) : target.path;
  const pathHash = hashIndex >= 0 ? target.path.slice(hashIndex + 1) : null;
  const hashAnchor = target.hashAnchor || pathHash;
  const gotoUrl = hashAnchor ? `${path}#${hashAnchor}` : path;

  const response = await page.goto(gotoUrl, {
    waitUntil: "domcontentloaded",
  });

  expect(response?.ok() ?? false, `Failed to load ${gotoUrl}`).toBeTruthy();
  await assertHealthyPage(page);

  await waitForVisualStable(page, target);
}

/**
 * Build Playwright screenshot assertion options for a visual target.
 *
 * @param {import("@playwright/test").Page} page
 * @param {import("./visualPages.js").VisualPageTarget} target
 */
export function buildScreenshotOptions(page, target) {
  const maskSelectors = [
    ...DEFAULT_MASK_SELECTORS,
    ...(target.maskSelectors ?? []),
  ];

  return {
    fullPage: target.fullPage ?? true,
    animations: "disabled",
    caret: "hide",
    scale: "css",
    mask: maskSelectors.map((selector) => page.locator(selector)),
    timeout: 30_000,
  };
}

/**
 * Resolve snapshot name: e.g. home-desktop-chromium
 *
 * @param {string} pageId
 * @param {string} deviceLabel
 * @param {string} [browserName]
 */
export function visualSnapshotName(pageId, deviceLabel, browserName) {
  const parts = [pageId, deviceLabel];
  if (browserName) {
    parts.push(browserName);
  }
  return parts.join("-");
}
