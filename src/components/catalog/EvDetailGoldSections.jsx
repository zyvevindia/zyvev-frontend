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
import { formatSafetyIntelligenceCopy } from "../../intelligence/safetyMetadata.js";

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

function shouldRender(only, key) {
  if (!only?.length) return true;
  return only.includes(key);
}

function GoldSection({
  layout,
  id,
  ariaLabelledby,
  collapsible = false,
  defaultOpen = true,
  summaryTitle = "",
  summaryPreview = "",
  children,
}) {
  if (layout === "v2" && collapsible) {
    return (
      <section
        id={id}
        className="cd-section cd-collapsible-section cd-card"
        aria-labelledby={ariaLabelledby}
      >
        <details
          className="cd-collapsible-section__details"
          open={defaultOpen}
        >
          <summary className="cd-collapsible-section__summary">
            <span className="cd-collapsible-section__summary-text">
              <span className="cd-collapsible-section__title">
                {summaryTitle}
              </span>
              {summaryPreview ? (
                <span className="cd-collapsible-section__preview">
                  {summaryPreview}
                </span>
              ) : null}
            </span>
            <span
              className="cd-collapsible-section__chevron"
              aria-hidden
            >
              ▾
            </span>
          </summary>
          <div className="cd-collapsible-section__body cd-content-card">
            {children}
          </div>
        </details>
      </section>
    );
  }

  if (layout === "v2") {
    return (
      <section
        id={id}
        className="cd-section cd-card cd-content-card"
        aria-labelledby={ariaLabelledby}
      >
        {children}
      </section>
    );
  }

  return (
    <section style={section} aria-labelledby={ariaLabelledby}>
      <article style={card}>{children}</article>
    </section>
  );
}

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
  only = null,
  layout = "default",
  collapsibleSections = false,
}) {
  if (!hasCatalogExperience(car)) {
    return null;
  }

  const meta = car.catalogMeta;
  const summary = meta.expertSummary || car.overview;

  const allFaq = [
    ...(meta.faq || []),
    ...(meta.chargingFaq || []),
  ];

  const showIntelligence = hasCatalogIntelligence(car);
  const h2Style = layout === "v2" ? undefined : h2;
  const bodyStyle = layout === "v2" ? undefined : body;
  const titleClass = layout === "v2" ? "cd-section__title" : undefined;
  const wrapperStyle =
    layout === "v2" ? undefined : { marginTop: "40px" };

  const hasCharging =
    meta.chargingSummary ||
    meta.chargingEcosystem ||
    meta.chargingFaq?.length > 0;

  return (
    <div style={wrapperStyle}>
      {showIntelligence &&
        shouldRender(only, "intelligence") && (
          <section style={section}>
            <CatalogDecisionBlocks catalogMeta={meta} slug={slug} />
          </section>
        )}

      {shouldRender(only, "trust") && layout !== "v2" && (
        <section style={section}>
          <TrustConfidenceBlock car={car} />
          <OwnershipRealityPanel car={car} />
        </section>
      )}

      {shouldRender(only, "fit-life") && (
        <GoldSection
          layout={layout}
          ariaLabelledby="ev-quick-decision"
        >
          <h2
            id="ev-quick-decision"
            className={titleClass}
            style={h2Style}
          >
            Should this EV fit your life?
          </h2>
          <p style={bodyStyle || body}>{summary}</p>
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
                ...(bodyStyle || body),
                marginTop: "16px",
                fontWeight: "600",
                color: "#1d4ed8",
              }}
            >
              EVSavari value score: {meta.compareValueScore}/100 in its
              segment
            </p>
          )}
        </GoldSection>
      )}

      {shouldRender(only, "ownership") && (
        <GoldSection
          layout={layout}
          ariaLabelledby="ev-ownership"
        >
          {layout === "v2" && (
            <>
              <TrustConfidenceBlock car={car} />
              <OwnershipRealityPanel car={car} />
            </>
          )}
          <h2
            id="ev-ownership"
            className={titleClass}
            style={h2Style}
          >
            Ownership confidence
          </h2>
          {meta.psychologyNarrative && (
            <p style={{ ...(bodyStyle || body), marginBottom: "20px" }}>
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
            <p style={{ ...(bodyStyle || body), marginTop: "16px" }}>
              Battery warranty: up to{" "}
              {meta.ownershipWarranty.batteryYears} years
              {meta.ownershipWarranty.batteryKm
                ? ` / ${meta.ownershipWarranty.batteryKm.toLocaleString()} km`
                : ""}
              . Always confirm with the OEM for your variant and city.
            </p>
          )}
        </GoldSection>
      )}

      {showIntelligence &&
        meta.safety &&
        shouldRender(only, "safety") && (
          <GoldSection layout={layout} ariaLabelledby="ev-safety">
            <h2 id="ev-safety" className={titleClass} style={h2Style}>
              Safety & driver assistance
            </h2>
            <ul
              className="ev-safety-intel-list"
              style={{
                margin: 0,
                paddingLeft: "1.1rem",
                color: "#475569",
                lineHeight: 1.55,
                fontSize: "0.9375rem",
              }}
            >
              {formatSafetyIntelligenceCopy(meta.safety).lines.map(
                (line) => (
                  <li key={line}>{line}</li>
                )
              )}
            </ul>
          </GoldSection>
        )}

      {hasCharging && shouldRender(only, "charging") && (
        <GoldSection
          layout={layout}
          id={layout === "v2" ? "charging" : undefined}
          ariaLabelledby="ev-charging"
          collapsible={
            collapsibleSections && layout === "v2"
          }
          summaryTitle="Charging confidence"
          summaryPreview="Charging options, speed, and real-world range confidence."
        >
          {!(collapsibleSections && layout === "v2") && (
            <h2
              id="ev-charging"
              className={titleClass}
              style={h2Style}
            >
              Charging confidence
            </h2>
          )}
          <details
            open={layout === "v2"}
            onToggle={(e) => {
              if (e.target.open) {
                trackBuyerEvent(
                  BUYER_EVENTS.CHARGING_REALITY_EXPANDED,
                  {
                    vehicleSlugs: car?.slug ? [car.slug] : [],
                    sourcePage: window.location.pathname,
                    panel: "charging_reality",
                  }
                );
              }
            }}
          >
            {layout !== "v2" && (
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
            )}
            {meta.chargingSummary && (
              <p style={bodyStyle || body}>{meta.chargingSummary}</p>
            )}
            {meta.chargingEcosystem?.networkCompatibility?.length > 0 && (
              <p style={{ ...(bodyStyle || body), marginTop: "12px" }}>
                Network compatibility:{" "}
                {meta.chargingEcosystem.networkCompatibility
                  .slice(0, 4)
                  .join(", ")}
                .
              </p>
            )}
            {meta.chargingEcosystem?.estimatedChargingCost && (
              <p
                style={{
                  ...(bodyStyle || body),
                  marginTop: "8px",
                  fontSize: "13px",
                }}
              >
                Indicative energy cost: AC ~₹
                {meta.chargingEcosystem.estimatedChargingCost.acPerKwhInr}
                /kWh, DC ~₹
                {meta.chargingEcosystem.estimatedChargingCost.dcPerKwhInr}
                /kWh.
              </p>
            )}
            {meta.realWorldRangeKm && (
              <p style={{ ...(bodyStyle || body), marginTop: "12px" }}>
                Real-world range estimate: {meta.realWorldRangeKm.min}–
                {meta.realWorldRangeKm.max} km (mixed use; not ARAI certified).
                {meta.claimedRangeKm && (
                  <> Certified (ARAI): {meta.claimedRangeKm} km.</>
                )}
              </p>
            )}
          </details>
        </GoldSection>
      )}

      {meta.pros?.length > 0 && shouldRender(only, "pros") && (
        <GoldSection
          layout={layout}
          id={layout === "v2" ? "detail-reviews" : undefined}
          ariaLabelledby="ev-pros"
        >
          <h2 id="ev-pros" className={titleClass} style={h2Style}>
            What owners love
          </h2>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {meta.pros.map((item, i) => (
              <li
                key={i}
                style={{ ...(bodyStyle || body), marginBottom: "8px" }}
              >
                {item}
              </li>
            ))}
          </ul>
        </GoldSection>
      )}

      {meta.cons?.length > 0 && shouldRender(only, "cons") && (
        <GoldSection layout={layout} ariaLabelledby="ev-cons">
          <h2 id="ev-cons" className={titleClass} style={h2Style}>
            Honest trade-offs
          </h2>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {meta.cons.map((item, i) => (
              <li
                key={i}
                style={{ ...(bodyStyle || body), marginBottom: "8px" }}
              >
                {item}
              </li>
            ))}
          </ul>
        </GoldSection>
      )}

      {meta.ownershipCost5yr?.totalInr &&
        shouldRender(only, "cost") && (
          <GoldSection layout={layout} ariaLabelledby="ev-cost">
            <h2 id="ev-cost" className={titleClass} style={h2Style}>
              Cost of ownership insight
            </h2>
            <p style={bodyStyle || body}>
              Indicative 5-year ownership: ₹
              {meta.ownershipCost5yr.totalInr.toLocaleString()} (energy,
              service, insurance estimates). Use this as a planning guide—not a
              quote.
            </p>
          </GoldSection>
        )}

      {meta.compareRivals?.length > 0 &&
        shouldRender(only, "compare-rivals") && (
          <GoldSection
            layout={layout}
            id={layout === "v2" ? "compare" : undefined}
            ariaLabelledby="ev-compare-rivals"
            collapsible={
              collapsibleSections && layout === "v2"
            }
            summaryTitle="Compare"
            summaryPreview="See how this EV stacks up against similar models on EVSavari."
          >
            {!(collapsibleSections && layout === "v2") && (
              <h2
                id="ev-compare-rivals"
                className={titleClass}
                style={h2Style}
              >
                Compare with rivals
              </h2>
            )}
            <p style={{ ...(bodyStyle || body), marginBottom: "16px" }}>
              See how this EV stacks up against similar models on EVSavari.
            </p>
            <div style={tagRow}>
              {meta.compareRivals.slice(0, 4).map((rivalSlug) => (
                <Link
                  key={rivalSlug}
                  to={vehicleDetailPath(rivalSlug)}
                  style={{ ...tag, textDecoration: "none" }}
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
                trackBuyerEvent(BUYER_EVENTS.COMPARE_STARTED, {
                  vehicleSlugs: meta.compareRivals?.slice(0, 4) || [],
                  sourcePage: window.location.pathname,
                  sessionIntent: "detail_compare_rivals",
                });
                window.location.href = "/compare";
              }}
            >
              Open compare tool
            </button>
          </GoldSection>
        )}

      {allFaq.length > 0 && shouldRender(only, "faq") && (
        <GoldSection
          layout={layout}
          id={layout === "v2" ? "faqs" : undefined}
          ariaLabelledby="ev-faq"
          collapsible={
            collapsibleSections && layout === "v2"
          }
          summaryTitle="FAQs"
          summaryPreview="Find answers to the most common questions about this EV."
        >
          {!(collapsibleSections && layout === "v2") && (
            <h2 id="ev-faq" className={titleClass} style={h2Style}>
              EV buyer FAQs
            </h2>
          )}
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
              <p style={{ ...(bodyStyle || body), marginTop: "8px" }}>
                {item.a}
              </p>
            </details>
          ))}
        </GoldSection>
      )}
    </div>
  );
}
