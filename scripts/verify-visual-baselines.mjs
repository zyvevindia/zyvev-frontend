#!/usr/bin/env node
/**
 * Verify committed visual regression baseline PNG counts.
 * Usage: node scripts/verify-visual-baselines.mjs [--require-webkit]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT_DIR = path.join(
  ROOT,
  "tests/visual/public-pages.spec.js-snapshots"
);

const PAGE_COUNT = 14;
const VIEWPORT_COUNT = 4;
const EXPECTED_PER_BROWSER = PAGE_COUNT * VIEWPORT_COUNT;

const args = process.argv.slice(2);
const requireWebkit = args.includes("--require-webkit");

function countByBrowser(files, browser) {
  return files.filter((name) => name.includes(`-${browser}.png`)).length;
}

if (!fs.existsSync(SNAPSHOT_DIR)) {
  console.error(`Snapshot directory missing: ${SNAPSHOT_DIR}`);
  process.exit(1);
}

const pngs = fs.readdirSync(SNAPSHOT_DIR).filter((name) => name.endsWith(".png"));

const chromium = countByBrowser(pngs, "chromium");
const firefox = countByBrowser(pngs, "firefox");
const webkit = countByBrowser(pngs, "webkit");

console.log("Visual baseline PNG counts:");
console.log(`  chromium: ${chromium}/${EXPECTED_PER_BROWSER}`);
console.log(`  firefox:  ${firefox}/${EXPECTED_PER_BROWSER}`);
console.log(`  webkit:   ${webkit}/${EXPECTED_PER_BROWSER}`);
console.log(`  total:    ${pngs.length}/${EXPECTED_PER_BROWSER * 3}`);

let failed = false;

for (const [browser, count] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  if (count < EXPECTED_PER_BROWSER) {
    console.error(
      `\nMissing ${browser} baselines: expected ${EXPECTED_PER_BROWSER}, found ${count}.`
    );
    console.error("Run: npm run test:visual:update");
    failed = true;
  }
}

if (requireWebkit && webkit < EXPECTED_PER_BROWSER) {
  console.error(
    `\nMissing webkit baselines: expected ${EXPECTED_PER_BROWSER}, found ${webkit}.`
  );
  console.error(
    "Generate on Linux via GitHub Actions → Visual Linux baselines (canonical)."
  );
  failed = true;
} else if (!requireWebkit && webkit < EXPECTED_PER_BROWSER) {
  console.warn(
    `\nWebKit baselines incomplete (${webkit}/${EXPECTED_PER_BROWSER}). CI requires all 168 PNGs from Linux.`
  );
  console.warn(
    "Bootstrap: Actions → Visual Linux baselines → download linux-visual-snapshots artifact."
  );
}

process.exit(failed ? 1 : 0);
