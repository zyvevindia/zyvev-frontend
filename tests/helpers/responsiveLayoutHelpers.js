import { expect } from "@playwright/test";

import { assertHealthyPage } from "./assertHealthyPage.js";

/** @typedef {{ path: string, label: string, cardSelector?: string, scrollContainer?: string }} ResponsivePageTarget */

export const RESPONSIVE_PAGES = Object.freeze([
  { path: "/", label: "homepage" },
  { path: "/assistant", label: "buyer assistant", scrollContainer: ".assistant-page" },
  { path: "/assistant/shortlist", label: "assistant shortlist", scrollContainer: ".assistant-page" },
  {
    path: "/cars/tata-nexon-ev",
    label: "vehicle detail",
    cardSelector: ".score2-perspective, .cd-overview-dashboard",
    scrollContainer: ".cd-overview-dashboard",
  },
  {
    path: "/reviews/tata-nexon-ev-review",
    label: "vehicle review",
    cardSelector: ".score2-perspective, article",
  },
  {
    path: "/ownership/tata-nexon-ev/running-cost",
    label: "ownership running cost",
    cardSelector: ".cost-per-km-form, .cost-per-km-result",
  },
  {
    path: "/compare/tata-nexon-ev-vs-mahindra-xuv400",
    label: "compare guide",
    cardSelector: ".compare-vehicle-card",
  },
]);

const HORIZONTAL_SCROLL_TOLERANCE_PX = 2;
const OVERLAP_AREA_THRESHOLD_PX = 16;
const INTERACTIVE_SELECTORS = [
  "button",
  "a[href]",
  "[role='button']",
  "input",
  "select",
  "textarea",
].join(", ");

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ containerSelector?: string|null }} [options]
 */
export async function assertNoHorizontalScroll(page, options = {}) {
  const containerSelector = options.containerSelector ?? null;

  await expect
    .poll(
      async () =>
        page.evaluate((sel) => {
          if (sel) {
            const element = document.querySelector(sel);
            if (!element) {
              return 0;
            }
            return element.scrollWidth - element.clientWidth;
          }

          return (
            Math.max(
              document.documentElement.scrollWidth,
              document.body?.scrollWidth ?? 0
            ) - window.innerWidth
          );
        }, containerSelector),
      {
        message: `waiting for horizontal layout to stabilize on ${page.url()}`,
        timeout: 15_000,
      }
    )
    .toBeLessThanOrEqual(HORIZONTAL_SCROLL_TOLERANCE_PX);
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 * @param {{ tolerancePx?: number }} [options]
 */
export async function assertElementsWithinViewport(page, selector, options = {}) {
  const tolerancePx = options.tolerancePx ?? HORIZONTAL_SCROLL_TOLERANCE_PX;
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error("Viewport size is unavailable");
  }

  const violations = await page.evaluate(
    ({ sel, tolerance, viewportWidth, viewportHeight }) => {
      const nodes = [...document.querySelectorAll(sel)].filter((node) => {
        const style = window.getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0.05;

        if (!visible) {
          return false;
        }

        return rect.bottom > 0 && rect.top < viewportHeight;
      });

      return nodes
        .map((node) => {
          const rect = node.getBoundingClientRect();
          const leftOverflow = rect.left < -tolerance;
          const rightOverflow = rect.right > viewportWidth + tolerance;
          if (!leftOverflow && !rightOverflow) {
            return null;
          }

          const label =
            node.getAttribute("aria-label") ||
            node.textContent?.trim().slice(0, 60) ||
            node.className ||
            sel;

          return {
            label,
            left: rect.left,
            right: rect.right,
          };
        })
        .filter(Boolean);
    },
    {
      sel: selector,
      tolerance: tolerancePx,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
    }
  );

  expect(
    violations,
    `Clipped elements for selector "${selector}": ${JSON.stringify(violations)}`
  ).toEqual([]);
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 */
export async function assertNoOverlappingElements(page, selector) {
  const overlaps = await page.evaluate(
    ({ sel, areaThreshold }) => {
      const nodes = [...document.querySelectorAll(sel)].filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 8 && rect.height > 8;
      });

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i].getBoundingClientRect();
          const b = nodes[j].getBoundingClientRect();
          const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

          if (overlapWidth > 0 && overlapHeight > 0) {
            const overlapArea = overlapWidth * overlapHeight;
            if (overlapArea > areaThreshold) {
              return {
                first:
                  nodes[i].textContent?.trim().slice(0, 40) ||
                  nodes[i].className ||
                  sel,
                second:
                  nodes[j].textContent?.trim().slice(0, 40) ||
                  nodes[j].className ||
                  sel,
                overlapArea,
              };
            }
          }
        }
      }

      return null;
    },
    { sel: selector, areaThreshold: OVERLAP_AREA_THRESHOLD_PX }
  );

  expect(overlaps, `Overlapping elements for selector "${selector}"`).toBeNull();
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 */
export async function assertNoTextOverflow(page, selector) {
  const offenders = await page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)]
      .filter((node) => {
        const style = window.getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      })
      .map((node) => {
        const overflowX = node.scrollWidth - node.clientWidth;
        if (overflowX <= 2) {
          return null;
        }

        return {
          label: node.textContent?.trim().slice(0, 60) || node.className || sel,
          overflowX,
        };
      })
      .filter(Boolean);
  }, selector);

  expect(
    offenders,
    `Text overflow for selector "${selector}": ${JSON.stringify(offenders)}`
  ).toEqual([]);
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 */
export async function assertReadableElements(page, selector) {
  const unreadable = await page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)]
      .map((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          return null;
        }

        const style = window.getComputedStyle(node);
        const fontSize = Number.parseFloat(style.fontSize || "0");
        const opacity = Number.parseFloat(style.opacity || "1");
        const visible =
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          opacity > 0.1 &&
          fontSize >= 10;

        if (visible) {
          return null;
        }

        return {
          label: node.textContent?.trim().slice(0, 60) || node.className || sel,
          fontSize,
          opacity,
        };
      })
      .filter(Boolean);
  }, selector);

  expect(
    unreadable,
    `Unreadable elements for selector "${selector}": ${JSON.stringify(unreadable)}`
  ).toEqual([]);
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {ResponsivePageTarget} target
 */
