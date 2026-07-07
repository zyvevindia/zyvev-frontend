import { test as base, expect } from "@playwright/test";

import { installCatalogApiStub } from "./helpers/catalogApiStub.js";

/**
 * Functional E2E fixture: stubs catalog API probes so golden vehicle data loads
 * without a locally running backend.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await installCatalogApiStub(page);
    await use(page);
  },
});

export { expect };
