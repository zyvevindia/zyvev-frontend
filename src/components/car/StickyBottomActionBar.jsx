import { useEffect, useState } from "react";

import "./sticky-bottom-action-bar.css";

const ICONS = {
  testDrive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h2v2H8zM14 14h2v2h-2z" />
    </svg>
  ),
  bestDeal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  compare: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7h4v10H4zM10 4h4v16h-4zM16 9h4v8h-4z" />
    </svg>
  ),
};

function formatCompareLabel(count) {
  if (count > 0) {
    return `Compare (${count})`;
  }
  return "Compare";
}

/**
 * Thumb-zone sticky CTA bar — appears after scrolling past the hero.
 */
export default function StickyBottomActionBar({
  onBookTestDrive = () => {},
  onGetBestDeal = () => {},
  onCompare = () => {},
  compareCount = 0,
  heroSelector = ".cd-hero",
  pageSelector = ".cd-page",
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(heroSelector);
    if (!hero) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.intersectionRatio === 0);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "0px 0px 0px 0px",
      }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroSelector]);

  useEffect(() => {
    const page = document.querySelector(pageSelector);
    if (!page) return undefined;

    page.classList.toggle("cd-page--sticky-bar-visible", visible);

    return () => {
      page.classList.remove("cd-page--sticky-bar-visible");
    };
  }, [visible, pageSelector]);

  return (
    <aside
      className={`cd-sticky-bar${visible ? " cd-sticky-bar--visible" : ""}`}
      aria-label="Quick booking actions"
      aria-hidden={!visible}
    >
      <div className="cd-sticky-bar__inner">
        <div className="cd-sticky-bar__panel">
          <p className="cd-sticky-bar__trust">
            <span aria-hidden>✓</span>
            Verified prices and real-world estimates
          </p>

          <div className="cd-sticky-bar__actions" role="group">
            <button
              type="button"
              className="cd-sticky-bar__btn cd-sticky-bar__btn--primary"
              onClick={onBookTestDrive}
            >
              <span className="cd-sticky-bar__btn-icon">{ICONS.testDrive}</span>
              <span className="cd-sticky-bar__btn-label">Book Test Drive</span>
            </button>

            <button
              type="button"
              className="cd-sticky-bar__btn cd-sticky-bar__btn--deal"
              onClick={onGetBestDeal}
            >
              <span className="cd-sticky-bar__btn-icon">{ICONS.bestDeal}</span>
              <span className="cd-sticky-bar__btn-label">Get Best Deal</span>
            </button>

            <button
              type="button"
              className="cd-sticky-bar__btn cd-sticky-bar__btn--compare"
              onClick={onCompare}
            >
              <span className="cd-sticky-bar__btn-icon">{ICONS.compare}</span>
              <span className="cd-sticky-bar__btn-label">
                {formatCompareLabel(compareCount)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
