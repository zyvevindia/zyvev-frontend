import { useState } from "react";
import { Link } from "react-router-dom";

import { ANALYTICS_EVENTS } from "../../analytics/events.js";
import { trackAnalytics } from "../../analytics/track.js";
import { resolveAssistantVehicleDisplay } from "../../aiAssistant/resolveAssistantVehicleDisplay.js";
import { useAssistantShortlist } from "../../hooks/useAssistantShortlist.js";
import VehicleImage from "../media/VehicleImage";

export default function AssistantShortlistDrawer({ sourcePage = "buyer_assistant" }) {
  const { entries, count, remove } = useAssistantShortlist();
  const [open, setOpen] = useState(false);

  if (!count) {
    return null;
  }

  const handleViewShortlist = () => {
    trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_SHORTLIST_VIEW, {
      source_page: sourcePage,
      shortlist_count: count,
    });
    setOpen(false);
  };

  return (
    <>
      <div className="assistant-shortlist-bar">
        <button
          type="button"
          className="assistant-shortlist-bar__toggle"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          Shortlist ({count})
        </button>
        <Link
          to="/assistant/shortlist"
          className="assistant-shortlist-bar__view"
          onClick={handleViewShortlist}
        >
          View Shortlist
        </Link>
      </div>

      {open ? (
        <div className="assistant-shortlist-drawer" role="dialog" aria-label="Shortlist">
          <div className="assistant-shortlist-drawer__header">
            <h2 className="assistant-shortlist-drawer__title">Your shortlist</h2>
            <button
              type="button"
              className="assistant-shortlist-drawer__close"
              onClick={() => setOpen(false)}
              aria-label="Close shortlist"
            >
              ×
            </button>
          </div>

          <ul className="assistant-shortlist-drawer__list">
            {entries.map((entry) => {
              const display = resolveAssistantVehicleDisplay(entry.vehicleSlug);

              return (
                <li key={entry.vehicleSlug} className="assistant-shortlist-drawer__item">
                  <VehicleImage
                    src={display.imageUrl}
                    alt={display.displayName}
                    className="assistant-shortlist-drawer__image"
                    loading="lazy"
                  />
                  <div className="assistant-shortlist-drawer__meta">
                    <p className="assistant-shortlist-drawer__name">{display.displayName}</p>
                    <p className="assistant-shortlist-drawer__price">{display.priceLabel}</p>
                  </div>
                  <button
                    type="button"
                    className="assistant-shortlist-drawer__remove"
                    onClick={() => {
                      remove(entry.vehicleSlug);
                      trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_SHORTLIST_REMOVE, {
                        source_page: sourcePage,
                        vehicle_slug: entry.vehicleSlug,
                      });
                    }}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>

          <Link
            to="/assistant/shortlist"
            className="assistant-btn assistant-btn--primary assistant-shortlist-drawer__cta"
            onClick={handleViewShortlist}
          >
            View Shortlist
          </Link>
        </div>
      ) : null}
    </>
  );
}
