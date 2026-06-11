/**
 * Fleet audit: variant comparison table columns vs golden dossier data.
 * Run: node scripts/audit-variant-table-golden-fleet.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildRangeConfidence, formatRangeBand } from "../src/intelligence/rangeConfidence.js";
import {
  extractVariantMetricValues,
  formatVariantAcChargingDisplay,
  formatVariantDcChargingDisplay,
  formatVariantPowerDisplay,
} from "../src/utils/familyAggregateMetrics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const vehiclesDir = path.join(
  root,
  "public/catalog/golden-dataset/vehicles"
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

function dossierToVariants(dossier) {
  const familySlug = dossier.familySlug || dossier.id;
  const fields = dossier.fields || {};
  const vehicle = dossier.vehicle || {};
  const brand = fields.brand || vehicle.brand || "";
  const model = fields.model || vehicle.model || dossier.displayName || "";
  const media = dossier.media || {};
  const rows =
    Array.isArray(dossier.variants) && dossier.variants.length
      ? dossier.variants
      : [{ variantName: model, priceInr: fields.startingPrice, rangeKm: fields.claimedRangeKm, batteryKwh: fields.batteryCapacityKwh }];

  return rows.map((row, index) => {
    const variantPart = slugifyVariantName(row.variantName);
    const slug =
      rows.length === 1 || !variantPart
        ? familySlug
        : `${familySlug}-${variantPart}`;
    const batteryKwh = row.batteryKwh ?? fields.batteryCapacityKwh;
    const rangeKm = row.rangeKm ?? fields.claimedRangeKm;
    const price = row.priceInr ?? fields.startingPrice ?? fields.exShowroomPrice;
    const acKw = row.acChargingKw ?? fields.acChargingKw ?? null;
    const dcKw = row.dcChargingKw ?? fields.dcChargingKw ?? null;
    const dcMinutes =
      row.dcChargingTimeMinutes ??
      row.dcFastChargingMinutes ??
      fields.dcChargingTimeMinutes ??
      null;
    const acHours = row.acChargingTimeHours ?? fields.acChargingTimeHours ?? null;
    const powerPsRaw = row.powerPs ?? fields.powerPs ?? null;
    const powerPs =
      powerPsRaw != null && Number.isFinite(Number(powerPsRaw))
        ? Number(powerPsRaw)
        : null;
    const powerKwRaw = row.powerKw ?? fields.powerKw ?? null;
    const powerKw =
      powerKwRaw != null && Number.isFinite(Number(powerKwRaw))
        ? Number(powerKwRaw)
        : null;
    const chargingSummary = buildGoldenChargingSummary({
      acKw,
      dcKw,
      dcMinutes,
      acHours,
    });

    return {
      slug,
      familySlug,
      name: `${brand} ${model} ${row.variantName || ""}`.trim(),
      variantLabel: row.variantName,
      price,
      range: rangeKm,
      battery: batteryKwh ? `${batteryKwh} kWh` : "EV Battery",
      chargingTime: chargingSummary,
      catalogMeta: {
        slug,
        familySlug,
        claimedRangeKm: rangeKm,
        dcChargingTimeMinutes: dcMinutes,
        chargingSummary,
        chargingIntelligence: {
          acKw,
          dcKw,
          dcTime10to80Minutes: dcMinutes,
          acTime0to100Hours: acHours,
        },
        chargingPracticality: {
          dcTime10to80Minutes: dcMinutes,
          acFullChargeHours: acHours,
        },
        performance: {
          powerPs,
          powerKw,
          powerBhp: powerPs != null ? Math.round(powerPs) : null,
        },
      },
      specifications: {
        range: rangeKm,
        batteryPack: batteryKwh ? `${batteryKwh} kWh` : undefined,
        acChargingKw: acKw,
        dcChargingKw: dcKw,
        chargingTime: chargingSummary,
        powerKw,
        powerBhp: powerPs != null ? Math.round(powerPs) : null,
      },
    };
  });
}

function formatVariantRealWorldRangeDisplay(variant) {
  const direct =
    variant?.realWorldRangeKm ||
    variant?.catalogMeta?.realWorldRangeKm ||
    variant?.range?.realWorldKm ||
    null;

  const min = Number(direct?.min);
  const max = Number(direct?.max);
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return formatRangeBand({ min, max });
  }

  const rangeIntel = buildRangeConfidence(variant);
  const estimated = rangeIntel?.estimatedRealWorldKm;
  if (
    estimated &&
    Number.isFinite(Number(estimated.min)) &&
    Number.isFinite(Number(estimated.max)) &&
    estimated.min > 0 &&
    estimated.max > 0
  ) {
    return formatRangeBand({
      min: Number(estimated.min),
      max: Number(estimated.max),
    });
  }

  return null;
}

function formatVariantCombinedChargingLines(dcCharging, acCharging) {
  const lines = [];
  if (dcCharging && dcCharging !== "—") lines.push(`DC: ${dcCharging}`);
  if (acCharging && acCharging !== "—") lines.push(`AC: ${acCharging}`);
  return lines.length ? lines : null;
}

function buildComparisonRows(variants) {
  return variants.map((v) => {
    const metrics = extractVariantMetricValues(v);
    const realWorldRangeLabel =
      formatVariantRealWorldRangeDisplay(v) || "—";
    const chargingLines = formatVariantCombinedChargingLines(
      formatVariantDcChargingDisplay(metrics),
      formatVariantAcChargingDisplay(metrics)
    );
    const power = formatVariantPowerDisplay(metrics) || "—";
    const range = Number(v?.range ?? v?.specifications?.range ?? 0) || 0;

    return {
      priceLabel: Number(v?.price ?? 0) || null,
      battery: v.battery || v.specifications?.batteryPack,
      rangeLabel: range > 0 ? `${range} km` : "—",
      realWorldRangeLabel,
      chargingLines,
      power,
    };
  });
}

function summarizeVehicle(displayName, variants) {
  const rows = buildComparisonRows(variants);
  const hasCore = rows.some(
    (r) => r.priceLabel && r.battery && r.rangeLabel && r.rangeLabel !== "—"
  );
  if (!hasCore) return null;

  const rwMissing = rows.every(
    (r) => !r.realWorldRangeLabel || r.realWorldRangeLabel === "—"
  );
  const chMissing = rows.every(
    (r) => !r.chargingLines || r.chargingLines.length === 0
  );
  const pwMissing = rows.every((r) => !r.power || r.power === "—");

  if (!rwMissing && !chMissing && !pwMissing) return null;

  return {
    vehicle: displayName,
    realWorldRange: rwMissing ? "missing" : "ok",
    charging: chMissing ? "missing" : "ok",
    power: pwMissing ? "missing" : "ok",
  };
}

const files = fs
  .readdirSync(vehiclesDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const affected = [];

for (const file of files) {
  const dossier = JSON.parse(
    fs.readFileSync(path.join(vehiclesDir, file), "utf8")
  );
  const variants = dossierToVariants(dossier);
  const summary = summarizeVehicle(dossier.displayName || dossier.id, variants);
  if (summary) affected.push(summary);
}

console.log("| Vehicle | Real World Range | Charging | Power |");
console.log("| ------- | ---------------- | -------- | ----- |");
for (const row of affected) {
  console.log(
    `| ${row.vehicle} | ${row.realWorldRange} | ${row.charging} | ${row.power} |`
  );
}
console.log(`\nTotal golden vehicles: ${files.length}`);
console.log(`Affected (core specs ok, column gaps): ${affected.length}`);
