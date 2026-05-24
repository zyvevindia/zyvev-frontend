import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "../styles/compare-page.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import JsonLd from "../components/SEO/JsonLd";
import SeoHead from "../components/SEO/SeoHead";
import { buildCompareToolMeta } from "../seo/pageMetadata";
import { canonicalCompareHubUrl } from "../seo/canonical";

import {
  buildBreadcrumbSchema,
  buildCompareItemListSchema,
} from "../utils/structuredData";

import CompareHeroExperience from "../components/compare/CompareHeroExperience";

import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest";
import { compareGuidePath } from "../seo/slugs";

import {
  COMPARE_CARS_SYNC_EVENT,
  loadCompareCarsFromStorage,
  saveCompareCars,
} from "../utils/compareCarsStorage";
import {
  ensureArray,
  normalizeCompareState,
} from "../utils/compareHydration";

const POPULAR_COMPARE_SLUGS = ensureArray(GENERATED_COMPARE_SLUGS).slice(0, 6);

function formatCompareGuideLabel(slug) {
  return String(slug || "")
    .replace(/-vs-/gi, " vs ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ComparePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cars, setCars] = useState(() => loadCompareCarsFromStorage());

  useEffect(() => {
    if (location.state?.cars != null) {
      setCars(saveCompareCars(location.state.cars));
      return;
    }

    setCars(loadCompareCarsFromStorage());
  }, [location.key, location.state?.cars]);

  useEffect(() => {
    const onSync = () => {
      setCars(loadCompareCarsFromStorage());
    };

    window.addEventListener(COMPARE_CARS_SYNC_EVENT, onSync);

    return () => {
      window.removeEventListener(COMPARE_CARS_SYNC_EVENT, onSync);
    };
  }, []);

  const safeCars = useMemo(() => normalizeCompareState(cars), [cars]);

  const compareBreadcrumb = useMemo(
    () =>
      buildBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Compare EVs", url: "/compare" },
      ]),
    []
  );

  const comparePageMeta = useMemo(
    () => buildCompareToolMeta({ cars: safeCars }),
    [safeCars]
  );

  const compareListSchema = useMemo(
    () =>
      safeCars.length >= 2
        ? buildCompareItemListSchema(
            safeCars,
            undefined,
            canonicalCompareHubUrl()
          )
        : null,
    [safeCars]
  );

  const handleCarsChange = useCallback((next) => {
    setCars(saveCompareCars(next));
  }, []);

  if (safeCars.length < 2) {
    return (
      <>
        <SeoHead meta={comparePageMeta} />

        <div className="compare-empty">
          <div className="compare-empty__card">
            <div className="compare-empty__icon" aria-hidden>
              ⚡
            </div>

            <h2 className="compare-empty__title">
              {safeCars.length === 1
                ? "Add one more EV"
                : "No EVs selected"}
            </h2>

            <p className="compare-empty__text">
              {safeCars.length === 1
                ? "You need at least 2 vehicles for a side-by-side comparison. Add another EV from the catalog."
                : "Select at least 2 electric vehicles to unlock premium side-by-side comparison."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/cars?compareMode=true")}
              className="compare-hero__btn compare-hero__btn--primary"
            >
              Explore EVs
            </button>

            {POPULAR_COMPARE_SLUGS.length > 0 ? (
              <div style={{ marginTop: "1.75rem" }}>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#64748b",
                    margin: "0 0 0.5rem",
                  }}
                >
                  Popular comparisons
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  {POPULAR_COMPARE_SLUGS.map((slug) => (
                    <Link
                      key={slug}
                      to={compareGuidePath(slug)}
                      style={{
                        fontSize: "0.8125rem",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "999px",
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: "#0f172a",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      {formatCompareGuideLabel(slug)}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead meta={comparePageMeta} />

      <JsonLd data={compareBreadcrumb} />
      {compareListSchema && <JsonLd data={compareListSchema} />}

      <CompareHeroExperience
        cars={safeCars}
        sourcePage="/compare"
        variant="tool"
        onCarsChange={handleCarsChange}
        showClearComparison
        enableFab
      />
    </>
  );
}
