/**
 * Export SEO Agent v1 specs to static JSON (read-only consumer of generateSeoContent).
 */
import { applyEditorialEnrichment } from "./editorialEnrichment.mjs";
import { loadAllGoldenDossiers } from "../../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import {
  SEO_PAGE_SPECS,
  SEO_CONTENT_TYPES,
  generateSeoContent,
} from "../../src/agents/seo/index.js";

function loadAgentVehiclePool() {
  return loadAllGoldenDossiers().map((row) => {
    const d = row.dossier || row;
    return {
      id: d.familySlug || d.id,
      displayName: d.displayName,
      familySlug: d.familySlug || d.id,
      fields: d.fields || d,
      variants: d.variants || [],
      features: d.features || {},
      startingPrice: d.fields?.startingPrice ?? d.startingPrice,
    };
  });
}

/**
 * Route-facing path — variant agent specs use /best-evs/ for discovery routing.
 * @param {object} spec
 */
export function resolveAgentPublicPath(spec) {
  const path = spec.canonicalPath || `/guides/${spec.slug}`;
  if (path.startsWith("/guides/")) {
    return path.replace(/^\/guides\//, "/best-evs/");
  }
  return path;
}

/**
 * @param {object} spec
 */
export function resolveAgentPageType(spec) {
  switch (spec.contentType) {
    case SEO_CONTENT_TYPES.COMPARE:
      return "compare_guide";
    case SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION:
      return "best_evs";
    case SEO_CONTENT_TYPES.TOP_LIST:
    case SEO_CONTENT_TYPES.BUYING_GUIDE:
    default:
      return "best_evs";
  }
}

/**
 * @returns {{ spec: object, page: object, publicPath: string, pageType: string }[]}
 */
export function generateAllAgentPages() {
  const pool = loadAgentVehiclePool();
  const results = [];

  for (const spec of SEO_PAGE_SPECS) {
    const generated = generateSeoContent(spec, pool);
    if (!generated.ok) {
      console.warn(`  [agent] skip ${spec.id}: ${(generated.errors || []).join(", ")}`);
      continue;
    }

    const publicPath = resolveAgentPublicPath(spec);
    const seoPage = applyEditorialEnrichment(
      {
        ...generated.seoPage,
        canonicalPath: publicPath,
        canonicalUrl: `https://evsavari.com${publicPath}`,
      },
      spec.slug
    );

    results.push({
      spec,
      page: { seoPage },
      publicPath,
      pageType: resolveAgentPageType(spec),
    });
  }

  return results;
}

/**
 * Maps /best-evs/:useCase → content slug for slugMap.js
 * @param {{ spec: object }[]} agentPages
 */
export function buildAgentBestEvsSlugMap(agentPages) {
  const map = {};
  for (const row of agentPages) {
    if (row.pageType !== "best_evs") continue;
    const useCase = row.publicPath.replace(/^\/best-evs\//, "");
    if (useCase) {
      map[useCase] = row.spec.slug;
    }
  }
  return map;
}

/**
 * @param {{ spec: object, pageType: string }[]} agentPages
 */
export function buildAgentCompareSlugs(agentPages) {
  return agentPages
    .filter((row) => row.pageType === "compare_guide")
    .map((row) => row.spec.slug);
}
