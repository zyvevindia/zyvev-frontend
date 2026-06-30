#!/usr/bin/env node
/**
 * Run Playwright functional E2E tests (excludes visual regression projects).
 * Usage: node scripts/run-functional-playwright.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getFunctionalE2eProjectNames } from "../tests/helpers/playwrightProjects.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const projects = getFunctionalE2eProjectNames();

const playwrightArgs = [
  "playwright",
  "test",
  ...projects.flatMap((name) => ["--project", name]),
];

const result = spawnSync("npx", playwrightArgs, {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PLAYWRIGHT_VISUAL: "0",
  },
});

process.exit(result.status ?? 1);
