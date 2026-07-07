import { test, expect } from "../fixtures.js";

import { assertHealthyPage } from "../helpers/assertHealthyPage.js";

const CORE_ROUTES = [
  { path: "/", label: "homepage" },
  { path: "/assistant", label: "buyer assistant" },
  { path: "/assistant/shortlist", label: "assistant shortlist" },
  { path: "/playground/assistant", label: "assistant playground" },
  { path: "/cars/tata-nexon-ev", label: "vehicle detail" },
  { path: "/reviews/tata-nexon-ev-review", label: "vehicle review" },
  { path: "/ownership/tata-nexon-ev/running-cost", label: "ownership running cost" },
];

test.describe("Core routes", () => {
  for (const route of CORE_ROUTES) {
    test(`${route.label} (${route.path}) loads without error boundary`, async ({
      page,
    }) => {
      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.ok()).toBeTruthy();
      await assertHealthyPage(page);
    });
  }
});
