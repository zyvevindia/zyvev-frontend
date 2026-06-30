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
 * @param {import("@playwright/test").Page} page
 * @param {{ navigate?: boolean }} [options]
 */
export async function startAssistant(page, options = {}) {
  const { navigate = true } = options;

  if (navigate) {
    await page.goto("/assistant", { waitUntil: "domcontentloaded" });
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
