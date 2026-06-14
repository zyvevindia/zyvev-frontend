import {
  CatalogBodyTypeSelect,
  CatalogBrandSelect,
  CatalogPriceSelect,
} from "./CatalogFilterSelects";

/**
 * Inline brand / price / body-type / sort controls for the catalog listing toolbar.
 */
export default function ListingCatalogMoreFilters({
  brand,
  brands = [],
  onBrandChange,
  priceRange,
  onPriceRangeChange,
  bodyType,
  onBodyTypeChange,
  onClearFilters,
  sortBy,
  onSortChange,
  inputStyle,
  hasActiveFilters = false,
}) {
  return (
    <>
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

      <div className="listing-filter-clear">
        <button
          type="button"
          className="listing-filter-clear__btn"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
        >
          Clear Filters
        </button>
      </div>
    </>
  );
}
