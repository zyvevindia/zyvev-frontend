/**
 * Safety intelligence schema — verified / unknown / not_tested only.
 * No fabricated NCAP or ADAS ratings.
 */

import { isPresent, UNAVAILABLE } from "./governance.js";

export const SAFETY_FIELD_STATUS = Object.freeze({
  VERIFIED: "verified",
  UNKNOWN: "unknown",
  NOT_TESTED: "not_tested",
  NOT_VERIFIED: "not_verified",
});

/**
 * @param {unknown} raw
 * @returns {object}
 */
export function normalizeSafetyMetadata(raw = {}) {
  const block = raw && typeof raw === "object" ? raw : {};

  const bharat = normalizeNcapBlock(block.bharatNcap || block.bharat_ncap);
  const global = normalizeNcapBlock(block.globalNcap || block.global_ncap);

  const airbags = normalizeCountField(block.airbags);
  const abs = normalizeBoolField(block.abs);
  const esc = normalizeBoolField(block.esc ?? block.stability?.esc);
  const tractionControl = normalizeBoolField(
    block.traction_control ?? block.tractionControl
  );
  const adas = normalizeAdasField(block.adas);

  const hasAny =
    bharat.status !== SAFETY_FIELD_STATUS.UNKNOWN ||
    global.status !== SAFETY_FIELD_STATUS.UNKNOWN ||
    airbags.status !== SAFETY_FIELD_STATUS.UNKNOWN ||
    abs.status !== SAFETY_FIELD_STATUS.UNKNOWN ||
    esc.status !== SAFETY_FIELD_STATUS.UNKNOWN ||
    tractionControl.status !== SAFETY_FIELD_STATUS.UNKNOWN ||
    adas.status !== SAFETY_FIELD_STATUS.UNKNOWN;

  return {
    bharatNcap: bharat,
    globalNcap: global,
    airbags,
    abs,
    esc,
    tractionControl,
    adas,
    hasData: hasAny,
  };
}

function normalizeNcapBlock(block = {}) {
  if (!block || typeof block !== "object") {
    return { stars: null, status: SAFETY_FIELD_STATUS.UNKNOWN, ratingYear: null };
  }
  if (block.status === SAFETY_FIELD_STATUS.NOT_TESTED) {
    return {
      stars: null,
      status: SAFETY_FIELD_STATUS.NOT_TESTED,
      ratingYear: block.ratingYear || null,
    };
  }
  const stars = block.stars;
  if (stars != null && Number.isFinite(Number(stars))) {
    const verified =
      block.verified === true || block.status === SAFETY_FIELD_STATUS.VERIFIED;
    return {
      stars: Number(stars),
      status: verified
        ? SAFETY_FIELD_STATUS.VERIFIED
        : SAFETY_FIELD_STATUS.NOT_VERIFIED,
      ratingYear: block.ratingYear || null,
    };
  }
  return {
    stars: null,
    status: SAFETY_FIELD_STATUS.UNKNOWN,
    ratingYear: null,
  };
}

function normalizeCountField(block = {}) {
  if (block?.status === SAFETY_FIELD_STATUS.NOT_TESTED) {
    return { count: null, status: SAFETY_FIELD_STATUS.NOT_TESTED };
  }
  const count = block?.count ?? block;
  if (count != null && Number.isFinite(Number(count))) {
    return {
      count: Number(count),
      status:
        block?.verified === true
          ? SAFETY_FIELD_STATUS.VERIFIED
          : SAFETY_FIELD_STATUS.NOT_VERIFIED,
    };
  }
  return { count: null, status: SAFETY_FIELD_STATUS.UNKNOWN };
}

function normalizeBoolField(value) {
  if (value === true) {
    return { value: true, status: SAFETY_FIELD_STATUS.NOT_VERIFIED };
  }
  if (value === false) {
    return { value: false, status: SAFETY_FIELD_STATUS.NOT_VERIFIED };
  }
  return { value: null, status: SAFETY_FIELD_STATUS.UNKNOWN };
}

function normalizeAdasField(block = {}) {
  if (!block || typeof block !== "object") {
    return { level: null, status: SAFETY_FIELD_STATUS.UNKNOWN };
  }
  if (block.status === SAFETY_FIELD_STATUS.NOT_TESTED) {
    return { level: null, status: SAFETY_FIELD_STATUS.NOT_TESTED };
  }
  const level = block.level;
  if (level != null && isPresent(level)) {
    return {
      level,
      supported: block.supported === true,
      status:
        block.verified === true
          ? SAFETY_FIELD_STATUS.VERIFIED
          : SAFETY_FIELD_STATUS.NOT_VERIFIED,
    };
  }
  return { level: null, status: SAFETY_FIELD_STATUS.UNKNOWN };
}

/**
 * @param {object[]} cars
 */
