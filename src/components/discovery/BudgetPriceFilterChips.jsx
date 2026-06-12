import { BUDGET_PRICE_FILTER_OPTIONS } from "../../data/budgetDiscoveryFilters.js";

import "../../styles/ev-discovery.css";

export default function BudgetPriceFilterChips({ activeId, onChange }) {
  return (
    <div className="intel-discovery-budget-filters">
      <span className="ev-discovery-filters__label">Budget</span>
      <div className="ev-discovery-filters__chips">
        {BUDGET_PRICE_FILTER_OPTIONS.map((option) => {
          const active = option.id === activeId;
          return (
            <button
              key={option.id}
              type="button"
              className={`ev-discovery-filter-chip${
                active ? " ev-discovery-filter-chip--active" : ""
              }`}
              onClick={() => onChange(option.id)}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
