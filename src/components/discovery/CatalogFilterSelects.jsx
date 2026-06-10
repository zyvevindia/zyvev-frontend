import {
  CATALOG_PRICE_RANGES,
  normalizePriceRangeId,
} from "../../intelligence/catalogPriceFilters.js";
import { BODY_TYPE_IDS, BODY_TYPE_LABELS } from "../../intelligence/bodyTypeCatalog.js";

const selectStyle = {
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  fontSize: "15px",
  fontWeight: "500",
  color: "#0f172a",
  background: "#fff",
  minWidth: 0,
  width: "100%",
};

export function CatalogPriceSelect({ value, onChange, id = "catalog-price", style }) {
  const normalized = normalizePriceRangeId(value);
  return (
    <select
      id={id}
      value={normalized}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by price range"
      style={{ ...selectStyle, ...style }}
    >
      <option value="">All Prices</option>
      {CATALOG_PRICE_RANGES.map((range) => (
        <option key={range.id} value={range.id}>
          {range.label}
        </option>
      ))}
    </select>
  );
}

export function CatalogBodyTypeSelect({
  value,
  onChange,
  id = "catalog-body-type",
  style,
}) {
  return (
    <select
      id={id}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by body type"
      style={{ ...selectStyle, ...style }}
    >
      <option value="">All Body Types</option>
      {BODY_TYPE_IDS.map((bodyId) => (
        <option key={bodyId} value={bodyId}>
          {BODY_TYPE_LABELS[bodyId]}
        </option>
      ))}
    </select>
  );
}

export function CatalogBrandSelect({
  value,
  onChange,
  brands = [],
  id = "catalog-brand",
  style,
  className = "",
  allLabel = "All Brands",
}) {
  return (
    <select
      id={id}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by brand"
      className={className || undefined}
      style={{ ...selectStyle, ...style }}
    >
      <option value="">{allLabel}</option>
      {brands.map((brand) => (
        <option key={brand} value={brand}>
          {brand}
        </option>
      ))}
    </select>
  );
}
