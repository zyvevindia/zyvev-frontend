/* =========================================================
   ==================== IMAGE UTILITIES ====================
   ========================================================= */

/*
  PURPOSE:

  - Cloudinary optimization
  - responsive image delivery
  - faster loading
  - SEO improvements
  - Core Web Vitals optimization
*/

/* =========================================================
   ================= CLOUDINARY DETECTION ==================
   ========================================================= */

export function isCloudinaryImage(
  url = ""
) {

  return url.includes(
    "res.cloudinary.com"
  );
}

/* =========================================================
   ================== OPTIMIZE IMAGE URL ===================
   ========================================================= */

export function optimizeImage(
  url = "",

  {
    width = 800,
    quality = "auto",
    format = "auto",
  } = {}
) {

  if (!url) {
    return "";
  }

  /* ================= NON-CLOUDINARY ================= */

  if (
    !isCloudinaryImage(url)
  ) {

    return url;
  }

  /* ================= ALREADY OPTIMIZED ================= */

  if (
    url.includes("/upload/")
  ) {

    return url.replace(

      "/upload/",

      `/upload/f_${format},q_${quality},w_${width},c_limit/`
    );
  }

  return url;
}

/* =========================================================
   ================== RESPONSIVE SOURCES ===================
   ========================================================= */

export function getResponsiveImage(
  url = ""
) {

  return {

    small:
      optimizeImage(url, {
        width: 480,
      }),

    medium:
      optimizeImage(url, {
        width: 800,
      }),

    large:
      optimizeImage(url, {
        width: 1200,
      }),
  };
}

/* =========================================================
   ====================== IMAGE FALLBACK ===================
   ========================================================= */

/** Hosted catalog CDN — placeholder URLs in Tier-1 JSON; not production-ready yet */
export const CATALOG_CDN_HOST = "cdn.evsavari.com";

/** Local static asset (Vercel /public) — always available */
export const LOCAL_FALLBACK_EV = "/fallback-ev.svg";

/** @deprecated use LOCAL_FALLBACK_EV — kept for imports */
export const fallbackEVImage = LOCAL_FALLBACK_EV;

export function isCatalogCdnUrl(url = "") {
  return (
    typeof url === "string" &&
    url.includes(CATALOG_CDN_HOST)
  );
}

/* =========================================================
   ==================== SAFE IMAGE URL =====================
   ========================================================= */

export function getSafeImage(
  image
) {

  if (
    !image ||
    typeof image !== "string"
  ) {

    return fallbackEVImage;
  }

  return image;
}