import { test, expect } from "../fixtures.js";

import {
  ASSISTANT_FLOW_FAMILY_VALUE,
  completeAssistantToResults,
  getFirstResultVehicleSlug,
} from "../helpers/assistantHelpers.js";
import { assertHealthyPage } from "../helpers/assertHealthyPage.js";

test.describe("Assistant ownership links", () => {
  test("opens ownership calculators from assistant results", async ({ page }) => {
    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);
    const vehicleSlug = await getFirstResultVehicleSlug(page);

    await page.getByRole("link", { name: "Estimate Ownership Cost" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/tools/tco\\?vehicle=${vehicleSlug}`));
    await expect(page.getByRole("heading", { name: /Total Cost of Ownership/i })).toBeVisible();
    await assertHealthyPage(page);

    await page.goBack();
    await assertHealthyPage(page);

    await page.goto(`/ownership/${vehicleSlug}/running-cost`);
    await expect(page).toHaveURL(new RegExp(`/ownership/${vehicleSlug}/running-cost`));
    await expect(page.locator(".cost-per-km-form, .ownership-page").first()).toBeVisible();
    await assertHealthyPage(page);

    await page.goto("/assistant", { waitUntil: "domcontentloaded" });
    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);

    await page.getByRole("link", { name: "Calculate EMI" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/tools/emi\\?vehicle=${vehicleSlug}`));
    await expect(page.getByRole("heading", { name: /EMI Calculator/i })).toBeVisible();
    await assertHealthyPage(page);
  });
});
