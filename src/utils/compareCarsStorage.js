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
