/* =========================================================
   ============== COMPARE LIST (localStorage) ===============
   ========================================================= */

import { sanitizeImageUrl } from "./imageUrl";
import { normalizeVehicleSlug } from "./vehicleRoutes";
import { resolveFullDisplayName } from "./vehicleDisplayName";
import { extractFamilySlug } from "./modelFamily.js";
import { ensureArray } from "./compareArrayUtils.js";

export const COMPARE_CARS_STORAGE_KEY = "compareCars";

/** @deprecated Use MAX_COMPARE_CARS */
export const MAX_COMPARE_VEHICLES = 3;

export const MAX_COMPARE_CARS = MAX_COMPARE_VEHICLES;

export const COMPARE_LIMIT_MESSAGE =
  "You can compare up to 3 EVs at a time. Remove one vehicle before adding another.";

/** Legacy localStorage keys from older builds */
const LEGACY_COMPARE_STORAGE_KEYS = [
  "compareSelections",
  "compareList",
  "compareQueue",
  "compareState",
  "evsavari:compare-cars",
];

export const COMPARE_CARS_SYNC_EVENT = "evsavari:compare-cars-sync";

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

function getCompareFamilySlug(car) {
  if (!car || typeof car !== "object") return "";
  return normalizeVehicleSlug(
    car.familySlug || extractFamilySlug(car.slug || "")
  );
}

export function carsMatchCompareSelection(left, right) {
  const a = sanitizeCompareCar(left) || left;
  const b = sanitizeCompareCar(right) || right;
  if (!a || !b) return false;

  const keyA = getCompareCarKey(a);
  const keyB = getCompareCarKey(b);
  if (keyA && keyB && keyA === keyB) return true;

  const familyA = getCompareFamilySlug(a);
  const familyB = getCompareFamilySlug(b);
  return Boolean(familyA && familyB && familyA === familyB);
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
  const familySlug = String(
    car.familySlug || extractFamilySlug(car.slug || "") || ""
  ).trim();

  return {
    _id: id || slug,
    slug: slug || id,
    familySlug,
    name,
    fullDisplayName: name,
    displayName: car.displayName || car.familyName || "",
    variantName:
      car.variantName ||
      car.trimLabel ||
      car.variantLabel ||
      car.catalogMeta?.variantName ||
      "",
    brand: car.brand || "",
    image: sanitizeImageUrl(car.image),
    heroImage: sanitizeImageUrl(car.heroImage),
    listingThumbnail: sanitizeImageUrl(car.listingThumbnail),
    compareThumbnail: sanitizeImageUrl(car.compareThumbnail),
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
  const seen = new Set();
  const list = [];

  for (const item of ensureArray(cars)) {
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
  const clean = sanitizeCompareCar(car) || car;
  if (!clean) return false;

  return sanitizeCompareList(list).some((item) =>
    carsMatchCompareSelection(item, clean)
  );
}

function migrateLegacyCompareStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  let canonical = [];
  try {
    const raw = window.localStorage.getItem(COMPARE_CARS_STORAGE_KEY);
    if (raw != null) {
      const trimmed = String(raw).trim();
      if (!trimmed) {
        window.localStorage.removeItem(COMPARE_CARS_STORAGE_KEY);
      } else {
        try {
          canonical = sanitizeCompareList(JSON.parse(trimmed));
          if (!canonical.length) {
            window.localStorage.setItem(COMPARE_CARS_STORAGE_KEY, "[]");
          }
        } catch {
          window.localStorage.removeItem(COMPARE_CARS_STORAGE_KEY);
        }
      }
    }
  } catch {
    try {
      window.localStorage.removeItem(COMPARE_CARS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  if (canonical.length > 0) {
    for (const key of LEGACY_COMPARE_STORAGE_KEYS) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    return canonical;
  }

  for (const key of LEGACY_COMPARE_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        window.localStorage.removeItem(key);
        continue;
      }

      const normalized = sanitizeCompareList(parsed);
      if (normalized.length > 0) {
        canonical = normalized;
      }
      window.localStorage.removeItem(key);
    } catch {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }

  if (canonical.length > 0) {
    try {
      window.localStorage.setItem(
        COMPARE_CARS_STORAGE_KEY,
        JSON.stringify(canonical)
      );
    } catch {
      /* quota */
    }
  }

  return canonical;
}

export function loadCompareCarsFromStorage() {
  try {
    const list = sanitizeCompareList(migrateLegacyCompareStorage());
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

  const exists = current.some((item) =>
    carsMatchCompareSelection(item, incoming)
  );

  if (exists) {
    return {
      list: current.filter(
        (item) => !carsMatchCompareSelection(item, incoming)
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
