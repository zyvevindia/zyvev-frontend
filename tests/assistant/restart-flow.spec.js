import { test } from "../fixtures.js";

import {
  ASSISTANT_FLOW_FAMILY_VALUE,
  completeAssistantToResults,
  expectAssistantWelcome,
  expectFirstQuestion,
  restartAssistant,
  startAssistant,
} from "../helpers/assistantHelpers.js";
import { assertHealthyPage } from "../helpers/assertHealthyPage.js";

test.describe("Assistant restart flow", () => {
  test("restart clears answers and returns to the first question", async ({ page }) => {
    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);
    await assertHealthyPage(page);

    await restartAssistant(page);
    await expectAssistantWelcome(page);

    await startAssistant(page);
    await expectFirstQuestion(page);
    await assertHealthyPage(page);
  });
});
