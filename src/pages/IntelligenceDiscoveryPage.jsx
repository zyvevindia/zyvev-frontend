import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import SeoHead from "../components/SEO/SeoHead";
import JsonLd from "../components/SEO/JsonLd";
import CarCard from "../components/CarCard";
import CarCardSkeleton from "../components/skeletons/CarCardSkeleton";
import DiscoveryPageSearch from "../components/discovery/DiscoveryPageSearch";
import BudgetPriceFilterChips from "../components/discovery/BudgetPriceFilterChips";

import { fetchListingCatalogVariants } from "../utils/vehicleDetailResolver.js";
import { aggregateModelFamilies } from "../utils/modelFamily";
import {
  getDiscoveryPreset,
  INTELLIGENCE_DISCOVERY_PRESETS,
} from "../data/intelligenceDiscoveryPresets";
import {
  BUDGET_DISCOVERY_PRICE_PARAM,
  BUDGET_LEGACY_PRESET_TO_PRICE,
  parseBudgetPriceFilterId,
  getBudgetPriceFilterOption,
} from "../data/budgetDiscoveryFilters";
import { rankFamiliesForPreset } from "../intelligence/discoveryRanking.js";
import { enrichFamiliesWithIntelligence } from "../intelligence/familyIntelligence.js";
import { buildGuideItemListSchema } from "../seo/schema";
import {
  trackDiscoveryPageEngaged,
  trackDiscoveryThinResults,
  trackTrustFaqEngaged,
} from "../analytics/funnel";
import { buildTrustFaqAnchors } from "../intelligence/trustMetadata.js";
import useDebouncedValue from "../hooks/useDebouncedValue";

import "../styles/ev-discovery.css";
import "../styles/ev-trust.css";
import "../styles/catalog-listing-a11y.css";

const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN || "https://evsavari.com";

const BUDGET_HUB_SLUG = "budget-evs";
const NAV_OFFSET_PX = 88;

