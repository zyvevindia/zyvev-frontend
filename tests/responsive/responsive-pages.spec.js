import { test } from "../fixtures.js";

import {
  RESPONSIVE_PAGES,
  assertResponsivePageLayout,
} from "../helpers/responsiveLayoutHelpers.js";

test.describe("Responsive core pages", () => {
  for (const target of RESPONSIVE_PAGES) {
    test(`${target.label} (${target.path}) has no responsive layout issues`, async ({
      page,
    }) => {
      await assertResponsivePageLayout(page, target);
    });
  }
});