export function buildSafetyCompletenessReport(cars = []) {
  const rows = cars.map((car) => {
    const safety = normalizeSafetyMetadata(car?.catalogMeta?.safety);
    const fields = [
      "bharatNcap",
      "globalNcap",
      "airbags",
      "abs",
      "esc",
      "tractionControl",
      "adas",
    ];
    const missing = fields.filter((f) => {
      const row = safety[f];
      return (
        !row ||
        row.status === SAFETY_FIELD_STATUS.UNKNOWN ||
        row.status === SAFETY_FIELD_STATUS.NOT_TESTED
      );
    });
    const verifiedCount = fields.filter(
      (f) => safety[f]?.status === SAFETY_FIELD_STATUS.VERIFIED
    ).length;

    return {
      slug: car?.slug || car?.catalogMeta?.slug,
      name: car?.name,
      safety,
      verifiedCount,
      missingFields: missing,
      readiness:
        verifiedCount >= 2
          ? "ready"
          : safety.hasData
            ? "partial"
            : "missing",
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    vehicles: rows.length,
    readyCount: rows.filter((r) => r.readiness === "ready").length,
    partialCount: rows.filter((r) => r.readiness === "partial").length,
    missingCount: rows.filter((r) => r.readiness === "missing").length,
    rows,
  };
}

/**
 * Public-facing safety copy — never shows unverified NCAP stars.
 * @param {object} rawSafety catalogMeta.safety or normalized input
 * @returns {{ lines: string[], hasContent: boolean, completenessStatus: string }}
 */
export function formatSafetyIntelligenceCopy(rawSafety = {}) {
  const s = normalizeSafetyMetadata(rawSafety);

  const lines = [];

  if (s.airbags.status === SAFETY_FIELD_STATUS.VERIFIED && s.airbags.count != null) {
    lines.push(`${s.airbags.count} airbags (verified)`);
  } else if (s.airbags.status === SAFETY_FIELD_STATUS.NOT_VERIFIED && s.airbags.count != null) {
    lines.push(`${s.airbags.count} airbags — confirm with dealer`);
  }

  if (s.esc.status === SAFETY_FIELD_STATUS.VERIFIED && s.esc.value === true) {
    lines.push("ESC confirmed");
  } else if (s.esc.status === SAFETY_FIELD_STATUS.NOT_VERIFIED && s.esc.value === true) {
    lines.push("ESC listed — verify variant");
  }

  if (s.tractionControl.value === true) {
    lines.push("Traction control listed");
  }

  if (s.adas.status === SAFETY_FIELD_STATUS.VERIFIED && s.adas.level != null) {
    lines.push(`ADAS Level ${s.adas.level} (verified)`);
  } else if (s.adas.status === SAFETY_FIELD_STATUS.NOT_VERIFIED && s.adas.level != null) {
    lines.push(`ADAS Level ${s.adas.level} — confirm availability`);
  }

  if (s.bharatNcap.status === SAFETY_FIELD_STATUS.VERIFIED && s.bharatNcap.stars != null) {
    lines.push(
      `Bharat NCAP ${s.bharatNcap.stars}★${s.bharatNcap.ratingYear ? ` (${s.bharatNcap.ratingYear})` : ""}`
    );
  } else if (s.bharatNcap.status === SAFETY_FIELD_STATUS.NOT_TESTED) {
    lines.push("Bharat NCAP: not tested / rating pending for this model");
  } else if (s.bharatNcap.status === SAFETY_FIELD_STATUS.NOT_VERIFIED && s.bharatNcap.stars != null) {
    lines.push("Bharat NCAP rating published — verify latest test for your variant");
  }

  if (s.globalNcap.status === SAFETY_FIELD_STATUS.VERIFIED && s.globalNcap.stars != null) {
    lines.push(
      `Global NCAP ${s.globalNcap.stars}★${s.globalNcap.ratingYear ? ` (${s.globalNcap.ratingYear})` : ""}`
    );
  } else if (s.globalNcap.status === SAFETY_FIELD_STATUS.NOT_TESTED) {
    lines.push("Global NCAP: not tested for this market variant");
  }

  if (!lines.length) {
    lines.push(
      "Safety ratings and driver-assistance details are being verified for this model."
    );
  }

  const verifiedCount = [
    s.bharatNcap,
    s.globalNcap,
    s.airbags,
    s.esc,
    s.adas,
  ].filter((f) => f?.status === SAFETY_FIELD_STATUS.VERIFIED).length;

  const completenessStatus =
    verifiedCount >= 2
      ? SAFETY_FIELD_STATUS.VERIFIED
      : s.hasData
        ? SAFETY_FIELD_STATUS.NOT_VERIFIED
        : SAFETY_FIELD_STATUS.UNKNOWN;

  return {
    lines,
    hasContent: true,
    completenessStatus,
    normalized: s,
  };
}

export { UNAVAILABLE };
