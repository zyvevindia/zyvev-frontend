import { test, expect } from "../fixtures.js";

import {
  ASSISTANT_FLOW_FAMILY_VALUE,
  completeAssistantToResults,
} from "../helpers/assistantHelpers.js";
import {
  addVehicleToShortlistByIndex,
  clearAssistantShortlist,
  readShortlistEntries,
  SHORTLIST_ADD_BUTTON,
} from "../helpers/shortlistHelpers.js";

test.describe("Assistant shortlist limits", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/assistant", { waitUntil: "domcontentloaded" });
    await clearAssistantShortlist(page);
  });

  test("prevents adding a sixth vehicle and avoids duplicates", async ({ page }) => {
    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);

    const addButtons = page.getByRole("button", { name: SHORTLIST_ADD_BUTTON });
    const targetAdds = 5;

    for (let index = 0; index < targetAdds; index += 1) {
      const remaining = await addButtons.count();
      if (remaining === 0) {
        break;
      }
      await addButtons.first().click();
    }

    const entries = await readShortlistEntries(page);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.length).toBeLessThanOrEqual(5);

    const uniqueSlugs = new Set(entries.map((entry) => entry.vehicleSlug));
    expect(uniqueSlugs.size).toBe(entries.length);

    if (entries.length === 5) {
      await expect(page.getByRole("button", { name: /Shortlist \(5\)/ })).toBeVisible();
      await expect(addButtons).toHaveCount(0);
    }
  });
});
