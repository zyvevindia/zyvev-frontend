/**
 * Browser API for catalog source registry (static JSON + localStorage overrides).
 */

const STORAGE_KEY = "evsavari-catalog-source-registry";

export async function fetchRegistryEntries() {
  try {
    const res = await fetch("/catalog/source-registry.json");
    if (res.ok) {
      const data = await res.json();
      return mergeWithLocalOverrides(data);
    }
  } catch {
    /* fallback */
  }
  return loadLocalRegistry();
}

function loadLocalRegistry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function mergeWithLocalOverrides(serverEntries) {
  const local = loadLocalRegistry();
  if (!local.length) return serverEntries;
  const byId = new Map(serverEntries.map((e) => [e.id, { ...e }]));
  for (const entry of local) {
    byId.set(entry.id, { ...byId.get(entry.id), ...entry });
  }
  return [...byId.values()];
}

export function saveRegistryEntry(entry) {
  const all = loadLocalRegistry();
  const idx = all.findIndex((e) => e.id === entry.id);
  if (idx >= 0) all[idx] = { ...all[idx], ...entry, updatedAt: new Date().toISOString() };
  else all.push({ ...entry, updatedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return entry;
}

export function saveRegistryEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entries;
}

export async function runAcquisitionQualityCheck(familySlug) {
  const res = await fetch("/api/catalog-v5-acquire", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importId: `acq-dash-${familySlug}-${Date.now()}`,
      familySlug,
      measureOnly: true,
    }),
  });
  return res.json();
}
