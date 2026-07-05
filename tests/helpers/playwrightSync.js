import { expect } from "@playwright/test";

/**
 * Poll until visible images have finished loading (or errored).
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForVisibleImagesLoaded(page, timeout = 30_000) {
  try {
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const images = [...document.images].filter(
              (img) => img.getBoundingClientRect().width > 0
            );
            return (
              images.length === 0 ||
              images.every((img) => img.complete)
            );
          }),
        { timeout, intervals: [100, 200, 300, 500] }
      )
      .toBe(true);
  } catch {
    // Incomplete lazy images remain masked in screenshots — do not block capture.
  }
}

/**
 * Poll until document height is unchanged across consecutive samples.
 *
 * @param {import("@playwright/test").Page} page
 * @param {{ samples?: number, timeout?: number }} [options]
 */
export async function waitForLayoutStable(page, options = {}) {
  const { samples = 3, timeout = 20_000 } = options;

  await expect
    .poll(
      async () => {
        const heights = await page.evaluate(async (sampleCount) => {
          const read = () => document.documentElement.scrollHeight;
          const values = [read()];
          for (let i = 1; i < sampleCount; i += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            values.push(read());
          }
          return values;
        }, samples);

        return heights.every((height) => height === heights[0]);
      },
      { timeout, intervals: [150, 200, 300] }
    )
    .toBe(true);
}

/**
 * Wait for catalog listing grid to show real cards (not loading skeletons).
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForCatalogGridReady(page, timeout = 45_000) {
  await expect
    .poll(
      async () => {
        const skeletons = await page.locator(".car-card-skeleton:visible").count();
        const cards = await page.getByRole("link", { name: "View Details" }).count();
        return cards > 0 && skeletons === 0;
      },
      { timeout, intervals: [200, 400, 600, 800] }
    )
    .toBe(true);
}

/**
 * Wait for home page vehicle sections to finish loading.
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForHomeCatalogReady(page, timeout = 45_000) {
  await expect
    .poll(
      async () => {
        const skeletons = await page.locator(".car-card-skeleton:visible").count();
        const cards = await page.getByRole("link", { name: "View Details" }).count();
        const homeCards = await page.locator('[aria-label^="View details for"]').count();
        const cardCount = Math.max(cards, homeCards);
        return cardCount >= 12 && skeletons === 0;
      },
      { timeout, intervals: [200, 400, 600, 800] }
    )
    .toBe(true);
}

/**
 * Poll until document scroll height is unchanged across consecutive samples.
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForDocumentHeightStable(page, timeout = 20_000) {
  await expect
    .poll(
      async () => {
        const heights = await page.evaluate(async () => {
          const read = () => document.documentElement.scrollHeight;
          const values = [read()];
          for (let i = 0; i < 2; i += 1) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            values.push(read());
          }
          return values;
        });
        return heights.every((height) => height === heights[0]);
      },
      { timeout, intervals: [200, 300, 500, 700] }
    )
    .toBe(true);
}

/**
 * Wait for intelligence discovery pages to finish loading vehicle cards.
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForDiscoveryCatalogReady(page, timeout = 45_000) {
  await expect
    .poll(
      async () => {
        const skeletons = await page.locator(".car-card-skeleton:visible").count();
        const cards = await page
          .locator(".intel-discovery-page")
          .getByRole("link", { name: "View Details" })
          .count();
        return cards > 0 && skeletons === 0;
      },
      { timeout, intervals: [200, 400, 600, 800] }
    )
    .toBe(true);
}

/**
 * Wait for vehicle detail page images to finish loading.
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForDetailPageImages(page, timeout = 30_000) {
  try {
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const images = [...document.querySelectorAll(".cd-page img")].filter(
              (img) => img.getBoundingClientRect().width > 0
            );
            return (
              images.length === 0 ||
              images.every((img) => img.complete && img.naturalWidth > 0)
            );
          }),
        { timeout, intervals: [150, 250, 400, 600, 800] }
      )
      .toBe(true);
  } catch {
    // Residual incomplete images remain masked via lazy-load selector.
  }
}

/**
 * Wait for vehicle card images inside catalog grids to finish loading.
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForCatalogCardImages(page, timeout = 30_000) {
  try {
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const images = [
              ...document.querySelectorAll(
                ".catalog-results-grid img, .intel-discovery-page img, .compact-car-image"
              ),
            ].filter((img) => img.getBoundingClientRect().width > 0);
            return (
              images.length === 0 ||
              images.every((img) => img.complete)
            );
          }),
        { timeout, intervals: [150, 250, 400, 600] }
      )
      .toBe(true);
  } catch {
    // Residual incomplete tiles are masked via img[loading='lazy']:not([complete]).
  }
}

/**
 * Wait until window scroll position is at the top (after static-page smooth scroll).
 *
 * @param {import("@playwright/test").Page} page
 */
export async function waitForScrollTop(page) {
  await expect
    .poll(async () => page.evaluate(() => window.scrollY === 0), {
      timeout: 10_000,
      intervals: [50, 100, 150, 200],
    })
    .toBe(true);
}

/**
 * Wait for web fonts to finish loading.
 *
 * @param {import("@playwright/test").Page} page
 */
export async function waitForFontsReady(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
}
