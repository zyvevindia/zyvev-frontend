import { expect } from "@playwright/test";

import { assertHealthyPage } from "./assertHealthyPage.js";
import { installCatalogApiStub } from "./catalogApiStub.js";
import {
  waitForCatalogGridReady,
  waitForCatalogCardImages,
  waitForDetailPageImages,
  waitForDiscoveryCatalogReady,
  waitForFontsReady,
  waitForHomeCatalogReady,
  waitForLayoutStable,
  waitForDocumentHeightStable,
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

/** @param {import("./visualPages.js").VisualPageTarget} target */
function isCatalogHeavyTarget(target) {
  return Boolean(
    target.requireCatalogGrid ||
      target.requireDiscoveryCatalog ||
      target.requireHomeCatalog ||
      target.retryCatalog
  );
}

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
    window.__EVSAVARI_VISUAL_REGRESSION__ = true;

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
  const catalogHeavy = isCatalogHeavyTarget(target);
  const { timeout = catalogHeavy ? 60_000 : 45_000 } = options;
  const imageTimeout = catalogHeavy ? 25_000 : timeout;

  await page.waitForLoadState("domcontentloaded", { timeout });

  if (target.hashAnchor) {
    await expect(page.locator(`#${target.hashAnchor}`)).toBeVisible({
      timeout: 15_000,
    });
  }

  if (target.readySelector) {
    await expect(page.locator(target.readySelector).first()).toBeVisible({
      timeout,
    });
  }

  if (target.retryCatalog) {
    await waitForCatalogContent(page, target.readySelector, timeout);
    await waitForDetailPageImages(page, imageTimeout);
    await waitForDocumentHeightStable(page, 20_000);
  }

  if (target.requireCatalogGrid) {
    await waitForCatalogGridReady(page, timeout);
    await waitForCatalogCardImages(page, imageTimeout);
  }

  if (target.requireHomeCatalog) {
    await waitForHomeCatalogReady(page, timeout);
    await pinHomeCatalogSort(page);
    await waitForHomeCatalogReady(page, timeout);
    await waitForCatalogCardImages(page, imageTimeout);
    await waitForDocumentHeightStable(page, 25_000);
  }

  if (target.requireDiscoveryCatalog) {
    await waitForDiscoveryCatalogReady(page, timeout);
    await waitForCatalogCardImages(page, imageTimeout);
  }

  await waitForFontsReady(page);
  await waitForVisibleImagesLoaded(page, imageTimeout);

  if (target.hashAnchor) {
    await scrollToHashAnchor(page, target.hashAnchor);
    await waitForCatalogCardImages(page, imageTimeout);
  } else if (!target.skipScrollTopWait) {
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    await waitForScrollTop(page);
  }

  await waitForLayoutStable(page, {
    timeout: catalogHeavy ? 15_000 : 20_000,
    samples: catalogHeavy ? 3 : 2,
  });

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  await page
    .waitForFunction(() => document.readyState === "complete", null, {
      timeout: 10_000,
    })
    .catch(() => {});
}

/**
 * Scroll to a hash anchor with a fixed offset so full-page shots are deterministic.
 *
 * @param {import("@playwright/test").Page} page
 * @param {string} anchorId
 */
async function scrollToHashAnchor(page, anchorId) {
  await expect(page.locator(`#${anchorId}`)).toBeVisible({ timeout: 15_000 });

  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top - 16), left: 0, behavior: "auto" });
  }, anchorId);

  await expect
    .poll(
      async () =>
        page.evaluate((id) => {
          const el = document.getElementById(id);
          if (!el) return false;
          const { top } = el.getBoundingClientRect();
          return top >= 0 && top <= 96;
        }, anchorId),
      { timeout: 10_000, intervals: [50, 100, 150, 200] }
    )
    .toBe(true);
}

/**
 * Pin homepage catalog sort so section layout is stable across runs.
 *
 * @param {import("@playwright/test").Page} page
 */
async function pinHomeCatalogSort(page) {
  const sortSelect = page.locator('select:has(option[value="priceLow"])').first();
  if (await sortSelect.isVisible().catch(() => false)) {
    await sortSelect.selectOption("priceLow");
  }
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
  const catalogHeavy = isCatalogHeavyTarget(target);
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
    timeout: catalogHeavy ? 90_000 : 45_000,
    ...(target.retryCatalog ? { maxDiffPixelRatio: 0.05 } : {}),
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
