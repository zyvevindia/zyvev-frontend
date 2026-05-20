import React from "react";
import { Link } from "react-router-dom";

import { logProduction } from "../../utils/productionLog";
import { captureException } from "../../monitoring/sentry";

import "../../styles/compare-page.css";

/**
 * Route-level boundary — compare shell survives child render failures.
 */
export default class CompareErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logProduction(
      "compare",
      "compare_boundary",
      { message: error?.message },
      "error"
    );
    captureException(error, {
      surface: "compare_error_boundary",
      componentStack: errorInfo?.componentStack?.slice(0, 400),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="compare-error-fallback">
          <h1>Compare temporarily unavailable</h1>
          <p>
            We could not render this comparison. Your selected EVs are still
            saved — try again or browse individual models.
          </p>
          <div className="compare-error-fallback__actions">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
            <Link to="/cars">Browse EVs</Link>
            <Link to="/">Home</Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
