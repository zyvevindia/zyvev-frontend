import { Link } from "react-router-dom";

export default function SeoRelatedLinks({ sections = [] }) {
  if (!sections.length) return null;

  return (
    <aside className="seo-related-links" aria-label="Related pages">
      {sections.map((section) => (
        <div key={section.title} className="seo-related-links__block">
          <h2 className="seo-related-links__title">
            {section.title}
          </h2>
          <ul className="seo-related-links__list">
            {section.links.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="seo-related-links__link"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
