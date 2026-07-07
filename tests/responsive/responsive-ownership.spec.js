import { test } from "../fixtures.js";

import { assertHealthyPage } from "../helpers/assertHealthyPage.js";
import { assertOwnershipCalculatorLayout } from "../helpers/responsiveLayoutHelpers.js";

test.describe("Responsive ownership calculators", () => {
  test("running-cost calculator remains accessible on device viewports", async ({ page }) => {
    await page.goto("/ownership/tata-nexon-ev/running-cost", {
      waitUntil: "domcontentloaded",
    });
    await assertHealthyPage(page);
    await assertOwnershipCalculatorLayout(page);
  });
});
