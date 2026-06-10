/**
 * EVSavari source registry bootstrap — validate OEM URLs and write source-registry.json.
 * Measurement only; does not modify extraction or acquisition pipelines.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "./lib/bootstrapEnv.mjs";

import { fetchUrlContent, deriveHostname } from "../src/catalogAcquisition/acquisition/fetchUrl.js";
import { SOURCE_REGISTRY_STATUS } from "../src/catalogAcquisition/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "public/catalog/source-registry.json");
const REPORT_PATH = path.join(ROOT, "docs/catalog/source-registry-bootstrap-report.md");

/** @type {Array<object>} Researched seed — official URLs from OEM sites (Jun 2026). */
const REGISTRY_SEED = [
  {
    id: "tata-nexon-ev",
    brand: "Tata",
    model: "Nexon EV",
    officialUrl: "https://ev.tatamotors.com/nexon/ev.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/tata/nexon-ev"],
    vehicleKeywords: ["nexon", "nexon ev", "nexonev"],
  },
  {
    id: "tata-curvv-ev",
    brand: "Tata",
    model: "Curvv EV",
    officialUrl: "https://ev.tatamotors.com/curvv/ev.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/tata/curvv-ev"],
    vehicleKeywords: ["curvv", "curvv ev", "curvvev"],
  },
  {
    id: "tata-punch-ev",
    brand: "Tata",
    model: "Punch EV",
    officialUrl: "https://ev.tatamotors.com/punch/ev.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/tata/punch-ev"],
    vehicleKeywords: ["punch", "punch ev", "punchev"],
  },
  {
    id: "tata-tiago-ev",
    brand: "Tata",
    model: "Tiago EV",
    officialUrl: "https://ev.tatamotors.com/tiago/ev.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/tata/tiago-ev"],
    vehicleKeywords: ["tiago", "tiago ev", "tiagoev"],
  },
  {
    id: "tata-harrier-ev",
    brand: "Tata",
    model: "Harrier EV",
    officialUrl: "https://ev.tatamotors.com/harrier/ev.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/tata/harrier-ev"],
    vehicleKeywords: ["harrier", "harrier ev", "harrierev"],
  },
  {
    id: "tata-tigor-ev",
    brand: "Tata",
    model: "Tigor EV",
    officialUrl: "https://ev.tatamotors.com/tigor/ev.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/tata/tigor-ev"],
    vehicleKeywords: ["tigor", "tigor ev", "tigorev"],
  },
  {
    id: "mg-comet-ev",
    brand: "MG",
    model: "Comet EV",
    officialUrl: "https://www.mgmotor.co.in/vehicles/comet-ev-electric-car-in-india",
    brochureUrl:
      "https://s7ap1.scene7.com/is/content/mgmotor/mgmotor/documents/MG%20Comet%20EV%20-%20Brochure.pdf",
    referenceUrls: ["https://www.cardekho.com/mg/comet-ev"],
    vehicleKeywords: ["comet", "comet ev", "cometev"],
  },
  {
    id: "mg-zs-ev",
    brand: "MG",
    model: "ZS EV",
    officialUrl: "https://www.mgmotor.co.in/vehicles/mgzsev-electric-car-in-india",
    brochureUrl:
      "https://s7ap1.scene7.com/is/content/mgmotor/mgmotor/documents/MG%20ZSEV%20-%20Brochure.pdf",
    referenceUrls: ["https://www.cardekho.com/mg/zs-ev"],
    vehicleKeywords: ["zs ev", "zsev", "mg zs"],
  },
  {
    id: "mg-windsor-ev",
    brand: "MG",
    model: "Windsor EV",
    officialUrl: "https://www.mgmotor.co.in/vehicles/windsor-ev-electric-car-in-india",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/mg/windsor-ev"],
    vehicleKeywords: ["windsor", "windsor ev", "windsorev"],
  },
  {
    id: "mahindra-be-6",
    brand: "Mahindra",
    model: "BE 6",
    officialUrl: "https://www.mahindraelectricsuv.com/esuv/be-6/MBE6.html",
    brochureUrl:
      "https://www.mahindraelectricsuv.com/on/demandware.static/-/Library-Sites-eSUVSharedLibrary/default/MBE6/MBE6-Brochure-Specification.pdf",
    referenceUrls: ["https://www.cardekho.com/mahindra/be-6"],
    vehicleKeywords: ["be 6", "be6", "be-6", "be6e"],
  },
  {
    id: "mahindra-xev-9e",
    brand: "Mahindra",
    model: "XEV 9e",
    officialUrl: "https://www.mahindraelectricsuv.com/esuv/xev-9e/MXV9.html",
    brochureUrl:
      "https://www.mahindraelectricsuv.com/on/demandware.static/-/Library-Sites-eSUVSharedLibrary/default/MXV9/XEV-9e-Brochure-Specification.pdf",
    referenceUrls: ["https://www.cardekho.com/mahindra/xev-9e"],
    vehicleKeywords: ["xev 9", "xev9", "xev 9e", "xev9e"],
  },
  {
    id: "mahindra-xuv400",
    brand: "Mahindra",
    model: "XUV400",
    officialUrl: "https://auto.mahindra.com/suv/xuv400/X400.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/mahindra/xuv400"],
    vehicleKeywords: ["xuv400", "xuv 400"],
  },
  {
    id: "byd-atto-3",
    brand: "BYD",
    model: "Atto 3",
    officialUrl: "https://www.bydautoindia.com/bydatto3",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/byd/atto-3"],
    vehicleKeywords: ["atto 3", "atto3", "atto-3"],
  },
  {
    id: "byd-seal",
    brand: "BYD",
    model: "Seal",
    officialUrl: "https://www.bydautoindia.com/bydseal",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/byd/seal"],
    vehicleKeywords: ["seal", "byd seal"],
  },
  {
    id: "hyundai-kona-electric",
    brand: "Hyundai",
    model: "Kona Electric",
    officialUrl: "https://www.hyundai.com/in/en/find-a-car/kona-electric/highlights",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/hyundai/kona-electric"],
    vehicleKeywords: ["kona", "kona electric", "konaelectric"],
    registryStatus: SOURCE_REGISTRY_STATUS.DEPRECATED,
    notes: "Discontinued in India (Jun 2024); canonical URL now redirects to Hyundai India homepage",
  },
  {
    id: "hyundai-creta-electric",
    brand: "Hyundai",
    model: "Creta Electric",
    officialUrl: "https://www.hyundai.com/in/en/find-a-car/creta-electric/highlights",
    brochureUrl: "https://www.hyundai.com/content/dam/hyundai/in/en/data/brochure/creta-ev.pdf",
    referenceUrls: ["https://www.cardekho.com/hyundai/creta-electric"],
    vehicleKeywords: ["creta", "creta electric", "cretaev", "creta ev"],
  },
  {
    id: "hyundai-ioniq-5",
    brand: "Hyundai",
    model: "Ioniq 5",
    officialUrl: "https://www.hyundai.com/in/en/find-a-car/ioniq-5/highlights",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/hyundai/ioniq-5"],
    vehicleKeywords: ["ioniq 5", "ioniq5", "ioniq-5"],
  },
  {
    id: "citroen-ec3",
    brand: "Citroen",
    model: "eC3",
    officialUrl: "https://www.citroen.in/models/new-e-c3.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/citroen/ec3"],
    vehicleKeywords: ["ec3", "e-c3", "ë-c3", "citroen ec3"],
  },
  {
    id: "kia-ev6",
    brand: "Kia",
    model: "EV6",
    officialUrl: "https://www.kia.com/in/our-vehicles/ev6/showroom.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/kia/ev6"],
    vehicleKeywords: ["ev6", "ev 6", "kia ev6"],
  },
  {
    id: "bmw-ix1",
    brand: "BMW",
    model: "iX1",
    officialUrl: "https://www.bmw.in/en/all-models/bmw-i/iX1/2025/bmw-ix1-highlights.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/bmw/ix1"],
    vehicleKeywords: ["ix1", "bmw ix1", "ix1 lwb"],
  },
  {
    id: "mercedes-eqa",
    brand: "Mercedes-Benz",
    model: "EQA",
    officialUrl: "https://www.mercedes-benz.co.in/en/passenger-cars/models/suv/eqa.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/mercedes-benz/eqa"],
    vehicleKeywords: ["eqa", "mercedes eqa"],
  },
  {
    id: "mercedes-eqb",
    brand: "Mercedes-Benz",
    model: "EQB",
    officialUrl: "https://www.mercedes-benz.co.in/en/passenger-cars/models/suv/eqb.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/mercedes-benz/eqb"],
    vehicleKeywords: ["eqb", "mercedes eqb"],
  },
  {
    id: "volvo-ex40",
    brand: "Volvo",
    model: "EX40",
    officialUrl: "https://www.volvocars.com/in/cars/ex40-electric/",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/volvo/ex40"],
    vehicleKeywords: ["ex40", "ex 40", "volvo ex40"],
  },
  {
    id: "mini-cooper-se",
    brand: "MINI",
    model: "Cooper SE",
    officialUrl: "https://www.mini.in/en_IN/home/range/mini-cooper-se-electric.html",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/mini/cooper-se"],
    vehicleKeywords: ["cooper se", "mini cooper", "cooperse"],
  },
  {
    id: "maruti-e-vitara",
    brand: "Maruti Suzuki",
    model: "e Vitara",
    officialUrl: "https://www.nexaexperience.com/e-vitara",
    brochureUrl: null,
    referenceUrls: ["https://www.cardekho.com/maruti/e-vitara"],
    vehicleKeywords: ["e vitara", "evitara", "vitara"],
  },
];

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html) {
  const m = String(html).match(/<title[^>]*>([^<]+)/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

function normalizePath(url) {
  try {
    return new URL(url).pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return "";
  }
}

function pageMatchesVehicle(title, body, brand, model, vehicleKeywords = []) {
  const hay = `${title} ${body}`.toLowerCase();
  const modelHay = model.toLowerCase();
  if (modelHay && hay.includes(modelHay)) return true;

  const brandHay = brand.toLowerCase();
  if (brandHay.length >= 3 && hay.includes(brandHay) && /\bev\b|electric/i.test(hay)) {
    const modelTokens = modelHay.split(/[\s\-_/]+/).filter((t) => t.length >= 2);
    if (modelTokens.every((t) => hay.includes(t))) return true;
  }

  return vehicleKeywords.some((kw) => {
    const k = String(kw).toLowerCase().trim();
    return k.length >= 3 && hay.includes(k);
  });
}

function pathHintsVehicle(path, model, vehicleKeywords = []) {
  const p = path.toLowerCase();
  const modelSlug = model.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (modelSlug.length >= 3 && p.includes(modelSlug)) return true;
  return vehicleKeywords.some((kw) => {
    const slug = String(kw).toLowerCase().replace(/[^a-z0-9]+/g, "");
    return slug.length >= 3 && p.includes(slug);
  });
}

function validateOfficialPage({ requestedUrl, fetchResult, brand, model, vehicleKeywords }) {
  if (!fetchResult?.ok) {
    return {
      valid: false,
      reachable: false,
      httpStatus: null,
      finalUrl: fetchResult?.url || requestedUrl,
      redirected: false,
      pageTitle: null,
      visibleTextLength: 0,
      validationStatus: "http_error",
      warnings: [(fetchResult?.errors || ["Fetch failed"]).join("; ")],
    };
  }

  const finalUrl = fetchResult.finalUrl || fetchResult.url || requestedUrl;
  const pageTitle = extractTitle(fetchResult.content || "");
  const visibleText = stripHtml(fetchResult.content || "");
  const reqPath = normalizePath(requestedUrl);
  const finPath = normalizePath(finalUrl);
  const redirected = Boolean(fetchResult.redirected) || reqPath !== finPath;
  const matches = pageMatchesVehicle(pageTitle, visibleText, brand, model, vehicleKeywords);
  const pathMatch = pathHintsVehicle(finPath, model, vehicleKeywords);
  const jsShell = visibleText.length < 400 && (fetchResult.byteLength || 0) < 15_000;

  const warnings = [];
  if (redirected && reqPath !== finPath) {
    warnings.push(`Redirected from ${reqPath} to ${finPath}`);
  }
  if (!matches) {
    if (jsShell && pathMatch) {
      warnings.push("HTTP 200 but page is JS-rendered shell — requires Playwright for content verification");
    } else {
      warnings.push(`Page may not match vehicle identity (${brand} ${model})`);
    }
  }

  return {
    valid: matches && fetchResult.ok,
    reachable: true,
    pathMatch,
    jsShell,
    httpStatus: fetchResult.status,
    finalUrl,
    redirected,
    pageTitle: pageTitle.slice(0, 120),
    visibleTextLength: visibleText.length,
    validationStatus: matches
      ? "valid"
      : jsShell && pathMatch
        ? "js_rendered_shell"
        : redirected
          ? "redirect_mismatch"
          : "no_vehicle_keywords",
    warnings,
  };
}

async function validateBrochureUrl(url) {
  if (!url) {
    return { ok: false, status: null, finalUrl: null, contentType: null, isPdf: false, redirected: false };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "EVSavari-RegistryBootstrap/1.0",
        Accept: "application/pdf,*/*",
      },
    });
    const ct = (head.headers.get("content-type") || "").toLowerCase();
    const isPdf = ct.includes("pdf") || url.toLowerCase().includes(".pdf");
    if (head.ok && isPdf) {
      return {
        ok: true,
        status: head.status,
        finalUrl: head.url || url,
        contentType: ct,
        isPdf: true,
        redirected: (head.url || url) !== url,
      };
    }
  } catch {
    // fall through to GET
  } finally {
    clearTimeout(timer);
  }

  const fetched = await fetchUrlContent(url, { timeoutMs: 20_000 });
  const ct = (fetched.contentType || "").toLowerCase();
  const isPdf = ct.includes("pdf") || url.toLowerCase().includes(".pdf");
  return {
    ok: Boolean(fetched.ok && isPdf),
    status: fetched.status || null,
    finalUrl: fetched.finalUrl || url,
    contentType: fetched.contentType || null,
    isPdf,
    redirected: fetched.redirected,
  };
}

