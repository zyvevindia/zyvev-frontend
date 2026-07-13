import "../styles/landing-page.css";

/**
 * Single reusable layout shell for all landing page types.
 */
export default function LandingPageLayout({ children }) {
  return (
    <div className="landing-page">
      <div className="landing-page__shell">{children}</div>
    </div>
  );
}
