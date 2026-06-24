import { useCallback, useEffect, useState } from "react";

import {
  addVehicleToAssistantShortlist,
  ASSISTANT_SHORTLIST_MAX,
  readAssistantShortlist,
  removeVehicleFromAssistantShortlist,
} from "../aiAssistant/assistantShortlist.js";
import {
  readAssistantIntentSignals,
  writeAssistantIntentSignals,
} from "../aiAssistant/assistantIntentSignals.js";

const SHORTLIST_EVENT = "evsavari-assistant-shortlist-change";

function dispatchShortlistChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SHORTLIST_EVENT));
  }
}

/**
 * @returns {{
 *   entries: import("../aiAssistant/assistantShortlist.js").AssistantShortlistEntry[],
 *   count: number,
 *   max: number,
 *   isListed: (vehicleSlug: string) => boolean,
 *   add: (vehicle: { vehicleSlug: string, vehicleName: string }) => { added: boolean, reason?: string },
 *   remove: (vehicleSlug: string) => void,
 * }}
 */
export function useAssistantShortlist() {
  const [entries, setEntries] = useState(() => readAssistantShortlist());

  const refresh = useCallback(() => {
    setEntries(readAssistantShortlist());
  }, []);

  useEffect(() => {
    refresh();

    const handleChange = () => refresh();
    window.addEventListener(SHORTLIST_EVENT, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(SHORTLIST_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [refresh]);

  const syncIntentCount = useCallback((nextEntries) => {
    writeAssistantIntentSignals({ shortlistCount: nextEntries.length });
  }, []);

  const add = useCallback(
    (vehicle) => {
      const result = addVehicleToAssistantShortlist(vehicle);
      setEntries(result.entries);
      syncIntentCount(result.entries);
      dispatchShortlistChange();
      return { added: result.added, reason: result.reason };
    },
    [syncIntentCount]
  );

  const remove = useCallback(
    (vehicleSlug) => {
      const next = removeVehicleFromAssistantShortlist(vehicleSlug);
      setEntries(next);
      syncIntentCount(next);
      dispatchShortlistChange();
    },
    [syncIntentCount]
  );

  const isListed = useCallback(
    (vehicleSlug) =>
      entries.some(
        (entry) => entry.vehicleSlug === String(vehicleSlug || "").trim().toLowerCase()
      ),
    [entries]
  );

  return {
    entries,
    count: entries.length,
    max: ASSISTANT_SHORTLIST_MAX,
    isListed,
    add,
    remove,
  };
}
