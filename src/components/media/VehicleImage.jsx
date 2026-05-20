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
import {
  IMAGE_ASPECT,
  buildImageFallbackChain,
} from "../../utils/vehicleMedia.js";

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
    if (srcProp) {
      const base = buildImageFallbackChain(car, role);
      return base.length
        ? [srcProp, ...base.filter((u) => u !== srcProp)]
        : [srcProp];
    }
    return buildImageFallbackChain(car, role);
  }, [car, role, srcProp]);

  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const src = chain[Math.min(index, chain.length - 1)] || "";
  const aspect = aspectRatio || IMAGE_ASPECT[role] || IMAGE_ASPECT.listing;
  const sizes = SIZES_BY_ROLE[role] || LISTING_SIZES;

  const responsiveSet = useMemo(() => {
    if (!responsive || !src) return null;
    return buildResponsiveSources(src, [480, 800, 1200]);
  }, [responsive, src]);

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

      const img = event?.currentTarget;
      if (img && img.src !== LOCAL_FALLBACK_EV) {
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

      setLoaded(true);
      onBroken?.(src);
    },
    [index, chain.length, onBroken, src, role, car, chain]
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
      {!loaded && (
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

      {responsive && responsiveSet ? (
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
      ) : (
        <img key={`${src}-${index}`} {...imgProps} src={src} />
      )}
    </div>
  );
}