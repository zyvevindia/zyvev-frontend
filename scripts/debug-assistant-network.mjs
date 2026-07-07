#!/usr/bin/env node
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

async function waitForPort() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("port not ready");
}

const preview = startPreview();
const portReadyAt = Date.now();
await waitForPort();
console.log("port ready ms:", Date.now() - portReadyAt);

const browser = await chromium.launch();
const page = await browser.newPage();
await installCatalogApiStub(page);

const assetEvents = [];
page.on("requestfinished", async (req) => {
  const url = req.url();
  if (!url.includes("/assets/")) return;
  const res = await req.response();
  assetEvents.push({
    t: Date.now() - portReadyAt,
    url: url.replace(BASE, ""),
    status: res?.status(),
  });
});
page.on("requestfailed", (req) => {
  if (!req.url().includes("/assets/")) return;
  assetEvents.push({
    t: Date.now() - portReadyAt,
    url: req.url().replace(BASE, ""),
    status: "FAILED",
    error: req.failure()?.errorText,
  });
});

const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));

const navStart = Date.now();
await page.goto(`${BASE}/assistant`, { waitUntil: "domcontentloaded" });
console.log("domcontentloaded ms:", Date.now() - portReadyAt);

for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(500);
  const state = await page.evaluate(() => ({
    assistantPage: Boolean(document.querySelector(".assistant-page")),
    errorBoundary: document.body.innerText.includes("Something Went Wrong"),
    routeLoader: document.body.innerText.includes("Loading EVSavari"),
    technical: document.querySelector("details pre")?.textContent || null,
  }));
  console.log(`t+${(i + 1) * 500}ms`, state);
  if (state.assistantPage || state.technical) break;
}

console.log("\nasset events:");
for (const e of assetEvents) console.log(e);
console.log("\npageerrors:", pageErrors);

await browser.close();
preview.kill();
