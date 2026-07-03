import { expect } from "@playwright/test";

import { assertHealthyPage } from "./assertHealthyPage.js";

/** @typedef {Record<string, string>} AssistantAnswerLabels */

export const ASSISTANT_FLOW_FAMILY_VALUE = Object.freeze({
  budget: "15–20L",
  usage: "Mixed",
  family: "Family",
  charging: "Home",
  priority: "Value",
});

export const ASSISTANT_FLOW_BUDGET_COMMUTER = Object.freeze({
  budget: "<15L",
  usage: "City",
  family: "Single",
  charging: "Apartment",
  priority: "Running Cost",
});

export const ASSISTANT_FLOW_PREMIUM_HIGHWAY = Object.freeze({
  budget: "30L+",
  usage: "Highway",
  family: "Couple",
  charging: "Home",
  priority: "Premium Experience",
});

const FLOW_LABEL_ORDER = ["budget", "usage", "family", "charging", "priority"];

/*
 * Engineering note — lazy-route stabilization (Playwright test infrastructure only)
 *
 * Firefox can abort in-flight Vite lazy CSS preloads when Playwright performs a
 * document-level navigation immediately after entering another lazy-loaded route.
 * The browser reports NS_BINDING_ABORTED; Vite's __vitePreload helper treats the
 * stylesheet <link> error as fatal and the global ErrorBoundary renders.
 *
 * Real users rarely hit this: human navigation is slower and typically waits for
 * the destination page to paint. Playwright E2E tests can call page.goto("/assistant")
 * within tens of milliseconds of clicking into /tools/tco or /cars/…, abandoning
 * CSS preloads that those lazy routes started but had not finished.
 *
 * waitForLazyRouteStabilized() waits for the outbound lazy route to reach a stable
 * terminal state before navigateToAssistant() issues page.goto(). This is a test-only
 * mitigation — it does not change production application code or suppress Vite errors.
 *
 * Scope: only pathname-matched outbound lazy routes listed in OUTBOUND_LAZY_ROUTE_STABILIZERS
 * are delayed. Paths already under /assistant, or routes without a registered stabilizer,
 * are unchanged (no extra waits before navigation).
 */

/** @typedef {import("@playwright/test").Page} PlaywrightPage */

/**
 * Declarative config for an outbound lazy route that must settle before document-level
 * navigation back to /assistant.
 *
 * @typedef {Object} OutboundLazyRouteStabilizer
 * @property {string} label Human-readable route name for maintenance and debugging.
 * @property {RegExp} pathname Matches `URL.pathname` when returning from this route.
 * @property {RegExp} url Playwright URL assertion applied before route-ready checks.
 * @property {(page: PlaywrightPage) => Promise<void>} waitForReady
 *   Route-specific readiness gate (headings, loading shells). Shared load/health checks
 *   run afterward via {@link finishLazyRouteStabilization}.
 */

/** Max wait for lazy compare-guide catalog fetch and chunk/CSS preload to settle. */
const LAZY_ROUTE_STABILIZE_TIMEOUT_MS = 45_000;

/**
 * Shared terminal checks after a route-specific `waitForReady` gate passes.
 *
 * @param {PlaywrightPage} page
 */
async function finishLazyRouteStabilization(page) {
  await page.waitForLoadState("load");
  await assertHealthyPage(page);
}

/**
 * Standard stabilization pipeline: confirm URL → route-ready → document load → no ErrorBoundary.
 *
 * @param {PlaywrightPage} page
 * @param {Pick<OutboundLazyRouteStabilizer, "url" | "waitForReady">} config
 */
async function stabilizeKnownOutboundRoute(page, { url, waitForReady }) {
  await expect(page).toHaveURL(url);
  await waitForReady(page);
  await finishLazyRouteStabilization(page);
}

/**
 * Outbound lazy routes reached from assistant result links that preload split CSS via Vite.
 * Add a new entry here when assistant tests navigate away and back via page.goto("/assistant").
 *
 * @type {OutboundLazyRouteStabilizer[]}
 */
