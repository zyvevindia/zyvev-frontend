# Body Type Filter

Status: Temporarily disabled

Reason:
Catalog body-type coverage and normalization are incomplete.

Re-enable after:

- 100% body-type coverage
- Normalized categories
- Validation across all vehicles

Planned categories:

- Hatchback
- Sedan
- SUV
- Compact SUV
- MPV
- Luxury Sedan
- Luxury SUV

## Implementation notes

- Feature flag: `BODY_TYPE_FILTER_ENABLED` in `src/intelligence/bodyTypeCatalog.js`
- Set to `true` when re-enabling, then restore dropdowns in:
  - `src/pages/Home.jsx`
  - `src/components/discovery/ListingCatalogMoreFilters.jsx`
- Taxonomy and classification code remain in `bodyTypeCatalog.js` and `familyIntelligence.js`
