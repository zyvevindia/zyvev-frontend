/**
 * Operational-safe persistence errors — no stack traces to UI.
 */

export class PersistenceError extends Error {
  constructor(message, { code = "persistence_error", cause = null } = {}) {
    super(message);
    this.name = "PersistenceError";
    this.code = code;
    this.cause = cause;
  }
}

export function mapSupabaseError(error, fallback = "Database operation failed") {
  if (!error) return new PersistenceError(fallback, { code: "unknown" });

  const code = error.code || error.name || "supabase_error";
  const message =
    error.message ||
    error.details ||
    error.hint ||
    fallback;

  return new PersistenceError(String(message).slice(0, 240), { code, cause: error });
}

export function toPersistenceResult(promise) {
  return promise
    .then((data) => ({ ok: true, data, error: null }))
    .catch((err) => ({
      ok: false,
      data: null,
      error: err instanceof PersistenceError ? err : mapSupabaseError(err),
    }));
}
