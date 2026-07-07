#!/usr/bin/env node
/**
 * Diagnostic: replay tests/assistant/analytics.spec.js with request timeline logging.
 * Evidence only — not part of the test suite.
 */
import { spawn } from "node:child_process";
import { firefox } from "playwright";

import { installCatalogApiStub } from "../tests/helpers/catalogApiStub.js";

const PORT = 5173;
const BASE = `http://localhost:${PORT}`;
const T0 = { ms: 0 };

const FLOW = Object.freeze({
  budget: "15–20L",
  usage: "Mixed",
  family: "Family",
  charging: "Home",
  priority: "Value",
});

const FLOW_ORDER = ["budget", "usage", "family", "charging", "priority"];
const SHORTLIST_ADD = /Add .+ to shortlist/i;
const SHORTLIST_REMOVE = /Remove .+ from shortlist/i;

/** @type {Array<{ t: number, kind: string, detail: string, extra?: object }>} */
const timeline = [];

function now() {
  return Date.now() - T0.ms;
}

function log(kind, detail, extra) {
  const entry = { t: now(), kind, detail, ...(extra ? { extra } : {}) };
  timeline.push(entry);
  const suffix = extra ? ` ${JSON.stringify(extra)}` : "";
  console.log(`t=${entry.t}ms [${kind}] ${detail}${suffix}`);
}

function matchesWatch(url) {
  return (
    /score2/i.test(url) ||
    /\.css/i.test(url) ||
    /BuyerAssistantPage/i.test(url) ||
    /CarDetails/i.test(url)
  );
}

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
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("preview port not ready");
}

async function waitForWelcome(page) {
  await page.waitForSelector(".assistant-page", { timeout: 15_000 });
  await page.getByRole("heading", { name: "Find EVs that match how you actually drive" }).waitFor();
  await page.getByRole("button", { name: "Get started" }).waitFor({ state: "visible" });
}

async function startAssistant(page, { navigate }) {
  if (navigate) {
    log("navigation", "page.goto(/assistant)", { method: "goto", target: "/assistant" });
    await page.goto(`${BASE}/assistant`, { waitUntil: "domcontentloaded" });
  } else {
    log("navigation", "stay on /assistant (navigate: false)", { method: "none" });
  }
  await waitForWelcome(page);
  log("click", "Get started");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("heading", { name: "What is your budget range?" }).waitFor();
}

async function answerFlow(page) {
  for (const key of FLOW_ORDER) {
    const label = FLOW[key];
    log("click", `radio: ${key} = ${label}`);
    await page.getByRole("radio", { name: label, exact: true }).click();
  }
}

async function expectResults(page) {
  await page.getByRole("heading", { name: "EVs that fit your brief" }).waitFor();
  await page.locator(".assistant-vehicle-card").first().waitFor();
}

async function completeAssistantToResults(page, { navigate }) {
  await startAssistant(page, { navigate });
  await answerFlow(page);
  await expectResults(page);
  log("assert", "assistant results visible");
}

async function clearShortlist(page) {
  await page.evaluate(() => localStorage.removeItem("evsavari_assistant_shortlist_v1"));
  log("action", "clearAssistantShortlist (localStorage)");
}

const preview = startPreview();
await waitForPort();
T0.ms = Date.now();
log("setup", "preview ready");

const browser = await firefox.launch();
const page = await browser.newPage();
await installCatalogApiStub(page);

/** @type {Map<string, { started: number, url: string }>} */
const inFlight = new Map();

page.on("framenavigated", (frame) => {
  if (frame === page.mainFrame()) {
    log("framenavigated", frame.url().replace(BASE, "") || "/");
  }
});

page.on("console", (msg) => {
  if (msg.type() === "error") {
    log("console.error", msg.text());
  }
});

page.on("pageerror", (err) => {
  log("pageerror", err.message, { stack: err.stack?.split("\n").slice(0, 4).join(" | ") });
});

