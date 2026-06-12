/**
 * Tata verified safety metadata for catalog overlays (moved from manual dossiers).
 */

export const TATA_NEXON_VERIFIED_SAFETY = Object.freeze({
  bharatNcap: { stars: 5, status: "verified", verified: true },
  childSafety: { stars: 5, status: "verified", verified: true },
  airbags: { count: 6, status: "verified", verified: true },
  abs: { value: true, verified: true },
  esc: { value: true, verified: true },
  tpms: { value: false, verified: true },
  isofix: { value: true, verified: true },
  hillAssist: { value: true, verified: true },
  camera360: { value: false, verified: true },
  adas: {
    level: 0,
    supported: false,
    status: "verified",
    verified: true,
    features: {
      forwardCollisionWarning: false,
      automaticEmergencyBraking: false,
      trafficSignRecognition: false,
      laneDepartureWarning: false,
      laneKeepAssist: false,
      driverAttentionWarning: false,
      adaptiveHighBeamAssist: false,
      blindSpotMonitor: false,
    },
  },
});

export const TATA_PUNCH_VERIFIED_SAFETY = Object.freeze({
  bharatNcap: { stars: 5, status: "verified", verified: true },
  globalNcap: { stars: 5, status: "verified", verified: true },
  childSafety: { stars: 5, status: "verified", verified: true },
  globalChildSafety: { stars: 5, status: "verified", verified: true },
  airbags: { count: 6, status: "verified", verified: true },
  abs: { value: true, verified: true },
  esc: { value: true, verified: true },
  tpms: { value: true, verified: true },
  isofix: { value: true, verified: true },
  hillAssist: { value: true, verified: true },
  hillDescentControl: { value: false, verified: true },
  camera360: { value: false, verified: true },
  blindSpotMonitor: { value: false, verified: true },
  adas: {
    level: 0,
    supported: false,
    status: "verified",
    verified: true,
    features: { blindSpotMonitor: false },
  },
});

export const TATA_TIAGO_VERIFIED_SAFETY = Object.freeze({
  bharatNcap: { status: "not_tested", verified: true },
  globalNcap: { status: "not_tested", verified: true },
  airbags: { count: 6, status: "verified", verified: true },
  abs: { value: true, verified: true },
  esc: { value: true, verified: true },
  traction_control: { value: true, verified: true },
  tpms: { value: true, verified: true },
  isofix: { value: true, verified: true },
  hillAssist: { value: true, verified: true },
  adas: {
    level: 0,
    supported: false,
    status: "verified",
    verified: true,
  },
});

export const TATA_VERIFIED_SAFETY_BY_FAMILY = Object.freeze({
  "tata-nexon-ev": TATA_NEXON_VERIFIED_SAFETY,
  "tata-punch-ev": TATA_PUNCH_VERIFIED_SAFETY,
  "tata-tiago-ev": TATA_TIAGO_VERIFIED_SAFETY,
});
