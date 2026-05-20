import { useEffect } from "react";

import SeoHead from "../components/SEO/SeoHead";
import { buildStaticPageMeta } from "../seo/pageMetadata";

/* =========================================================
   ===================== STATIC PAGE =======================
   ========================================================= */

export default function StaticPage({
  pageTitle,
  title,
  subtitle,
  sections = [],
  path = "/",
}) {
  const meta = buildStaticPageMeta({
    pageTitle,
    title,
    subtitle,
    path,
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <div style={pageWrapper}>
      <SeoHead meta={meta} />

      <section style={heroSection}>
        <div style={heroOverlay}>
          <h1 style={heroTitle}>{title}</h1>
          <p style={heroSubtitle}>{subtitle}</p>
        </div>
      </section>

      <section style={contentSection}>
        <div style={contentWrapper}>
          {sections.map((section, index) => (
            <div key={index} style={contentCard}>
              <h2 style={sectionTitle}>{section.heading}</h2>
              <p style={sectionText}>{section.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const pageWrapper = {
  minHeight: "100vh",
  background: "#f5f7fb",
};

const heroSection = {
  background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
  padding: "90px 24px",
};

const heroOverlay = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const heroTitle = {
  fontSize: "clamp(42px, 8vw, 72px)",
  fontWeight: "800",
  color: "white",
  lineHeight: "1.05",
  marginBottom: "22px",
  letterSpacing: "-2px",
};

const heroSubtitle = {
  color: "#dbeafe",
  fontSize: "18px",
  lineHeight: "1.9",
  maxWidth: "800px",
};

const contentSection = {
  padding: "70px 24px 100px",
};

const contentWrapper = {
  maxWidth: "1100px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "28px",
};

const contentCard = {
  background: "white",
  borderRadius: "28px",
  padding: "38px",
  boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
  border: "1px solid #e2e8f0",
};

const sectionTitle = {
  fontSize: "clamp(24px, 4vw, 34px)",
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: "18px",
};

const sectionText = {
  color: "#475569",
  lineHeight: "2",
  fontSize: "16px",
};