function computeAcquisitionReadinessScore(input) {
  let score = 0;
  if (input.officialUrlReachable) score += 25;
  if (input.officialUrlValid) score += 25;
  if (input.officialUrlReachable && !input.flags.redirectingUrl) score += 10;
  if (input.officialUrlValid && input.hasVehicleKeywords) score += 5;
  if (input.jsRenderedShell && input.officialUrlReachable) score += 5;
  if (input.brochureUrlValid) score += 25;
  if (input.referenceUrls?.length) score += 5;
  if (input.officialContentLength > 5000) score += 5;
  if (input.brochureUrl && !input.brochureUrlValid) score -= 5;
  if (input.flags.unreachableUrl) score = Math.min(score, 15);
  if (input.status === SOURCE_REGISTRY_STATUS.DEPRECATED) score = Math.min(score, 25);
  return Math.max(0, Math.min(100, score));
}

function buildFlags(official, brochure, seed) {
  const flags = {
    missingBrochure: !seed.brochureUrl,
    redirectingUrl: Boolean(
      official.reachable &&
        official.redirected &&
        official.httpStatus >= 200 &&
        official.httpStatus < 400
    ),
    unreachableUrl: !official.reachable,
  };
  if (seed.brochureUrl && !brochure.ok) {
    flags.missingBrochure = true;
    flags.brochureUnreachable = true;
  }
  return flags;
}

