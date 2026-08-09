import type { CSSProperties } from "react";

/**
 * NewFind mark — the face glyph (thin ring · two eyes · smile), with the
 * terracotta "connection dot" at the chin. The ring/eyes/smile are drawn in
 * `currentColor` so the mark re-tints with whatever colour the parent sets
 * (we drive that from the theme-aware `--brand-logo` var). The terracotta dot
 * is a fixed brand accent and never changes.
 *
 * Geometry is copied verbatim from the SVG master
 * (logo_and_wordmark/svg/mark/newfind-mark-green.svg).
 */
export function BrandMark({
  className,
  style,
  blinking = false,
  title = "NewFind",
}: {
  className?: string;
  style?: CSSProperties;
  /** Adds the blink animation to the eyes (used by the loader). */
  blinking?: boolean;
  title?: string;
}) {
  const eyeClass = blinking ? "nf-eye" : undefined;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx="39" cy="44" r="6.5" fill="currentColor" className={eyeClass} />
      <circle cx="61" cy="44" r="6.5" fill="currentColor" className={eyeClass} />
      <path d="M34 57 C38 69 44 73 50 73" fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
      <path d="M66 57 C62 69 56 73 50 73" fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
      <circle cx="50" cy="73" r="6.5" fill="#E07A5F" />
    </svg>
  );
}
