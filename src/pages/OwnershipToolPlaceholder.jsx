import { Link, Navigate, useParams } from "react-router-dom";

import SEO from "../components/SEO/SEO.jsx";
import { getOwnershipToolById } from "../tools/ownershipToolRoutes.js";

import "../styles/ownership-tools-page.css";

export default function OwnershipToolPlaceholder() {
  const { toolId } = useParams();
  const tool = getOwnershipToolById(toolId);

  if (!tool) {
    return <Navigate to="/tools" replace />;
  }

  return (
    <div className="ownership-tools-page ownership-tools-page--placeholder">
      <SEO
        title={`${tool.title} | EVSavari Tools`}
        description={tool.description}
        robots="noindex,follow"
      />

      <div className="ownership-tools-page__inner">
        <nav className="ownership-tools-page__crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link to="/tools">Tools</Link>
          <span aria-hidden="true"> / </span>
          <span>{tool.title}</span>
        </nav>

        <article className="ownership-tools-page__placeholder-card">
          <h1 className="ownership-tools-page__title">{tool.title}</h1>
          <p className="ownership-tools-page__subtitle">{tool.description}</p>
          <p className="ownership-tools-page__placeholder-note">
            This calculator is coming soon. Return to the tools hub to explore
            other ownership planners.
          </p>
          <Link to="/tools" className="ownership-tools-page__tool-link">
            Back to Ownership Tools →
          </Link>
        </article>
      </div>
    </div>
  );
}
