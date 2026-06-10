/**
 * v6 — deterministic identity recovery before LLM fallback.
 * Uses OEM URL, page title, H1, meta tags, PDF title. Does not modify acquisition or registry.
 */

import { createEvidenceRecord } from "../evidenceRecord.js";
import { EVIDENCE_SOURCE_TYPE, EVIDENCE_TRUST_SCORE } from "../constants.js";
import { loadDefaultRegistry } from "../sourceRegistry/registryLoader.js";

const BODY_TYPE_KEYWORDS = [
  { re: /\bsuv\b|crossover|coup[eé]\s*suv/i, type: "SUV" },
  { re: /\bhatchback\b/i, type: "Hatchback" },
  { re: /\bsedan\b/i, type: "Sedan" },
  { re: /\bmpv\b/i, type: "MPV" },
];

/** OEM URL path → identity (deterministic, no LLM). */
const URL_IDENTITY_HINTS = [
  { re: /ev\.tatamotors\.com\/nexon/i, brand: "Tata", model: "Nexon EV", familySlug: "tata-nexon-ev", bodyType: "SUV" },
  { re: /ev\.tatamotors\.com\/curvv/i, brand: "Tata", model: "Curvv EV", familySlug: "tata-curvv-ev", bodyType: "SUV" },
  { re: /ev\.tatamotors\.com\/punch/i, brand: "Tata", model: "Punch EV", familySlug: "tata-punch-ev", bodyType: "SUV" },
  { re: /ev\.tatamotors\.com\/tiago/i, brand: "Tata", model: "Tiago EV", familySlug: "tata-tiago-ev", bodyType: "Hatchback" },
  { re: /ev\.tatamotors\.com\/harrier/i, brand: "Tata", model: "Harrier EV", familySlug: "tata-harrier-ev", bodyType: "SUV" },
  { re: /ev\.tatamotors\.com\/tigor/i, brand: "Tata", model: "Tigor EV", familySlug: "tata-tigor-ev", bodyType: "Sedan" },
  { re: /mahindraelectricsuv\.com.*\/be-6|\/MBE6/i, brand: "Mahindra", model: "BE 6", familySlug: "mahindra-be-6", bodyType: "SUV" },
  { re: /mahindraelectricsuv\.com.*xev-9|\/MXV9/i, brand: "Mahindra", model: "XEV 9e", familySlug: "mahindra-xev-9e", bodyType: "SUV" },
  { re: /auto\.mahindra\.com.*xuv400/i, brand: "Mahindra", model: "XUV400", familySlug: "mahindra-xuv400", bodyType: "SUV" },
  { re: /mgmotor\.co\.in.*comet/i, brand: "MG", model: "Comet EV", familySlug: "mg-comet-ev", bodyType: "Hatchback" },
  { re: /mgmotor\.co\.in.*mgzsev|zs-ev|zsev/i, brand: "MG", model: "ZS EV", familySlug: "mg-zs-ev", bodyType: "SUV" },
  { re: /mgmotor\.co\.in.*windsor/i, brand: "MG", model: "Windsor EV", familySlug: "mg-windsor-ev", bodyType: "SUV" },
  { re: /bydautoindia\.com\/bydatto3/i, brand: "BYD", model: "Atto 3", familySlug: "byd-atto-3", bodyType: "SUV" },
  { re: /bydautoindia\.com\/bydseal/i, brand: "BYD", model: "Seal", familySlug: "byd-seal", bodyType: "Sedan" },
  { re: /creta-electric|cretaelectric/i, brand: "Hyundai", model: "Creta Electric", familySlug: "hyundai-creta-electric", bodyType: "SUV" },
  { re: /ioniq-5|ioniq5/i, brand: "Hyundai", model: "Ioniq 5", familySlug: "hyundai-ioniq-5", bodyType: "SUV" },
  { re: /kona-electric/i, brand: "Hyundai", model: "Kona Electric", familySlug: "hyundai-kona-electric", bodyType: "SUV" },
  { re: /citroen\.in.*e-c3|ec3/i, brand: "Citroen", model: "eC3", familySlug: "citroen-ec3", bodyType: "Hatchback" },
  { re: /kia\.com.*ev6/i, brand: "Kia", model: "EV6", familySlug: "kia-ev6", bodyType: "SUV" },
];