const OUTBOUND_LAZY_ROUTE_STABILIZERS = [
  {
    label: "TCO calculator (/tools/tco)",
    pathname: /^\/tools\/tco(?:\/|$)/,
    url: /\/tools\/tco/,
    waitForReady: async (page) => {
      // PAGE_TITLE in TcoCalculatorPage.jsx — stable product copy, not a layout class.
      await expect(
        page.getByRole("heading", { name: /Total Cost of Ownership/i })
      ).toBeVisible();
    },
  },
  {
    label: "Vehicle detail (/cars/:slug)",
    pathname: /^\/cars\/[^/?#]+/,
    url: /\/cars\/.+/,
    waitForReady: async (page) => {
      // CarDetails root shell — route-level container present once the lazy page mounts.
      await expect(page.locator(".cd-page").first()).toBeVisible();
    },
  },
  {
    label: "Compare guide (/compare/:slug)",
    pathname: /^\/compare\/[^/?#]+/,
    url: /\/compare\/.+/,
    waitForReady: async (page) => {
      // Wait until the lazy compare route has started (loading shell or terminal UI).
      await expect(
        page
          .locator(".compare-guide-loading")
          .or(page.locator(".compare-guide-page"))
          .or(page.getByRole("heading", { name: /Guide not found/i }))
          .first()
      ).toBeVisible({ timeout: LAZY_ROUTE_STABILIZE_TIMEOUT_MS });

      // Async catalog fetch + CSS preload must finish (skeleton removed if it appeared).
      await expect(page.locator(".compare-guide-loading")).toHaveCount(0, {
        timeout: LAZY_ROUTE_STABILIZE_TIMEOUT_MS,
      });

      // Terminal states: catalog-backed guide, editorial fallback, or SEO not-found.
      await expect(
        page
          .getByRole("heading", { name: /Guide not found/i })
          .or(page.locator(".compare-guide-page .compare-hero__title"))
          .or(page.locator(".compare-guide-editorial"))
          .first()
      ).toBeVisible({ timeout: LAZY_ROUTE_STABILIZE_TIMEOUT_MS });
    },
  },
];

/**
 * Wait until the current outbound lazy route has finished mounting before a hard
 * `page.goto()` back to /assistant.
 *
 * **Why this exists:** Assistant analytics tests click into lazy routes (TCO, vehicle
 * detail, compare guide), then immediately call `completeAssistantToResults()` with
 * `navigate: true`, which used to invoke `page.goto("/assistant")` while Vite was still
 * preloading route CSS (e.g. score2-*.css). Firefox aborts those stylesheet requests
 * (`NS_BINDING_ABORTED`), Vite throws `"Unable to preload CSS for …"`, and the global
 * ErrorBoundary hides `.assistant-page`.
 *
 * **Why not fix the app:** Production navigation timing does not reproduce this race
 * reliably. Suppressing `vite:preloadError` would mask real deploy-skew and 404 failures.
 * This helper only adjusts Playwright navigation timing.
 *
 * **Scope:** No-op when already on `/assistant`. Only registered outbound lazy routes
 * in {@link OUTBOUND_LAZY_ROUTE_STABILIZERS} receive extra waits. All other paths are
 * left unchanged (no fallback `waitForLoadState`), so unrelated tests behave as before.
 *
 * @param {PlaywrightPage} page
 */
export async function waitForLazyRouteStabilized(page) {
  const { pathname } = new URL(page.url());

  if (pathname.startsWith("/assistant")) {
    return;
  }

  const stabilizer = OUTBOUND_LAZY_ROUTE_STABILIZERS.find((entry) =>
    entry.pathname.test(pathname)
  );

  if (!stabilizer) {
    return;
  }

  await stabilizeKnownOutboundRoute(page, stabilizer);
}

/**
 * Return to /assistant after stabilizing a registered outbound lazy route, if any.
 *
 * Used by {@link startAssistant} when `navigate: true` — typically after assistant
 * tests leave /assistant via result links and need a fresh assistant journey.
 *
 * @param {PlaywrightPage} page
 */
export async function navigateToAssistant(page) {
  await waitForLazyRouteStabilized(page);
  await page.goto("/assistant", { waitUntil: "domcontentloaded" });
}

/**
 * Wait until the assistant welcome screen is hydrated and interactive.
 *
 * @param {import("@playwright/test").Page} page
 */
export async function waitForAssistantWelcome(page) {
  await assertHealthyPage(page);
  await expect(page.locator(".assistant-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Find EVs that match how you actually drive" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toBeEnabled();
}

/**
 * Start the assistant questionnaire from the welcome screen.
 *
 * When `navigate: true`, uses {@link navigateToAssistant} so outbound lazy routes
 * (TCO, vehicle detail, compare) stabilize before document-level navigation.
 *
 * @param {PlaywrightPage} page
 * @param {{ navigate?: boolean }} [options]
 */
export async function startAssistant(page, options = {}) {
  const { navigate = true } = options;

  if (navigate) {
    await navigateToAssistant(page);
  }

  await waitForAssistantWelcome(page);
  await page.getByRole("button", { name: "Get started" }).click();
  await expectFirstQuestion(page);
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {AssistantAnswerLabels} answers
 */
export async function answerAssistantFlow(page, answers) {
  for (const key of FLOW_LABEL_ORDER) {
    const label = answers[key];
    if (!label) {
      throw new Error(`Missing assistant answer label for ${key}`);
    }

    const option = page.getByRole("radio", { name: label, exact: true });
    await expect(option).toBeVisible();
    await expect(option).toBeEnabled();
    await option.click();
  }
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {AssistantAnswerLabels} answers
 */
export async function completeAssistantToResults(page, answers, options = {}) {
  await startAssistant(page, options);
  await answerAssistantFlow(page, answers);
  await expectAssistantResults(page);
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function expectAssistantResults(page) {
  await expect(
    page.getByRole("heading", { name: "EVs that fit your brief" })
  ).toBeVisible();
  await expect(page.locator(".assistant-vehicle-card").first()).toBeVisible();
  await assertHealthyPage(page);
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function expectStrongMatchesSection(page) {
  await expect(page.getByRole("heading", { name: "Strong Matches" })).toBeVisible();
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string[]} vehicleNames
 */
export async function expectVehiclesVisible(page, vehicleNames) {
  for (const name of vehicleNames) {
    await expect(page.locator(".assistant-vehicle-card__name", { hasText: name })).toBeVisible();
  }
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function restartAssistant(page) {
  await page.getByRole("button", { name: "Restart" }).click();
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function expectAssistantWelcome(page) {
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function expectFirstQuestion(page) {
  await expect(
    page.getByRole("heading", { name: "What is your budget range?" })
  ).toBeVisible();
  await expect(page.getByLabel("Step 1 of 5")).toBeVisible();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
}

/**
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<string>}
 */
export async function getFirstResultVehicleSlug(page) {
  const href = await page
    .getByRole("link", { name: "Estimate Ownership Cost" })
    .first()
    .getAttribute("href");

  if (!href) {
    throw new Error("Could not resolve vehicle slug from ownership link");
  }

  const url = new URL(href, "http://localhost");
  const slug = url.searchParams.get("vehicle");
  if (!slug) {
    throw new Error(`Vehicle slug missing from ownership link: ${href}`);
  }

  return slug;
}
