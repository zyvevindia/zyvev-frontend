/**
 * Source acquisition gap audit — measurement only.
 * Captures raw HTML, PDF discovery, JS-render signals, evidence records.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "./lib/bootstrapEnv.mjs";

import { fetchUrlContent } from "../src/catalogAcquisition/acquisition/fetchUrl.js";
import { acquireAllSources } from "../src/catalogAcquisition/acquisition/index.js";
import { runEvidencePipelineV3 } from "../src/catalogAcquisition/evidencePipelineV3.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs/catalog/production-validation/source-acquisition-gap");
const OUT_MD = path.join(OUT_DIR, "source-acquisition-gap-report.md");
const OUT_JSON = path.join(OUT_DIR, "gap-audit-results.json");

const VEHICLES = [
  {
    id: "tata-curvv-ev",
    name: "Tata Curvv EV",
    oemUrl: "https://www.tatamotors.com/curvv/ev",
    referenceUrls: ["https://www.cardekho.com/tata/curvv-ev"],
  },
  {
    id: "tata-nexon-ev",
    name: "Tata Nexon EV",
    oemUrl: "https://www.tatamotors.com/nexon/ev",
    referenceUrls: ["https://www.cardekho.com/tata/nexon-ev"],
  },
  {
    id: "mg-windsor-ev",
    name: "MG Windsor EV",
    oemUrl: "https://www.mgmotor.co.in/vehicles/windsor-ev",
    referenceUrls: ["https://www.cardekho.com/mg/windsor-ev"],
  },
  {
    id: "mahindra-be-6",
    name: "Mahindra BE 6",
    oemUrl: "https://www.mahindra.com/be6",
    referenceUrls: ["https://www.cardekho.com/mahindra/be-6"],
  },
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function analyzeJsRendering(html) {
  const signals = [];
  const lower = html.toLowerCase();

  if (/<div[^>]+id=["']root["']/i.test(html)) signals.push("react-root (#root)");
  if (/__next_data__/i.test(html)) signals.push("__NEXT_DATA__ (Next.js SSR/hydration)");
  if (/ng-app|angular\.module/i.test(html)) signals.push("Angular bootstrap");
  if (/window\.__initial_state__|window\.__nuxt__/i.test(html)) signals.push("window global state blob");
  if (/enable javascript|javascript is disabled|requires javascript/i.test(html)) {
    signals.push("noscript / JS-required message in HTML");
  }
  if (/<body[^>]*>\s*(<script|<noscript)/i.test(html.slice(0, 3000))) {
    signals.push("body starts with script/noscript (possible shell)");
  }
  if ((html.match(/<script/gi) || []).length > 15) {
    signals.push(`heavy script tags (${(html.match(/<script/gi) || []).length})`);
  }
  if (/<meta[^>]+property=["']og:title["']/i.test(html)) {
    const m = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);
    if (m) signals.push(`og:title present: "${m[1].slice(0, 80)}"`);
  }

  const visibleText = stripHtml(html);
  const textLen = visibleText.length;
  const htmlLen = html.length;
  const textRatio = htmlLen ? textLen / htmlLen : 0;

  const vehicleKeywords = /ev|electric|battery|range|₹|kwh|km|variant|price|brochure/i;
  const hasVehicleContent = vehicleKeywords.test(visibleText);

  return {
    htmlByteLength: htmlLen,
    visibleTextLength: textLen,
    textToHtmlRatio: Math.round(textRatio * 1000) / 1000,
    scriptTagCount: (html.match(/<script/gi) || []).length,
    likelyJsRendered: signals.length >= 2 || (textLen < 500 && htmlLen > 5000) || !hasVehicleContent,
    hasVehicleKeywords: hasVehicleContent,
    signals,
    visibleTextPreview: visibleText.slice(0, 800),
  };
}

function discoverAllPdfLinks(html, baseUrl) {
  const allPdfHrefs = [];
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (/\.pdf/i.test(href) || /brochure|download.*pdf|pdf.*download/i.test(href)) {
      try {
        allPdfHrefs.push(new URL(href, baseUrl).href);
      } catch {
        allPdfHrefs.push(href);
      }
    }
  }

  const brochureFilter = /brochure|spec|download|e-brochure|ebrochure|factsheet|technical/i;
  const filtered = allPdfHrefs.filter((u) => brochureFilter.test(u));
  const rejected = allPdfHrefs.filter((u) => !brochureFilter.test(u));

  return {
    allPdfHrefs: [...new Set(allPdfHrefs)],
    filteredBrochureUrls: [...new Set(filtered)],
    rejectedByKeywordFilter: [...new Set(rejected)],
    filterRule: "href must match /brochure|spec|download|e-brochure|ebrochure|factsheet|technical/i in resolved URL",
  };
}

function findBrochurePatternsWithoutPdf(html) {
  const patterns = [];
  const checks = [
    { name: "data-brochure", re: /data-brochure[^>]*/gi },
    { name: "brochure in onclick", re: /onclick[^>]*brochure[^>]*/gi },
    { name: "brochure API path", re: /["']([^"']*brochure[^"']*)["']/gi },
    { name: "download brochure text", re: /download[^<]{0,40}brochure/gi },
    { name: ".pdf in JS string", re: /["']([^"']*\.pdf[^"']*)["']/gi },
  ];
  for (const c of checks) {
    const matches = [...html.matchAll(c.re)].slice(0, 5).map((x) => x[0] || x[1]).filter(Boolean);
    if (matches.length) patterns.push({ pattern: c.name, samples: matches });
  }
  return patterns;
}