export default function IntelligenceDiscoveryPage() {
  const { presetSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const preset = getDiscoveryPreset(presetSlug);

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [intelHighlight, setIntelHighlight] = useState(false);
  const thinSignalSentRef = useRef(false);
  const intelHighlightTimerRef = useRef(null);

  const debouncedSearch = useDebouncedValue(search, 400);

  const isBudgetHub = preset?.slug === BUDGET_HUB_SLUG;
  const showBudgetFilters = Boolean(preset?.budgetPriceFilters);

  const budgetPriceId = useMemo(() => {
    if (!showBudgetFilters) return "all";
    if (isBudgetHub) {
      return parseBudgetPriceFilterId(
        searchParams.get(BUDGET_DISCOVERY_PRICE_PARAM)
      );
    }
    return BUDGET_LEGACY_PRESET_TO_PRICE[preset?.slug] || "all";
  }, [showBudgetFilters, isBudgetHub, searchParams, preset?.slug]);

  useEffect(() => {
    if (!preset?.redirectToBudgetHub) return;
    const price =
      BUDGET_LEGACY_PRESET_TO_PRICE[preset.slug] || "all";
    const next = new URLSearchParams();
    if (price !== "all") {
      next.set(BUDGET_DISCOVERY_PRICE_PARAM, price);
    }
    const query = next.toString();
    navigate(
      `/discover/${BUDGET_HUB_SLUG}${query ? `?${query}` : ""}`,
      { replace: true }
    );
  }, [preset, navigate]);

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
  }, [presetSlug, budgetPriceId, debouncedSearch]);

  useEffect(
    () => () => {
      if (intelHighlightTimerRef.current) {
        window.clearTimeout(intelHighlightTimerRef.current);
      }
    },
    []
  );

  const families = useMemo(
    () => enrichFamiliesWithIntelligence(aggregateModelFamilies(cars)),
    [cars]
  );

  const { ranked, fallbackNotice } = useMemo(() => {
    if (!preset || preset.redirectToBudgetHub) {
      return { ranked: [], fallbackNotice: null };
    }

    const extraFilterIds = showBudgetFilters
      ? getBudgetPriceFilterOption(budgetPriceId).filterIds
      : [];

    return rankFamiliesForPreset(families, preset, {
      search: preset.enableSearch ? debouncedSearch : "",
      extraFilterIds: isBudgetHub ? extraFilterIds : [],
    });
  }, [
    families,
    preset,
    showBudgetFilters,
    budgetPriceId,
    debouncedSearch,
    isBudgetHub,
  ]);

  useEffect(() => {
    if (!preset || preset.redirectToBudgetHub || loading) return;
    trackDiscoveryPageEngaged({
      presetSlug: preset.slug,
      resultCount: ranked.length,
    });
  }, [preset, loading, ranked.length]);

  useEffect(() => {
    if (!preset || preset.redirectToBudgetHub || loading) return;
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

  const handleBudgetPriceChange = (nextId) => {
    if (!isBudgetHub) {
      navigate(`/discover/${BUDGET_HUB_SLUG}?${BUDGET_DISCOVERY_PRICE_PARAM}=${nextId}`);
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (nextId === "all") {
      next.delete(BUDGET_DISCOVERY_PRICE_PARAM);
    } else {
      next.set(BUDGET_DISCOVERY_PRICE_PARAM, nextId);
    }
    setSearchParams(next, { replace: true });
  };

  const scrollToMoreIntelligence = () => {
    const target = document.getElementById("more-ev-intelligence");
    if (!target) return;

    const top =
      target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET_PX;
    window.scrollTo({ top, behavior: "smooth" });

    setIntelHighlight(true);
    if (intelHighlightTimerRef.current) {
      window.clearTimeout(intelHighlightTimerRef.current);
    }
    intelHighlightTimerRef.current = window.setTimeout(() => {
      setIntelHighlight(false);
    }, 2000);
  };

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

  if (preset.redirectToBudgetHub) {
    return (
      <div className="intel-discovery-page">
        <div className="intel-discovery-body">
          <div className="intel-discovery-grid">
            {[1, 2, 3].map((i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const canonical = `${SITE_ORIGIN}${preset.path}`;
  const meta = {
    title: preset.title,
    description: preset.description,
    canonical,
    robots:
      ranked.length >= (preset.minResults || 1) ? "index, follow" : "noindex, follow",
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

  const relatedPresets = Object.values(INTELLIGENCE_DISCOVERY_PRESETS)
    .filter(
      (p) =>
        p.slug !== preset.slug &&
        !p.redirectToBudgetHub &&
        p.slug !== BUDGET_HUB_SLUG
    )
    .slice(0, 6);

  const trustFaq = buildTrustFaqAnchors();

  return (
    <div className="intel-discovery-page">
      <SeoHead meta={meta} />
      {itemListSchema && <JsonLd data={itemListSchema} />}

      <header className="intel-discovery-hero">
        <h1>{preset.h1}</h1>
        <p>{preset.description}</p>
        <p className="intel-discovery-hero__note">
          Rankings use EVSavari intelligence scores — refreshed as catalog data
          is reviewed. Stale or unreviewed models are flagged on detail pages.
          Not paid placements.
        </p>
      </header>

      <div className="intel-discovery-body">
        {preset.enableSearch || showBudgetFilters ? (
          <div
            id="discovery-search"
            className="intel-discovery-toolbar listing-filter-card"
          >
            {preset.enableSearch ? (
              <DiscoveryPageSearch value={search} onChange={setSearch} />
            ) : null}

            {showBudgetFilters ? (
              <BudgetPriceFilterChips
                activeId={budgetPriceId}
                onChange={handleBudgetPriceChange}
              />
            ) : null}
          </div>
        ) : null}

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
            {debouncedSearch.trim()
              ? "No EVs match your search. Try another name or clear filters."
              : "Not enough verified data to rank this list yet."}{" "}
            <Link to="/cars">Browse all EVs</Link> or try{" "}
            <Link to="/guides">buying guides</Link>.
          </p>
        )}

        {!loading && ranked.length > 0 && (
          <>
            {fallbackNotice ? (
              <p className="intel-discovery-fallback-notice">{fallbackNotice}</p>
            ) : null}

            <div className="intel-discovery-meta-row">
              {preset.sortLabel ? (
                <p className="intel-discovery-sort-label">
                  Sorted by: {preset.sortLabel}
                </p>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="intel-discovery-intel-jump"
                onClick={scrollToMoreIntelligence}
              >
                More EV Intelligence ↓
              </button>
            </div>

            <div className="intel-discovery-grid">
              {ranked.map(({ card }) => (
                <CarCard
                  key={card.slug}
                  car={card}
                  showValueScore={Boolean(preset.showValueScore)}
                />
              ))}
            </div>

            <div className="intel-discovery-compare-cta">
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
          <section className="intel-discovery-faq">
            <h2 className="cd-section__title">FAQs</h2>
            {preset.faq.map((item) => (
              <details key={item.q} className="intel-discovery-faq__item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>
        )}

        <section className="ev-trust-panel intel-discovery-trust">
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
          <nav className="intel-discovery-trust__links">
            <Link to="/guides/ownership-running-cost">Running cost guide</Link>
            {" · "}
            <Link to="/guides/ownership-home-charger-install">
              Home charging guide
            </Link>
            {" · "}
            <Link to="/guides/ownership-rain-range">Range in rain</Link>
          </nav>
        </section>

        <nav
          id="more-ev-intelligence"
          className={`intel-discovery-links${
            intelHighlight ? " intel-discovery-links--highlight" : ""
          }`}
          aria-label="Related discovery"
        >
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
