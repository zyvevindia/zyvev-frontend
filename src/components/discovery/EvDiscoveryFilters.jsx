import { useMemo, useState } from "react";

import {
  getPrimaryFilters,
  getSecondaryFilters,
  FILTER_GROUPS,
} from "../../intelligence/filterDefinitions.js";
import { getAvailableFiltersForFamilies } from "../../intelligence/filterMatcher.js";

import "../../styles/ev-discovery.css";

export default function EvDiscoveryFilters({
  families = [],
  activeFilterIds = [],
  onChange,
  onFilterToggleAnalytics,
}) {
  const [showMore, setShowMore] = useState(false);

  const available = useMemo(
    () => getAvailableFiltersForFamilies(families),
    [families]
  );

  const availableIds = useMemo(
    () => new Set(available.map((f) => f.id)),
    [available]
  );

  const primary = useMemo(() => {
    return getPrimaryFilters().filter((f) => availableIds.has(f.id));
  }, [availableIds]);

  const secondary = useMemo(() => {
    return getSecondaryFilters().filter((f) => availableIds.has(f.id));
  }, [availableIds]);

  const toggle = (id) => {
    const next = activeFilterIds.includes(id)
      ? activeFilterIds.filter((x) => x !== id)
      : [...activeFilterIds, id];
    onChange(next);
    onFilterToggleAnalytics?.(id, !activeFilterIds.includes(id));
  };

  const clearAll = () => {
    onChange([]);
  };

  if (!primary.length && !secondary.length) {
    return null;
  }

  return (
    <div className="ev-discovery-filters">
      <div className="ev-discovery-filters__row">
        <span className="ev-discovery-filters__label">Smart filters</span>
        <div className="ev-discovery-filters__chips">
          {primary.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              active={activeFilterIds.includes(f.id)}
              onClick={() => toggle(f.id)}
            />
          ))}
        </div>
        {activeFilterIds.length > 0 && (
          <button
            type="button"
            className="ev-discovery-filters__clear"
            onClick={clearAll}
          >
            Clear
          </button>
        )}
      </div>

      {secondary.length > 0 && (
        <div className="ev-discovery-filters__more">
          <button
            type="button"
            className="ev-discovery-filters__more-btn"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
          >
            {showMore ? "Fewer filters" : "More filters"}
            <span aria-hidden>{showMore ? " ▴" : " ▾"}</span>
          </button>
          {showMore && (
            <div className="ev-discovery-filters__groups">
              {FILTER_GROUPS.map((group) => {
                const items = secondary.filter(
                  (f) => f.group === group.id
                );
                if (!items.length) return null;
                return (
                  <div
                    key={group.id}
                    className="ev-discovery-filters__group"
                  >
                    <span className="ev-discovery-filters__group-label">
                      {group.label}
                    </span>
                    <div className="ev-discovery-filters__chips">
                      {items.map((f) => (
                        <FilterChip
                          key={f.id}
                          label={f.label}
                          active={activeFilterIds.includes(f.id)}
                          onClick={() => toggle(f.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      className={`ev-discovery-filter-chip${active ? " ev-discovery-filter-chip--active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
