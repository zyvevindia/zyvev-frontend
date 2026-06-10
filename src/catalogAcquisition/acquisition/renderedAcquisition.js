/**
 * v5 rendered page acquisition — Playwright when available, graceful fallback.
 */

import { fetchUrlContent } from "./fetchUrl.js";

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadPlaywright() {
  try {
    const pw = await import("playwright");
    return pw.chromium ? pw : null;
  } catch {
    return null;
  }
}

/**
 * Acquire rendered HTML + visible text via Playwright.
 * @param {string} url
 * @param {{ timeoutMs?: number, waitUntil?: string }} opts
 */
export async function acquireRenderedPage(url, opts = {}) {
  const playwright = await loadPlaywright();
  if (!playwright) {
    return {
      ok: false,
      url,
      playwrightAvailable: false,
      errors: ["Playwright not installed — run: npx playwright install chromium"],
    };
  }

  const timeoutMs = opts.timeoutMs ?? 35_000;
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: "EVSavari-CatalogAcquisition/5.0 (+https://evsavari.com)",
    });
    const response = await page.goto(url, {
      waitUntil: opts.waitUntil || "networkidle",
      timeout: timeoutMs,
    });
    const finalUrl = page.url();
    const renderedHtml = await page.content();
    const visibleText = await page.evaluate(() => document.body?.innerText || "");
    const links = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].slice(0, 500).map((a) => ({
        href: a.href,
        text: (a.textContent || "").trim().slice(0, 80),
      }))
    );

    return {
      ok: true,
      url,
      finalUrl,
      playwrightAvailable: true,
      httpStatus: response?.status() ?? null,
      rawHtml: null,
      renderedHtml,
      visibleText,
      visibleTextLength: visibleText.length,
      renderedHtmlLength: renderedHtml.length,
      discoveredLinks: links,
      method: "playwright",
      fetchedAt: new Date().toISOString(),
      page,
      browser,
    };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    return {
      ok: false,
      url,
      playwrightAvailable: true,
      errors: [err?.message || "Playwright render failed"],
    };
  }
}

/** Close Playwright browser if left open on result object. */
export async function closeRenderedSession(result) {
  if (result?.browser) {
    await result.browser.close().catch(() => {});
    result.browser = null;
    result.page = null;
  }
}

/**
 * Raw fetch fallback when Playwright unavailable.
 */
export async function acquireRawOnly(url) {
  const fetched = await fetchUrlContent(url);
  if (!fetched.ok) return { ok: false, url, errors: fetched.errors };
  const visibleText = stripHtml(fetched.content);
  return {
    ok: true,
    url,
    finalUrl: fetched.finalUrl || url,
    playwrightAvailable: false,
    rawHtml: fetched.content,
    renderedHtml: fetched.content,
    visibleText,
    visibleTextLength: visibleText.length,
    renderedHtmlLength: fetched.byteLength,
    discoveredLinks: [],
    method: "fetch_only",
    fetchedAt: fetched.fetchedAt,
  };
}
