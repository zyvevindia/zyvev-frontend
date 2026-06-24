/**
 * Assistant shortlist — localStorage, max 5 vehicles, no backend.
 */

export const ASSISTANT_SHORTLIST_STORAGE_KEY = "evsavari_assistant_shortlist_v1";
export const ASSISTANT_SHORTLIST_MAX = 5;

/**
 * @typedef {Object} AssistantShortlistEntry
 * @property {string} vehicleSlug
 * @property {string} vehicleName
 * @property {string} addedAt
 */

/**
 * @returns {AssistantShortlistEntry[]}
 */
export function readAssistantShortlist() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(ASSISTANT_SHORTLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => ({
        vehicleSlug: String(entry.vehicleSlug || "").trim().toLowerCase(),
        vehicleName: String(entry.vehicleName || "").trim(),
        addedAt: String(entry.addedAt || ""),
      }))
      .filter((entry) => entry.vehicleSlug);
  } catch {
    return [];
  }
}

/**
 * @param {AssistantShortlistEntry[]} entries
 */
function writeAssistantShortlist(entries) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(
    ASSISTANT_SHORTLIST_STORAGE_KEY,
    JSON.stringify(entries.slice(0, ASSISTANT_SHORTLIST_MAX))
  );
}

/**
 * @param {string} vehicleSlug
 * @returns {boolean}
 */
export function isVehicleInAssistantShortlist(vehicleSlug) {
  const slug = String(vehicleSlug || "").trim().toLowerCase();
  return readAssistantShortlist().some((entry) => entry.vehicleSlug === slug);
}

/**
 * @param {{ vehicleSlug: string, vehicleName: string }} vehicle
 * @returns {{ entries: AssistantShortlistEntry[], added: boolean, reason?: string }}
 */
export function addVehicleToAssistantShortlist(vehicle) {
  const slug = String(vehicle.vehicleSlug || "").trim().toLowerCase();
  const name = String(vehicle.vehicleName || "").trim();

  if (!slug) {
    return { entries: readAssistantShortlist(), added: false, reason: "invalid_slug" };
  }

  const current = readAssistantShortlist();

  if (current.some((entry) => entry.vehicleSlug === slug)) {
    return { entries: current, added: false, reason: "already_listed" };
  }

  if (current.length >= ASSISTANT_SHORTLIST_MAX) {
    return { entries: current, added: false, reason: "limit_reached" };
  }

  const next = [
    ...current,
    {
      vehicleSlug: slug,
      vehicleName: name || slug.replace(/-/g, " "),
      addedAt: new Date().toISOString(),
    },
  ];

  writeAssistantShortlist(next);
  return { entries: next, added: true };
}

/**
 * @param {string} vehicleSlug
 * @returns {AssistantShortlistEntry[]}
 */
export function removeVehicleFromAssistantShortlist(vehicleSlug) {
  const slug = String(vehicleSlug || "").trim().toLowerCase();
  const next = readAssistantShortlist().filter((entry) => entry.vehicleSlug !== slug);
  writeAssistantShortlist(next);
  return next;
}

/**
 * @returns {AssistantShortlistEntry[]}
 */
export function clearAssistantShortlist() {
  writeAssistantShortlist([]);
  return [];
}
