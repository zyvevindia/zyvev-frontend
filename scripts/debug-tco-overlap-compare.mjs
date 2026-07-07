#!/usr/bin/env node
import { chromium, firefox } from "playwright";
import { installCatalogApiStub } from "../tests/helpers/catalogApiStub.js";

const BASE = "http://localhost:5173";
const FLOW = { budget: "15–20L", usage: "Mixed", family: "Family", charging: "Home", priority: "Value" };
const order = ["budget", "usage", "family", "charging", "priority"];

async function overlapScenario(name, launch) {
  const browser = await launch();
  const page = await browser.newPage();
  await installCatalogApiStub(page);
  const events = [];
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (/score2|CarDetails|BuyerAssistant|\.css/.test(u)) {
      events.push({ url: u.replace(BASE, ""), fail: r.failure()?.errorText });
    }
  });
  page.on("pageerror", (e) => events.push({ pageerror: e.message }));

  await page.goto(`${BASE}/assistant`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".assistant-page");
  await page.getByRole("button", { name: "Get started" }).click();
  for (const k of order) await page.getByRole("radio", { name: FLOW[k], exact: true }).click();
  await page.getByRole("heading", { name: "EVs that fit your brief" }).waitFor();
  await page.getByRole("link", { name: "Estimate Ownership Cost" }).first().click();
  await page.waitForURL(/\/tools\/tco/);
  await page.goto(`${BASE}/assistant`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const healthy = await page.locator(".assistant-page").count();
  const boundary = await page.getByRole("heading", { name: "Something Went Wrong" }).count();
  console.log(JSON.stringify({ browser: name, events, healthy, boundary }, null, 2));
  await browser.close();
}

await overlapScenario("firefox", () => firefox.launch());
await overlapScenario("chromium", () => chromium.launch());
