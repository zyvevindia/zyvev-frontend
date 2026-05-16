import { Link } from "react-router-dom";

import { pickPersonaFits } from "../../utils/personaFitEngine";

import { vehicleDetailPath } from "../../utils/vehicleRoutes";

const card = {
  background: "white",
  borderRadius: "24px",
  padding: "28px 32px",
  boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
  border: "1px solid #e2e8f0",
  marginBottom: "24px",
};

const h2 = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 16px 0",
};

const list = {
  margin: 0,
  paddingLeft: "20px",
  fontSize: "15px",
  lineHeight: 1.75,
  color: "#475569",
};

const personaChip = {
  display: "inline-block",
  padding: "6px 14px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1e40af",
  fontSize: "13px",
  fontWeight: "600",
  marginRight: "8px",
  marginBottom: "8px",
};

const pathLink = {
  display: "inline-block",
  marginTop: "12px",
  marginRight: "16px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#2563eb",
  textDecoration: "none",
};

function slugLabel(slug) {
  return slug?.replace(/-/g, " ") || "";
}

export default function CatalogDecisionBlocks({
  catalogMeta,
  slug,
}) {
  if (!catalogMeta) return null;

  const decision = catalogMeta.decision;
  const personas = pickPersonaFits(catalogMeta, 3);

  const hasContent =
    personas.length ||
    decision?.whoShouldBuy?.length ||
    decision?.whoShouldAvoid?.length ||
    decision?.bestAlternativeSlug;

  if (!hasContent) return null;

  return (
  <>
      {personas.length > 0 && (
        <article style={card}>
          <h2 style={h2}>Buyer persona fit</h2>
          <div>
            {personas.map((p) => (
              <span key={p.id} style={personaChip}>
                {p.label}
              </span>
            ))}
          </div>
        </article>
      )}

      {(decision?.whoShouldBuy?.length ||
        decision?.whoShouldAvoid?.length) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {decision.whoShouldBuy?.length > 0 && (
            <article style={card}>
              <h2 style={h2}>Who should buy this?</h2>
              <ul style={list}>
                {decision.whoShouldBuy.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </article>
          )}

          {decision.whoShouldAvoid?.length > 0 && (
            <article style={card}>
              <h2 style={h2}>Who should avoid this?</h2>
              <ul style={list}>
                {decision.whoShouldAvoid.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </article>
          )}
        </div>
      )}

      {(decision?.bestAlternativeSlug ||
        decision?.upgradePathSlug ||
        decision?.downgradePathSlug) && (
        <article style={card}>
          <h2 style={h2}>Your decision paths</h2>
          {decision.bestAlternativeSlug && (
            <Link
              style={pathLink}
              to={vehicleDetailPath(
                decision.bestAlternativeSlug
              )}
            >
              Best alternative → {slugLabel(decision.bestAlternativeSlug)}
            </Link>
          )}
          {decision.upgradePathSlug &&
            decision.upgradePathSlug !== slug && (
              <Link
                style={pathLink}
                to={vehicleDetailPath(
                  decision.upgradePathSlug
                )}
              >
                Upgrade path → {slugLabel(decision.upgradePathSlug)}
              </Link>
            )}
          {decision.downgradePathSlug &&
            decision.downgradePathSlug !== slug && (
              <Link
                style={pathLink}
                to={vehicleDetailPath(
                  decision.downgradePathSlug
                )}
              >
                Value downgrade → {slugLabel(decision.downgradePathSlug)}
              </Link>
            )}
        </article>
      )}
    </>
  );
}