async function auditVehicle(vehicle) {
  const htmlDir = path.join(OUT_DIR, "html", vehicle.id);
  fs.mkdirSync(htmlDir, { recursive: true });

  const urlFetches = [];
  const oemFetch = await fetchUrlContent(vehicle.oemUrl);
  urlFetches.push({ role: "oem", url: vehicle.oemUrl, ...oemFetch });

  if (oemFetch.ok) {
    fs.writeFileSync(path.join(htmlDir, "oem.html"), oemFetch.content);
    fs.writeFileSync(
      path.join(htmlDir, "oem-visible-text.txt"),
      stripHtml(oemFetch.content)
    );
  }

  for (const refUrl of vehicle.referenceUrls) {
    const refFetch = await fetchUrlContent(refUrl);
    urlFetches.push({ role: "reference", url: refUrl, ...refFetch });
    if (refFetch.ok) {
      const slug = new URL(refUrl).hostname.replace(/\./g, "-");
      fs.writeFileSync(path.join(htmlDir, `ref-${slug}.html`), refFetch.content);
      fs.writeFileSync(
        path.join(htmlDir, `ref-${slug}-visible-text.txt`),
        stripHtml(refFetch.content)
      );
    }
  }

  const oemHtml = oemFetch.ok ? oemFetch.content : "";
  const jsAnalysis = oemFetch.ok ? analyzeJsRendering(oemHtml) : null;
  const refAnalyses = urlFetches
    .filter((f) => f.role === "reference" && f.ok)
    .map((f) => ({
      url: f.url,
      ...analyzeJsRendering(f.content),
    }));

  const pdfDiscovery = oemFetch.ok
    ? discoverAllPdfLinks(oemHtml, vehicle.oemUrl)
    : { allPdfHrefs: [], filteredBrochureUrls: [], rejectedByKeywordFilter: [], filterRule: "N/A — OEM fetch failed" };

  const brochurePatterns = oemFetch.ok ? findBrochurePatternsWithoutPdf(oemHtml) : [];

  const acquisition = await acquireAllSources({
    oemUrl: vehicle.oemUrl,
    referenceUrls: vehicle.referenceUrls,
    pdfBuffer: null,
    pdfName: null,
  });

  const pipeline = await runEvidencePipelineV3({
    importId: `gap-audit-${vehicle.id}`,
    oemUrl: vehicle.oemUrl,
    referenceUrls: vehicle.referenceUrls,
    pdfBuffer: null,
  });

  const evidenceRecords = (pipeline.evidenceRecords || []).map((r) => ({
    fieldName: r.fieldName,
    fieldValue: r.fieldValue,
    sourceType: r.sourceType,
    sourceName: r.sourceName,
    sourceUrl: r.sourceUrl,
    trustScore: r.trustScore,
    extractionConfidence: r.extractionConfidence,
    extractionMethod: r.extractionMethod,
    sourceSnippet: r.sourceSnippet ? r.sourceSnippet.slice(0, 120) : null,
  }));

  const sourcesAcquired = (acquisition.sources || []).map((s) => ({
    type: s.type,
    url: s.url,
    name: s.name,
    contentByteLength: s.content?.length ?? 0,
    visibleTextLength: s.content ? stripHtml(s.content).length : 0,
    contentPreview: s.content ? s.content.slice(0, 1500) : null,
    metadata: s.metadata,
  }));

  const acquisitionDiagnostics = acquisition.diagnostics?.map((d) => ({
    step: d.step,
    url: d.url,
    ok: d.ok,
    errors: d.errors,
    metadata: d.metadata,
  }));

  return {
    id: vehicle.id,
    name: vehicle.name,
    oemUrl: vehicle.oemUrl,
    referenceUrls: vehicle.referenceUrls,
    urlFetches: urlFetches.map(({ content, ...rest }) => ({
      ...rest,
      byteLength: content?.length ?? rest.byteLength ?? 0,
      contentType: rest.contentType,
      htmlSavedTo: rest.ok
        ? path.relative(ROOT, path.join(htmlDir, rest.role === "oem" ? "oem.html" : `ref-${new URL(rest.url).hostname.replace(/\./g, "-")}.html`))
        : null,
    })),
    jsAnalysis: {
      oem: jsAnalysis,
      references: refAnalyses,
    },
    pdfDiscovery: {
      ...pdfDiscovery,
      localPdfChecked: [
        path.join(ROOT, "docs/catalog/validation-sources", `${vehicle.id}.pdf`),
        path.join(ROOT, "data-acquisition/incoming", `${vehicle.id}.pdf`),
      ],
      localPdfFound: false,
      brochurePatternsInHtml: brochurePatterns,
      whyNotFound:
        !oemFetch.ok
          ? [`OEM fetch failed: ${(oemFetch.errors || []).join("; ")}`]
          : pdfDiscovery.filteredBrochureUrls.length === 0
            ? [
                pdfDiscovery.allPdfHrefs.length === 0
                  ? "No .pdf hrefs in raw HTML at all"
                  : `${pdfDiscovery.allPdfHrefs.length} .pdf href(s) found but none matched brochure keyword filter`,
                brochurePatterns.length > 0
                  ? "Brochure references exist in JS/onclick/data attributes (not plain href=.pdf)"
                  : "No brochure-related strings detected in HTML",
                jsAnalysis?.likelyJsRendered
                  ? "OEM page likely JS-rendered — fetch() returns shell HTML without spec content or PDF links"
                  : null,
              ].filter(Boolean)
            : ["PDF URLs found but fetch not attempted in this audit"],
    },
    acquisition: {
      ok: acquisition.ok,
      sourceCount: acquisition.sources?.length ?? 0,
      errors: acquisition.errors,
      diagnostics: acquisitionDiagnostics,
      sourcesAcquired,
    },
    pipeline: {
      ok: pipeline.ok,
      evidenceRecordCount: evidenceRecords.length,
      variantCount: pipeline.diagnostics?.variantCount ?? 0,
      extractionDiagnostics: pipeline.diagnostics?.extractionDiagnostics,
    },
    evidenceRecords,
    variants: (pipeline.mergedVariants || []).map((v) => ({
      variantName: v.variantName,
      price: v.price?.value,
      battery: v.battery?.value,
      range: v.range?.value,
    })),
  };
}

