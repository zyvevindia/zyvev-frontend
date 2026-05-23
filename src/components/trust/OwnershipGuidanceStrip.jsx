import { useState } from "react";

import { buildOwnershipGuidance } from "../../utils/ownershipGuidanceCopy.js";
import {
  trackOwnershipTooltipOpened,
  trackChargingPracticalityOpened,
  trackSuitabilityGuidanceOpened,
} from "../../analytics/funnel.js";

const chargingReadabilityNote =
  "Charging notes are practical, not promotional — confirm society rules and tariff locally.";

const strip = {
  fontSize: "0.8rem",
  color: "#475569",
  lineHeight: 1.5,
  margin: "8px 0 0",
  padding: "8px 12px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
};

const toggle = {
  background: "none",
  border: "none",
  padding: 0,
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#0369a1",
  cursor: "pointer",
  textDecoration: "underline",
};

/**
 * Subtle ownership + charging guidance — expandable, no fear tone.
 */
export default function OwnershipGuidanceStrip({
  car,
  variant = "compare",
  onExpand,
}) {
  const [open, setOpen] = useState(false);
  if (!car) return null;

  const g = buildOwnershipGuidance(car);
  const hasContent =
    g.worksBestWhen.length ||
    g.considerIf.length ||
    g.lessIdealFor.length ||
    g.goodFitFor.length;

  if (!hasContent) return null;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      trackOwnershipTooltipOpened({
        sourcePage: typeof window !== "undefined" ? window.location.pathname : "",
        panel: "ownership_guidance",
        vehicleSlugs: car.slug ? [car.slug] : [],
      });
      trackChargingPracticalityOpened({ vehicleSlugs: car.slug ? [car.slug] : [] });
      trackSuitabilityGuidanceOpened({ vehicleSlugs: car.slug ? [car.slug] : [] });
      onExpand?.();
    }
  };

  return (
    <div style={strip} aria-live="polite">
      <button type="button" style={toggle} onClick={handleToggle}>
        {open ? "Hide ownership practicality" : "Ownership & charging practicality"}
      </button>
      {open ? (
        <div style={{ marginTop: 8 }}>
          {g.worksBestWhen.length > 0 ? (
            <p style={{ margin: "0 0 6px" }}>
              <strong>Works best when:</strong> {g.worksBestWhen.join(" · ")}
            </p>
          ) : null}
          {g.considerIf.length > 0 ? (
            <p style={{ margin: "0 0 6px" }}>
              <strong>Consider this if:</strong> {g.considerIf.join(" · ")}
            </p>
          ) : null}
          {g.lessIdealFor.length > 0 ? (
            <p style={{ margin: "0 0 6px" }}>
              <strong>Less ideal for:</strong> {g.lessIdealFor.join(" · ")}
            </p>
          ) : null}
          {g.goodFitFor.length > 0 ? (
            <p style={{ margin: "0 0 6px" }}>
              <strong>Good fit for:</strong> {g.goodFitFor.join(" · ")}
            </p>
          ) : null}
          <p style={{ margin: variant === "detail" ? "0 0 6px" : 0, fontSize: "0.75rem", color: "#64748b" }}>
            {g.ownershipPracticality} {g.chargingPracticality}
          </p>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "#94a3b8" }}>
            {chargingReadabilityNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}
