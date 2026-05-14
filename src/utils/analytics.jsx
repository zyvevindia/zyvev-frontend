/* =========================================================
   ===================== GOOGLE ANALYTICS ==================
   ========================================================= */

/*
  IMPORTANT:

  Replace:

  G-XXXXXXXXXX

  with your real Google Analytics GA4 ID.
*/

/* =========================================================
   ====================== PAGE TRACKING ====================
   ========================================================= */

export const trackPageView =
  (path) => {

    if (
      !window.gtag
    ) {
      return;
    }

    window.gtag(
      "config",

      "G-XXXXXXXXXX",

      {
        page_path: path,
      }
    );
  };

/* =========================================================
   ======================= EVENT TRACKING ==================
   ========================================================= */

export const trackEvent =
  (
    action,
    category,
    label = "",
    value = 0
  ) => {

    if (
      !window.gtag
    ) {
      return;
    }

    window.gtag(
      "event",

      action,

      {
        event_category:
          category,

        event_label:
          label,

        value,
      }
    );
  };

/* =========================================================
   ===================== LEAD TRACKING =====================
   ========================================================= */

export const trackLead =
  (
    carName
  ) => {

    trackEvent(
      "lead_generated",

      "Lead",

      carName
    );
  };

/* =========================================================
   ==================== COMPARE TRACKING ===================
   ========================================================= */

export const trackCompare =
  (
    compareCount
  ) => {

    trackEvent(
      "compare_ev",

      "Comparison",

      `Compared ${compareCount} EVs`
    );
  };

/* =========================================================
   ==================== CAR VIEW TRACKING ==================
   ========================================================= */

export const trackCarView =
  (
    carName
  ) => {

    trackEvent(
      "view_ev",

      "Vehicle",

      carName
    );
  };