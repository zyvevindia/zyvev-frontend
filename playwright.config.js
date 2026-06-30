import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DESKTOP_VIEWPORT,
  LAPTOP_VIEWPORT,
  MOBILE_VIEWPORT,
  TABLET_VIEWPORT,
} from "./tests/helpers/viewports.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

if (process.argv.some((arg) => /tests[/\\]visual/.test(arg))) {
  process.env.PLAYWRIGHT_VISUAL = "1";
}

const includeVisual = process.env.PLAYWRIGHT_VISUAL === "1";

const functionalProjects = [
  {
    name: "chromium",
    testIgnore: [/responsive\//, /visual\//],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "firefox",
    testIgnore: [/responsive\//, /visual\//],
    use: { ...devices["Desktop Firefox"] },
  },
  {
    name: "webkit",
    testIgnore: [/responsive\//, /visual\//],
    use: { ...devices["Desktop Safari"] },
  },
  {
    name: "responsive-desktop-chrome",
    testMatch: /responsive\//,
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "responsive-iphone-14",
    testMatch: /responsive\//,
    use: { ...devices["iPhone 14"] },
  },
  {
    name: "responsive-pixel-7",
    testMatch: /responsive\//,
    use: { ...devices["Pixel 7"] },
  },
  {
    name: "responsive-ipad-air",
    testMatch: /responsive\//,
    use: { ...devices["iPad Air"] },
  },
];

/** @param {string} slug @param {keyof typeof devices} device @param {{ width: number, height: number }} viewport @param {boolean} [mobile] */
function visualProject(slug, device, viewport, mobile = false) {
  return {
    name: `visual-${slug}`,
    testMatch: /visual\//,
    use: {
      ...devices[device],
      viewport,
      ...(mobile ? { isMobile: true, hasTouch: true } : {}),
    },
  };
}

const visualProjects = [
  visualProject("chromium", "Desktop Chrome", DESKTOP_VIEWPORT),
  visualProject("firefox", "Desktop Firefox", DESKTOP_VIEWPORT),
  visualProject("webkit", "Desktop Safari", DESKTOP_VIEWPORT),
  visualProject("laptop-chromium", "Desktop Chrome", LAPTOP_VIEWPORT),
  visualProject("laptop-firefox", "Desktop Firefox", LAPTOP_VIEWPORT),
  visualProject("laptop-webkit", "Desktop Safari", LAPTOP_VIEWPORT),
  visualProject("tablet-chromium", "Desktop Chrome", TABLET_VIEWPORT, true),
  visualProject("tablet-firefox", "Desktop Firefox", TABLET_VIEWPORT, true),
  visualProject("tablet-webkit", "Desktop Safari", TABLET_VIEWPORT, true),
  visualProject("mobile-chromium", "Desktop Chrome", MOBILE_VIEWPORT, true),
  visualProject("mobile-firefox", "Desktop Firefox", MOBILE_VIEWPORT, true),
  visualProject("mobile-webkit", "Desktop Safari", MOBILE_VIEWPORT, true),
];

export default defineConfig({
  testDir: "./tests",
  globalSetup: path.resolve(__dirname, "tests/global-setup.mjs"),
  fullyParallel: !includeVisual,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: includeVisual ? 1 : process.env.CI ? 1 : 1,
  timeout: includeVisual ? 90_000 : 60_000,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"]],

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },

  snapshotPathTemplate:
    "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",

  use: {
    baseURL: BASE_URL,
    trace: includeVisual ? "retain-on-failure" : "on-first-retry",
    screenshot: includeVisual ? "off" : "only-on-failure",
    navigationTimeout: 45_000,
    actionTimeout: 15_000,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    colorScheme: "light",
  },

  projects: includeVisual
    ? [...functionalProjects, ...visualProjects]
    : functionalProjects,

  webServer: {
    command: `npm run preview -- --port ${PORT} --host 0.0.0.0`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
