import { test, expect } from "../fixtures.js";

import { assertHealthyPage } from "../helpers/assertHealthyPage.js";

const VEHICLE_SLUG = "tata-nexon-ev";

test.describe("Vehicle review to ownership journey", () => {
  test("navigates homepage → detail → review → ownership for Tata Nexon EV", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await assertHealthyPage(page);

    const vehicleLink = page.locator(`a[href="/cars/${VEHICLE_SLUG}"]`).first();
    await expect(vehicleLink).toBeVisible({ timeout: 30_000 });
    await vehicleLink.click();

    await expect(page).toHaveURL(new RegExp(`/cars/${VEHICLE_SLUG}`));
    await assertHealthyPage(page);

    await page.getByRole("link", { name: /Read full review/i }).click();
    await expect(page).toHaveURL(new RegExp(`/reviews/${VEHICLE_SLUG}-review`));
    await assertHealthyPage(page);
    await expect(page.locator("body")).toContainText(/Nexon/i);

    await page.getByRole("link", { name: "Calculate cost/km" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/tools/cost-per-km\\?vehicle=${VEHICLE_SLUG}`)
    );
    await assertHealthyPage(page);
    await expect(page.getByRole("heading", { name: /cost/i }).first()).toBeVisible();
  });
});
