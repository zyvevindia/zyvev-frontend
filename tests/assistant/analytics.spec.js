import { test, expect } from "../fixtures.js";

import {
  ASSISTANT_FLOW_FAMILY_VALUE,
  completeAssistantToResults,
  restartAssistant,
  waitForAssistantWelcome,
} from "../helpers/assistantHelpers.js";
import {
  EXPECTED_ASSISTANT_ANALYTICS_EVENTS,
  readAssistantIntentSignals,
} from "../helpers/analyticsHelpers.js";
import {
  clearAssistantShortlist,
  readShortlistEntries,
  SHORTLIST_ADD_BUTTON,
  SHORTLIST_REMOVE_BUTTON,
} from "../helpers/shortlistHelpers.js";

test.describe("Assistant analytics events", () => {
  // Four full assistant journeys plus cross-page navigation — scoped timeout, not a retry mask.
  test.describe.configure({ timeout: 120_000 });

  test("registers assistant analytics events and fires handlers during journeys", async ({
    page,
  }) => {
    for (const eventName of EXPECTED_ASSISTANT_ANALYTICS_EVENTS) {
      expect(eventName).toMatch(/^assistant_/);
    }

    await page.goto("/assistant", { waitUntil: "domcontentloaded" });
    await waitForAssistantWelcome(page);
    await clearAssistantShortlist(page);

    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE, {
      navigate: false,
    });
    let intent = await readAssistantIntentSignals(page);
    expect(intent.assistantStarted).toBe(true);
    expect(intent.assistantCompleted).toBe(true);

    await page.getByRole("link", { name: "Estimate Ownership Cost" }).first().click();
    await expect(page).toHaveURL(/\/tools\/tco/);
    intent = await readAssistantIntentSignals(page);
    expect(intent.ownershipToolUsed).toBe(true);

    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);
    await page.getByRole("link", { name: "Compare Similar EVs" }).first().click();
    await expect(page).toHaveURL(/\/compare\//);
    intent = await readAssistantIntentSignals(page);
    expect(intent.compareUsed).toBe(true);

    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);
    await page.getByRole("link", { name: "View Vehicle" }).first().click();
    await expect(page).toHaveURL(/\/cars\//);

    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);
    await page.getByRole("button", { name: SHORTLIST_ADD_BUTTON }).first().click();
    let shortlist = await readShortlistEntries(page);
    expect(shortlist).toHaveLength(1);
    intent = await readAssistantIntentSignals(page);
    expect(intent.shortlistCount).toBe(1);

    await page.getByRole("button", { name: SHORTLIST_REMOVE_BUTTON }).first().click();
    shortlist = await readShortlistEntries(page);
    expect(shortlist).toHaveLength(0);

    await restartAssistant(page);
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  });
});
