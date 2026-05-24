import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  COMPARE_CARS_SYNC_EVENT,
  areCompareListsEqual,
  loadCompareCarsFromStorage,
  saveCompareCars,
  toggleCompareInList,
} from "../utils/compareCarsStorage";
import { loadCompareState } from "../utils/compareHydration";

/**
 * Shared compare list state — single write path, no save/sync feedback loops.
 */
export default function useCompareCars() {
  const [compareList, setCompareList] = useState(
    () => loadCompareState()
  );
  const skipExternalSyncRef = useRef(false);

  useEffect(() => {
    const onSync = () => {
      if (skipExternalSyncRef.current) return;

      const stored = loadCompareCarsFromStorage();
      setCompareList((prev) =>
        areCompareListsEqual(prev, stored) ? prev : stored
      );
    };

    window.addEventListener(
      COMPARE_CARS_SYNC_EVENT,
      onSync
    );

    return () => {
      window.removeEventListener(
        COMPARE_CARS_SYNC_EVENT,
        onSync
      );
    };
  }, []);

  const persistList = useCallback((nextList) => {
    skipExternalSyncRef.current = true;
    const saved = saveCompareCars(nextList);
    setCompareList(saved);
    queueMicrotask(() => {
      skipExternalSyncRef.current = false;
    });
    return saved;
  }, []);

  const toggleCompare = useCallback(
    (car) => {
      const { list, limitReached } = toggleCompareInList(
        compareList,
        car
      );

      if (!areCompareListsEqual(compareList, list)) {
        persistList(list);
      }

      return { limitReached };
    },
    [compareList, persistList]
  );

  const clearCompare = useCallback(() => {
    persistList([]);
  }, [persistList]);

  return {
    compareList,
    setCompareList: persistList,
    toggleCompare,
    clearCompare,
  };
}
