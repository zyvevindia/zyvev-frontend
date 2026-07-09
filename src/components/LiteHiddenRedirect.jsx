import { Navigate } from "react-router-dom";

import { LITE_HIDDEN_REDIRECT_FALLBACK } from "../config/evsavariLite";

/**
 * Redirects platform-only public routes to the Lite marketplace surface.
 * Route entries stay registered; only the rendered element changes.
 */
export default function LiteHiddenRedirect({
  to = LITE_HIDDEN_REDIRECT_FALLBACK,
}) {
  return <Navigate to={to} replace />;
}
