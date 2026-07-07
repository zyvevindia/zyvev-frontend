import { test, expect } from "../fixtures.js";

import {
  ASSISTANT_FLOW_FAMILY_VALUE,
  completeAssistantToResults,
} from "../helpers/assistantHelpers.js";
import { assertHealthyPage } from "../helpers/assertHealthyPage.js";

const KNOWN_COMPARE_PATH = "/compare/tata-nexon-ev-vs-mahindra-xuv400";

test.describe("Assistant compare links", () => {
  test("opens compare guide with editorial comparison content", async ({ page }) => {
    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);

    const compareLink = page.getByRole("link", { name: "Compare Similar EVs" }).first();
    await expect(compareLink).toBeEnabled();
    const compareHref = await compareLink.getAttribute("href");
    expect(compareHref).toMatch(/\/compare\/.+-vs-.+/);

    await page.goto(KNOWN_COMPARE_PATH, { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator(".compare-vehicle-card").first()).toBeVisible({
      timeout: 30_000,
    });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const editorialHeading = page
      .getByRole("heading", { name: "About this comparison" })
      .or(page.getByRole("heading", { name: "Tradeoffs to consider" }));

    await expect(editorialHeading.first()).toBeVisible({ timeout: 45_000 });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).not.toContain("overall winner");
    expect(bodyText.toLowerCase()).not.toMatch(/ranked\s+#?\d/);
  });
});
