/**
 * Trace Tata Curvv EV → VariantComparisonTable row payload (post golden-priority fix).
 * Run: node scripts/trace-curvv-variant-table.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { aggregateModelFamilies } from "../src/utils/modelFamily.js";
import { buildVariantComparisonRows } from "../src/utils/variantInsights.js";
import normalizeCar from "../src/utils/normalizeCar.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dossierPath = path.join(
  __dirname,
  "../public/catalog/golden-dataset/vehicles/tata-curvv-ev.json"
);

function slugifyVariantName(name = "") {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildGoldenChargingSummary({ acKw, dcKw, dcMinutes, acHours }) {
  const parts = [];
  if (dcKw) parts.push(`${dcKw} kW DC`);
  if (dcMinutes != null) parts.push(`${dcMinutes} min`);
  if (acKw) parts.push(`${acKw} kW AC`);
  if (acHours != null) parts.push(`${acHours} hrs`);
  return parts.length ? parts.join(" • ") : undefined;
}

function dossierToMarketplaceVariants(dossier) {
  const familySlug = dossier.familySlug || dossier.id;
  const fields = dossier.fields || {};
  const vehicle = dossier.vehicle || {};
  const brand = fields.brand || vehicle.brand || "";
  const model = fields.model || vehicle.model || dossier.displayName || "";

  return dossier.variants.map((row) => {
    const variantPart = slugifyVariantName(row.variantName);
    const slug = `${familySlug}-${variantPart}`;
    const batteryKwh = row.batteryKwh ?? fields.batteryCapacityKwh;
    const rangeKm = row.rangeKm ?? fields.claimedRangeKm;
    const price = row.priceInr ?? fields.startingPrice;
    const acKw = row.acChargingKw ?? fields.acChargingKw ?? null;
    const dcKw = row.dcChargingKw ?? fields.dcChargingKw ?? null;
    const dcMinutes =
      row.dcChargingTimeMinutes ?? fields.dcChargingTimeMinutes ?? null;
    const acHours = row.acChargingTimeHours ?? fields.acChargingTimeHours ?? null;
    const powerPs = Number(row.powerPs ?? fields.powerPs) || null;
    const powerKw = Number(row.powerKw ?? fields.powerKw) || null;
    const chargingSummary = buildGoldenChargingSummary({
      acKw,
      dcKw,
      dcMinutes,
      acHours,
    });

    return normalizeCar({
      slug,
      familySlug,
      name: `${brand} ${model} ${row.variantName}`.trim(),
      brand,
      price,
      range: rangeKm,
      battery: `${batteryKwh} kWh`,
      chargingTime: chargingSummary,
      catalogSource: "golden-dataset",
      catalogMeta: {
        slug,
        familySlug,
        claimedRangeKm: rangeKm,
        dcChargingTimeMinutes: dcMinutes,
        chargingSummary,
        chargingIntelligence: { acKw, dcKw, dcTime10to80Minutes: dcMinutes },
        chargingPracticality: { dcTime10to80Minutes: dcMinutes },
        performance: { powerPs, powerKw, powerBhp: powerPs },
      },
      specifications: {
        range: rangeKm,
        batteryPack: `${batteryKwh} kWh`,
        acChargingKw: acKw,
        dcChargingKw: dcKw,
        chargingTime: chargingSummary,
        powerKw,
        powerBhp: powerPs,
      },
    });
  });
}

const dossier = JSON.parse(fs.readFileSync(dossierPath, "utf8"));
const variants = dossierToMarketplaceVariants(dossier);
const families = aggregateModelFamilies(variants);
const family = families.find((f) => f.familySlug === "tata-curvv-ev");
const rows = buildVariantComparisonRows(family?.variants || []);

console.log(
  JSON.stringify(
    {
      source: dossierPath,
      resolverPriority: "golden-dataset (bundled) over API for manifest families",
      variantCount: rows.length,
      rows: rows.map((r) => ({
        name: r.name,
        battery: r.battery,
        range: r.rangeLabel,
        charging: r.chargingLines,
        power: r.power,
      })),
    },
    null,
    2
  )
);
