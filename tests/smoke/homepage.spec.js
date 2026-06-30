import { test, expect } from "../fixtures.js";

import { assertHealthyPage } from "../helpers/assertHealthyPage.js";

test.describe("Homepage smoke", () => {
  test("homepage loads with title and no error boundary", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(response?.ok()).toBeTruthy();

    await expect(page).toHaveTitle(/EVSavari/i);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await assertHealthyPage(page);
  });
});
