/**
 * Subtle controlled-beta notice — shown when VITE_LAUNCH_PROFILE=public-beta
 */

import { LAUNCH_PROFILE } from "../config/launchProfiles";

const wrap = {
  background: "linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 100%)",
  borderBottom: "1px solid #bbf7d0",
  padding: "10px 20px",
  textAlign: "center",
  fontSize: "13px",
  color: "#065f46",
  lineHeight: 1.5,
};

export default function PublicBetaBanner() {
  if (LAUNCH_PROFILE !== "public-beta") return null;

  return (
    <div style={wrap} role="status">
      EVSavari is in a <strong>controlled public beta</strong> — practical EV guidance
      with editorial confidence indicators, not user reviews. Verify prices and
      charging access in your city before booking.
    </div>
  );
}
