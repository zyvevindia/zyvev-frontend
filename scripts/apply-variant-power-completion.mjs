/**
 * Enrich golden dossiers with OEM powerPs / powerKw (and torqueNm where known).
 * Run: node scripts/apply-variant-power-completion.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vehiclesDir = path.join(
  __dirname,
  "..",
  "public/catalog/golden-dataset/vehicles"
);

/** @type {Record<string, { fields?: object, variant?: (row: object) => object | null, source: string }>} */
const ENRICHMENT = {
  "bmw-ix1": {
    fields: { powerPs: 313, powerKw: 230, torqueNm: 494 },
    source: "BMW Group iX1 xDrive30 technical specifications (313 PS / 230 kW)",
  },
  "byd-atto-3": {
    fields: { powerPs: 204, powerKw: 150, torqueNm: 310 },
    source: "BYD India Atto 3 OEM brochure (150 kW / 204 PS)",
  },
  "hyundai-creta-electric": {
    fields: { powerPs: 171, powerKw: 126, torqueNm: 200 },
    variant: (row) =>
      Number(row.batteryKwh) >= 51
        ? { powerPs: 171, powerKw: 126, torqueNm: 200 }
        : { powerPs: 135, powerKw: 99, torqueNm: 200 },
    source: "Hyundai India CRETA Electric brochure (99 kW / 126 kW motors)",
  },
  "hyundai-ioniq-5": {
    fields: { powerPs: 229, powerKw: 168, torqueNm: 350 },
    variant: (row) =>
      /awd/i.test(String(row.variantName))
        ? { powerPs: 325, powerKw: 239, torqueNm: 605 }
        : { powerPs: 217, powerKw: 160, torqueNm: 350 },
    source:
      "Hyundai India Ioniq 5 specs (RWD 217 PS; AWD dual-motor 325 PS global/India catalog)",
  },
  "hyundai-kona-electric": {
    fields: { powerPs: 136, powerKw: 100, torqueNm: 395 },
    source: "Hyundai India Kona Electric brochure (100 kW / 136 PS)",
  },
  "mahindra-be-6": {
    fields: { powerPs: 286, powerKw: 210, torqueNm: 380 },
    variant: (row) =>
      Number(row.batteryKwh) >= 79
        ? { powerPs: 286, powerKw: 210, torqueNm: 380 }
        : { powerPs: 231, powerKw: 170, torqueNm: 380 },
    source: "Mahindra India BE 6 launch specs (170 kW / 210 kW rear motor)",
  },
  "mahindra-xev-9e": {
    fields: { powerPs: 286, powerKw: 210, torqueNm: 380 },
    variant: (row) =>
      Number(row.batteryKwh) >= 79
        ? { powerPs: 286, powerKw: 210, torqueNm: 380 }
        : { powerPs: 231, powerKw: 170, torqueNm: 380 },
    source: "Mahindra India XEV 9e specs (228–282 bhp by battery pack)",
  },
  "mahindra-xuv400": {
    fields: { powerPs: 150, powerKw: 110, torqueNm: 310 },
    source: "Mahindra XUV400 Pro press release (110 kW / 150 PS)",
  },
  "maruti-e-vitara": {
    fields: { powerPs: 174, powerKw: 128, torqueNm: 193 },
    variant: (row) =>
      Number(row.batteryKwh) >= 61
        ? { powerPs: 174, powerKw: 128, torqueNm: 193 }
        : { powerPs: 144, powerKw: 106, torqueNm: 193 },
    source: "Maruti Suzuki Nexa e Vitara launch specs (105.8 kW / 128 kW)",
  },
  "mercedes-eqa": {
    fields: { powerPs: 190, powerKw: 140, torqueNm: 385 },
    source: "Mercedes-Benz India EQA 250+ specifications (140 kW / 190 PS)",
  },
  "mercedes-eqb": {
    fields: { powerPs: 190, powerKw: 140, torqueNm: 385 },
    variant: (row) =>
      /350|4matic/i.test(String(row.variantName))
        ? { powerPs: 292, powerKw: 215, torqueNm: 520 }
        : { powerPs: 190, powerKw: 140, torqueNm: 385 },
    source:
      "Mercedes-Benz India EQB specs (250+ 190 PS; 350 4MATIC 292 PS / 215 kW)",
  },
  "mg-comet-ev": {
    fields: { powerPs: 42, powerKw: 31, torqueNm: 110 },
    source: "MG India Comet EV brochure (42 PS / 31 kW)",
  },
  "mg-windsor-ev": {
    fields: { powerPs: 136, powerKw: 100, torqueNm: 200 },
    source: "MG India Windsor EV specs (100 kW / 136 PS)",
  },
  "mg-zs-ev": {
    fields: { powerPs: 177, powerKw: 130, torqueNm: 280 },
    source: "MG India ZS EV technical specifications (176.75 PS / 130 kW)",
  },
  "tata-curvv-ev": {
    fields: { powerPs: 167, powerKw: 123, torqueNm: 215 },
    variant: (row) =>
      Number(row.batteryKwh) >= 55
        ? { powerPs: 167, powerKw: 123, torqueNm: 215 }
        : { powerPs: 150, powerKw: 110, torqueNm: 215 },
    source: "Tata Motors Curvv.ev OEM specs (110 kW / 123 kW)",
  },
  "tata-harrier-ev": {
    fields: { powerPs: 238, powerKw: 175, torqueNm: 315 },
    variant: (row) =>
      /qwd/i.test(String(row.variantName))
        ? { powerPs: 396, powerKw: 291, torqueNm: 504 }
        : { powerPs: 238, powerKw: 175, torqueNm: 315 },
    source:
      "Tata Motors Harrier.ev product note (RWD 238 PS; QWD 158+238 PS cumulative)",
  },
  "tata-tiago-ev": {
    fields: { powerPs: 75, powerKw: 55, torqueNm: 114 },
    variant: (row) =>
      Number(row.batteryKwh) <= 19.5
        ? { powerPs: 61, powerKw: 45, torqueNm: 110 }
        : { powerPs: 75, powerKw: 55, torqueNm: 114 },
    source: "Tata Motors Tiago.ev OEM + EVSavari verified dossier",
  },
};

const results = [];

for (const [slug, spec] of Object.entries(ENRICHMENT)) {
  const filePath = path.join(vehiclesDir, `${slug}.json`);
  const dossier = JSON.parse(fs.readFileSync(filePath, "utf8"));
  dossier.fields = { ...dossier.fields, ...spec.fields };

  if (Array.isArray(dossier.variants)) {
    dossier.variants = dossier.variants.map((row) => {
      const patch = spec.variant ? spec.variant(row) : spec.fields;
      if (!patch) return row;
      return { ...row, ...patch };
    });
  }

  const powerMeta = {
    enrichedAt: new Date().toISOString().slice(0, 10),
    source: spec.source,
    sprint: "variant-power-completion",
  };
  dossier.populationMeta = {
    ...(dossier.populationMeta || {}),
    powerEnrichment: powerMeta,
  };

  fs.writeFileSync(filePath, `${JSON.stringify(dossier, null, 2)}\n`, "utf8");

  results.push({
    slug,
    displayName: dossier.displayName,
    fields: spec.fields,
    variantCount: dossier.variants?.length ?? 0,
    source: spec.source,
  });
}

console.log(JSON.stringify(results, null, 2));
console.log(`\nEnriched ${results.length} vehicle dossiers.`);
