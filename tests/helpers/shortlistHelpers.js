import { expect } from "@playwright/test";

export const ASSISTANT_SHORTLIST_STORAGE_KEY = "evsavari_assistant_shortlist_v1";

/**
 * @param {import("@playwright/test").Page} page
 */
export async function clearAssistantShortlist(page) {
  await page.evaluate((storageKey) => {
    localStorage.removeItem(storageKey);
  }, ASSISTANT_SHORTLIST_STORAGE_KEY);
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function resetAssistantShortlistStorage(page) {
  await page.evaluate((storageKey) => {
    localStorage.removeItem(storageKey);
  }, ASSISTANT_SHORTLIST_STORAGE_KEY);
}

/**
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<object[]>}
 */
export async function readShortlistEntries(page) {
  return page.evaluate((storageKey) => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, ASSISTANT_SHORTLIST_STORAGE_KEY);
}

export const SHORTLIST_ADD_BUTTON = /Add .+ to shortlist/i;
export const SHORTLIST_REMOVE_BUTTON = /Remove .+ from shortlist/i;

/**
 * @param {import("@playwright/test").Page} page
 * @param {number} index
 */
export async function addVehicleToShortlistByIndex(page, index = 0) {
  const button = page.getByRole("button", { name: SHORTLIST_ADD_BUTTON }).nth(index);
  await button.click();
}

/**
 * @param {import("@playwright/test").Page} page
 */
export async function addFirstAvailableShortlistVehicle(page) {
  await page.getByRole("button", { name: SHORTLIST_ADD_BUTTON }).first().click();
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} vehicleSlug
 */
export async function expectShortlistContainsSlug(page, vehicleSlug) {
  await expect(
    page.locator(`.assistant-shortlist-page__grid a[href*="/cars/${vehicleSlug}"]`).first()
  ).toBeVisible();
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} vehicleName
 */
export async function removeShortlistVehicleOnPage(page, vehicleName) {
  const card = page.locator(".assistant-shortlist-page__grid").filter({
    has: page.getByRole("heading", { name: vehicleName }),
  });
  await card.getByRole("button", { name: "Remove" }).click();
}
