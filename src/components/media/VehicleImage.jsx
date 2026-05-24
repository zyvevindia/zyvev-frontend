import {
  useCallback,
  useMemo,
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
  buildImageFallbackChain,
} from "../../utils/vehicleMedia.js";

const PLACEHOLDER_LABEL = "EV image coming soon";

function filterValidChain(urls, role = "listing") {
  if (!Array.isArray(urls)) return [];
  return urls
    .map((u) => sanitizeImageUrl(u, { role }))
    .filter(Boolean);
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
      buildImageFallbackChain(car, role),
      role
    );

    if (primary) {
      return [primary, ...base.filter((u) => u !== primary)];
    }

    if (base.length > 0) return base;

    const fallback = sanitizeImageUrl(LOCAL_FALLBACK_EV, sanitizeOpts);
    return fallback ? [fallback] : [];
  }, [car, role, srcProp]);

  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(
    chain.length === 0
  );

  const rawSrc = showPlaceholder
    ? ""
    : chain[Math.min(index, chain.length - 1)] || "";
  const src = sanitizeImageUrl(rawSrc, { role }) || "";
  const usePlaceholder = showPlaceholder || !src;
  const aspect = aspectRatio || IMAGE_ASPECT[role] || IMAGE_ASPECT.listing;
  const sizes = SIZES_BY_ROLE[role] || LISTING_SIZES;

  const responsiveSet = useMemo(() => {
    if (!responsive || usePlaceholder || !src) return null;
    return buildResponsiveSources(src, [480, 800, 1200]);
  }, [responsive, usePlaceholder, src]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoadProp?.();
  }, [onLoadProp]);

  const handleError = useCallback(
    (event) => {
      const failedUrl = src;
      const slug =
        car?.slug ||
        car?.catalogMeta?.slug ||
        "";

      if (index < chain.length - 1) {
        const nextUrl = chain[index + 1];
        if (!sanitizeImageUrl(nextUrl, { role })) {
          setShowPlaceholder(true);
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
        setIndex((i) => i + 1);
        setLoaded(false);
        return;
      }

      if (role === "compare") {
        const local = sanitizeImageUrl(LOCAL_FALLBACK_EV, { role });
        if (
          local &&
          event?.currentTarget &&
          !event.currentTarget.src.endsWith(LOCAL_FALLBACK_EV)
        ) {
          logImageFallback({
            role,
            failedUrl,
            fallbackUrl: local,
            slug,
          });
          event.currentTarget.src = local;
          setLoaded(false);
          return;
        }
        setShowPlaceholder(true);
        setLoaded(true);
        onBroken?.(failedUrl);
        return;
      }

      const img = event?.currentTarget;
      if (
        img &&
        sanitizeImageUrl(LOCAL_FALLBACK_EV, { role }) &&
        !img.src.endsWith(LOCAL_FALLBACK_EV)
      ) {
        logImageFallback({
          role,
          failedUrl,
          fallbackUrl: LOCAL_FALLBACK_EV,
          slug,
        });
        img.src = LOCAL_FALLBACK_EV;
        setLoaded(false);
        return;
      }

      setShowPlaceholder(true);
      setLoaded(true);
      onBroken?.(failedUrl);
    },
    [index, chain, onBroken, src, role, car]
  );

  const imgBaseStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    opacity: loaded ? 1 : 0,
    transition: "opacity 0.35s ease",
    ...imgStyle,
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
        animation: loaded
          ? "none"
          : "vehicleImageShimmer 1.4s ease-in-out infinite",
        ...wrapperStyle,
      }}
    >
      {!loaded && !usePlaceholder && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(15,23,42,0.04), transparent)",
          }}
          aria-hidden
        />
      )}

      {usePlaceholder ? (
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

      {!usePlaceholder && responsive && responsiveSet ? (
        <picture
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
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
            {...imgProps}
            src={responsiveSet.default}
            srcSet={responsiveSet.srcSet}
            sizes={sizes}
          />
        </picture>
      ) : !usePlaceholder ? (
        <img key={`${src}-${index}`} {...imgProps} src={src} />
      ) : null}
    </div>
  );
}
