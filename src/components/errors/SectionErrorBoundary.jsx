import React from "react";

import { logProduction } from "../../utils/productionLog";
import { captureException } from "../../monitoring/sentry";

/**
 * Isolates section failures so the rest of the page keeps rendering.
 */
export default class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logProduction(
      "ui",
      "section_error_boundary",
      {
        label: this.props.label || "section",
        message: error?.message,
      },
      "error"
    );
    captureException(error, {
      surface: "section_error_boundary",
      label: this.props.label,
      componentStack: errorInfo?.componentStack?.slice(0, 400),
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const { label = "This section", compact = false } = this.props;
      return (
        <div
          className={`section-error-fallback${compact ? " section-error-fallback--compact" : ""}`}
          role="alert"
          style={
            compact
              ? {
                  padding: "12px 16px",
                  margin: "12px 0",
                  borderRadius: "10px",
                  border: "1px solid #fde68a",
                  background: "#fffbeb",
                  fontSize: "0.875rem",
                  color: "#92400e",
                }
              : {
                  padding: "20px",
                  margin: "16px 0",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  textAlign: "center",
                }
          }
        >
          <p style={{ margin: "0 0 10px" }}>
            {label} could not load right now.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
