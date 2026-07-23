# Internal Link Graph Engine

## Flow

```
Current Page Context
        ↓
  getRelatedPages()
        ↓
  resolveRelationships()  (per relationship type)
        ↓
  rankAndGroupRelationships()  (dedupe + score)
        ↓
  Link Groups → UI components
```

## API

```js
import { getRelatedPages, buildVehiclePageContext } from "../linkGraph/index.js";

const groups = getRelatedPages(buildVehiclePageContext({ familySlug, brand, priceInr, ... }));
```

## Page families

See [`link-graph-relationship-matrix.md`](./link-graph-relationship-matrix.md).

## Adding City Pages (example)

1. Add `LINK_PAGE_FAMILIES.CITY` relationships in `relationshipMatrix.js` (already stubbed)
2. Implement city data in `resolveRelationships.js` `cityLinks` using city registry
3. Call `getRelatedPages(buildGuidePageContext({ category: 'city', slug }))`

No changes to `LandingPage.jsx`, routes, or vehicle/compare page components.