page.on("request", (req) => {
  const url = req.url();
  if (!url.startsWith(BASE)) return;
  if (!matchesWatch(url)) return;
  const path = url.replace(BASE, "");
  inFlight.set(req, { started: now(), url: path });
  log("request", path, { resourceType: req.resourceType() });
});

page.on("requestfinished", async (req) => {
  const url = req.url();
  if (!url.startsWith(BASE) || !matchesWatch(url)) return;
  const path = url.replace(BASE, "");
  const start = inFlight.get(req);
  inFlight.delete(req);
  const res = await req.response();
  log("requestfinished", path, {
    durationMs: start ? now() - start.started : null,
    status: res?.status(),
  });
});

page.on("requestfailed", (req) => {
  const url = req.url();
  if (!url.startsWith(BASE) || !matchesWatch(url)) return;
  const path = url.replace(BASE, "");
  const start = inFlight.get(req);
  inFlight.delete(req);
  const failure = req.failure();
  log("requestfailed", path, {
    durationMs: start ? now() - start.started : null,
    failure: failure?.errorText ?? null,
  });
});

try {
  log("test-step", "=== analytics.spec.js:31 page.goto(/assistant) ===");
  await page.goto(`${BASE}/assistant`, { waitUntil: "domcontentloaded" });
  await waitForWelcome(page);
  await clearShortlist(page);

  log("test-step", "=== completeAssistantToResults navigate:false ===");
  await completeAssistantToResults(page, { navigate: false });

  log("test-step", "=== click Estimate Ownership Cost ===");
  log("click", "link: Estimate Ownership Cost");
  await page.getByRole("link", { name: "Estimate Ownership Cost" }).first().click();
  await page.waitForURL(/\/tools\/tco/);
  log("navigation", `client nav → ${new URL(page.url()).pathname}`);

  log("test-step", "=== completeAssistantToResults navigate:true (goto /assistant) ===");
  await completeAssistantToResults(page, { navigate: true });

  log("test-step", "=== click Compare Similar EVs ===");
  log("click", "link: Compare Similar EVs");
  await page.getByRole("link", { name: "Compare Similar EVs" }).first().click();
  await page.waitForURL(/\/compare\//);
  log("navigation", `client nav → ${new URL(page.url()).pathname}`);

  log("test-step", "=== completeAssistantToResults navigate:true (goto /assistant) ===");
  await completeAssistantToResults(page, { navigate: true });

  log("test-step", "=== click View Vehicle ===");
  log("click", "link: View Vehicle");
  await page.getByRole("link", { name: "View Vehicle" }).first().click();
  await page.waitForURL(/\/cars\//);
  log("navigation", `client nav → ${new URL(page.url()).pathname}`);

  log("test-step", "=== completeAssistantToResults navigate:true (goto /assistant) — OVERLAP RISK ===");
  await completeAssistantToResults(page, { navigate: true });

  log("test-step", "=== shortlist add/remove ===");
  await page.getByRole("button", { name: SHORTLIST_ADD }).first().click();
  await page.getByRole("button", { name: SHORTLIST_REMOVE }).first().click();

  log("test-step", "=== restartAssistant ===");
  log("click", "button: Restart");
  await page.getByRole("button", { name: "Restart" }).click();
  await page.getByRole("button", { name: "Get started" }).waitFor();

  log("test-step", "=== test complete ===");
} catch (error) {
  log("fatal", error instanceof Error ? error.message : String(error));
  const boundary = await page
    .locator("details pre")
    .textContent()
    .catch(() => null);
  if (boundary) log("error-boundary", boundary.trim());
}

if (inFlight.size > 0) {
  log("inflight-at-end", `${inFlight.size} watched requests still in flight`);
  for (const [, meta] of inFlight) {
    log("inflight", meta.url, { startedMsAgo: now() - meta.started });
  }
}

console.log("\n=== SUMMARY: score2 / CarDetails / BuyerAssistant / css failures ===");
for (const entry of timeline.filter((e) => e.kind === "requestfailed" || e.kind === "pageerror")) {
  console.log(JSON.stringify(entry));
}

await browser.close();
preview.kill();
