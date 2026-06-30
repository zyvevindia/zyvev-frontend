#!/usr/bin/env node
/**
 * Run Playwright visual regression tests.
 * Usage: node scripts/run-visual-playwright.mjs [--update-snapshots] [--webkit-only]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getVisualProjectNames } from "../tests/helpers/playwrightProjects.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const updateSnapshots = args.includes("--update-snapshots");
const webkitOnly = args.includes("--webkit-only");

const projects = getVisualProjectNames(process.platform, { webkitOnly });

const playwrightArgs = [
  "playwright",
  "test",
  "tests/visual",
  ...projects.flatMap((name) => ["--project", name]),
];

if (updateSnapshots) {
  playwrightArgs.push("--update-snapshots");
}

const result = spawnSync("npx", playwrightArgs, {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PLAYWRIGHT_VISUAL: "1",
  },
});

process.exit(result.status ?? 1);
