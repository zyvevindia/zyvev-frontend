#!/usr/bin/env node
/**
 * Run Playwright visual regression tests.
 * Usage: node scripts/run-visual-playwright.mjs [--update-snapshots] [--webkit-only]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ALL_VISUAL_PROJECTS = [
  "visual-chromium",
  "visual-firefox",
  "visual-webkit",
  "visual-laptop-chromium",
  "visual-laptop-firefox",
  "visual-laptop-webkit",
  "visual-tablet-chromium",
  "visual-tablet-firefox",
  "visual-tablet-webkit",
  "visual-mobile-chromium",
  "visual-mobile-firefox",
  "visual-mobile-webkit",
];

const WEBKIT_VISUAL_PROJECTS = [
  "visual-webkit",
  "visual-laptop-webkit",
  "visual-tablet-webkit",
  "visual-mobile-webkit",
];

const args = process.argv.slice(2);
const updateSnapshots = args.includes("--update-snapshots");
const webkitOnly = args.includes("--webkit-only");

const projects =
  webkitOnly
    ? WEBKIT_VISUAL_PROJECTS
    : process.platform === "win32"
      ? ALL_VISUAL_PROJECTS.filter((name) => !name.includes("webkit"))
      : ALL_VISUAL_PROJECTS;

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
