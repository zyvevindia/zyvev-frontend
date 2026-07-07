import { test } from "../fixtures.js";

import {
  ASSISTANT_FLOW_FAMILY_VALUE,
  answerAssistantFlow,
  expectAssistantResults,
  startAssistant,
} from "../helpers/assistantHelpers.js";
import { assertHealthyPage } from "../helpers/assertHealthyPage.js";
import {
  assertAssistantChipsLayout,
  assertAssistantProgressVisible,
  assertAssistantResultsLayout,
  assertNoHorizontalScroll,
} from "../helpers/responsiveLayoutHelpers.js";

test.describe("Responsive assistant journey", () => {
  test("completes assistant flow with readable mobile layout", async ({ page }) => {
    await startAssistant(page);
    await assertAssistantProgressVisible(page);
    await assertAssistantChipsLayout(page);

    await answerAssistantFlow(page, ASSISTANT_FLOW_FAMILY_VALUE);
    await expectAssistantResults(page);
    await assertNoHorizontalScroll(page);
    await assertAssistantResultsLayout(page);
    await assertHealthyPage(page);
  });
});
