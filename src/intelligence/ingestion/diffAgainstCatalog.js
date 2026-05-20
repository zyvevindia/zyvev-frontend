import { CHANGE_SEVERITY } from "./constants.js";

function readCarPrice(car) {
  return Number(car?.startingPrice ?? car?.price ?? 0) || 0;
}

function readCarRange(car) {
  return (
    Number(car?.specifications?.range ?? car?.range ?? 0) || 0
  );
}

function readBatteryKwh(car) {
  const pack = car?.specifications?.batteryPack;
  if (typeof pack === "number" && Number.isFinite(pack)) return pack;
  const m = String(pack || "").match(/([\d.]+)\s*kwh/i);
  return m ? Number(m[1]) : undefined;
}

/**
 * Deterministic diff: normalized import fields vs live catalog car (API shape).
 * @param {object} normalizedRow from mapOemRowToNormalized
 * @param {object|null} car normalized or raw from API
 */
export function diffNormalizedAgainstCatalog(normalizedRow, car) {
  const changes = [];
  if (!normalizedRow?.slug) {
    return {
      slug: "",
      changes,
      severity: CHANGE_SEVERITY.MINOR,
      trustImpacted: false,
      intelligenceSystems: [],
      missingCatalog: true,
    };
  }

  if (!car) {
    return {
      slug: normalizedRow.slug,
      changes: [
        {
          field: "_catalog",
          before: null,
          after: "unknown_slug",
          note: "No matching vehicle in loaded catalog snapshot",
        },
      ],
      severity: CHANGE_SEVERITY.INTELLIGENCE,
      trustImpacted: true,
      intelligenceSystems: ["catalog", "compare", "discovery"],
      missingCatalog: true,
    };
  }

  const f = normalizedRow.fields || {};
  const intelligenceSystems = new Set();

  const pushChange = (field, before, after, systems) => {
    const bStr = before === undefined ? null : before;
    const aStr = after === undefined ? null : after;
    if (bStr === aStr) return;
    if (typeof bStr === "number" && typeof aStr === "number" && bStr === aStr) return;
    changes.push({ field, before: bStr, after: aStr });
    (systems || []).forEach((s) => intelligenceSystems.add(s));
  };

  if (f.startingPrice != null) {
    const before = readCarPrice(car);
    const after = f.startingPrice;
    pushChange("startingPrice", before, after, [
      "ownership",
      "taxonomy",
      "compare",
      "recommendations",
    ]);
  }

  if (f.rangeKm != null) {
    const before = readCarRange(car);
    pushChange("rangeKm", before || null, f.rangeKm, [
      "range",
      "compare",
      "recommendations",
      "seo",
    ]);
  }

  if (f.batteryKwh != null) {
    const before = readBatteryKwh(car);
    pushChange("batteryKwh", before ?? null, f.batteryKwh, [
      "range",
      "ownership",
      "compare",
    ]);
  }

  if (f.chargingTime != null) {
    const before = car?.specifications?.chargingTime || car?.chargingTime || null;
    pushChange("chargingTime", before, f.chargingTime, [
      "charging",
      "compare",
    ]);
  }

  if (f.dcFastKw != null || f.acKw != null || f.connector != null || f.dcChargeMinutes != null) {
    const beforeDc = car?.specifications?.dcFastChargingKw;
    pushChange("dcFastKw", beforeDc ?? null, f.dcFastKw ?? null, [
      "charging",
      "compare",
    ]);
    const beforeAc = car?.specifications?.acChargingKw;
    pushChange("acKw", beforeAc ?? null, f.acKw ?? null, ["charging"]);
    const beforeConn = car?.specifications?.connectorType || car?.specifications?.connector;
    pushChange("connector", beforeConn ?? null, f.connector ?? null, [
      "charging",
      "compare",
    ]);
    pushChange(
      "dcChargeMinutes",
      car?.specifications?.dc10to80Minutes ?? null,
      f.dcChargeMinutes ?? null,
      ["charging"]
    );
  }

  if (f.warranty != null) {
    pushChange("warranty", car?.specifications?.warranty ?? null, f.warranty, [
      "ownership",
    ]);
  }

  if (f.variantId != null || f.variantName != null) {
    changes.push({
      field: "variant",
      before: { id: car?.variantId, name: car?.variantName },
      after: { id: f.variantId, name: f.variantName },
      note: "Variant add/remove requires manual catalog verification",
    });
    intelligenceSystems.add("compare");
    intelligenceSystems.add("catalog");
  }

  if (f.featureTags?.length) {
    changes.push({
      field: "featureTags",
      before: null,
      after: f.featureTags,
      note: "Feature tag delta not auto-computed — review against catalog features",
    });
    intelligenceSystems.add("features");
  }

  let severity = CHANGE_SEVERITY.MINOR;
  for (const c of changes) {
    if (c.field === "startingPrice") {
      const b = Number(c.before);
      const a = Number(c.after);
      const pct = b ? Math.abs((a - b) / b) * 100 : 100;
      if (pct >= 8) severity = CHANGE_SEVERITY.PRICING;
    }
  }
  if (
    changes.some(
      (c) =>
        ["rangeKm", "batteryKwh", "chargingTime", "dcFastKw", "connector", "dcChargeMinutes"].includes(
          c.field
        )
    )
  ) {
    severity =
      severity === CHANGE_SEVERITY.PRICING
        ? CHANGE_SEVERITY.PRICING
        : CHANGE_SEVERITY.INTELLIGENCE;
  }

  if (changes.some((c) => c.field === "variant")) {
    severity = CHANGE_SEVERITY.INTELLIGENCE;
  }

  const trustImpacted = changes.some(
    (c) =>
      [
        "startingPrice",
        "rangeKm",
        "batteryKwh",
        "chargingTime",
        "dcFastKw",
        "connector",
        "dcChargeMinutes",
        "variant",
      ].includes(c.field)
  );

  return {
    slug: normalizedRow.slug,
    changes,
    severity,
    trustImpacted,
    intelligenceSystems: [...intelligenceSystems],
    missingCatalog: false,
    freshnessImpact:
      trustImpacted
        ? "Likely requires freshness / trust metadata review after publish"
        : "Low — optional editorial pass",
  };
}

/**
 * Max severity across slug reports.
 * @param {object[]} reports
 */
export function maxSeverity(reports) {
  let m = CHANGE_SEVERITY.MINOR;
  const order = [CHANGE_SEVERITY.MINOR, CHANGE_SEVERITY.PRICING, CHANGE_SEVERITY.INTELLIGENCE];
  for (const r of reports || []) {
    const idx = order.indexOf(r.severity);
    const cur = order.indexOf(m);
    if (idx > cur) m = r.severity;
  }
  return m;
}
