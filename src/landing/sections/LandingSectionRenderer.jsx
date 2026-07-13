import { Suspense } from "react";

import {
  isLazySectionComponent,
  resolveLandingSectionComponent,
} from "./sectionRegistry.js";

function SectionFallback() {
  return (
    <div className="landing-section landing-section--loading" aria-hidden>
      …
    </div>
  );
}

/**
 * Renders one configurable landing section.
 */
export default function LandingSectionRenderer({ section, context }) {
  if (section?.enabled === false) return null;

  const Component = resolveLandingSectionComponent(section.id);
  if (!Component) return null;

  const props = {
    ...context,
    ...(section.props || {}),
  };

  if (isLazySectionComponent(Component)) {
    return (
      <Suspense fallback={<SectionFallback />}>
        <Component {...props} />
      </Suspense>
    );
  }

  return <Component {...props} />;
}
