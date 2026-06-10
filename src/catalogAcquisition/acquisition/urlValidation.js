/**
 * v5 URL validation — reject stale redirects and wrong pages before acquisition.
 */

import { URL_VALIDATION_STATUS } from "../constants.js";
import { fetchUrlContent } from "./fetchUrl.js";

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html) {
  const m = String(html).match(/<title[^>]*>([^<]+)/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

function normalizePath(url) {
  try {
    return new URL(url).pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return "";
  }
}

function buildKeywordSet(vehicleKeywords = [], brand = "", model = "") {
  const tokens = new Set();
  for (const kw of vehicleKeywords) {
    for (const part of String(kw).toLowerCase().split(/[\s\-_/]+/)) {
      if (part.length >= 3) tokens.add(part);
    }
  }
  for (const part of `${brand} ${model}`.toLowerCase().split(/[\s\-_/]+/)) {
    if (part.length >= 3) tokens.add(part);
  }
  return [...tokens];
}

function textContainsKeyword(text, keywords) {
  const hay = text.toLowerCase();
  return keywords.some((kw) => hay.includes(kw));
}

function pathContainsKeyword(path, keywords) {
  const p = path.toLowerCase();
  return keywords.some((kw) => p.includes(kw.replace(/\s+/g, "")) || p.includes(kw));
}

/**
 * Validate fetched page against requested URL and vehicle identity.
 * @param {{ requestedUrl: string, fetchResult: object, vehicleKeywords?: string[], brand?: string, model?: string }} input
 */
export function validateAcquiredUrl(input = {}) {
  const requestedUrl = String(input.requestedUrl || "").trim();
  const fetchResult = input.fetchResult || {};
  const keywords = buildKeywordSet(input.vehicleKeywords, input.brand, input.model);

  if (!fetchResult.ok) {
    return {
      status: URL_VALIDATION_STATUS.HTTP_ERROR,
      valid: false,
      requestedUrl,
      finalUrl: fetchResult.finalUrl || requestedUrl,
      httpStatus: fetchResult.status || null,
      pageTitle: null,
      warnings: [
        {
          code: URL_VALIDATION_STATUS.HTTP_ERROR,
          message: (fetchResult.errors || ["HTTP fetch failed"]).join("; "),
        },
      ],
      keywords,
    };
  }

  const finalUrl = fetchResult.finalUrl || fetchResult.url || requestedUrl;
  const pageTitle = extractTitle(fetchResult.content || "");
  const visibleText = stripHtml(fetchResult.content || "");
  const reqPath = normalizePath(requestedUrl);
  const finPath = normalizePath(finalUrl);
  const redirected = Boolean(fetchResult.redirected) || reqPath !== finPath;

  const warnings = [];
  let status = URL_VALIDATION_STATUS.VALID;

  if (redirected && !pathContainsKeyword(finPath, keywords)) {
    status = URL_VALIDATION_STATUS.REDIRECT_MISMATCH;
    warnings.push({
      code: URL_VALIDATION_STATUS.REDIRECT_MISMATCH,
      message: `Redirected from ${reqPath} to ${finPath} — final path lacks vehicle keywords`,
      requestedUrl,
      finalUrl,
    });
  }

  const titleHasKeyword = textContainsKeyword(pageTitle, keywords);
  const bodyHasKeyword = textContainsKeyword(visibleText, keywords);

  if (!titleHasKeyword && !bodyHasKeyword) {
    status =
      status === URL_VALIDATION_STATUS.REDIRECT_MISMATCH
        ? URL_VALIDATION_STATUS.INVALID_SOURCE
        : URL_VALIDATION_STATUS.NO_VEHICLE_KEYWORDS;
    warnings.push({
      code: URL_VALIDATION_STATUS.NO_VEHICLE_KEYWORDS,
      message: `Page title and body lack vehicle keywords: [${keywords.join(", ")}]`,
      pageTitle: pageTitle.slice(0, 120),
    });
  }

  if (
    status === URL_VALIDATION_STATUS.REDIRECT_MISMATCH ||
    status === URL_VALIDATION_STATUS.NO_VEHICLE_KEYWORDS
  ) {
    status = URL_VALIDATION_STATUS.INVALID_SOURCE;
  }

  const valid = status === URL_VALIDATION_STATUS.VALID;

  return {
    status,
    valid,
    requestedUrl,
    finalUrl,
    redirected,
    httpStatus: fetchResult.status || 200,
    pageTitle,
    visibleTextLength: visibleText.length,
    hasVehicleKeywordsInBody: bodyHasKeyword,
    hasVehicleKeywordsInTitle: titleHasKeyword,
    warnings,
    keywords,
  };
}

/**
 * Fetch + validate in one step.
 */
export async function fetchAndValidateUrl(input = {}) {
  const requestedUrl = String(input.url || input.requestedUrl || "").trim();
  const fetched = await fetchUrlContent(requestedUrl, input.fetchOpts);
  const validation = validateAcquiredUrl({
    requestedUrl,
    fetchResult: fetched,
    vehicleKeywords: input.vehicleKeywords,
    brand: input.brand,
    model: input.model,
  });
  return { fetched, validation };
}
