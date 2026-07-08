import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com";

const apiURL =
  process.env.VITE_API_URL ||
  process.env.LEAD_SMOKE_API_URL ||
  "https://evsavari-api.onrender.com";

export default defineConfig({
  testDir: "./tests/leads",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  metadata: {
    apiURL,
  },
});
