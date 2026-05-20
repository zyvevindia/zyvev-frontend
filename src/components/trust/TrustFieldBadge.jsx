import { VERIFICATION_BADGE } from "../../intelligence/trustMetadata.js";

const STYLES = {
  [VERIFICATION_BADGE.OFFICIAL]: "ev-trust-badge--official",
  [VERIFICATION_BADGE.ESTIMATED]: "ev-trust-badge--estimated",
  [VERIFICATION_BADGE.VERIFIED]: "ev-trust-badge--verified",
  [VERIFICATION_BADGE.PARTIAL]: "ev-trust-badge--partial",
  [VERIFICATION_BADGE.UNAVAILABLE]: "ev-trust-badge--unavailable",
};

export default function TrustFieldBadge({
  badge = VERIFICATION_BADGE.ESTIMATED,
  label,
  title,
}) {
  const text =
    label ||
    (badge === VERIFICATION_BADGE.OFFICIAL
      ? "Official"
      : badge === VERIFICATION_BADGE.VERIFIED
        ? "Reviewed"
        : badge === VERIFICATION_BADGE.UNAVAILABLE
          ? "N/A"
          : "Est.");

  return (
    <span
      className={`ev-trust-badge ${STYLES[badge] || STYLES[VERIFICATION_BADGE.ESTIMATED]}`}
      title={title}
    >
      {text}
    </span>
  );
}