async function validateVehicle(seed) {
  const fetched = await fetchUrlContent(seed.officialUrl, { timeoutMs: 60_000 });
  const official = validateOfficialPage({
    requestedUrl: seed.officialUrl,
    fetchResult: fetched,
    brand: seed.brand,
    model: seed.model,
    vehicleKeywords: seed.vehicleKeywords,
  });

  const brochure = await validateBrochureUrl(seed.brochureUrl);
  const officialReachable = Boolean(official.reachable);
  const officialUrlValid = Boolean(official.valid);
  const jsRenderedShell = official.validationStatus === "js_rendered_shell";

  const flags = buildFlags(
    { reachable: officialReachable, redirected: official.redirected, httpStatus: official.httpStatus },
    brochure,
    seed
  );
  if (jsRenderedShell) flags.jsRenderedSource = true;

  const status =
    seed.registryStatus ||
    (officialUrlValid && (!seed.brochureUrl || brochure.ok)
      ? SOURCE_REGISTRY_STATUS.VERIFIED
      : SOURCE_REGISTRY_STATUS.NEEDS_VERIFICATION);

  const acquisitionReadinessScore = computeAcquisitionReadinessScore({
    officialUrlReachable: officialReachable,
    officialUrlValid,
    jsRenderedShell,
    flags,
    hasVehicleKeywords: officialUrlValid,
    brochureUrlValid: brochure.ok,
    brochureUrl: seed.brochureUrl,
    referenceUrls: seed.referenceUrls,
    officialContentLength: fetched?.byteLength || official.visibleTextLength || 0,
    status,
  });

  const oemDomain = normalizeHostname(official.finalUrl || seed.officialUrl);

  const notes = [
    seed.notes || null,
    flags.unreachableUrl ? `Official URL unreachable (${official.warnings?.[0] || "fetch error"})` : null,
    flags.redirectingUrl ? `Redirects to ${official.finalUrl}` : null,
    flags.jsRenderedSource ? "OEM page is JS-rendered; static fetch lacks vehicle content" : null,
    flags.missingBrochure ? "Brochure URL missing or invalid" : null,
    seed.brochureUrl && brochure.ok ? "Brochure verified" : null,
  ]
    .filter(Boolean)
    .join("; ") || null;

  return {
    id: seed.id,
    familySlug: seed.id,
    brand: seed.brand,
    model: seed.model,
    officialUrl: seed.officialUrl,
    brochureUrl: seed.brochureUrl || null,
    oemDomain,
    referenceUrls: seed.referenceUrls || [],
    vehicleKeywords: seed.vehicleKeywords || [],
    status,
    lastVerifiedAt: new Date().toISOString(),
    flags,
    acquisitionReadinessScore,
    notes,
    _audit: {
      official: {
        httpStatus: official.httpStatus,
        finalUrl: official.finalUrl,
        redirected: official.redirected,
        valid: official.valid,
        validationStatus: official.validationStatus,
        pageTitle: official.pageTitle,
        visibleTextLength: official.visibleTextLength,
        warnings: official.warnings,
      },
      brochure: seed.brochureUrl
        ? {
            httpStatus: brochure.status,
            finalUrl: brochure.finalUrl,
            ok: brochure.ok,
            contentType: brochure.contentType,
            isPdf: brochure.isPdf,
          }
        : null,
    },
  };
}