function slugify(text = "") {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractHtmlSignals(html = "") {
  const title = html.match(/<title[^>]*>([^<]+)/i)?.[1]?.replace(/\s+/g, " ").trim() || null;
  const h1 = html.match(/<h1[^>]*>([^<]+)/i)?.[1]?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || null;
  const ogTitle =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1] ||
    null;
  const metaDesc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || null;
  return { title, h1, ogTitle, metaDesc };
}

function parseTitleIdentity(title = "") {
  const t = String(title).replace(/\s+/g, " ").trim();
  if (!t) return null;

  const brandModels = [
    ["Tata", /\b(tata)\s+(nexon\s*ev|curvv\s*ev|punch\s*ev|tiago\s*ev|harrier\s*ev|tigor\s*ev)/i],
    ["Mahindra", /\b(mahindra)\s+(be\s*6|xev\s*9e?|xuv\s*400)/i],
    ["MG", /\b(mg)\s+(comet\s*ev|zs\s*ev|windsor\s*ev)/i],
    ["BYD", /\b(byd)\s+(atto\s*3|seal)/i],
    ["Hyundai", /\b(hyundai)\s+(creta\s*electric|ioniq\s*5|kona\s*electric)/i],
    ["Citroen", /\b(citro[eë]n)\s+(ë?-?c3|ec3)/i],
    ["Kia", /\b(kia)\s+(ev6)/i],
    ["Maruti Suzuki", /\b(maruti|nexa)\s+(e\s*vitara)/i],
  ];

  for (const [brand, re] of brandModels) {
    const m = t.match(re);
    if (m) {
      const model = m[2].replace(/\s+/g, " ").replace(/^./, (c) => c.toUpperCase());
      const normalizedModel = model
        .replace(/\bEv\b/g, "EV")
        .replace(/\bBe\s*6\b/i, "BE 6")
        .replace(/\bXev\s*9e?\b/i, "XEV 9e")
        .replace(/\bAtto\s*3\b/i, "Atto 3")
        .replace(/\bEc3\b/i, "eC3")
        .replace(/\bEv6\b/i, "EV6");
      return {
        brand,
        model: normalizedModel,
        familySlug: slugify(`${brand}-${normalizedModel}`),
      };
    }
  }

  const dotEv = t.match(/\b([A-Za-z]+)\.ev\b/i);
  if (dotEv) {
    const name = dotEv[1];
    const model = `${name.charAt(0).toUpperCase()}${name.slice(1).toLowerCase()} EV`;
    return { brand: "Tata", model, familySlug: slugify(`tata-${model}`) };
  }

  return null;
}

function inferBodyType(text = "", fallback = null) {
  for (const { re, type } of BODY_TYPE_KEYWORDS) {
    if (re.test(text)) return type;
  }
  return fallback || "SUV";
}

function findRegistryByUrl(oemUrl) {
  if (!oemUrl) return null;
  try {
    const hostPath = new URL(oemUrl).hostname + new URL(oemUrl).pathname;
    return loadDefaultRegistry().find((e) => {
      if (!e.officialUrl) return false;
      try {
        const ep = new URL(e.officialUrl).hostname + new URL(e.officialUrl).pathname;
        return hostPath === ep || oemUrl.startsWith(e.officialUrl.replace(/\.html$/, ""));
      } catch {
        return false;
      }
    });
  } catch {
    return null;
  }
}

function identityFromUrl(oemUrl) {
  const hay = String(oemUrl || "");
  for (const hint of URL_IDENTITY_HINTS) {
    if (hint.re.test(hay)) {
      return { ...hint, source: "oem_url", confidence: 96 };
    }
  }
  return null;
}

/**
 * Collect identity signals from acquisition sources.
 * @param {object[]} sources
 * @param {{ oemUrl?: string, familySlug?: string }} hints
 */
