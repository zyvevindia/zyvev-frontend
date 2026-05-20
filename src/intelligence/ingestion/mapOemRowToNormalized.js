import {
  inferConnectorFromText,
  isPresent,
  parseKwhFromText,
  parseMinutesFromText,
} from "../governance.js";
import {
  CONNECTOR_TAXONOMY,
  classifyBatteryCapacity,
  classifyPriceBand,
} from "../taxonomy.js";

const CONNECTOR_VALUES = new Set(Object.values(CONNECTOR_TAXONOMY));

function num(v) {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(String(v).replace(/[,₹]/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Map flexible OEM / sheet keys to normalized catalog-intelligence fields.
 * @param {object} raw
 * @returns {{ slug: string, fields: object, normalization: { warnings: string[], unmapped: string[], confidence: string } }}
 */
export function mapOemRowToNormalized(raw) {
  const warnings = [];
  const unmapped = [];
  const fields = {};

  const pick = (...keys) => {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== "") return raw[k];
    }
    return undefined;
  };

  const slug = String(
    pick("slug", "family_slug", "vehicle_slug", "model_slug") || ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  const price = num(pick("starting_price", "startingprice", "price_inr", "ex_showroom", "price"));
  if (price !== undefined) fields.startingPrice = Math.round(price);

  const rangeKm = num(pick("range_km", "rangekm", "claimed_range_km", "range", "arai_range"));
  if (rangeKm !== undefined) fields.rangeKm = Math.round(rangeKm);

  const batteryTxt = pick("battery_kwh", "batterypack", "battery", "battery_pack");
  const batteryNum =
    typeof batteryTxt === "number"
      ? batteryTxt
      : parseKwhFromText(String(batteryTxt || ""));
  if (batteryNum !== undefined && Number.isFinite(batteryNum)) {
    fields.batteryKwh = batteryNum;
  } else if (isPresent(batteryTxt)) {
    fields.batteryLabel = String(batteryTxt);
    warnings.push("battery_not_numeric");
  }

  const chargingTime = pick("charging_time", "chargingtime", "ac_charging_time");
  if (isPresent(chargingTime)) fields.chargingTime = String(chargingTime);

  const dcKw = num(pick("dc_fast_kw", "dc_kw", "dc_charging_kw"));
  if (dcKw !== undefined) fields.dcFastKw = dcKw;

  const acKw = num(pick("ac_kw", "ac_charging_kw"));
  if (acKw !== undefined) fields.acKw = acKw;

  const connectorRaw = pick("connector", "dc_connector", "charge_port");
  if (isPresent(connectorRaw)) {
    const inferred = inferConnectorFromText(String(connectorRaw));
    if (inferred && CONNECTOR_VALUES.has(inferred)) {
      fields.connector = inferred;
    } else {
      const upper = String(connectorRaw).trim();
      if (CONNECTOR_VALUES.has(upper)) fields.connector = upper;
      else {
        warnings.push(`connector_unmapped:${connectorRaw}`);
        fields.connectorRaw = String(connectorRaw);
      }
    }
  }

  const topSpeed = pick("top_speed", "topspeed");
  if (isPresent(topSpeed)) fields.topSpeed = String(topSpeed);

  const warranty = pick("warranty", "battery_warranty");
  if (isPresent(warranty)) fields.warranty = String(warranty);

  const variantId = pick("variant_id", "variantid", "sku");
  if (isPresent(variantId)) fields.variantId = String(variantId);

  const variantName = pick("variant_name", "variant", "trim");
  if (isPresent(variantName)) fields.variantName = String(variantName);

  const featuresRaw = pick("features", "feature_tags", "tags");
  if (isPresent(featuresRaw)) {
    const list = String(featuresRaw)
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length) fields.featureTags = list;
  }

  const dcMin = num(pick("dc_10_80_min", "dc_charge_minutes"));
  if (dcMin !== undefined) {
    fields.dcChargeMinutes = Math.round(dcMin);
  } else {
    const t = pick("dc_charge_time_text", "dc_time");
    if (isPresent(t)) {
      const m = parseMinutesFromText(String(t));
      if (m !== null && m !== undefined && Number.isFinite(m)) {
        fields.dcChargeMinutes = m;
      } else {
        warnings.push("dc_time_unparsed");
      }
    }
  }

  Object.keys(raw).forEach((k) => {
    const known = new Set([
      "slug",
      "family_slug",
      "vehicle_slug",
      "model_slug",
      "starting_price",
      "startingprice",
      "price_inr",
      "ex_showroom",
      "price",
      "range_km",
      "rangekm",
      "claimed_range_km",
      "range",
      "arai_range",
      "battery_kwh",
      "batterypack",
      "battery",
      "battery_pack",
      "charging_time",
      "chargingtime",
      "ac_charging_time",
      "dc_fast_kw",
      "dc_kw",
      "ac_kw",
      "connector",
      "dc_connector",
      "charge_port",
      "top_speed",
      "topspeed",
      "warranty",
      "battery_warranty",
      "variant_id",
      "variantid",
      "sku",
      "variant_name",
      "variant",
      "trim",
      "features",
      "feature_tags",
      "tags",
      "dc_10_80_min",
      "dc_charge_minutes",
      "dc_charge_time_text",
      "dc_time",
    ]);
    if (!known.has(String(k).toLowerCase())) {
      unmapped.push(k);
    }
  });

  let confidence = "high";
  if (warnings.length || unmapped.length) confidence = "medium";
  if (!slug) confidence = "low";
  if (warnings.some((w) => w.startsWith("connector_unmapped"))) confidence = "low";

  return {
    slug,
    fields,
    normalization: {
      warnings,
      unmapped,
      confidence,
    },
  };
}

/**
 * Taxonomy-aware post-checks on normalized row.
 * @param {ReturnType<typeof mapOemRowToNormalized>} row
 */
export function attachTaxonomyHints(row) {
  const hints = [];
  const { fields } = row;
  if (fields.startingPrice != null && !classifyPriceBand(fields.startingPrice)) {
    hints.push("price_invalid_for_taxonomy");
  }
  if (fields.batteryKwh != null && !classifyBatteryCapacity(fields.batteryKwh)) {
    hints.push("battery_invalid_for_taxonomy");
  }
  return hints;
}
