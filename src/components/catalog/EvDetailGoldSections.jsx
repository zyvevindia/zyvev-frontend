import { Link } from "react-router-dom";

import CatalogDecisionBlocks from "./CatalogDecisionBlocks";

import {
  formatPsychologyTag,
  hasCatalogExperience,
} from "../../utils/catalogExperience";

import { hasCatalogIntelligence } from "../../utils/catalogIntelligence";

import OwnershipRealityPanel from "./OwnershipRealityPanel";

import TrustConfidenceBlock from "./TrustConfidenceBlock";

import { vehicleDetailPath } from "../../utils/vehicleRoutes";

import { trackBuyerEvent } from "../../event-tracking/trackBuyerEvent";

import { BUYER_EVENTS } from "../../event-tracking/eventTypes";

const section = {
  marginTop: "48px",
  padding: "0 20px",
  maxWidth: "1200px",
  marginLeft: "auto",
  marginRight: "auto",
};

const card = {
  background: "white",
  borderRadius: "24px",
  padding: "28px 32px",
  boxShadow:
    "0 14px 40px rgba(15,23,42,0.06)",
  border: "1px solid #e2e8f0",
  marginBottom: "24px",
};

const h2 = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 16px 0",
};

const body = {
  fontSize: "15px",
  lineHeight: 1.75,
  color: "#475569",
  margin: 0,
};

const tagRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
};

const tag = {
  padding: "6px 14px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1e40af",
  fontSize: "13px",
  fontWeight: "600",
};

