import { useMemo } from "react";

import SeoHead from "../components/SEO/SeoHead.jsx";
import JsonLd from "../components/SEO/JsonLd.jsx";
import LandingPageLayout from "./layout/LandingPageLayout.jsx";
import LandingSectionRenderer from "./sections/LandingSectionRenderer.jsx";
import useLandingCatalog from "./hooks/useLandingCatalog.js";
import { buildLandingPageMeta } from "./seo/landingMetadata.js";
import { buildExtendedLandingSchemas } from "./seo/landingSchema.js";
import { resolveLandingInternalLinks } from "./links/landingLinkGraph.js";

/**
 * Generic landing page engine — renders entirely from registry configuration.
 * Does not branch on brand, price, use case, or any page-specific type.
 */
export default function LandingPage({ config }) {
  const meta = useMemo(() => buildLandingPageMeta(config), [config]);

  const filterConfig = config.filters;
  const { families, cards, loading, error, fallbackNotice } =
    useLandingCatalog(filterConfig);

  const linkGroups = useMemo(
    () => resolveLandingInternalLinks(config),
    [config]
  );

  const schemas = useMemo(
    () =>
      buildExtendedLandingSchemas(config, {
        rankedFamilies: families,
      }),
    [config, families]
  );

  const sectionContext = useMemo(
    () => ({
      config,
      cards,
      loading,
      error,
      fallbackNotice,
      linkGroups,
      families,
    }),
    [config, cards, loading, error, fallbackNotice, linkGroups, families]
  );

  const sections = config.sections || [];

  return (
    <LandingPageLayout>
      <SeoHead meta={meta} />

      {schemas.map((schema, index) => (
        <JsonLd
          key={schema?.["@type"] || schema?.name || `landing-schema-${index}`}
          data={schema}
        />
      ))}

      {sections.map((section) => (
        <LandingSectionRenderer
          key={section.id}
          section={section}
          context={sectionContext}
        />
      ))}
    </LandingPageLayout>
  );
}
