import { useCallback, useEffect, useRef, useState } from "react";
import { isImageCached, markImageCached } from "../utils/imageCache";
import styles from "./LazyPoster.module.css";

interface Props {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  rootMargin?: string;
}

export default function LazyPoster({
  src,
  alt = "",
  className,
  imgClassName,
  priority = false,
  rootMargin = "300px 0px",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(
    () => priority || isImageCached(src)
  );
  const [loaded, setLoaded] = useState(() => isImageCached(src));

  useEffect(() => {
    if (priority || shouldLoad) return;

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [priority, shouldLoad, rootMargin]);

  useEffect(() => {
    if (isImageCached(src)) {
      setShouldLoad(true);
      setLoaded(true);
      return;
    }

    setLoaded(false);
    if (priority) setShouldLoad(true);
  }, [src, priority]);

  const handleImgRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className ?? ""} ${
        loaded ? styles.loaded : ""
      }`}
    >
      <div className={styles.placeholder} aria-hidden />
      {shouldLoad && (
        <img
          ref={handleImgRef}
          src={src}
          alt={alt}
          className={`${styles.image} ${imgClassName ?? ""}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => {
            markImageCached(src);
            setLoaded(true);
          }}
          onError={() => {
            markImageCached(src);
            setLoaded(true);
          }}
        />
      )}
    </div>
  );
}
