/**
 * Build-time metadata injected by Vite `define`.
 */

export const BUILD_METADATA = {
  commit:
    typeof __EVSAVARI_BUILD_COMMIT__ !== "undefined"
      ? __EVSAVARI_BUILD_COMMIT__
      : "dev",
  builtAt:
    typeof __EVSAVARI_BUILD_TIME__ !== "undefined"
      ? __EVSAVARI_BUILD_TIME__
      : null,
  releaseVersion:
    typeof __EVSAVARI_RELEASE_VERSION__ !== "undefined"
      ? __EVSAVARI_RELEASE_VERSION__
      : "0.0.0",
};

/** @deprecated Use BUILD_METADATA */
export const BUILD_META = BUILD_METADATA;

export function formatBuildTimestamp(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getBuildMetadataSnapshot() {
  return {
    ...BUILD_METADATA,
    builtAtFormatted: formatBuildTimestamp(BUILD_METADATA.builtAt),
  };
}
