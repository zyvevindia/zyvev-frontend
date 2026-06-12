import { formatAcChargeDurationLabel } from "../../../../utils/formatChargingDuration.js";



export function chargingSummary(charging) {

  if (!charging) return "";



  const segments = [];



  const dcParts = [];

  if (charging.dcKw) dcParts.push(`${charging.dcKw} kW`);

  if (charging.dcTime10to80Minutes) {

    dcParts.push(`${charging.dcTime10to80Minutes} min`);

  } else if (charging.dcTime20to80Minutes) {

    dcParts.push(`${charging.dcTime20to80Minutes} min`);

  }

  if (dcParts.length) segments.push(`DC: ${dcParts.join(" • ")}`);



  const acParts = [];

  if (charging.acKw) acParts.push(`${charging.acKw} kW`);

  const acLabel = formatAcChargeDurationLabel(charging.acTime0to100Hours);

  if (acLabel) acParts.push(acLabel);

  if (acParts.length) segments.push(`AC: ${acParts.join(" • ")}`);



  if (segments.length) return segments.join(" · ");



  const legacy = [];

  if (charging.acKw) legacy.push(`${charging.acKw} kW AC`);

  if (charging.dcKw) legacy.push(`${charging.dcKw} kW DC`);

  if (charging.port) legacy.push(charging.port);

  return legacy.join(" · ");

}

