#!/usr/bin/env node
/**
 * CI-parity assistant crash capture (production preview + catalog stub).
 */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

import { installCatalogApiStub } from "../tests/helpers/catalogApiStub.js";

const PORT = 5173;
const BASE = `http://localhost:${PORT}`;

function startPreview() {
  return spawn("npm", ["run", "preview", "--", "--port", String(PORT), "--host", "0.0.0.0"], {
    shell: true,
    stdio: "ignore",
    env: { ...process.env },
  });
}

async function waitForServer(maxMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Preview server did not start");
}

const preview = startPreview();
await waitForServer();

const browser = await chromium.launch();
const page = await browser.newPage();

await installCatalogApiStub(page);

const consoleLines = [];
const pageErrors = [];
const failedRequests = [];

page.on("console", (msg) => {
  consoleLines.push(`[${msg.type()}] ${msg.text()}`);
});
page.on("pageerror", (err) => {
  pageErrors.push(err.stack || String(err));
});
page.on("requestfailed", (req) => {
  failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText || "failed"}`);
});
page.on("response", (res) => {
  if (res.status() >= 400 && res.url().includes("/assets/")) {
    failedRequests.push(`HTTP ${res.status()} ${res.url()}`);
  }
});

await page.goto(`${BASE}/assistant`, { waitUntil: "domcontentloaded", timeout: 60_000 });

for (let i = 0; i < 10; i += 1) {
  await page.waitForTimeout(500);
  const state = await page.evaluate(() => ({
    assistantPage: Boolean(document.querySelector(".assistant-page")),
    errorBoundary: Boolean(
      document.querySelector("h1")?.textContent?.includes("Something Went Wrong")
    ),
    routeLoader: Boolean(
      document.querySelector("h2")?.textContent?.includes("Loading EVSavari")
    ),
    technicalDetails: document.querySelector("details pre")?.textContent || null,
    title: document.title,
    bodyText: document.body?.innerText?.slice(0, 500) || "",
  }));

  console.log(`--- t+${(i + 1) * 500}ms ---`);
  console.log(JSON.stringify(state, null, 2));

  if (state.technicalDetails) {
    console.log("\n=== Technical Details ===");
    console.log(state.technicalDetails);
    break;
  }
  if (state.assistantPage) break;
}

console.log("\n=== pageerror ===");
for (const e of pageErrors) console.log(e);

console.log("\n=== failed asset/network ===");
for (const e of failedRequests) console.log(e);

console.log("\n=== console errors ===");
for (const line of consoleLines.filter((l) => /error|failed|exception/i.test(l))) {
  console.log(line);
}

await browser.close();
preview.kill();
process.exit(pageErrors.length ? 1 : 0);
