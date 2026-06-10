/**
 * Audit-only: benchmark input quality vs golden dossiers.
 * Does not modify extraction, prompts, or benchmark framework.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BENCHMARK_SAMPLE_HTML } from "../src/catalogAcquisition/benchmark/benchmarkFixtures.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GOLDEN_DIR = path.join(ROOT, "docs/catalog/golden-dataset/vehicles");
const REPORT_DIR = path.join(ROOT, "docs/catalog/benchmark-reports/llm");
const OUT_MD = path.join(ROOT, "docs/catalog/benchmark-input-quality-audit.md");

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[₹,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatInr(n) {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(",")},${last3}`;
}

function priceInSource(amount, text) {
  const variants = new Set([
    String(Math.round(amount)),
    formatInr(amount),
    formatInr(amount).replace(/,/g, ""),
  ]);
  const c = norm(text).replace(/\s/g, "");
  for (const v of variants) {
    if (v && c.includes(String(v).replace(/\s/g, ""))) return true;
  }
  return false;
}

function numInSource(num, text) {
  const n = Number(num);
  if (!Number.isFinite(n)) return false;
  const c = norm(text).replace(/\s/g, "");
  return c.includes(String(n)) || c.includes(String(Math.round(n)));
}

function rangeSupportsGolden(expected, text) {
  const e = Number(expected);
  if (!Number.isFinite(e)) return false;
  if (numInSource(e, text)) return true;
  const rangeSpan = text.match(/(\d+)\s*[–\-]\s*(\d+)\s*km/i);
  if (rangeSpan) {
    const lo = Number(rangeSpan[1]);
    const hi = Number(rangeSpan[2]);
    if (e >= lo && e <= hi) return true;
  }
  return [...text.matchAll(/(\d+)\s*km/gi)].some((m) => Number(m[1]) === e);
}

function kwValuesInSource(text) {
  return [...text.matchAll(/(\d+(?:\.\d+)?)\s*kW/gi)].map((m) => Number(m[1]));
}

function sourceEvidenceForField(fieldKey, expected, source) {
  const s = norm(source);
  if (expected === null || expected === undefined || expected === "") {
    return { present: false, detail: "golden_null" };
  }

  switch (fieldKey) {
    case "brand":
      return { present: s.includes(norm(expected)), detail: "brand text" };
    case "model": {
      const parts = norm(expected).split(" ").filter(Boolean);
      return { present: parts.every((p) => s.includes(p)), detail: "model tokens" };
    }
    case "bodyType":
      return { present: s.includes(norm(expected)), detail: "body type" };
    case "familySlug":
      return {
        present: s.includes(norm(expected).replace(/-/g, " ")),
        detail: "slug (derived)",
      };
    case "startingPrice":
    case "topVariantPrice":
    case "exShowroomPrice":
      return { present: priceInSource(expected, source), detail: "exact INR price" };
    case "batteryCapacityKwh":
      return {
        present: new RegExp(`\\b${expected}\\s*kwh`, "i").test(source) || numInSource(expected, source),
        detail: "battery kWh",
      };
    case "claimedRangeKm":
      return { present: rangeSupportsGolden(expected, source), detail: "range km" };
    case "rangeTestStandard":
      return { present: s.includes(norm(expected)), detail: "test standard" };
    case "acChargingKw":
    case "dcChargingKw": {
      const kws = kwValuesInSource(source);
      return {
        present: kws.includes(Number(expected)),
        detail: `kW in source: [${kws.join(", ")}]`,
        allKws: kws,
      };
    }
    case "airbags":
      return {
        present: new RegExp(`${expected}\\s*airbag`, "i").test(source),
        detail: "airbag count",
      };
    case "adas": {
      const has = s.includes("adas");
      if (expected === true) return { present: has, detail: "ADAS keyword" };
      if (expected === false) return { present: !has, detail: "ADAS absent" };
      return { present: has, detail: "ADAS" };
    }
    case "ncapRating":
      return { present: /5\s*star/i.test(source) && expected == 5, detail: "NCAP stars" };
    case "sunroof":
      return {
        present: /sunroof|panoramic/i.test(source) === Boolean(expected),
        detail: "sunroof keyword",
      };
    case "ventilatedSeats":
      return {
        present: /ventilated/i.test(source) === Boolean(expected),
        detail: "ventilated seats",
      };
    case "camera360":
      return {
        present: (/360|camera/i.test(source) && expected) || (!/360|camera/i.test(source) && !expected),
        detail: "360 camera",
      };
    case "connectedCar":
    case "v2l":
    case "v2v":
      return { present: false, detail: "not stated in benchmark HTML" };
    default:
      return {
        present: false,
        detail: "not in sparse benchmark HTML",
      };
  }
}

function sourceHasAnyEvidenceForField(fieldKey, source) {
  switch (fieldKey) {
    case "startingPrice":
    case "topVariantPrice":
    case "exShowroomPrice":
      return /₹[\d,]+/.test(source);
    case "batteryCapacityKwh":
      return /\d+\s*kwh/i.test(source);
    case "claimedRangeKm":
      return /\d+\s*km/i.test(source);
    case "acChargingKw":
    case "dcChargingKw":
      return kwValuesInSource(source).length > 0;
    case "airbags":
      return /airbag/i.test(source);
    case "adas":
      return /adas/i.test(source);
    case "ncapRating":
      return /star|ncap/i.test(source);
    default:
      return false;
  }
}

function classifyFailure(fieldKey, expected, actual, source) {
  const goldenInSource = sourceEvidenceForField(fieldKey, expected, source).present;
  const anyFieldEvidence = sourceHasAnyEvidenceForField(fieldKey, source);
  const actualMissing = actual === null || actual === undefined || actual === "";

  if (!goldenInSource && !anyFieldEvidence) return "A";
  if (!goldenInSource && anyFieldEvidence) return "D";

  if (actualMissing) return "B";

  if (fieldKey.includes("Price")) {
    if (priceInSource(actual, source) && Number(actual) !== Number(expected)) return "C";
  }
  if (fieldKey === "acChargingKw" || fieldKey === "dcChargingKw") {
    const kws = kwValuesInSource(source);
    if (kws.includes(Number(actual)) && Number(actual) !== Number(expected)) return "C";
  }
  if (fieldKey === "claimedRangeKm") {
    if (numInSource(actual, source) && Number(actual) !== Number(expected)) return "C";
  }
  if (norm(String(actual)) !== norm(String(expected))) return "C";
  return "B";
}

const vehicleIds = Object.keys(BENCHMARK_SAMPLE_HTML);
const vehicles = [];
const aggFailures = { A: 0, B: 0, C: 0, D: 0 };
let totalGoldenFields = 0;
let totalSourcePresent = 0;
let totalFailures = 0;

for (const id of vehicleIds) {
  const golden = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, `${id}.json`), "utf8"));
  const source = BENCHMARK_SAMPLE_HTML[id];
  const reportPath = path.join(REPORT_DIR, `openai-${id}.json`);
  const bench = fs.existsSync(reportPath)
    ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
    : null;

  const goldenFields = { ...golden.fields, ...golden.features };
  const entries = Object.entries(goldenFields).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  const sourcePresent = [];
  const sourceAbsent = [];

  for (const [k, v] of entries) {
    totalGoldenFields++;
    const ev = sourceEvidenceForField(k, v, source);
    if (ev.present) {
      sourcePresent.push({ field: k, expected: v });
      totalSourcePresent++;
    } else {
      sourceAbsent.push({ field: k, expected: v, reason: ev.detail });
    }
  }

  const failures = [];
  const comparisons = bench?.report?.evaluation?.field?.comparisons || [];

  for (const cmp of comparisons) {
    if (cmp.correct) continue;
    totalFailures++;
    const cat = classifyFailure(cmp.fieldKey, cmp.expected, cmp.actual, source);
    aggFailures[cat]++;
    failures.push({
      field: cmp.fieldKey,
      expected: cmp.expected,
      actual: cmp.actual,
      status: cmp.status,
      category: cat,
    });
  }

  vehicles.push({
    id,
    displayName: golden.displayName,
    goldenFieldCount: entries.length,
    sourcePresentCount: sourcePresent.length,
    coveragePct: Math.round((sourcePresent.length / entries.length) * 1000) / 10,
    missingEvidencePct:
      Math.round((sourceAbsent.length / entries.length) * 1000) / 10,
    sourcePresent,
    sourceAbsent,
    failures,
  });
}

const pctMissingSource =
  totalFailures ? Math.round((aggFailures.A / totalFailures) * 1000) / 10 : 0;
const pctExtractionQuality =
  totalFailures ? Math.round(((totalFailures - aggFailures.A) / totalFailures) * 1000) / 10 : 0;

let md = `# Benchmark Input Quality Audit

Generated: ${new Date().toISOString().slice(0, 10)}

Audit-only analysis. No extraction, prompt, or benchmark code was modified.

## Primary finding

**${pctMissingSource}%** of OpenAI benchmark failures are caused by **missing source evidence** (Category A).

**${pctExtractionQuality}%** are caused by **extraction quality, normalization, or golden/source mismatch** (Categories B, C, D).

---

## Aggregate summary

| Metric | Value |
|--------|-------|
| Golden fields analyzed | ${totalGoldenFields} |
| Source supports golden value | ${totalSourcePresent} (${Math.round((totalSourcePresent / totalGoldenFields) * 1000) / 10}%) |
| Source missing golden evidence | ${totalGoldenFields - totalSourcePresent} (${Math.round(((totalGoldenFields - totalSourcePresent) / totalGoldenFields) * 1000) / 10}%) |
| Total OpenAI extraction failures | ${totalFailures} |
| **A — Source lacked evidence** | ${aggFailures.A} (${pctMissingSource}%) |
| **B — Evidence in source, extraction failed** | ${aggFailures.B} |
| **C — Evidence in source, normalization failed** | ${aggFailures.C} |
| **D — Golden/source benchmark mismatch** | ${aggFailures.D} |

### Root cause verdict

Benchmark failures split roughly **${pctMissingSource}% missing source evidence** vs **${pctExtractionQuality}% extraction/normalization/mismatch**. Poor scores reflect **both** sparse synthetic HTML and grounded extraction returning null on fields that are present in source.

---

## Per-vehicle analysis

`;

for (const v of vehicles) {
  md += `### ${v.displayName} (\`${v.id}\`)

| Metric | Value |
|--------|-------|
| Golden fields expected | ${v.goldenFieldCount} |
| Source fields present (golden value found) | ${v.sourcePresentCount} |
| **Coverage %** | ${v.coveragePct}% |
| **Missing evidence %** | ${v.missingEvidencePct}% |

**Source present for:** ${v.sourcePresent.map((x) => x.field).join(", ") || "—"}

**Missing from source:** ${v.sourceAbsent.map((x) => `${x.field} (${x.reason})`).join("; ") || "—"}

#### Failed extraction fields (OpenAI grounded run)

| Field | Expected | Actual | Category |
|-------|----------|--------|----------|
`;
  for (const f of v.failures) {
    const catLabel = {
      A: "A — no source evidence",
      B: "B — extraction failed",
      C: "C — normalization failed",
      D: "D — golden/source mismatch",
    }[f.category];
    md += `| ${f.field} | ${JSON.stringify(f.expected)} | ${JSON.stringify(f.actual)} | ${catLabel} |\n`;
  }
  if (!v.failures.length) md += `| — | — | — | No failures |\n`;
  md += "\n";
}

md += `## Category definitions

- **A — Source did not contain evidence:** Benchmark HTML lacks the golden value and lacks field-type evidence.
- **B — Source contained evidence but extraction failed:** Golden value appears in source; model returned null/missing.
- **C — Source contained evidence but normalization failed:** Model returned a value present in source but not the golden target (e.g. wrong kW tier, wrong range endpoint).
- **D — Source contained evidence but benchmark mismatch:** Source has field-type data that contradicts golden dossier (verified production values vs synthetic abbreviated HTML).

## Methodology

- Golden dossiers: \`docs/catalog/golden-dataset/vehicles/*.json\`
- Benchmark inputs: \`BENCHMARK_SAMPLE_HTML\` (synthetic sparse HTML)
- Extraction failures: latest OpenAI grounded benchmark reports in \`docs/catalog/benchmark-reports/llm/\`
- Source presence: deterministic text/price/range/kW matching against golden field values
`;

fs.writeFileSync(OUT_MD, md);
console.log("Wrote", OUT_MD);
console.log(JSON.stringify({
  totalGoldenFields,
  overallSourceCoveragePct: Math.round((totalSourcePresent / totalGoldenFields) * 1000) / 10,
  totalFailures,
  failuresByCategory: aggFailures,
  pctFailuresDueToMissingSource: pctMissingSource,
  pctFailuresDueToExtractionQuality: pctExtractionQuality,
}, null, 2));