export async function assertResponsivePageLayout(page, target) {
  const response = await page.goto(target.path, { waitUntil: "domcontentloaded" });
  expect(response?.ok(), `Failed to load ${target.path}`).toBeTruthy();

  await assertHealthyPage(page);

  if (target.cardSelector) {
    await expect(page.locator(target.cardSelector).first()).toBeVisible({
      timeout: 45_000,
    });
  } else {
    await page.waitForTimeout(250);
  }

  await assertNoHorizontalScroll(page, {
    containerSelector: target.scrollContainer ?? null,
  });

  if (target.cardSelector) {
    await assertNoOverlappingElements(page, target.cardSelector);
    await assertElementsWithinViewport(page, target.cardSelector);
    await assertNoTextOverflow(
      page,
      `${target.cardSelector} h1, ${target.cardSelector} h2, ${target.cardSelector} h3, ${target.cardSelector} p`
    );
  }

  await assertElementsWithinViewport(page, INTERACTIVE_SELECTORS);
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function assertAssistantChipsLayout(page) {
  const chips = page.locator(".assistant-chips");
  await expect(chips).toBeVisible();
  await assertNoHorizontalScroll(page, { containerSelector: ".assistant-page" });
  await assertNoOverlappingElements(page, ".assistant-chip");
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function assertAssistantProgressVisible(page) {
  await expect(page.locator(".assistant-progress [role='progressbar']")).toBeVisible();
  await assertElementsWithinViewport(page, ".assistant-progress");
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function assertAssistantResultsLayout(page) {
  await expect(page.locator(".assistant-vehicle-card").first()).toBeVisible();
  await assertNoHorizontalScroll(page, { containerSelector: ".assistant-page" });
  await assertNoOverlappingElements(page, ".assistant-vehicle-card");
  await assertElementsWithinViewport(page, ".assistant-vehicle-card");
  await assertReadableElements(
    page,
    ".assistant-vehicle-card__name, .assistant-vehicle-card__price"
  );

  const actionCenter = page.locator(".assistant-action-center").first();
  await expect(actionCenter).toBeVisible();
  await assertElementsWithinViewport(page, ".assistant-action-center__action");
  await assertNoOverlappingElements(page, ".assistant-action-center__action");
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function assertScore2PerspectiveLayout(page) {
  const perspective = page.locator(".score2-perspective").first();
  await expect(perspective).toBeVisible({ timeout: 45_000 });
  await expect(perspective.getByText("EVSavari Perspective")).toBeVisible();
  await assertNoHorizontalScroll(page, { containerSelector: ".score2-perspective" });
  await assertElementsWithinViewport(page, ".score2-perspective");
  await assertNoTextOverflow(
    page,
    ".score2-perspective__summary, .score2-perspective__eyebrow"
  );
  await assertReadableElements(page, ".score2-perspective__summary");
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function assertOwnershipCalculatorLayout(page) {
  const calculator = page.locator(".ownership-page__calculator");
  await expect(calculator).toBeVisible({ timeout: 45_000 });
  await expect(page.locator(".cost-per-km-form")).toBeVisible();
  await expect(page.locator(".cost-per-km-result")).toBeVisible();

  await assertNoHorizontalScroll(page, { containerSelector: ".ownership-page__calculator" });
  await assertElementsWithinViewport(
    page,
    ".cost-per-km-form__field input, .cost-per-km-form__field select"
  );
  await assertElementsWithinViewport(page, ".cost-per-km-result");
  await assertReadableElements(
    page,
    ".cost-per-km-result__metric-value, .cost-per-km-result__metric-label"
  );
}
