import { Link } from "react-router-dom";

/**
 * Shown when a landing route has no registry entry and no legacy fallback.
 */
export default function LandingNotFound({ routeFamily, slug }) {
  return (
    <div className="landing-page landing-page--not-found">
      <div className="landing-page__shell">
        <h1>Landing page configuration not found</h1>
        <p>
          No registry entry for{" "}
          <code>
            {routeFamily}/{slug}
          </code>
          . This route is reserved for the landing page framework.
        </p>
        <p>
          <Link to="/cars">Browse EVs</Link> · <Link to="/guides">Guides</Link>
        </p>
      </div>
    </div>
  );
}
