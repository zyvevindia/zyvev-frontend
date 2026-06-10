import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { LOCAL_FALLBACK_EV } from "../../config/media.js";
import {
  buildResponsiveSources,
  COMPARE_SIZES,
  HERO_SIZES,
  LISTING_SIZES,
} from "../../media/responsive.js";
import { logImageFallback } from "../../launch/imageFallbackLog.js";
import { sanitizeImageUrl } from "../../utils/imageUrl.js";
import {
  IMAGE_ASPECT,
  buildGalleryTypeFallbackChain,
  buildImageFallbackChain,
} from "../../utils/vehicleMedia.js";

const PLACEHOLDER_LABEL = "EV image coming soon";

function filterValidChain(urls, role = "listing") {
  if (!Array.isArray(urls)) return [];
  return urls
    .map((u) => sanitizeImageUrl(u, { role }))
    .filter(Boolean);
}

function resolveMediaSlug(car) {
  return (
    car?.familySlug ||
    car?.slug ||
    car?.catalogMeta?.familySlug ||
    car?.catalogMeta?.slug ||
    "unknown"
  );
}

const SIZES_BY_ROLE = {
  listing: LISTING_SIZES,
  compare: COMPARE_SIZES,
  hero: HERO_SIZES,
  gallery: LISTING_SIZES,
  og: HERO_SIZES,
};

/**
 * Catalog-aware image with aspect-ratio box, loading placeholder, and fallback chain.
 */
export default function VehicleImage({
  car,
  src: srcProp,
  role = "listing",
  imageType = null,
  mediaChannel = null,
  alt = "Electric vehicle",
  aspectRatio,
  wrapperStyle = {},
  imgClassName = "",
  imgStyle = {},
  responsive = false,
  eager = false,
  onLoad: onLoadProp,
  onBroken,
}) {
  const chain = useMemo(() => {
    const sanitizeOpts = { role };
    const primary = sanitizeImageUrl(srcProp, sanitizeOpts);
    const base = filterValidChain(
      role === "gallery" && imageType
        ? buildGalleryTypeFallbackChain(car, imageType)
        : buildImageFallbackChain(car, role),
      role
    );

    if (primary) {
      return [primary, ...base.filter((u) => u !== primary)];
    }

    if (base.length > 0) return base;

    const fallback = sanitizeImageUrl(LOCAL_FALLBACK_EV, sanitizeOpts);
    return fallback ? [fallback] : [];
  }, [car, role, srcProp, imageType]);

  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [exhausted, setExhausted] = useState(chain.length === 0);
  const imgRef = useRef(null);

  const markLoadedIfComplete = useCallback((node) => {
    if (node?.complete && node.naturalWidth > 0) {
      setLoaded(true);
      return true;
    }
    return false;
  }, []);

  const setImgRef = useCallback(
    (node) => {
      imgRef.current = node;
      markLoadedIfComplete(node);
    },
    [markLoadedIfComplete]
  );

  useEffect(() => {
    setIndex(0);
    setLoaded(false);
    setExhausted(chain.length === 0);
  }, [chain]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const slug = resolveMediaSlug(car);
    if (role === "gallery" && imageType) {
      console.warn("[gallery-media]", slug, imageType, chain);
      return;
    }
    if (role === "compare") {
      console.warn("[compare-media]", slug, chain);
      return;
    }
    if (mediaChannel === "seo") {
      console.warn("[seo-media]", slug, chain);
      return;
    }
    console.warn("[media]", slug, chain);
  }, [car, chain, role, imageType, mediaChannel]);

  const currentSrc =
    exhausted || chain.length === 0
      ? ""
      : chain[Math.min(index, chain.length - 1)] || "";
  const src = sanitizeImageUrl(currentSrc, { role }) || "";
  const showPlaceholder = exhausted;
  const aspect = aspectRatio || IMAGE_ASPECT[role] || IMAGE_ASPECT.listing;
  const sizes = SIZES_BY_ROLE[role] || LISTING_SIZES;

  const responsiveSet = useMemo(() => {
    if (!responsive || showPlaceholder || !src) return null;
    const set = buildResponsiveSources(src, [480, 800, 1200]);
    if (!set?.default) return null;
    return set;
  }, [responsive, showPlaceholder, src]);

  useLayoutEffect(() => {
    markLoadedIfComplete(imgRef.current);
  }, [src, index, markLoadedIfComplete]);

  const advanceFallback = useCallback(() => {
    const failedUrl = src;
    const slug = resolveMediaSlug(car);

    if (index < chain.length - 1) {
      const nextIndex = index + 1;
      const nextUrl = chain[nextIndex];
      if (!sanitizeImageUrl(nextUrl, { role })) {
        setExhausted(true);
        setLoaded(true);
        onBroken?.(failedUrl);
        return;
      }
      logImageFallback({
        role,
        failedUrl,
        fallbackUrl: nextUrl,
        slug,
      });
      setIndex(nextIndex);
      setLoaded(false);
      return;
    }

    setExhausted(true);
    setLoaded(true);
    onBroken?.(failedUrl);
  }, [index, chain, onBroken, src, role, car]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoadProp?.();
  }, [onLoadProp]);

  const handleError = useCallback(() => {
    advanceFallback();
  }, [advanceFallback]);

  const imgBaseStyle = {
    ...imgStyle,
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    zIndex: 1,
    opacity: loaded ? 1 : 0,
    visibility: loaded ? "visible" : "hidden",
    transition: [imgStyle.transition, "opacity 0.35s ease"]
      .filter(Boolean)
      .join(", "),
  };

  const imgProps = {
    className: imgClassName,
    alt,
    style: imgBaseStyle,
    loading: eager ? "eager" : "lazy",
    decoding: "async",
    fetchPriority: eager ? "high" : "auto",
    draggable: false,
    onLoad: handleLoad,
    onError: handleError,
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: aspect,
        overflow: "hidden",
        background:
          "linear-gradient(110deg, #e2e8f0 8%, #f1f5f9 18%, #e2e8f0 33%)",
        backgroundSize: "200% 100%",
        animation:
          loaded || showPlaceholder
            ? "none"
            : "vehicleImageShimmer 1.4s ease-in-out infinite",
        ...wrapperStyle,
      }}
    >
      {!loaded && !showPlaceholder && src ? (
        <span
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(15,23,42,0.04), transparent)",
          }}
          aria-hidden
        />
      ) : null}

      {showPlaceholder ? (
        <div
          className="vehicle-image-placeholder"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.8125rem",
            fontWeight: 500,
            lineHeight: 1.35,
            background:
              "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
          }}
          role="img"
          aria-label={PLACEHOLDER_LABEL}
        >
          {PLACEHOLDER_LABEL}
        </div>
      ) : null}

      {!showPlaceholder && responsive && responsiveSet ? (
        <picture
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
          }}
        >
          <source
            type="image/avif"
            srcSet={responsiveSet.avifSrcSet}
            sizes={sizes}
          />
          <source
            type="image/webp"
            srcSet={responsiveSet.webpSrcSet}
            sizes={sizes}
          />
          <img
            key={`${src}-${index}`}
            ref={setImgRef}
            {...imgProps}
            src={responsiveSet.default}
            srcSet={responsiveSet.srcSet}
            sizes={sizes}
          />
        </picture>
      ) : !showPlaceholder && src ? (
        <img key={`${src}-${index}`} ref={setImgRef} {...imgProps} src={src} />
      ) : null}
    </div>
  );
}
