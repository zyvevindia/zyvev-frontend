import { useEffect, useRef } from "react";

import "../../styles/catalog-listing-a11y.css";

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
};

export default function DiscoveryPageSearch({
  value,
  onChange,
  inputId = "discovery-catalog-search",
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#discovery-search") return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="listing-filter-search listing-filter-field">
      <label htmlFor={inputId} className="listing-filter-label">
        Search
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="search"
        placeholder="Search EV or brand..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="listing-filter-input"
        style={inputStyle}
        aria-label="Search electric vehicles by name or brand"
      />
    </div>
  );
}