function buildMarkdown(results) {
  let md = `# Source Acquisition Gap Report

Generated: ${new Date().toISOString().slice(0, 10)}

Measurement only — no fixes applied.

Raw HTML saved under \`docs/catalog/production-validation/source-acquisition-gap/html/\`.

---

`;

  for (const r of results) {
    md += `## ${r.name} (\`${r.id}\`)\n\n`;

    md += `### 1. HTML acquired today\n\n`;
    for (const f of r.urlFetches) {
      md += `**${f.role.toUpperCase()}:** ${f.url}\n\n`;
      md += `| Property | Value |\n|----------|-------|\n`;
      md += `| HTTP OK | ${f.ok} |\n`;
      md += `| Status/errors | ${f.ok ? "200" : (f.errors || []).join("; ")} |\n`;
      md += `| Content-Type | ${f.contentType || "—"} |\n`;
      md += `| Raw HTML bytes | ${f.byteLength} |\n`;
      md += `| Saved to | \`${f.htmlSavedTo || "—"}\` |\n\n`;
    }

    const oemJs = r.jsAnalysis.oem;
    if (oemJs) {
      md += `**OEM visible text preview (first 400 chars after tag strip):**\n\n\`\`\`\n${oemJs.visibleTextPreview.slice(0, 400)}\n\`\`\`\n\n`;
    }

    md += `### 2. Evidence records generated\n\n`;
    if (!r.evidenceRecords.length) {
      md += `_No evidence records._\n\n`;
    } else {
      md += `| Field | Value | Source | Confidence | Snippet |\n|-------|-------|--------|------------|--------|\n`;
      for (const e of r.evidenceRecords) {
        md += `| ${e.fieldName} | ${String(e.fieldValue).slice(0, 40)} | ${e.sourceName || e.sourceType} | ${e.extractionConfidence ?? "—"} | ${(e.sourceSnippet || "—").slice(0, 60)} |\n`;
      }
      md += `\n**Total:** ${r.evidenceRecords.length} records · ${r.variants.length} variants\n\n`;
    }

    md += `### 3. PDF discovery attempts\n\n`;
    md += `| Step | Result |\n|------|--------|\n`;
    md += `| Local PDF paths checked | ${r.pdfDiscovery.localPdfChecked.map((p) => `\`${path.relative(ROOT, p)}\``).join(", ")} |\n`;
    md += `| Local PDF found | ${r.pdfDiscovery.localPdfFound ? "Yes" : "No"} |\n`;
    md += `| .pdf hrefs in OEM HTML | ${r.pdfDiscovery.allPdfHrefs.length} |\n`;
    md += `| Passed brochure keyword filter | ${r.pdfDiscovery.filteredBrochureUrls.length} |\n`;
    md += `| Filter rule | ${r.pdfDiscovery.filterRule} |\n\n`;

    if (r.pdfDiscovery.allPdfHrefs.length) {
      md += `All .pdf hrefs:\n`;
      for (const u of r.pdfDiscovery.allPdfHrefs.slice(0, 10)) md += `- ${u}\n`;
      md += `\n`;
    }
    if (r.pdfDiscovery.rejectedByKeywordFilter?.length) {
      md += `Rejected (keyword filter):\n`;
      for (const u of r.pdfDiscovery.rejectedByKeywordFilter.slice(0, 5)) md += `- ${u}\n`;
      md += `\n`;
    }

    md += `### 4. Why brochure URLs are not found\n\n`;
    for (const reason of r.pdfDiscovery.whyNotFound) md += `- ${reason}\n`;
    if (r.pdfDiscovery.brochurePatternsInHtml?.length) {
      md += `\nBrochure-related patterns in HTML (non-href):\n`;
      for (const p of r.pdfDiscovery.brochurePatternsInHtml) {
        md += `- **${p.pattern}:** ${p.samples.map((s) => `\`${String(s).slice(0, 80)}\``).join(", ")}\n`;
      }
    }
    md += `\n`;

    md += `### 5. JS rendering & fetch() content gap\n\n`;
    if (oemJs) {
      md += `| Signal | Value |\n|--------|-------|\n`;
      md += `| Likely JS-rendered | **${oemJs.likelyJsRendered ? "YES" : "NO"}** |\n`;
      md += `| Vehicle keywords in visible text | ${oemJs.hasVehicleKeywords ? "Yes" : "No"} |\n`;
      md += `| HTML bytes / visible text bytes | ${oemJs.htmlByteLength} / ${oemJs.visibleTextLength} |\n`;
      md += `| Text-to-HTML ratio | ${oemJs.textToHtmlRatio} |\n`;
      md += `| Script tags | ${oemJs.scriptTagCount} |\n`;
      md += `| Signals | ${oemJs.signals.join("; ") || "none"} |\n\n`;
    }

    for (const ref of r.jsAnalysis.references || []) {
      md += `Reference (${ref.url}): visible text ${ref.visibleTextLength} bytes, likely JS-rendered: ${ref.likelyJsRendered}, vehicle keywords: ${ref.hasVehicleKeywords}\n\n`;
    }

    md += `### Acquisition pipeline sources\n\n`;
    for (const s of r.acquisition.sourcesAcquired) {
      md += `- **${s.type}** ${s.url}: ${s.contentByteLength} HTML bytes, ${s.visibleTextLength} visible text bytes\n`;
    }
    md += `\n---\n\n`;
  }

  return md;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("\n=== Source Acquisition Gap Audit ===\n");

  const results = [];
  for (const v of VEHICLES) {
    console.log(`--- ${v.name} ---`);
    const r = await auditVehicle(v);
    results.push(r);
    console.log(
      `  OEM: ${r.urlFetches.find((f) => f.role === "oem")?.byteLength ?? 0} bytes · evidence: ${r.evidenceRecords.length} · PDF hrefs: ${r.pdfDiscovery.allPdfHrefs.length}`
    );
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  fs.writeFileSync(OUT_MD, buildMarkdown(results));
  console.log(`\nWrote ${OUT_MD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
