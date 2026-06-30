import { test, expect } from "@playwright/test";

import { VISUAL_PUBLIC_PAGES } from "../helpers/visualPages.js";
import {
  gotoVisualTarget,
  buildScreenshotOptions,
  visualSnapshotName,
} from "../helpers/visualHelpers.js";

/** Device label derived from Playwright project name. */
function resolveDeviceLabel(projectName) {
  if (projectName.includes("mobile")) return "mobile";
  if (projectName.includes("tablet")) return "tablet";
  if (projectName.includes("laptop")) return "laptop";
  return "desktop";
}

/** Browser slug for snapshot file naming. */
function resolveBrowserName(projectName) {
  if (projectName.includes("firefox")) return "firefox";
  if (projectName.includes("webkit")) return "webkit";
  return "chromium";
}

test.describe("Visual regression — public pages", () => {
  for (const target of VISUAL_PUBLIC_PAGES) {
    test(`${target.label} matches baseline`, async ({ page }, testInfo) => {
      await gotoVisualTarget(page, target);

      const deviceLabel = resolveDeviceLabel(testInfo.project.name);
      const browserName = resolveBrowserName(testInfo.project.name);
      const snapshotName = visualSnapshotName(target.id, deviceLabel, browserName);

      await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
        ...buildScreenshotOptions(page, target),
      });
    });
  }
});
