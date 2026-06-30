import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * E2E build with analytics test id so trackAnalytics dispatches to gtag stub.
 */
export default async function globalSetup() {
  if (process.env.PLAYWRIGHT_SKIP_BUILD === "1") {
    return;
  }

  const buildEnv = {
    ...process.env,
    VITE_GA_ID: process.env.VITE_GA_ID || "G-E2ETEST",
    VITE_ANALYTICS_DEBUG: "true",
  };

  // Avoid baking localhost:5000 from .env into preview bundles when no API is running.
  if (!buildEnv.VITE_API_URL && process.env.CI) {
    buildEnv.VITE_API_URL = "https://evsavari-api.onrender.com";
  }

  execSync("npm run build", {
    cwd: ROOT,
    env: buildEnv,
    stdio: "inherit",
  });
}
