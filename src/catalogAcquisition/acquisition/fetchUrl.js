/**
 * Server-side URL acquisition — fetch OEM and reference pages without CORS.
 */

const DEFAULT_HEADERS = {
  "User-Agent": "EVSavari-CatalogAcquisition/3.0 (+https://evsavari.com)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9",
};

/**
 * @param {string} url
 * @param {{ timeoutMs?: number }} opts
 */
export async function fetchUrlContent(url, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 25_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      return {
        ok: false,
        url,
        errors: [`HTTP ${res.status} ${res.statusText}`],
      };
    }
    const contentType = res.headers.get("content-type") || "";
    const body = await res.text();
    const finalUrl = res.url || url;
    return {
      ok: true,
      url,
      finalUrl,
      redirected: finalUrl !== url,
      status: res.status,
      content: body,
      contentType,
      byteLength: body.length,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      url,
      errors: [err?.message || "Fetch failed"],
    };
  } finally {
    clearTimeout(timer);
  }
}

export function deriveHostname(url = "") {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function buildAcquisitionMetadata(source = {}) {
  return {
    url: source.url || null,
    sourceType: source.sourceType || null,
    fetchedAt: source.fetchedAt || new Date().toISOString(),
    contentType: source.contentType || null,
    byteLength: source.byteLength ?? source.content?.length ?? 0,
    method: source.method || "url_fetch",
    ok: source.ok !== false,
    errors: source.errors || [],
  };
}
