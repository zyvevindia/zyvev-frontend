import { useMemo } from "react";

import { buildPersonas } from "../../intelligence/buildPersonas.js";
import { PERSONA_LIMITS } from "../../intelligence/personaRules.js";

import "./persona-chips.css";

function normalizePersonas(personasResult) {
  if (!personasResult || typeof personasResult !== "object") {
    return [];
  }

  return Array.isArray(personasResult.personas)
    ? personasResult.personas.filter(Boolean)
    : [];
}

/**
 * Compact persona pill chips from buildPersonas().
 * Use on car detail, compare, discovery cards, and SEO surfaces.
 */
export default function PersonaChips({
  vehicle = null,
  personas = null,
  variant = "default",
  layout = "inline",
  maxChips = PERSONA_LIMITS.maxPersonas,
  className = "",
  id = undefined,
  ariaLabel = "EV personas",
}) {
  const labels = useMemo(() => {
    if (personas) {
      if (Array.isArray(personas)) {
        return normalizePersonas({ personas });
      }
      return normalizePersonas(personas);
    }
    if (vehicle) {
      return normalizePersonas(buildPersonas(vehicle));
    }
    return [];
  }, [vehicle, personas]);

  const chips = labels.slice(0, maxChips);

  if (!chips.length) {
    return null;
  }

  const rootClass = [
    "persona-chips",
    variant === "compact" ? "persona-chips--compact" : "",
    layout === "card" ? "persona-chips--card" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} id={id} aria-label={ariaLabel}>
      {chips.map((label) => (
        <span key={label} className="persona-chips__chip">
          {label}
        </span>
      ))}
    </div>
  );
}
