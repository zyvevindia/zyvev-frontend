import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import SEO from "../components/SEO/SEO";
import JsonLd from "../components/SEO/JsonLd";

import { buildPageMeta } from "../seo/meta";
import { buildWebPageSchema, buildBreadcrumbSchema } from "../seo/schema";
import { canonicalGuidesHubUrl } from "../seo/canonical";
import { buildRegistryManifest } from "../seo/registry";
import { auditSeoPages, logSeoAudit } from "../seo/qa";
import {
  getBestEvsGuideLinks,
  getChargingGuideLinks,
  getOwnershipGuideLinks,
  getCityGuideLinks,
} from "../seo/internalLinks";
import { getIntelligenceDiscoveryLinks } from "../seo/intelligenceDiscoveryLinks.js";

import { fetchSeoPagesList } from "../utils/seoPageApi";

export default function SeoGuidesHub() {
  const [apiPages, setApiPages] = useState([]);

  const canonical = canonicalGuidesHubUrl();
  const meta = buildPageMeta({
    title: "EV Buying Guides — Compare, Charge & Own",
    description:
      "Decision guides for Indian EV buyers: best EVs by use case, charging, ownership, brand hubs, and side-by-side comparisons.",
    canonical,
    ogType: "website",
  });

  const manifest = useMemo(() => buildRegistryManifest(), []);

  useEffect(() => {
    fetchSeoPagesList().then(setApiPages).catch(() => {});
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const auditPages = manifest.map((entry) => ({
      id: entry.id,
      path: entry.path,
      canonical: entry.canonicalUrl,
      title: entry.contentSlug.replace(/-/g, " "),
      description: "Manifest entry — run full QA after content load",
      h1: entry.contentSlug,
    }));

    logSeoAudit(auditSeoPages(auditPages), "SEO Registry");
  }, [manifest]);

  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
    ]),
    buildWebPageSchema({
      name: meta.h1,
      description: meta.description,
      url: canonical,
    }),
  ].filter(Boolean);

  const bestEvs = getBestEvsGuideLinks({ limit: 12 });
  const charging = getChargingGuideLinks({ limit: 4 });
  const ownership = getOwnershipGuideLinks({ limit: 10 });
  const cities = getCityGuideLinks({ limit: 12 });
  const intelligenceDiscovery = getIntelligenceDiscoveryLinks({
    limit: 8,
  });

  return (
    <div className="seo-guides-hub">
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
      />

      {schemas.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}

      <div className="seo-guides-hub__inner">
        <nav className="seo-guides-hub__crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span> / Guides</span>
        </nav>

        <h1 className="seo-guides-hub__title">{meta.h1}</h1>
        <p className="seo-guides-hub__lead">
          Data-driven guides to shortlist electric cars by budget, use case,
          charging reality, and ownership fit — without paid rankings.
        </p>

        <section className="seo-guides-hub__section">
          <h2>Best EVs by use case</h2>
          <ul className="seo-guides-hub__list">
            {bestEvs.map((link) => (
              <li key={link.href}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="seo-guides-hub__section">
          <h2>EV intelligence picks</h2>
          <p className="seo-guides-hub__note">
            Rule-ranked lists from EVSavari charging, range, and suitability
            scores — not sponsored placements.
          </p>
          <ul className="seo-guides-hub__list">
            {intelligenceDiscovery.map((link) => (
              <li key={link.href}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="seo-guides-hub__section">
          <h2>Charging guides</h2>
          <ul className="seo-guides-hub__list">
            {charging.map((link) => (
              <li key={link.href}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="seo-guides-hub__section">
          <h2>Ownership guides</h2>
          <ul className="seo-guides-hub__list">
            {ownership.map((link) => (
              <li key={link.href}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="seo-guides-hub__section">
          <h2>EVs by city</h2>
          <ul className="seo-guides-hub__list seo-guides-hub__list--columns">
            {cities.map((link) => (
              <li key={link.href}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="seo-guides-hub__section">
          <h2>Brand hubs</h2>
          <ul className="seo-guides-hub__list">
            <li>
              <Link to="/brands/tata">Tata electric cars</Link>
            </li>
          </ul>
        </section>

        <section className="seo-guides-hub__section">
          <h2>Legacy guide URLs</h2>
          <p className="seo-guides-hub__note">
            These remain available at <code>/cars/…</code> for existing
            indexed links. Prefer the new paths above for sharing.
          </p>
          <ul className="seo-guides-hub__list seo-guides-hub__list--compact">
            {manifest
              .filter((e) => e.pageType === "legacy_guide")
              .slice(0, 8)
              .map((entry) => (
                <li key={entry.path}>
                  <Link to={entry.path}>
                    {entry.contentSlug.replace(/-/g, " ")}
                  </Link>
                </li>
              ))}
          </ul>
          <p>
            <Link to="/cars">Browse all vehicles →</Link>
          </p>
        </section>

        {apiPages.length > 0 && import.meta.env.DEV && (
          <p className="seo-guides-hub__dev">
            API registry: {apiPages.length} pages
          </p>
        )}
      </div>
    </div>
  );
}
