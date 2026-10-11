/**
 * LazyViewport3D — viewport-gated mount for WebGL islands.
 *
 * React lazy() only splits the chunk; the import still fires as soon as the
 * component is rendered anywhere in the tree (even far below the fold), so
 * three.js + the whole scene boots on every province-page visit. This wrapper
 * defers rendering `children` until the placeholder is NEAR the viewport
 * (IntersectionObserver, 200px margin), which means:
 *   - no three.js import/parse before the visitor actually scrolls to the block
 *   - no WebGL context created offscreen
 *   - the placeholder keeps the final layout height, so SSR/SEO HTML and CLS
 *     are unchanged
 * The reduced-motion case is handled inside each scene (single static frame).
 */
import { useEffect, useRef, useState } from "react";

export type LazyViewport3DProps = {
  children: React.ReactNode;
  /** Placeholder height so scroll position and CLS stay identical. */
  minHeight: number;
};

export default function LazyViewport3D({
  children,
  minHeight,
}: LazyViewport3DProps) {
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = placeholderRef.current;
    if (!el || mounted) return;
    if (typeof IntersectionObserver === "undefined") {
      // Ancient browsers: render the island rather than nothing at all.
      setMounted(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  if (mounted) return <>{children}</>;

  return (
    <div
      ref={placeholderRef}
      aria-hidden="true"
      className="w-full"
      style={{ minHeight }}
    />
  );
}
