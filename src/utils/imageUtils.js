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

export const fallbackEVImage =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop";

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