const recent = new Map();
const TTL_MS = 1200;

/**
 * Prevent duplicate bursts (e.g. StrictMode double mount).
 */
export function shouldEmitEvent(eventName, dedupeKey = "") {
  const key = `${eventName}::${dedupeKey}`;
  const now = Date.now();
  const last = recent.get(key);

  if (last && now - last < TTL_MS) {
    return false;
  }

  recent.set(key, now);

  if (recent.size > 200) {
    for (const [k, ts] of recent) {
      if (now - ts > TTL_MS * 10) {
        recent.delete(k);
      }
    }
  }

  return true;
}
