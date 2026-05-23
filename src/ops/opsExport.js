/**
 * Ops report exports — CSV + JSON with build/environment envelope.
 */

import { downloadCsvFromObjects } from "../utils/csvExport.js";
import { getBuildMetadataSnapshot } from "../utils/buildMetadata.js";
import { APP_CONFIG } from "../config.js";

export function buildExportEnvelope(reportType, data = {}) {
  const build = getBuildMetadataSnapshot();
  return {
    reportType,
    exportedAt: new Date().toISOString(),
    environment: APP_CONFIG.environment,
    domain: APP_CONFIG.domain,
    build: {
      commit: build.commit,
      builtAt: build.builtAt,
      releaseVersion: build.releaseVersion,
    },
    data,
  };
}

export function downloadJsonSnapshot(reportType, data, filenamePrefix) {
  const envelope = buildExportEnvelope(reportType, data);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filename = `${filenamePrefix || reportType}-${stamp}.json`;
  const blob = new Blob([JSON.stringify(envelope, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return envelope;
}

export function exportRowsAsCsv(rows, mapRow, filename) {
  if (!rows?.length) return false;
  return downloadCsvFromObjects(rows, mapRow, filename);
}
