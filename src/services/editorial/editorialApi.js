import { API_URL } from "../../config";

import { getToken } from "../../auth";



function authHeaders() {

  const token = getToken();

  return {

    "Content-Type": "application/json",

    ...(token ? { Authorization: `Bearer ${token}` } : {}),

  };

}



async function request(path, options = {}) {

  const res = await fetch(`${API_URL}/api/editorial${path}`, {

    ...options,

    headers: { ...authHeaders(), ...options.headers },

  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {

    const err = new Error(body.error || `HTTP ${res.status}`);

    err.status = res.status;

    err.body = body;

    throw err;

  }

  return body;

}



export function fetchEditorialOverview() {

  return request("/overview");

}



export function fetchEditorialJobs(params = {}) {

  const q = new URLSearchParams(params).toString();

  return request(`/jobs${q ? `?${q}` : ""}`);

}



export function fetchEditorialJob(jobId) {

  return request(`/jobs/${encodeURIComponent(jobId)}`);

}



export function fetchJobDiff(jobId) {

  return request(`/jobs/${encodeURIComponent(jobId)}/diff`);

}



export function fetchExtract(sourceId) {

  return request(`/extracts/${encodeURIComponent(sourceId)}`);

}



export function fetchEditorialSources(params = {}) {

  const q = new URLSearchParams(params).toString();

  return request(`/sources${q ? `?${q}` : ""}`);

}



export function fetchStaged() {

  return request("/staged");

}



export function fetchCoverage() {

  return request("/coverage");

}



export function fetchObservations(params = {}) {

  const q = new URLSearchParams(params).toString();

  return request(`/observations${q ? `?${q}` : ""}`);

}



export function moderateObservation(observationId, payload) {

  return request(`/observations/${encodeURIComponent(observationId)}/moderate`, {

    method: "POST",

    body: JSON.stringify(payload),

  });

}



export function fetchLeadQuality(days = 7) {

  return request(`/lead-quality?days=${days}`);

}



export function fetchDealerReadiness(days = 7) {

  return request(`/dealer-readiness?days=${days}`);

}



export function fetchPublicBetaChecklist() {

  return request("/public-beta-checklist");

}

export function fetchControlledLaunch(profile = "public-beta") {
  return request(`/controlled-launch?profile=${encodeURIComponent(profile)}`);
}

export function fetchMarketLearning(days = 7, useDb = false) {
  return request(`/market-learning?days=${days}${useDb ? "&db=true" : ""}`);
}

export function fetchMarketHealth(useDb = false) {
  return request(`/market-health${useDb ? "?db=true" : ""}`);
}

export function fetchJobRevisions(jobId) {

  return request(`/jobs/${encodeURIComponent(jobId)}/revisions`);

}



export function approveJob(jobId, reviewerNotes = "") {

  return request(`/jobs/${encodeURIComponent(jobId)}/approve`, {

    method: "POST",

    body: JSON.stringify({ reviewerNotes }),

  });

}



export function rejectJob(jobId, reviewerNotes = "") {

  return request(`/jobs/${encodeURIComponent(jobId)}/reject`, {

    method: "POST",

    body: JSON.stringify({ reviewerNotes }),

  });

}



export function needsManualReview(jobId, reviewerNotes = "") {

  return request(

    `/jobs/${encodeURIComponent(jobId)}/needs-manual-review`,

    {

      method: "POST",

      body: JSON.stringify({ reviewerNotes }),

    }

  );

}



export function returnToPending(jobId, reviewerNotes = "") {

  return request(

    `/jobs/${encodeURIComponent(jobId)}/return-to-pending`,

    {

      method: "POST",

      body: JSON.stringify({ reviewerNotes }),

    }

  );

}



export function patchJobField(jobId, payload) {

  return request(`/jobs/${encodeURIComponent(jobId)}/fields`, {

    method: "PATCH",

    body: JSON.stringify(payload),

  });

}



export function publishStaging() {

  return request("/staged/publish", { method: "POST", body: "{}" });

}



export function rollbackStaging(manifestId) {

  return request("/staged/rollback", {

    method: "POST",

    body: JSON.stringify({ manifestId }),

  });

}

