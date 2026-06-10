import {
  CatalogBodyTypeSelect,
  CatalogBrandSelect,
  CatalogPriceSelect,
} from "./CatalogFilterSelects";

/**
 * Collapsible brand / price / body-type filters + always-visible sort control.
 */
export default function ListingCatalogMoreFilters({
  moreFiltersOpen,
  onToggleMoreFilters,
  brand,
  brands = [],
  onBrandChange,
  priceRange,
  onPriceRangeChange,
  bodyType,
  onBodyTypeChange,
  onClearMoreFilters,
  sortBy,
  onSortChange,
  inputStyle,
  hasActiveMoreFilters = false,
}) {
  return (
    <div className="listing-filter-actions-wrap">
      <div className="listing-filter-actions">
        <button
          type="button"
          className={`listing-more-filters-toggle${
            hasActiveMoreFilters
              ? " listing-more-filters-toggle--active"
              : ""
          }`}
          onClick={onToggleMoreFilters}
          aria-expanded={moreFiltersOpen}
          aria-controls="listing-more-filters-panel"
        >
          More Filters <span aria-hidden>⚙</span>
        </button>

        <div className="listing-filter-sort">
          <label htmlFor="catalog-sort" className="listing-filter-label">
            Sort
          </label>
          <select
            id="catalog-sort"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="listing-filter-input listing-filter-sort__select"
            style={inputStyle}
            aria-label="Sort EV listings"
          >
            <option value="">Sort By</option>
            <option value="price-low">Price Low to High</option>
            <option value="price-high">Price High to Low</option>
            <option value="range-high">Best Range</option>
          </select>
        </div>
      </div>

      {moreFiltersOpen ? (
        <div
          id="listing-more-filters-panel"
          className="listing-more-filters-panel"
        >
          <div className="listing-filter-field">
            <label htmlFor="catalog-brand" className="listing-filter-label">
              Brand
            </label>
            <CatalogBrandSelect
              id="catalog-brand"
              value={brand}
              onChange={onBrandChange}
              brands={brands}
              className="listing-filter-input"
              style={inputStyle}
            />
          </div>

          <div className="listing-filter-field">
            <span className="listing-filter-label">Price</span>
            <CatalogPriceSelect
              value={priceRange}
              onChange={onPriceRangeChange}
              style={inputStyle}
            />
          </div>

          <div className="listing-filter-field">
            <span className="listing-filter-label">Body Type</span>
            <CatalogBodyTypeSelect
              value={bodyType}
              onChange={onBodyTypeChange}
              style={inputStyle}
            />
          </div>

          <div className="listing-more-filters-panel__clear">
            <button
              type="button"
              className="listing-more-filters-clear"
              onClick={onClearMoreFilters}
              disabled={!hasActiveMoreFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