function buildReport(entries) {
  const verified = entries.filter((e) => e.status === SOURCE_REGISTRY_STATUS.VERIFIED);
  const flagged = entries.filter(
    (e) => e.flags.missingBrochure || e.flags.redirectingUrl || e.flags.unreachableUrl
  );
  const avgScore =
    entries.reduce((s, e) => s + e.acquisitionReadinessScore, 0) / Math.max(1, entries.length);

  const lines = [
    "# EVSavari Source Registry Bootstrap Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `**Vehicles:** ${entries.length}`,
    `**Verified:** ${verified.length}`,
    `**Flagged:** ${flagged.length}`,
    `**Average acquisition readiness score:** ${avgScore.toFixed(1)}`,
    "",
    "## Summary by readiness",
    "",
    "| Vehicle | Score | Status | Official | Brochure | Flags |",
    "| --- | ---: | --- | --- | --- | --- |",
  ];

  for (const e of [...entries].sort((a, b) => b.acquisitionReadinessScore - a.acquisitionReadinessScore)) {
    const flagStr = [
      e.flags.missingBrochure ? "missingBrochure" : null,
      e.flags.redirectingUrl ? "redirectingUrl" : null,
      e.flags.unreachableUrl ? "unreachableUrl" : null,
      e.flags.brochureUnreachable ? "brochureUnreachable" : null,
    ]
      .filter(Boolean)
      .join(", ") || "—";
    lines.push(
      `| ${e.brand} ${e.model} | ${e.acquisitionReadinessScore} | ${e.status} | ${e._audit.official.valid ? "✓" : "✗"} | ${e.brochureUrl && e._audit.brochure?.ok ? "✓" : "—"} | ${flagStr} |`
    );
  }

  lines.push("", "## Flagged entries", "");
  for (const e of flagged) {
    lines.push(`### ${e.brand} ${e.model} (${e.id})`);
    lines.push(`- Official: ${e.officialUrl}`);
    lines.push(`- Final: ${e._audit.official.finalUrl}`);
    lines.push(`- OEM domain: ${e.oemDomain}`);
    lines.push(`- Score: ${e.acquisitionReadinessScore}`);
    if (e.notes) lines.push(`- Notes: ${e.notes}`);
    lines.push("");
  }

  return lines.join("\n");
}

