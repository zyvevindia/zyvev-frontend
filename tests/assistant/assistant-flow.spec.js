import { test, expect } from "../fixtures.js";

import {
  ASSISTANT_FLOW_BUDGET_COMMUTER,
  ASSISTANT_FLOW_FAMILY_VALUE,
  ASSISTANT_FLOW_PREMIUM_HIGHWAY,
  completeAssistantToResults,
  expectStrongMatchesSection,
  expectVehiclesVisible,
} from "../helpers/assistantHelpers.js";

test.describe("Assistant journey flows", () => {
  test("Scenario 1 — family value buyer sees strong matches", async ({ page }) => {
    await completeAssistantToResults(page, ASSISTANT_FLOW_FAMILY_VALUE);

    await expectStrongMatchesSection(page);
    await expectVehiclesVisible(page, [
      "Nexon EV",
      "Curvv EV",
      "BE 6",
    ]);
  });

  test("Scenario 2 — budget city commuter sees affordable EVs", async ({ page }) => {
    await completeAssistantToResults(page, ASSISTANT_FLOW_BUDGET_COMMUTER);

    await expectVehiclesVisible(page, ["Comet EV", "Tiago EV"]);
  });

  test("Scenario 3 — premium highway buyer sees premium EVs", async ({ page }) => {
    await completeAssistantToResults(page, ASSISTANT_FLOW_PREMIUM_HIGHWAY);

    await expectVehiclesVisible(page, ["Seal", "Ioniq 5"]);
  });
});
