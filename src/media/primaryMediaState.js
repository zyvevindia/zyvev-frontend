/** DOM contract for VehicleImage primary (chain index 0) resolution status. */
export const PRIMARY_MEDIA_STATE = Object.freeze({
  PENDING: "pending",
  LOADED: "loaded",
  FAILED: "failed",
});

/** @typedef {(typeof PRIMARY_MEDIA_STATE)[keyof typeof PRIMARY_MEDIA_STATE]} PrimaryMediaState */

export const PRIMARY_MEDIA_STATE_ATTR = "data-primary-media-state";
