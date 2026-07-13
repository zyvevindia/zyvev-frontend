import { Link } from "react-router-dom";

export default function InternalLinksSection({ linkGroups = [] }) {
  if (!linkGroups.length) return null;

  return (
    <section
      className="landing-internal-links"
      data-content-block="relatedPages"
      aria-labelledby="landing-links-title"
    >
      <h2 id="landing-links-title" className="landing-section__title">
        Related pages
      </h2>
      {linkGroups.map((group) => (
        <div key={group.title} className="landing-internal-links__group">
          <h3>{group.title}</h3>
          <ul>
            {group.links.map((link) => (
              <li key={link.href}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
