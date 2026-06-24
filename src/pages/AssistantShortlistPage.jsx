import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { buildAssistantComparePairSlug } from "../aiAssistant/comparePairSlug.js";
import { resolveAssistantVehicleDisplay } from "../aiAssistant/resolveAssistantVehicleDisplay.js";
import { ANALYTICS_EVENTS } from "../analytics/events.js";
import { trackAnalytics } from "../analytics/track.js";
import AssistantShell from "../components/assistant/AssistantShell.jsx";
import {
  AssistantIntentProvider,
  useAssistantIntent,
} from "../components/assistant/AssistantIntentProvider.jsx";
import { useAssistantShortlist } from "../hooks/useAssistantShortlist.js";
import {
  buildReviewSlug,
  isEditorialReviewAvailable,
  reviewPagePath,
} from "../reviews/reviewRoutes.js";
import { buildOwnershipToolHref } from "../tools/ownershipToolLinks.js";
import { vehicleDetailPath } from "../utils/vehicleRoutes.js";
import VehicleImage from "../components/media/VehicleImage";

const SOURCE_PAGE = "assistant_shortlist";

function ShortlistCompareLinks({ entries, onCompareClick }) {
  if (entries.length < 2) {
    return null;
  }

  /** @type {{ compareSlug: string, label: string, href: string }[]} */
  const links = [];

  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length && links.length < 4; j += 1) {
      const compareSlug = buildAssistantComparePairSlug(
        entries[i].vehicleSlug,
        entries[j].vehicleSlug
      );

      if (!compareSlug) {
        continue;
      }

      links.push({
        compareSlug,
        label: `${entries[i].vehicleName} vs ${entries[j].vehicleName}`,
        href: `/compare/${compareSlug}`,
      });
    }
  }

  if (!links.length) {
    return null;
  }

  return (
    <section className="assistant-card assistant-shortlist-page__compare">
      <p className="assistant-card__eyebrow">Quick comparison</p>
      <div className="assistant-shortlist-page__compare-links">
        {links.map((link) => (
          <Link
            key={link.compareSlug}
            to={link.href}
            className="assistant-link-chip"
            onClick={() => onCompareClick(link.compareSlug)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function AssistantShortlistContent() {
  const { entries, count, remove } = useAssistantShortlist();
  const { markCompareUsed, markOwnershipUsed, markReviewViewed } = useAssistantIntent();

  useEffect(() => {
    trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_SHORTLIST_VIEW, {
      source_page: SOURCE_PAGE,
      shortlist_count: count,
    });
  }, [count]);

  return (
    <AssistantShell>
      <Helmet>
        <title>Assistant Shortlist | EVSavari</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <section className="assistant-card">
        <p className="assistant-card__eyebrow">Your shortlist</p>
        <h1 className="assistant-card__title">EVs you&apos;re considering</h1>
        <p className="assistant-card__copy">
          Compare, estimate ownership, and read reviews before you decide.
        </p>
        <Link to="/assistant" className="assistant-btn assistant-btn--ghost">
          Back to Assistant
        </Link>
      </section>

      {!count ? (
        <section className="assistant-card">
          <p className="assistant-card__copy">
            Your shortlist is empty. Complete the assistant and add up to 5 EVs.
          </p>
          <Link to="/assistant" className="assistant-btn assistant-btn--primary">
            Start Assistant
          </Link>
        </section>
      ) : (
        <>
          <ShortlistCompareLinks
            entries={entries}
            onCompareClick={(compareSlug) => markCompareUsed("", compareSlug)}
          />

          <div className="assistant-shortlist-page__grid">
            {entries.map((entry) => {
              const display = resolveAssistantVehicleDisplay(entry.vehicleSlug);
              const reviewAvailable = isEditorialReviewAvailable(entry.vehicleSlug);

              return (
                <article key={entry.vehicleSlug} className="assistant-vehicle-card">
                  <Link
                    to={vehicleDetailPath(entry.vehicleSlug)}
                    className="assistant-vehicle-card__media-link"
                  >
                    <VehicleImage
                      src={display.imageUrl}
                      alt={display.displayName}
                      className="assistant-vehicle-card__image"
                      loading="lazy"
                    />
                  </Link>

                  <div className="assistant-vehicle-card__body">
                    <h2 className="assistant-vehicle-card__name">{display.displayName}</h2>
                    <p className="assistant-vehicle-card__price">{display.priceLabel}</p>

                    <div className="assistant-shortlist-page__links">
                      <Link
                        to={buildOwnershipToolHref("tco", entry.vehicleSlug)}
                        className="assistant-ownership-link"
                        onClick={() => markOwnershipUsed(entry.vehicleSlug, "tco")}
                      >
                        Ownership cost
                      </Link>
                      {reviewAvailable ? (
                        <Link
                          to={reviewPagePath(buildReviewSlug(entry.vehicleSlug))}
                          className="assistant-ownership-link"
                          onClick={() => markReviewViewed(entry.vehicleSlug)}
                        >
                          Expert review
                        </Link>
                      ) : null}
                      <Link
                        to={vehicleDetailPath(entry.vehicleSlug)}
                        className="assistant-ownership-link"
                      >
                        View vehicle
                      </Link>
                    </div>

                    <button
                      type="button"
                      className="assistant-btn assistant-btn--ghost"
                      onClick={() => {
                        remove(entry.vehicleSlug);
                        trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_SHORTLIST_REMOVE, {
                          source_page: SOURCE_PAGE,
                          vehicle_slug: entry.vehicleSlug,
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </AssistantShell>
  );
}

export default function AssistantShortlistPage() {
  return (
    <AssistantIntentProvider sourcePage={SOURCE_PAGE}>
      <AssistantShortlistContent />
    </AssistantIntentProvider>
  );
}
