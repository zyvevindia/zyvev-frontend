/**
 * Content hashing for source snapshots (change-detection foundation).
 */

export async function hashContent(text = "") {
  const data = new TextEncoder().encode(String(text));
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let h = 0;
  for (let i = 0; i < data.length; i += 1) {
    h = (h * 31 + data[i]) >>> 0;
  }
  return `fallback-${h.toString(16)}`;
}

export function buildSourceSnapshot(importId, snapshotType, payload, contentHash) {
  return {
    import_id: importId,
    snapshot_type: snapshotType,
    content_hash: contentHash,
    payload,
    captured_at: new Date().toISOString(),
  };
}
