import { test, expect } from "../fixtures.js";

import {
  ASSISTANT_FLOW_FAMILY_VALUE,
  completeAssistantToResults,
} from "../helpers/assistantHelpers.js";
import { assertHealthyPage } from "../helpers/assertHealthyPage.js";
import {
  addVehicleToShortlistByIndex,
  clearAssistantShortlist,
  expectShortlistContainsSlug,
  readShortlistEntries,
} from "../helpers/shortlistHelpers.js";

test.describe("Assistant shortlist", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/assistant", { waitUntil: "domcontentloaded" });
    await clearAssistantShortlist(page);
  });

  test("add, persist, and remove a shortlisted vehicle", async ({ page }) => {
    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);

    await addVehicleToShortlistByIndex(page, 0);
    await expect(page.getByRole("button", { name: /Shortlist \(1\)/ })).toBeVisible();

    const entries = await readShortlistEntries(page);
    expect(entries).toHaveLength(1);
    const vehicleSlug = entries[0].vehicleSlug;
    expect(vehicleSlug).toBeTruthy();

    await page.goto("/assistant/shortlist");
    await assertHealthyPage(page);
    await expectShortlistContainsSlug(page, vehicleSlug);

    await page.reload();
    await assertHealthyPage(page);
    await expectShortlistContainsSlug(page, vehicleSlug);

    const card = page.locator(".assistant-shortlist-page__grid .assistant-vehicle-card").filter({
      has: page.locator(`a[href*="/cars/${vehicleSlug}"]`),
    });
    await card.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("Your shortlist is empty.")).toBeVisible();

    const cleared = await readShortlistEntries(page);
    expect(cleared).toHaveLength(0);
  });
});
