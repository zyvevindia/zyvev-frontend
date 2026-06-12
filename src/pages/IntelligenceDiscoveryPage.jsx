import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import SeoHead from "../components/SEO/SeoHead";
import JsonLd from "../components/SEO/JsonLd";
import CarCard from "../components/CarCard";
import CarCardSkeleton from "../components/skeletons/CarCardSkeleton";

import { fetchListingCatalogVariants } from "../utils/vehicleDetailResolver.js";
import { aggregateModelFamilies } from "../utils/modelFamily";
import {
  getDiscoveryPreset,
  INTELLIGENCE_DISCOVERY_PRESETS,
} from "../data/intelligenceDiscoveryPresets";
import { rankFamiliesForPreset } from "../intelligence/discoveryRanking.js";
import { enrichFamiliesWithIntelligence } from "../intelligence/familyIntelligence.js";
import { buildGuideItemListSchema } from "../seo/schema";
import { trackDiscoveryPageEngaged, trackDiscoveryThinResults, trackTrustFaqEngaged } from "../analytics/funnel";
import { buildTrustFaqAnchors } from "../intelligence/trustMetadata.js";

import "../styles/ev-discovery.css";
import "../styles/ev-trust.css";

const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN || "https://evsavari.com";

export default function IntelligenceDiscoveryPage() {
  const { presetSlug } = useParams();
  const navigate = useNavigate();
  const preset = getDiscoveryPreset(presetSlug);

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const thinSignalSentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const normalized = await fetchListingCatalogVariants({ limit: 120 });
        if (!cancelled) {
          if (!normalized.length) throw new Error("empty catalog");
          setCars(normalized);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load EV catalog.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    thinSignalSentRef.current = false;
  }, [presetSlug]);

  const families = useMemo(
    () => enrichFamiliesWithIntelligence(aggregateModelFamilies(cars)),
    [cars]
  );

  const ranked = useMemo(() => {
    if (!preset) return [];
    return rankFamiliesForPreset(families, preset);
  }, [families, preset]);

  useEffect(() => {
    if (!preset || loading) return;
    trackDiscoveryPageEngaged({
      presetSlug: preset.slug,
      resultCount: ranked.length,
    });
  }, [preset, loading, ranked.length]);

  useEffect(() => {
    if (!preset || loading) return;
    const min = preset.minResults ?? 1;
    if (ranked.length >= min) return;
    if (thinSignalSentRef.current) return;
    thinSignalSentRef.current = true;
    trackDiscoveryThinResults({
      presetSlug: preset.slug,
      resultCount: ranked.length,
      minResults: min,
    });
  }, [preset, loading, ranked.length]);

  if (!preset) {
    return (
      <div className="intel-discovery-page">
        <SeoHead
          meta={{
            title: "Discovery page not found | EVSavari",
            description: "Browse EV intelligence guides on EVSavari.",
            robots: "noindex, follow",
            canonical: `${SITE_ORIGIN}/guides`,
          }}
        />
        <div className="intel-discovery-hero">
          <h1>Page not found</h1>
          <p>
            <Link to="/guides">All guides</Link> ·{" "}
            <Link to="/cars">Browse EVs</Link>
          </p>
        </div>
      </div>
    );
  }

  const canonical = `${SITE_ORIGIN}${preset.path}`;
  const meta = {
    title: preset.title,
    description: preset.description,
    canonical,
    robots: ranked.length >= (preset.minResults || 1) ? "index, follow" : "noindex, follow",
  };

  const itemListSchema = buildGuideItemListSchema(
    ranked.map((r, i) => ({
      rank: i + 1,
      displayName: r.family.familyName,
      slug: r.family.familySlug,
      detailPath: `/cars/${r.family.familySlug}`,
    })),
    canonical,
    preset.h1
  );

  const relatedPresets = Object.values(
    INTELLIGENCE_DISCOVERY_PRESETS
  )
    .filter((p) => p.slug !== preset.slug)
    .slice(0, 6);

  const trustFaq = buildTrustFaqAnchors();

  return (
    <div className="intel-discovery-page">
      <SeoHead meta={meta} />
      {itemListSchema && <JsonLd data={itemListSchema} />}

      <header className="intel-discovery-hero">
        <h1>{preset.h1}</h1>
        <p>{preset.description}</p>
        <p style={{ marginTop: 16, fontSize: "0.875rem", opacity: 0.85 }}>
          Rankings use EVSavari intelligence scores — refreshed as catalog data
          is reviewed. Stale or unreviewed models are flagged on detail pages.
          Not paid placements.
        </p>
      </header>

      <div className="intel-discovery-body">
        {loading && (
          <div className="intel-discovery-grid">
            {[1, 2, 3].map((i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && <p>{error}</p>}

        {!loading && ranked.length === 0 && (
          <p>
            Not enough verified data to rank this list yet.{" "}
            <Link to="/cars">Browse all EVs</Link> or try{" "}
            <Link to="/guides">buying guides</Link>.
          </p>
        )}

        {!loading && ranked.length > 0 && (
          <>
            {preset.sortLabel ? (
              <p className="intel-discovery-sort-label">
                Sorted by: {preset.sortLabel}
              </p>
            ) : null}
            <div className="intel-discovery-grid">
              {ranked.map(({ card }) => (
                <CarCard
                  key={card.slug}
                  car={card}
                  showValueScore={Boolean(preset.showValueScore)}
                />
              ))}
            </div>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button
                type="button"
                className="ev-discovery-filter-chip ev-discovery-filter-chip--active"
                onClick={() => {
                  const top = ranked.slice(0, 3).map((r) => r.card);
                  navigate("/compare", { state: { cars: top } });
                }}
              >
                Compare top picks
              </button>
            </div>
          </>
        )}

        {preset.faq?.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 className="cd-section__title">FAQs</h2>
            {preset.faq.map((item) => (
              <details key={item.q} style={{ marginBottom: 12 }}>
                <summary style={{ fontWeight: 700, cursor: "pointer" }}>
                  {item.q}
                </summary>
                <p style={{ color: "#64748b", lineHeight: 1.6 }}>{item.a}</p>
              </details>
            ))}
          </section>
        )}

        <section className="ev-trust-panel" style={{ marginTop: 32 }}>
          <h2 className="cd-section__title">How we estimate EV data</h2>
          <p className="ev-trust-panel__intro">
            Rankings and specs use deterministic EVSavari intelligence — bands
            and labels, not fabricated precision. Figures marked Est. are
            assumptions-based.
          </p>
          <div className="ev-trust-panel__faq">
            {trustFaq.map((item) => (
              <details
                key={item.id}
                onToggle={(e) => {
                  if (e.target.open) {
                    trackTrustFaqEngaged({
                      faqId: item.id,
                      sourcePage: "intelligence_discovery",
                    });
                  }
                }}
              >
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
          <nav style={{ marginTop: 16, fontSize: "0.875rem" }}>
            <Link to="/guides/ownership-running-cost">Running cost guide</Link>
            {" · "}
            <Link to="/guides/ownership-home-charger-install">
              Home charging guide
            </Link>
            {" · "}
            <Link to="/guides/ownership-rain-range">Range in rain</Link>
          </nav>
        </section>

        <nav className="intel-discovery-links" aria-label="Related discovery">
          <h2>More EV intelligence</h2>
          <ul>
            {relatedPresets.map((p) => (
              <li key={p.slug}>
                <Link to={p.path}>{p.h1}</Link>
              </li>
            ))}
            <li>
              <Link to="/compare">Compare tool</Link>
            </li>
            <li>
              <Link to="/cars?intel=city_friendly">City-friendly EVs</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
