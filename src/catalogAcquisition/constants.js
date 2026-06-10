/**
 * Catalog Acquisition System — statuses, source types, format constants.
 */

export const CATALOG_IMPORT_FORMAT = "evsavari-catalog-import/1";

export const IMPORT_SOURCE_TYPE = Object.freeze({
  OEM_URL: "oem_url",
  PDF_BROCHURE: "pdf_brochure",
});

/** v2 evidence source categories with default trust scores. */
export const EVIDENCE_SOURCE_TYPE = Object.freeze({
  OEM_PDF: "OEM_PDF",
  OEM_WEBSITE: "OEM_WEBSITE",
  TRUSTED_REFERENCE: "TRUSTED_REFERENCE",
  SEARCH_RESULT: "SEARCH_RESULT",
});

export const EVIDENCE_TRUST_SCORE = Object.freeze({
  [EVIDENCE_SOURCE_TYPE.OEM_PDF]: 100,
  [EVIDENCE_SOURCE_TYPE.OEM_WEBSITE]: 95,
  [EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE]: 80,
  [EVIDENCE_SOURCE_TYPE.SEARCH_RESULT]: 60,
});

export const EVIDENCE_FIELD_STATUS = Object.freeze({
  AGREEMENT: "agreement",
  CONFLICT: "conflict",
  SINGLE_SOURCE: "single_source",
  MISSING: "missing",
});

export const IMPORT_STATUS = Object.freeze({
  DRAFT: "draft",
  PROCESSING: "processing",
  REVIEW_REQUIRED: "review_required",
  APPROVED: "approved",
  PUBLISHED: "published",
  REJECTED: "rejected",
});

export const SNAPSHOT_TYPE = Object.freeze({
  SOURCE_RAW: "source_raw",
  EXTRACTED: "extracted",
  REVIEWED: "reviewed",
  PUBLISHED: "published",
  /** v5 — raw fetch HTML before JS render */
  SOURCE_RAW_HTML: "source_raw_html",
  /** v5 — Playwright rendered DOM */
  SOURCE_RENDERED_HTML: "source_rendered_html",
  /** v5 — visible text from rendered page */
  SOURCE_VISIBLE_TEXT: "source_visible_text",
  SOURCE_PARSED_PDF: "source_parsed_pdf",
});

/** v5 source registry entry status */
export const SOURCE_REGISTRY_STATUS = Object.freeze({
  VERIFIED: "verified",
  NEEDS_VERIFICATION: "needs_verification",
  DEPRECATED: "deprecated",
});

/** v5 URL validation outcome */
export const URL_VALIDATION_STATUS = Object.freeze({
  VALID: "valid",
  INVALID_SOURCE: "invalid_source",
  HTTP_ERROR: "http_error",
  REDIRECT_MISMATCH: "redirect_mismatch",
  NO_VEHICLE_KEYWORDS: "no_vehicle_keywords",
});

/** v5 evidence volume thresholds */
export const ACQUISITION_EVIDENCE_TARGETS = Object.freeze({
  TARGET: 50,
  FAILURE_THRESHOLD: 20,
});

export const CONFIDENCE_BAND = Object.freeze({
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
});

/** Minimum overall score to enable one-click publish suggestion (not auto-publish). */
export const PUBLISH_READY_CONFIDENCE = 80;