export function collectIdentitySignals(sources = [], hints = {}) {
  const signals = [];
  const oemUrl = hints.oemUrl || sources.find((s) => s.type === EVIDENCE_SOURCE_TYPE.OEM_WEBSITE)?.url || sources[0]?.url;

  const registry =
    (hints.familySlug && loadDefaultRegistry().find((e) => e.familySlug === hints.familySlug)) ||
    findRegistryByUrl(oemUrl);

  if (registry?.brand && registry?.model) {
    signals.push({
      brand: registry.brand,
      model: registry.model,
      familySlug: registry.familySlug || registry.id,
      bodyType: inferBodyType(`${registry.model} ${registry.brand}`),
      source: "registry_read",
      confidence: 98,
    });
  }

  const urlId = identityFromUrl(oemUrl);
  if (urlId) signals.push(urlId);

  for (const source of sources) {
    if (!source?.content) continue;
    const isPdf = source.type === EVIDENCE_SOURCE_TYPE.OEM_PDF || /\.pdf/i.test(source.url || "");
    if (isPdf) {
      const firstLine = String(source.content).split("\n")[0]?.slice(0, 120);
      const pdfTitle = parseTitleIdentity(firstLine);
      if (pdfTitle) signals.push({ ...pdfTitle, bodyType: inferBodyType(source.content), source: "pdf_title", confidence: 90 });
      continue;
    }
    const { title, h1, ogTitle, metaDesc } = extractHtmlSignals(source.content);
    for (const t of [title, h1, ogTitle]) {
      const parsed = parseTitleIdentity(t);
      if (parsed) {
        signals.push({
          ...parsed,
          bodyType: inferBodyType(`${t} ${metaDesc || ""}`),
          source: "html_title",
          confidence: 92,
        });
      }
    }
  }

  return { oemUrl, signals };
}

/**
 * Resolve best identity from collected signals (highest confidence wins per field).
 */
export function resolveIdentity(signalsResult) {
  const { signals = [] } = signalsResult || {};
  if (!signals.length) return null;

  const pick = (key) => {
    const ranked = signals
      .filter((s) => s[key])
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    return ranked[0]?.[key] ?? null;
  };

  const brand = pick("brand");
  const model = pick("model");
  let familySlug = pick("familySlug");
  if (!familySlug && brand && model) {
    familySlug = slugify(`${brand}-${model}`);
  }
  const bodyType = pick("bodyType") || inferBodyType(`${brand} ${model}`);

  if (!brand || !model) return null;

  return {
    brand,
    model,
    familySlug,
    bodyType,
    confidence: Math.max(...signals.map((s) => s.confidence || 0)),
    sources: [...new Set(signals.map((s) => s.source))],
  };
}

/**
 * Emit high-trust evidence records for identity fields.
 */
export function identityToEvidenceRecords(identity, meta = {}) {
  if (!identity) return [];
  const base = {
    importId: meta.importId,
    sourceType: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
    sourceName: meta.sourceName || "v6-identity-recovery",
    sourceUrl: meta.oemUrl || null,
    trustScore: EVIDENCE_TRUST_SCORE[EVIDENCE_SOURCE_TYPE.OEM_WEBSITE] ?? 85,
    extractionMethod: "v6-identity-deterministic",
    extractionConfidence: identity.confidence ?? 95,
  };

  const fields = [
    ["brand", identity.brand],
    ["model", identity.model],
    ["familySlug", identity.familySlug],
    ["bodyType", identity.bodyType],
  ];

  return fields
    .filter(([, v]) => v)
    .map(([fieldName, fieldValue]) =>
      createEvidenceRecord({ ...base, fieldName, fieldValue, sourceSnippet: `v6-identity:${identity.sources?.join(",")}` })
    );
}

/**
 * Apply resolved identity to merged fields when missing or low-confidence.
 */
export function applyIdentityToMergedFields(mergedFields, identity) {
  if (!identity) return mergedFields;
  const out = { ...mergedFields };
  const apply = (key, value, confidence = 95) => {
    const cur = out[key];
    const missing = !cur?.value || cur.value === "";
    const lowConf = (cur?.confidence ?? 0) < 80;
    if (missing || lowConf) {
      out[key] = {
        fieldName: key,
        value,
        confidence,
        status: "agreement",
        manualReview: false,
        sources: [{ sourceType: "v6_identity", extractionMethod: "v6-identity-deterministic" }],
        sourceValues: [{ value, trustWeight: confidence }],
      };
    }
  };
  apply("brand", identity.brand, identity.confidence);
  apply("model", identity.model, identity.confidence);
  apply("familySlug", identity.familySlug, identity.confidence);
  apply("bodyType", identity.bodyType, Math.min(identity.confidence, 88));
  return out;
}
