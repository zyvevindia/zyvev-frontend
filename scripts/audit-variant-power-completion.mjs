/**
 * Fleet audit: Variant Details table column coverage after power enrichment.
 * Run: node scripts/audit-variant-power-completion.mjs
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
const outJson = path.join(root, "docs/media/variant-power-completion.json");

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
  const rows =
    Array.isArray(dossier.variants) && dossier.variants.length
      ? dossier.variants
      : [
          {
            variantName: model,
            priceInr: fields.startingPrice,
            rangeKm: fields.claimedRangeKm,
            batteryKwh: fields.batteryCapacityKwh,
          },
        ];

  return rows.map((row) => {
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
    const realWorldRangeLabel = formatVariantRealWorldRangeDisplay(v) || "—";
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

function auditDossier(dossier) {
  const variants = dossierToMarketplaceVariants(dossier);
  const rows = buildComparisonRows(variants);
  const gaps = {
    realWorldRange: 0,
    charging: 0,
    power: 0,
    price: 0,
    battery: 0,
    range: 0,
  };

  for (const row of rows) {
    if (!row.priceLabel) gaps.price++;
    if (!row.battery || row.battery === "—") gaps.battery++;
    if (!row.rangeLabel || row.rangeLabel === "—") gaps.range++;
    if (!row.realWorldRangeLabel || row.realWorldRangeLabel === "—")
      gaps.realWorldRange++;
    if (!row.chargingLines || row.chargingLines.length === 0) gaps.charging++;
    if (!row.power || row.power === "—") gaps.power++;
  }

  const total = rows.length;
  const complete = total > 0 && Object.values(gaps).every((n) => n === 0);

  return {
    slug: dossier.id || dossier.familySlug,
    displayName: dossier.displayName,
    variantRows: total,
    fieldsPowerPs: dossier.fields?.powerPs ?? null,
    fieldsPowerKw: dossier.fields?.powerKw ?? null,
    gaps,
    complete,
    samplePower: rows.map((r) => r.power),
    sampleCharging: rows.map((r) => r.chargingLines?.join(" | ") ?? "—"),
    sampleRealWorld: rows.map((r) => r.realWorldRangeLabel),
  };
}

const files = fs
  .readdirSync(vehiclesDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const vehicles = files.map((file) => {
  const dossier = JSON.parse(
    fs.readFileSync(path.join(vehiclesDir, file), "utf8")
  );
  return auditDossier(dossier);
});

const fleetComplete = vehicles.filter((v) => v.complete).length;
const powerMissing = vehicles.filter((v) => v.gaps.power > 0);
const anyGaps = vehicles.filter((v) => !v.complete);

const beforeEnrichment = {
  totalVehicles: 25,
  powerComplete: 8,
  variantTableComplete: 8,
  note: "Pre-sprint: 17/25 missing Power; 8/25 fully populated (prior audit)",
};

const report = {
  generatedAt: new Date().toISOString(),
  before: beforeEnrichment,
  after: {
    totalVehicles: vehicles.length,
    fleetCompleteCount: fleetComplete,
    fleetCompletePct: Math.round((fleetComplete / vehicles.length) * 100),
    powerCompleteCount: vehicles.length - powerMissing.length,
    powerMissingCount: powerMissing.length,
  },
  vehiclesWithAnyGaps: anyGaps.map((v) => ({
    slug: v.slug,
    displayName: v.displayName,
    gaps: v.gaps,
  })),
  vehicles,
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("| Vehicle | Variants | Power (fields) | Power gaps | Table complete |");
console.log("| ------- | -------- | -------------- | ---------- | -------------- |");
for (const v of vehicles) {
  console.log(
    `| ${v.displayName} | ${v.variantRows} | ${v.fieldsPowerPs ?? "—"} PS | ${v.gaps.power}/${v.variantRows} | ${v.complete ? "yes" : "no"} |`
  );
}
console.log(`\nFleet complete: ${fleetComplete}/${vehicles.length}`);
console.log(`Wrote ${outJson}`);
