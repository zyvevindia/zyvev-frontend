import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  getResponsiveImage,
} from "../../utils/imageUtils";

import {
  LOCAL_FALLBACK_EV,
} from "../../utils/imageUtils";

import {
  IMAGE_ASPECT,
  buildImageFallbackChain,
} from "../../utils/vehicleMedia";

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
      return buildImageFallbackChain(car, role).length
        ? [srcProp, ...buildImageFallbackChain(car, role)]
        : [srcProp];
    }
    return buildImageFallbackChain(car, role);
  }, [car, role, srcProp]);

  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const src = chain[Math.min(index, chain.length - 1)] || "";
  const aspect = aspectRatio || IMAGE_ASPECT[role] || IMAGE_ASPECT.listing;

  const responsiveSet = responsive
    ? getResponsiveImage(src)
    : null;

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoadProp?.();
  }, [onLoadProp]);

  const handleError = useCallback(
    (event) => {
      if (index < chain.length - 1) {
        setIndex((i) => i + 1);
        setLoaded(false);
        return;
      }

      const img = event?.currentTarget;
      if (img && img.src !== LOCAL_FALLBACK_EV) {
        img.src = LOCAL_FALLBACK_EV;
        setLoaded(false);
        return;
      }

      setLoaded(true);
      onBroken?.(src);
    },
    [index, chain.length, onBroken, src]
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
            media="(max-width: 640px)"
            srcSet={responsiveSet.small}
          />
          <source
            media="(max-width: 1024px)"
            srcSet={responsiveSet.medium}
          />
          <img
            key={src}
            className={imgClassName}
            src={responsiveSet.large}
            alt={alt}
            style={imgBaseStyle}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : "low"}
            draggable="false"
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      ) : (
        <img
          key={src}
          className={imgClassName}
          src={src}
          alt={alt}
          style={imgBaseStyle}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          draggable="false"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
