import { test, expect } from "../fixtures.js";

import {
  ASSISTANT_FLOW_FAMILY_VALUE,
  completeAssistantToResults,
} from "../helpers/assistantHelpers.js";
import { assertHealthyPage } from "../helpers/assertHealthyPage.js";
import {
  assertElementsWithinViewport,
  assertNoHorizontalScroll,
  assertNoOverlappingElements,
  assertReadableElements,
} from "../helpers/responsiveLayoutHelpers.js";
import {
  addVehicleToShortlistByIndex,
  clearAssistantShortlist,
} from "../helpers/shortlistHelpers.js";

test.describe("Responsive assistant shortlist", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/assistant", { waitUntil: "domcontentloaded" });
    await clearAssistantShortlist(page);
  });

  test("drawer and shortlist page remain usable on small viewports", async ({ page }) => {
    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);
    await addVehicleToShortlistByIndex(page, 0);

    const shortlistToggle = page.getByRole("button", { name: /Shortlist \(1\)/ });
    await expect(shortlistToggle).toBeVisible();
    await shortlistToggle.click();

    const drawer = page.getByRole("dialog", { name: "Shortlist" });
    await expect(drawer).toBeVisible();
    await assertNoHorizontalScroll(page);
    await assertElementsWithinViewport(page, ".assistant-shortlist-drawer__item");
    await assertNoOverlappingElements(page, ".assistant-shortlist-drawer__item");
    await assertReadableElements(
      page,
      ".assistant-shortlist-drawer__name, .assistant-shortlist-drawer__price"
    );

    const removeButton = drawer.getByRole("button", { name: "Remove" }).first();
    await expect(removeButton).toBeVisible();
    await assertElementsWithinViewport(page, ".assistant-shortlist-drawer__remove");

    await page.goto("/assistant/shortlist");
    await assertHealthyPage(page);
    await assertNoHorizontalScroll(page);
    await expect(page.locator(".assistant-shortlist-page__grid .assistant-vehicle-card").first()).toBeVisible();
    await assertElementsWithinViewport(page, ".assistant-shortlist-page__grid .assistant-vehicle-card");
    await expect(
      page.locator(".assistant-shortlist-page__grid").getByRole("button", { name: "Remove" }).first()
    ).toBeVisible();
  });
});
