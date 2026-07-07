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

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("preview not ready");
}

const preview = startPreview();
await waitForServer();

const browser = await chromium.launch();
const page = await browser.newPage();
await installCatalogApiStub(page);

const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.stack || String(e)));

const target = process.argv[2] || "useAssistantShortlist";
await page.route(`**/*${target}*.js`, (route) => route.abort("failed"));

await page.goto(`${BASE}/assistant`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);

const details = await page.evaluate(() => ({
  errorBoundary: document.body.innerText.includes("Something Went Wrong"),
  routeLoader: document.body.innerText.includes("Loading EVSavari"),
  assistantPage: Boolean(document.querySelector(".assistant-page")),
  technical: document.querySelector("details pre")?.textContent || null,
}));

console.log("aborted:", target);
console.log(JSON.stringify({ details, pageErrors }, null, 2));

await browser.close();
preview.kill();