function ScoreBar({ label, value }) {
  if (value == null) return null;
  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "13px",
          marginBottom: "4px",
          color: "#334155",
        }}
      >
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div
        style={{
          height: "8px",
          borderRadius: "4px",
          background: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, value)}%`,
            height: "100%",
            background:
              "linear-gradient(90deg,#2563eb,#1d4ed8)",
            borderRadius: "4px",
          }}
        />
      </div>
    </div>
  );
}

export default function EvDetailGoldSections({
  car,
  slug,
}) {
  if (!hasCatalogExperience(car)) {
    return null;
  }

  const meta = car.catalogMeta;
  const summary =
    meta.expertSummary || car.overview;

  const allFaq = [
    ...(meta.faq || []),
    ...(meta.chargingFaq || []),
  ];

  const showIntelligence = hasCatalogIntelligence(car);

  return (
    <div style={{ marginTop: "40px" }}>
      {showIntelligence && (
        <section style={section}>
          <CatalogDecisionBlocks
            catalogMeta={meta}
            slug={slug}
          />
        </section>
      )}

      <section style={section}>
        <TrustConfidenceBlock car={car} />

        <OwnershipRealityPanel car={car} />
      </section>

      {/* Quick decision */}
      <section style={section} aria-labelledby="ev-quick-decision">
        <article style={card}>
          <h2 id="ev-quick-decision" style={h2}>
            Should this EV fit your life?
          </h2>
          <p style={body}>{summary}</p>
          {meta.psychologyTags?.length > 0 && (
            <div style={tagRow}>
              {meta.psychologyTags.map((t) => (
                <span key={t} style={tag}>
                  {formatPsychologyTag(t)}
                </span>
              ))}
            </div>
          )}
          {meta.compareValueScore != null && (
            <p
              style={{
                ...body,
                marginTop: "16px",
                fontWeight: "600",
                color: "#1d4ed8",
              }}
            >
              EVSavari value score: {meta.compareValueScore}/100 in its
              segment
            </p>
          )}
        </article>
      </section>

      {/* Ownership & suitability */}
      <section style={section} aria-labelledby="ev-ownership">
        <article style={card}>
          <h2 id="ev-ownership" style={h2}>
            Ownership confidence
          </h2>
          {meta.psychologyNarrative && (
            <p style={{ ...body, marginBottom: "20px" }}>
              {meta.psychologyNarrative}
            </p>
          )}
          <ScoreBar
            label="Family suitability"
            value={meta.suitabilityScores?.family}
          />
          <ScoreBar
            label="City driving"
            value={meta.suitabilityScores?.city}
          />
          <ScoreBar
            label="Highway comfort"
            value={meta.suitabilityScores?.highway}
          />
          {meta.ownershipWarranty?.batteryYears && (
            <p style={{ ...body, marginTop: "16px" }}>
              Battery warranty: up to{" "}
              {meta.ownershipWarranty.batteryYears} years
              {meta.ownershipWarranty.batteryKm
                ? ` / ${meta.ownershipWarranty.batteryKm.toLocaleString()} km`
                : ""}
              . Always confirm with the OEM for your variant and city.
            </p>
          )}
        </article>
      </section>

      {showIntelligence && meta.safety && (
        <section style={section} aria-labelledby="ev-safety">
          <article style={card}>
            <h2 id="ev-safety" style={h2}>
              Safety & driver assistance
            </h2>
            <p style={body}>
              {meta.safety.airbags?.count != null && (
                <>
                  {meta.safety.airbags.count} airbags
                  {meta.safety.adas?.level != null
                    ? ` · ADAS level ${meta.safety.adas.level}`
                    : ""}
                  {meta.safety.stability?.esc
                    ? " · ESC"
                    : ""}
                  {meta.safety.stability?.hillHold
                    ? " · Hill hold"
                    : ""}
                  .
                </>
              )}
              {meta.safety.bharatNcap?.stars != null && (
                <>
                  {" "}
                  Bharat NCAP: {meta.safety.bharatNcap.stars}★
                  (verify latest test for your variant).
                </>
              )}
            </p>
          </article>
        </section>
      )}

      {/* Charging */}
      {(meta.chargingSummary ||
        meta.chargingEcosystem ||
        meta.chargingFaq?.length > 0) && (
        <section style={section} aria-labelledby="ev-charging">
          <article style={card}>
            <h2 id="ev-charging" style={h2}>
              Charging confidence
            </h2>
            <details
              onToggle={(e) => {
                if (e.target.open) {
                  trackBuyerEvent(
                    BUYER_EVENTS.CHARGING_REALITY_EXPANDED,
                    {
                      vehicleSlugs: car?.slug
                        ? [car.slug]
                        : [],
                      sourcePage:
                        window.location.pathname,
                      panel: "charging_reality",
                    }
                  );
                }
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  marginBottom: "12px",
                  color: "#2563eb",
                }}
              >
                View charging & range details
              </summary>
            {meta.chargingSummary && (
              <p style={body}>{meta.chargingSummary}</p>
            )}
            {meta.chargingEcosystem?.networkCompatibility
              ?.length > 0 && (
              <p style={{ ...body, marginTop: "12px" }}>
                Network compatibility:{" "}
                {meta.chargingEcosystem.networkCompatibility
                  .slice(0, 4)
                  .join(", ")}
                .
              </p>
            )}
            {meta.chargingEcosystem?.estimatedChargingCost && (
              <p style={{ ...body, marginTop: "8px", fontSize: "13px" }}>
                Indicative energy cost: AC ~₹
                {
                  meta.chargingEcosystem.estimatedChargingCost
                    .acPerKwhInr
                }
                /kWh, DC ~₹
                {
                  meta.chargingEcosystem.estimatedChargingCost
                    .dcPerKwhInr
                }
                /kWh.
              </p>
            )}
            {meta.realWorldRangeKm && (
              <p style={{ ...body, marginTop: "12px" }}>
                Real-world range estimate:{" "}
                {meta.realWorldRangeKm.min}–
                {meta.realWorldRangeKm.max} km (mixed use; not
                ARAI certified).
                {meta.claimedRangeKm && (
                  <>
                    {" "}
                    Certified (ARAI): {meta.claimedRangeKm} km.
                  </>
                )}
              </p>
            )}
            </details>
          </article>
        </section>
      )}

      {/* Pros / cons */}
      {(meta.pros?.length || meta.cons?.length) && (
        <section style={section} aria-labelledby="ev-pros-cons">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {meta.pros?.length > 0 && (
              <article style={card}>
                <h2 id="ev-pros-cons" style={h2}>
                  What owners love
                </h2>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {meta.pros.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        ...body,
                        marginBottom: "8px",
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            )}
            {meta.cons?.length > 0 && (
              <article style={card}>
                <h2 style={h2}>Honest trade-offs</h2>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {meta.cons.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        ...body,
                        marginBottom: "8px",
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </div>
        </section>
      )}

      {/* Cost of ownership */}
      {meta.ownershipCost5yr?.totalInr && (
        <section style={section} aria-labelledby="ev-cost">
          <article style={card}>
            <h2 id="ev-cost" style={h2}>
              Cost of ownership insight
            </h2>
            <p style={body}>
              Indicative 5-year ownership: ₹
              {meta.ownershipCost5yr.totalInr.toLocaleString()}{" "}
              (energy, service, insurance estimates). Use this as a
              planning guide—not a quote.
            </p>
          </article>
        </section>
      )}

      {/* Compare rivals */}
      {meta.compareRivals?.length > 0 && (
        <section style={section} aria-labelledby="ev-compare-rivals">
          <article style={card}>
            <h2 id="ev-compare-rivals" style={h2}>
              Compare with rivals
            </h2>
            <p style={{ ...body, marginBottom: "16px" }}>
              See how this EV stacks up against similar models on
              EVSavari.
            </p>
            <div style={tagRow}>
              {meta.compareRivals.slice(0, 4).map((rivalSlug) => (
                <Link
                  key={rivalSlug}
                  to={vehicleDetailPath(rivalSlug)}
                  style={{
                    ...tag,
                    textDecoration: "none",
                  }}
                >
                  {rivalSlug.replace(/-/g, " ")}
                </Link>
              ))}
            </div>
            <button
              type="button"
              style={{
                marginTop: "16px",
                padding: "12px 20px",
                borderRadius: "12px",
                border: "none",
                background:
                  "linear-gradient(135deg,#2563eb,#1d4ed8)",
                color: "white",
                fontWeight: "700",
                cursor: "pointer",
              }}
              onClick={() => {
                trackBuyerEvent(
                  BUYER_EVENTS.COMPARE_STARTED,
                  {
                    vehicleSlugs:
                      meta.compareRivals?.slice(0, 4) || [],
                    sourcePage: window.location.pathname,
                    sessionIntent: "detail_compare_rivals",
                  }
                );
                window.location.href = "/compare";
              }}
            >
              Open compare tool
            </button>
          </article>
        </section>
      )}

      {/* FAQs */}
      {allFaq.length > 0 && (
        <section style={section} aria-labelledby="ev-faq">
          <article style={card}>
            <h2 id="ev-faq" style={h2}>
              EV buyer FAQs
            </h2>
            {allFaq.map((item, i) => (
              <details
                key={i}
                style={{
                  marginBottom: "12px",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "12px",
                }}
              >
                <summary
                  style={{
                    fontWeight: "700",
                    color: "#0f172a",
                    cursor: "pointer",
                    fontSize: "15px",
                  }}
                >
                  {item.q}
                </summary>
                <p style={{ ...body, marginTop: "8px" }}>
                  {item.a}
                </p>
              </details>
            ))}
          </article>
        </section>
      )}
    </div>
  );
}
