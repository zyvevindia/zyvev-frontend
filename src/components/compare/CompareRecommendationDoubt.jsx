import { useEffect, useState } from "react";

import { shouldShowRecommendationDoubt } from "../../utils/compareTrustEligibility.js";
import {
  trackRecommendationDoubted,
  trackCompareAbandonAfterGuidance,
} from "../../analytics/funnel.js";

const wrap = {
  marginTop: 8,
  paddingTop: 8,
  borderTop: "1px solid #fde68a",
  fontSize: "0.78rem",
  color: "#64748b",
};

const linkBtn = {
  background: "none",
  border: "none",
  padding: 0,
  fontSize: "inherit",
  color: "#0369a1",
  cursor: "pointer",
  textDecoration: "underline",
};

const quietBtn = {
  fontSize: "0.75rem",
  padding: "4px 10px",
  marginRight: 8,
  marginTop: 6,
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#475569",
  cursor: "pointer",
};

/**
 * Subtle recommendation feedback — only when maturity/confidence warrants it.
 */
export default function CompareRecommendationDoubt({
  cars = [],
  recommendedSlug = null,
  guidanceWasOpened = false,
}) {
  const recommended = recommendedSlug
    ? cars.find((c) => c.slug === recommendedSlug) || cars[0]
    : cars[0];

  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!recommended || !shouldShowRecommendationDoubt(recommended)) {
    return null;
  }

  if (acknowledged) return null;

  const sourcePage =
    typeof window !== "undefined" ? window.location.pathname : "compare";

  const handleHardToTell = () => {
    trackRecommendationDoubted({
      sourcePage,
      reason: "usage_unclear",
    });
    setAcknowledged(true);
    setOpen(false);
  };

  const handleMostlyYes = () => {
    setAcknowledged(true);
    setOpen(false);
  };

  useEffect(() => {
    if (!guidanceWasOpened || typeof window === "undefined") return undefined;
    const onLeave = () => {
      trackCompareAbandonAfterGuidance({
        vehicleSlugs: cars.map((c) => c.slug).filter(Boolean),
        sourcePage,
      });
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [guidanceWasOpened, cars, sourcePage]);

  return (
    <div style={wrap} aria-live="polite">
      {!open ? (
        <p style={{ margin: 0 }}>
          Not sure this fits your usage?{" "}
          <button
            type="button"
            style={linkBtn}
            onClick={() => setOpen(true)}
          >
            Help improve compare guidance
          </button>
        </p>
      ) : (
        <div>
          <p style={{ margin: "0 0 4px", color: "#475569" }}>
            Did this recommendation feel realistic for your driving pattern?
          </p>
          <button type="button" style={quietBtn} onClick={handleMostlyYes}>
            Mostly yes
          </button>
          <button type="button" style={quietBtn} onClick={handleHardToTell}>
            Hard to tell for my usage
          </button>
        </div>
      )}
    </div>
  );
}
