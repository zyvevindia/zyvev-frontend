import { useState } from "react";
import { Link } from "react-router-dom";

import {
  INTERNAL_BETA_TAG,
  LAUNCH_ACK_LINE,
  LAUNCH_KNOWN_LIMITATION,
  LAUNCH_PROFILE,
  MAINTENANCE_NOTE,
  OPS_KNOWN_ISSUES,
  OPS_RELEASE_SUMMARY,
} from "../config/launchProfiles";

const DISMISS_KEY = "evsavari-soft-launch-banner-dismissed";

const wrap = {
  background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)",
  borderBottom: "1px solid #e2e8f0",
  padding: "10px 16px",
  fontSize: "13px",
  color: "#334155",
  lineHeight: 1.5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "wrap",
};

export default function SoftLaunchBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  let message = null;
  if (LAUNCH_PROFILE === "public-beta") {
    message = (
      <>
        EVSavari is in a <strong>controlled public beta</strong> — verify prices
        and charging in your city.{" "}
        <Link to="/how-evsavari-works">How we work</Link>
      </>
    );
  } else if (LAUNCH_PROFILE === "soft-launch") {
    message = (
      <>
        <strong>Early access</strong> — intelligence and prices are updated
        regularly; not dealer quotes.{" "}
        <Link to="/how-evsavari-works">Methodology</Link>
        {" · "}
        <Link to="/trust/freshness">Data freshness</Link>
      </>
    );
  }

  if (!message) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const extraLines = [
    MAINTENANCE_NOTE,
    OPS_RELEASE_SUMMARY,
    OPS_KNOWN_ISSUES,
    LAUNCH_ACK_LINE,
    LAUNCH_KNOWN_LIMITATION,
  ].filter(Boolean);

  return (
    <div style={wrap} role="status">
      <span style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        <span>{message}</span>
        {extraLines.map((line) => (
          <span key={line} style={{ fontSize: "12px", color: "#475569" }}>
            {line}
          </span>
        ))}
        {INTERNAL_BETA_TAG ? (
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            {INTERNAL_BETA_TAG}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={dismiss}
        style={{
          border: "none",
          background: "transparent",
          color: "#64748b",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 600,
        }}
        aria-label="Dismiss banner"
      >
        Dismiss
      </button>
    </div>
  );
}
