/**
 * v5 PDF discovery — scan rendered DOM and raw HTML for brochure links.
 */

const BROCHURE_KEYWORDS = Object.freeze([
  "brochure",
  "e-brochure",
  "ebrochure",
  "download brochure",
  "specifications",
  "specification",
  "factsheet",
  "fact sheet",
  "technical sheet",
]);

const PDF_HINT = /\.pdf(\?|#|$)|download.*pdf|pdf.*download/i;

function resolveHref(href, baseUrl) {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function scoreCandidate(text, href) {
  const combined = `${text} ${href}`.toLowerCase();
  let score = 0;
  for (const kw of BROCHURE_KEYWORDS) {
    if (combined.includes(kw)) score += 10;
  }
  if (PDF_HINT.test(href)) score += 20;
  if (/\.pdf/i.test(href)) score += 15;
  return score;
}

/**
 * Discover PDF/brochure candidates from HTML string (raw or rendered).
 */
export function discoverPdfCandidatesFromHtml(html, baseUrl) {
  const candidates = [];
  const seen = new Set();

  function add(href, text, source, scoreBoost = 0) {
    const resolved = resolveHref(href, baseUrl);
    if (!resolved || seen.has(resolved)) return;
    const score = scoreCandidate(text, resolved) + scoreBoost;
    if (score <= 0 && !PDF_HINT.test(resolved)) return;
    seen.add(resolved);
    candidates.push({
      url: resolved,
      label: String(text || "").trim().slice(0, 120),
      source,
      score,
    });
  }

  // href="...pdf..."
  const hrefRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    const inner = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    add(m[1], inner, "anchor_href");
  }

  // Buttons / elements with brochure text and data attributes
  const dataHrefRe =
    /<(?:button|a|div)[^>]*(?:data-href|data-url|data-download|data-file)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:button|a|div)>/gi;
  while ((m = dataHrefRe.exec(html)) !== null) {
    const inner = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    add(m[1], inner, "data_attribute", 5);
  }

  // onclick handlers with URLs
  const onclickRe = /onclick=["'][^"']*(https?:[^"']+\.pdf[^"']*)[^"']*["']/gi;
  while ((m = onclickRe.exec(html)) !== null) {
    add(m[1], "onclick handler", "js_onclick", 8);
  }

  // Bare PDF URLs in script/string literals
  const stringPdfRe = /["'](https?:[^"']+\.pdf[^"']*)["']/gi;
  while ((m = stringPdfRe.exec(html)) !== null) {
    add(m[1], "embedded url", "js_string", 3);
  }

  // Brochure keyword near any href (broader scan)
  for (const kw of BROCHURE_KEYWORDS) {
    const nearRe = new RegExp(`${kw}[\\s\\S]{0,200}href=["']([^"']+)["']`, "gi");
    while ((m = nearRe.exec(html)) !== null) {
      add(m[1], kw, "keyword_proximity", 12);
    }
    const revRe = new RegExp(`href=["']([^"']+)["'][\\s\\S]{0,200}${kw}`, "gi");
    while ((m = revRe.exec(html)) !== null) {
      add(m[1], kw, "keyword_proximity", 12);
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Discover from Playwright page (rendered DOM).
 * @param {import('playwright').Page} page
 * @param {string} baseUrl
 */
export async function discoverPdfCandidatesFromPage(page, baseUrl) {
  const domCandidates = await page.evaluate(() => {
    const keywords = [
      "brochure",
      "e-brochure",
      "download",
      "specification",
      "pdf",
    ];
    const out = [];

    const elements = document.querySelectorAll("a, button, [role='button'], [data-href], [data-url]");
    for (const el of elements) {
      const text = (el.textContent || el.getAttribute("aria-label") || "").trim();
      const lower = text.toLowerCase();
      const href =
        el.getAttribute("href") ||
        el.getAttribute("data-href") ||
        el.getAttribute("data-url") ||
        el.getAttribute("data-download") ||
        "";
      const onclick = el.getAttribute("onclick") || "";
      const matchText = keywords.some((k) => lower.includes(k));
      const matchHref = /\.pdf|brochure|specification|download/i.test(href + onclick);
      if (!matchText && !matchHref) continue;
      out.push({
        href: href || null,
        text: text.slice(0, 120),
        onclick: onclick.slice(0, 200),
        tag: el.tagName,
      });
    }
    return out;
  });

  const candidates = [];
  const seen = new Set();
  for (const row of domCandidates) {
    let href = row.href;
    if (!href && row.onclick) {
      const pdfMatch = row.onclick.match(/https?:[^'"\s]+\.pdf[^'"\s]*/i);
      if (pdfMatch) href = pdfMatch[0];
    }
    const resolved = resolveHref(href, baseUrl);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    candidates.push({
      url: resolved,
      label: row.text || row.tag,
      source: "rendered_dom",
      score: scoreCandidate(row.text, resolved) + 15,
    });
  }

  const html = await page.content();
  const htmlCandidates = discoverPdfCandidatesFromHtml(html, baseUrl);
  for (const c of htmlCandidates) {
    if (!seen.has(c.url)) {
      seen.add(c.url);
      candidates.push(c);
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export async function fetchPdfBuffer(url, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "EVSavari-CatalogAcquisition/5.0 (+https://evsavari.com)",
        Accept: "application/pdf,*/*",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, url, errors: [`HTTP ${res.status}`] };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024 || !buf.slice(0, 5).toString().startsWith("%PDF")) {
      return { ok: false, url, errors: ["Not a valid PDF response"] };
    }
    return { ok: true, url, buffer: buf, byteLength: buf.length };
  } catch (err) {
    return { ok: false, url, errors: [err?.message || "PDF fetch failed"] };
  } finally {
    clearTimeout(timer);
  }
}
