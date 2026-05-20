import { isPresent, pickFirstPresent, UNAVAILABLE } from "./governance.js";

function textIncludes(haystack, needles) {
  const s = String(haystack || "").toLowerCase();
  return needles.some((n) => s.includes(n));
}

function scanProsCons(meta, needles) {
  const items = [
    ...(meta?.pros || []),
    ...(meta?.cons || []),
    meta?.expertSummary || "",
  ];
  return items.some((item) => textIncludes(item, needles));
}

/**
 * @param {object} car
 */
export function buildFeatureMatrix(car) {
  const meta = car?.catalogMeta || {};
  const safety = meta.safety || {};
  const comfort = meta.comfort || {};
  const tags = meta.psychologyTags || [];
  const features = car?.features || [];

  const combinedText = [
    ...features,
    ...tags,
    meta.expertSummary,
  ]
    .filter(Boolean)
    .join(" ");

  const regenerativeBraking = pickFirstPresent(
    comfort.regenerativeBrakingLevel,
    scanProsCons(meta, ["regen", "regenerative"])
      ? "multi"
      : UNAVAILABLE
  );

  const driveModes = comfort.driveModes?.length
    ? comfort.driveModes
    : scanProsCons(meta, ["drive mode", "eco mode", "sport mode"])
      ? ["Eco", "Sport"]
      : UNAVAILABLE;

  const batteryThermalManagement = pickFirstPresent(
    comfort.batteryThermalManagement,
    scanProsCons(meta, ["thermal management", "liquid cooled"])
      ? true
      : UNAVAILABLE
  );

  const v2l = pickFirstPresent(
    comfort.v2l,
    scanProsCons(meta, ["v2l", "vehicle to load", "vehicle-to-load"])
      ? true
      : UNAVAILABLE
  );

  const connectedCar = pickFirstPresent(
    comfort.connectedCar,
    tags.includes("tech_appeal") || scanProsCons(meta, ["connected", "app"])
      ? true
      : UNAVAILABLE
  );

  const otaUpdates = pickFirstPresent(
    comfort.otaUpdates,
    scanProsCons(meta, ["ota", "over-the-air"])
      ? true
      : UNAVAILABLE
  );

  const adasSupported = pickFirstPresent(
    safety.adas?.supported,
    safety.adas?.level != null ? true : UNAVAILABLE
  );

  const adasLevel = safety.adas?.level ?? UNAVAILABLE;

  const batteryCoolingType = pickFirstPresent(
    comfort.batteryCoolingType,
    scanProsCons(meta, ["liquid cool"]) ? "Liquid cooled" : UNAVAILABLE
  );

  const hillHold = pickFirstPresent(
    safety.stability?.hillHold,
    scanProsCons(meta, ["hill hold", "hill assist"]) ? true : UNAVAILABLE
  );

  const cruiseControl = pickFirstPresent(
    comfort.cruiseControl,
    scanProsCons(meta, ["cruise control", "adaptive cruise"]) ? true : UNAVAILABLE
  );

  const fastChargingCapability = pickFirstPresent(
    meta.chargingPracticality?.fastChargingSupported,
    meta.chargingSummary && /dc|fast|ccs/i.test(meta.chargingSummary)
      ? true
      : UNAVAILABLE
  );

  const highlights = [];

  if (regenerativeBraking !== UNAVAILABLE) {
    highlights.push(
      typeof regenerativeBraking === "string"
        ? `Regen: ${regenerativeBraking}`
        : "Regenerative braking"
    );
  }
  if (Array.isArray(driveModes) && driveModes.length) {
    highlights.push(`Drive modes: ${driveModes.slice(0, 3).join(", ")}`);
  }
  if (batteryThermalManagement === true) {
    highlights.push("Battery thermal management");
  }
  if (v2l === true) highlights.push("V2L (vehicle-to-load)");
  if (connectedCar === true) highlights.push("Connected car features");
  if (otaUpdates === true) highlights.push("OTA updates");
  if (adasSupported === true) {
    highlights.push(
      adasLevel !== UNAVAILABLE
        ? `ADAS (level ${adasLevel})`
        : "ADAS support"
    );
  }
  if (hillHold === true) highlights.push("Hill hold / hill assist");
  if (cruiseControl === true) highlights.push("Cruise control");
  if (fastChargingCapability === true) highlights.push("DC fast charging");

  const hasData = highlights.length > 0 || adasSupported !== UNAVAILABLE;

  return {
    regenerativeBraking,
    driveModes,
    batteryThermalManagement,
    v2l,
    connectedCar,
    otaUpdates,
    adas: {
      supported: adasSupported,
      level: adasLevel,
    },
    batteryCoolingType,
    hillHold,
    cruiseControl,
    fastChargingCapability,
    highlights,
    hasData,
  };
}
