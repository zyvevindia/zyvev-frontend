import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  readAssistantIntentSignals,
  resolveBuyerReadiness,
  shouldEmitHighIntent,
  writeAssistantIntentSignals,
} from "../../aiAssistant/assistantIntentSignals.js";
import { ANALYTICS_EVENTS } from "../../analytics/events.js";
import { trackAnalytics } from "../../analytics/track.js";

/** @typedef {import("../aiAssistant/assistantIntentSignals.js").AssistantIntentSignals} AssistantIntentSignals */
/** @typedef {import("../aiAssistant/assistantIntentSignals.js").BuyerReadinessState} BuyerReadinessState */

/**
 * @typedef {Object} AssistantIntentContextValue
 * @property {AssistantIntentSignals} signals
 * @property {BuyerReadinessState} readiness
 * @property {(patch: Partial<AssistantIntentSignals>) => void} recordSignals
 * @property {() => void} markStarted
 * @property {() => void} markCompleted
 * @property {(vehicleSlug?: string, toolKey?: string) => void} markOwnershipUsed
 * @property {(vehicleSlug?: string, compareSlug?: string) => void} markCompareUsed
 * @property {(vehicleSlug?: string) => void} markReviewViewed
 */

const AssistantIntentContext = createContext(null);

/**
 * @param {{ children: import("react").ReactNode, sourcePage?: string }} props
 */
export function AssistantIntentProvider({ children, sourcePage = "buyer_assistant" }) {
  const [signals, setSignals] = useState(() => readAssistantIntentSignals());

  const recordSignals = useCallback((patch) => {
    const next = writeAssistantIntentSignals(patch);
    setSignals(next);
    return next;
  }, []);

  const emitHighIntentIfNeeded = useCallback(
    (nextSignals) => {
      if (!shouldEmitHighIntent(nextSignals)) {
        return;
      }

      trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_HIGH_INTENT, {
        source_page: sourcePage,
      });
      writeAssistantIntentSignals({ highIntentEmitted: true });
      setSignals(readAssistantIntentSignals());
    },
    [sourcePage]
  );

  const markStarted = useCallback(() => {
    recordSignals({ assistantStarted: true });
  }, [recordSignals]);

  const markCompleted = useCallback(() => {
    const next = recordSignals({ assistantCompleted: true });
    emitHighIntentIfNeeded(next);
  }, [recordSignals, emitHighIntentIfNeeded]);

  const markOwnershipUsed = useCallback(
    (vehicleSlug = "", toolKey = "") => {
      const next = recordSignals({ ownershipToolUsed: true });
      trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_OWNERSHIP_CLICKED, {
        source_page: sourcePage,
        vehicle_slug: vehicleSlug,
        ownership_tool: toolKey,
      });
      emitHighIntentIfNeeded(next);
    },
    [recordSignals, emitHighIntentIfNeeded, sourcePage]
  );

  const markCompareUsed = useCallback(
    (vehicleSlug = "", compareSlug = "") => {
      const next = recordSignals({ compareUsed: true });
      trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_COMPARE_CLICKED, {
        source_page: sourcePage,
        vehicle_slug: vehicleSlug,
        compare_slug: compareSlug,
      });
      emitHighIntentIfNeeded(next);
    },
    [recordSignals, emitHighIntentIfNeeded, sourcePage]
  );

  const markReviewViewed = useCallback(
    (vehicleSlug = "") => {
      const next = recordSignals({ reviewViewed: true });
      trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_REVIEW_CLICKED, {
        source_page: sourcePage,
        vehicle_slug: vehicleSlug,
      });
      emitHighIntentIfNeeded(next);
    },
    [recordSignals, emitHighIntentIfNeeded, sourcePage]
  );

  useEffect(() => {
    setSignals(readAssistantIntentSignals());
  }, []);

  const readiness = useMemo(() => resolveBuyerReadiness(signals), [signals]);

  const value = useMemo(
    () => ({
      signals,
      readiness,
      recordSignals,
      markStarted,
      markCompleted,
      markOwnershipUsed,
      markCompareUsed,
      markReviewViewed,
    }),
    [
      signals,
      readiness,
      recordSignals,
      markStarted,
      markCompleted,
      markOwnershipUsed,
      markCompareUsed,
      markReviewViewed,
    ]
  );

  return (
    <AssistantIntentContext.Provider value={value}>
      {children}
    </AssistantIntentContext.Provider>
  );
}

/**
 * @returns {AssistantIntentContextValue}
 */
export function useAssistantIntent() {
  const context = useContext(AssistantIntentContext);
  if (!context) {
    throw new Error("useAssistantIntent must be used within AssistantIntentProvider");
  }
  return context;
}
