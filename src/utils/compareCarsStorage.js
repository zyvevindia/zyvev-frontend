/* =========================================================
   ============== COMPARE LIST (localStorage) ===============
   ========================================================= */

import { normalizeVehicleSlug } from "./vehicleRoutes";
import { resolveFullDisplayName } from "./vehicleDisplayName";

export const COMPARE_CARS_STORAGE_KEY = "compareCars";

export const COMPARE_CARS_SYNC_EVENT = "evsavari:compare-cars-sync";

export const MAX_COMPARE_CARS = 3;

let lastPersistedSerialized = null;

/**
 * Stable key for deduplication (slug-first, then id).
 */
export function getCompareCarKey(car) {
  if (!car || typeof car !== "object") return "";

  const slug = normalizeVehicleSlug(
    car.slug || car.familySlug || ""
  );
  if (slug) return `slug:${slug}`;

  const id = String(car._id || "").trim();
  return id ? `id:${id}` : "";
}

/**
 * Strip non-serializable / nested data before persistence.
 */
export function sanitizeCompareCar(car) {
  if (!car || typeof car !== "object") return null;

  const slug = normalizeVehicleSlug(
    car.slug || car.familySlug || ""
  );
  const id = String(car._id || slug || "").trim();

  if (!slug && !id) return null;

  const specs = car.specifications || {};
  const name = resolveFullDisplayName(car);

  return {
    _id: id || slug,
    slug: slug || id,
    familySlug: String(car.familySlug || slug || "").trim(),
    name,
    fullDisplayName: name,
    brand: car.brand || "",
    image: car.image || car.heroImage || "",
    heroImage: car.heroImage || car.image || "",
    listingThumbnail: car.listingThumbnail || "",
    compareThumbnail: car.compareThumbnail || "",
    startingPrice:
      Number(car.startingPrice ?? car.price) || 0,
    price: Number(car.price ?? car.startingPrice) || 0,
    range:
      Number(car.range ?? specs.range) || 0,
    battery:
      car.battery ||
      specs.batteryPack ||
      "EV Battery",
    specifications: {
      range: Number(specs.range ?? car.range) || 0,
      batteryPack:
        specs.batteryPack || car.battery || "EV Battery",
      chargingTime: specs.chargingTime || "N/A",
      topSpeed: specs.topSpeed || "N/A",
    },
    catalogMeta: car.catalogMeta || null,
    catalogSource: car.catalogSource || "",
    isFeatured: Boolean(car.isFeatured),
    category: car.category || "",
  };
}

export function sanitizeCompareList(cars) {
  if (!Array.isArray(cars)) return [];

  const seen = new Set();
  const list = [];

  for (const item of cars) {
    const clean = sanitizeCompareCar(item);
    if (!clean) continue;

    const key = getCompareCarKey(clean);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    list.push(clean);

    if (list.length >= MAX_COMPARE_CARS) break;
  }

  return list;
}

export function areCompareListsEqual(a, b) {
  try {
    return (
      JSON.stringify(sanitizeCompareList(a)) ===
      JSON.stringify(sanitizeCompareList(b))
    );
  } catch {
    return false;
  }
}

export function isCarInCompareList(list, car) {
  const key = getCompareCarKey(sanitizeCompareCar(car) || car);
  if (!key) return false;

  return sanitizeCompareList(list).some(
    (item) => getCompareCarKey(item) === key
  );
}

export function loadCompareCarsFromStorage() {
  try {
    const raw = localStorage.getItem(COMPARE_CARS_STORAGE_KEY);

    if (!raw) {
      lastPersistedSerialized = "[]";
      return [];
    }

    const parsed = JSON.parse(raw);
    const list = sanitizeCompareList(parsed);
    lastPersistedSerialized = JSON.stringify(list);
    return list;
  } catch {
    lastPersistedSerialized = "[]";
    return [];
  }
}

export function saveCompareCars(cars = []) {
  const list = sanitizeCompareList(cars);
  const serialized = JSON.stringify(list);

  if (serialized === lastPersistedSerialized) {
    return list;
  }

  try {
    localStorage.setItem(
      COMPARE_CARS_STORAGE_KEY,
      serialized
    );
    lastPersistedSerialized = serialized;
    notifyCompareCarsSync();
  } catch {
    /* ignore quota errors */
  }

  return list;
}

/**
 * @returns {{ list: object[], limitReached: boolean }}
 */
export function toggleCompareInList(
  list,
  car,
  max = MAX_COMPARE_CARS
) {
  const current = sanitizeCompareList(list);
  const incoming = sanitizeCompareCar(car);

  if (!incoming) {
    return { list: current, limitReached: false };
  }

  const key = getCompareCarKey(incoming);
  const exists = current.some(
    (item) => getCompareCarKey(item) === key
  );

  if (exists) {
    return {
      list: current.filter(
        (item) => getCompareCarKey(item) !== key
      ),
      limitReached: false,
    };
  }

  if (current.length >= max) {
    return { list: current, limitReached: true };
  }

  return {
    list: [...current, incoming],
    limitReached: false,
  };
}

export function replaceCompareCars(cars = []) {
  return saveCompareCars(cars);
}

export function mergeCompareCars(incoming = []) {
  const existing = loadCompareCarsFromStorage();
  return saveCompareCars([...existing, ...incoming]);
}

export function notifyCompareCarsSync() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(COMPARE_CARS_SYNC_EVENT)
  );
}
