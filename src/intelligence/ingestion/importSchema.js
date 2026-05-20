import { INGESTION_FORMAT } from "./constants.js";

/**
 * @param {*} body
 * @returns {{ ok: boolean, errors: string[], envelope?: object }}
 */
export function validateImportEnvelope(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    errors.push("Root must be a JSON object");
    return { ok: false, errors };
  }
  if (body.format !== INGESTION_FORMAT) {
    errors.push(`format must be "${INGESTION_FORMAT}"`);
  }
  if (!Array.isArray(body.items)) {
    errors.push("items must be an array");
  } else if (body.items.length === 0) {
    errors.push("items must not be empty");
  }
  if (body.items?.length) {
    body.items.forEach((it, i) => {
      if (!it || typeof it !== "object") {
        errors.push(`items[${i}] must be an object`);
        return;
      }
      const slug = String(it.slug || "").trim();
      if (!slug) errors.push(`items[${i}].slug is required`);
    });
  }
  const ok = errors.length === 0;
  return { ok, errors, envelope: ok ? body : undefined };
}
