/**
 * Lightweight production health probes (browser or Node).
 */

import { API_URL } from "../config";
import {
  PRODUCTION_FAMILY_MEDIA,
  PRODUCTION_FAMILY_SLUGS,
} from "../media/familyMediaManifest";
import { probeBrokenImages } from "../utils/mediaAudit";

/**
 * @returns {Promise<{ ok: boolean; status: number; latencyMs: number; total?: number; error?: string }>}
 */
export async function probeApiHealth(fetchImpl = globalThis.fetch) {
  const started = Date.now();
  const url = `${API_URL}/cars?limit=1`;

  try {
    const res = await fetchImpl(url, {
      headers: { Accept: "application/json" },
    });
    const latencyMs = Date.now() - started;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        latencyMs,
        error: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const total = data?.total ?? data?.cars?.length ?? 0;

    return {
      ok: true,
      status: res.status,
      latencyMs,
      total,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      error: err?.message || "network_error",
    };
  }
}

/**
 * Probe tier-1 Cloudinary hero + listing URLs.
 */
export async function probeCloudinaryHealth(fetchImpl = globalThis.fetch) {
  const urls = [];
  for (const family of PRODUCTION_FAMILY_SLUGS) {
    const m = PRODUCTION_FAMILY_MEDIA[family];
    urls.push(m.heroImage, m.listingThumbnail, m.compareThumbnail);
  }

  const broken = await probeBrokenImages(urls, fetchImpl);
  const checked = urls.length;

  return {
    ok: broken.length === 0,
    checked,
    broken: broken.length,
    failures: broken,
  };
}

/**
 * @param {object[]} cars
 */
export function probeLaunchFamiliesInCatalog(cars = []) {
  const slugs = new Set(
    (cars || []).map((c) => String(c.slug || "").toLowerCase()).filter(Boolean)
  );

  const missing = PRODUCTION_FAMILY_SLUGS.filter((family) => {
    if (slugs.has(family)) return false;
    return ![...slugs].some((s) => s.startsWith(`${family}-`));
  });

  return {
    ok: missing.length === 0,
    expected: PRODUCTION_FAMILY_SLUGS.length,
    found: PRODUCTION_FAMILY_SLUGS.length - missing.length,
    missing,
  };
}

/**
 * @returns {Promise<{ api: object; cloudinary: object; checkedAt: string }>}
 */
export async function runLaunchHealthChecks(fetchImpl = globalThis.fetch) {
  const [api, cloudinary] = await Promise.all([
    probeApiHealth(fetchImpl),
    probeCloudinaryHealth(fetchImpl),
  ]);

  return {
    api,
    cloudinary,
    checkedAt: new Date().toISOString(),
  };
}