function normalizeHostname(url) {
  const host = deriveHostname(url);
  if (!host) return null;
  return host.replace(/^www\./, "");
}

async function main() {
  console.log(`Validating ${REGISTRY_SEED.length} vehicles…`);
  const entries = [];

  for (const seed of REGISTRY_SEED) {
    process.stdout.write(`  ${seed.id}… `);
    try {
      const entry = await validateVehicle(seed);
      entries.push(entry);
      console.log(`${entry.acquisitionReadinessScore} (${entry.status})`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      entries.push({
        id: seed.id,
        familySlug: seed.id,
        brand: seed.brand,
        model: seed.model,
        officialUrl: seed.officialUrl,
        brochureUrl: seed.brochureUrl || null,
        oemDomain: normalizeHostname(seed.officialUrl),
        referenceUrls: seed.referenceUrls || [],
        vehicleKeywords: seed.vehicleKeywords || [],
        status: SOURCE_REGISTRY_STATUS.NEEDS_VERIFICATION,
        lastVerifiedAt: new Date().toISOString(),
        flags: { missingBrochure: !seed.brochureUrl, redirectingUrl: false, unreachableUrl: true },
        acquisitionReadinessScore: 0,
        notes: err.message,
        _audit: { official: { valid: false, error: err.message }, brochure: null },
      });
    }
  }

  const output = entries.map(({ _audit, ...rest }) => rest);
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, buildReport(entries), "utf8");

  console.log(`\nWrote ${OUT_PATH}`);
  console.log(`Wrote ${REPORT_PATH}`);
  console.log(
    `Verified: ${output.filter((e) => e.status === SOURCE_REGISTRY_STATUS.VERIFIED).length}/${output.length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
