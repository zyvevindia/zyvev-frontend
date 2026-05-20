import { useEffect, useRef } from "react";

import { trackTransparencySectionViewed } from "../../analytics/funnel";

import "../../styles/ev-trust.css";

export default function CatalogTransparencyNotes({
  transparency,
  sourcePage = "car_detail",
  familySlug = "",
}) {
  const ref = useRef(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!transparency?.hasTransparency || tracked.current) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !tracked.current) {
          tracked.current = true;
          trackTransparencySectionViewed({
            familySlug,
            sourcePage,
            hasBadges: Boolean(transparency?.badges?.length),
          });
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [transparency, familySlug, sourcePage]);

  if (!transparency?.hasTransparency) return null;

  return (
    <div ref={ref} className="ev-catalog-transparency">
      {transparency.badges?.length > 0 && (
        <div className="ev-catalog-transparency__badges">
          {transparency.badges.map((badge) => (
            <span key={badge.id} className="ev-catalog-transparency__badge">
              {badge.label}
              {badge.relative ? ` · ${badge.relative}` : ""}
            </span>
          ))}
        </div>
      )}
      {transparency.notes?.length > 0 && (
        <ul className="ev-catalog-transparency__notes">
          {transparency.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
