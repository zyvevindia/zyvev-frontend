import { Link } from "react-router-dom";

export default function CtaSection({ config }) {
  const label = config?.ctaLabel || "Browse all electric vehicles";
  const href = config?.ctaHref || "/cars";

  return (
    <section className="landing-cta" data-content-block="cta" aria-label="Next step">
      <Link to={href} className="landing-cta__button">
        {label}
      </Link>
    </section>
  );
}
