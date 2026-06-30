import { test } from "../fixtures.js";

import { assertHealthyPage } from "../helpers/assertHealthyPage.js";
import { assertScore2PerspectiveLayout } from "../helpers/responsiveLayoutHelpers.js";

test.describe("Responsive Score2 perspective", () => {
  test("EVSavari Perspective is visible and readable on vehicle detail", async ({ page }) => {
    await page.goto("/cars/tata-nexon-ev", { waitUntil: "domcontentloaded" });
    await assertHealthyPage(page);
    await assertScore2PerspectiveLayout(page);
  });
});
