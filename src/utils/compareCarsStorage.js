/* =========================================================
   ============== COMPARE LIST (localStorage) ===============
   ========================================================= */

export const COMPARE_CARS_STORAGE_KEY =
  "compareCars";

export const COMPARE_CARS_SYNC_EVENT =
  "evsavari:compare-cars-sync";

export function loadCompareCarsFromStorage() {

  try {

    const raw =
      localStorage.getItem(
        COMPARE_CARS_STORAGE_KEY
      );

    if (!raw) {

      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {

    return [];
  }
}

export function saveCompareCars(cars = []) {
  const list = Array.isArray(cars) ? cars : [];

  try {
    localStorage.setItem(
      COMPARE_CARS_STORAGE_KEY,
      JSON.stringify(list)
    );
  } catch {
    /* ignore quota errors */
  }

  notifyCompareCarsSync();
  return list;
}

/**
 * Replace compare list entirely (variant-family compare, no merge).
 */
export function replaceCompareCars(cars = []) {
  return saveCompareCars(cars);
}

/**
 * Append vehicles not already in the list (standard compare flow).
 */
export function mergeCompareCars(incoming = []) {
  const existing = loadCompareCarsFromStorage();
  let merged = [...existing];

  for (const item of incoming) {
    const slug = item?.slug;
    if (
      slug &&
      !merged.find((e) => e?.slug === slug)
    ) {
      merged = [...merged, item];
    } else if (
      item?._id &&
      !merged.find((e) => e?._id === item._id)
    ) {
      merged = [...merged, item];
    }
  }

  return saveCompareCars(merged);
}

export function notifyCompareCarsSync() {

  if (
    typeof window ===
    "undefined"
  ) {

    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      COMPARE_CARS_SYNC_EVENT
    )
  );
}
