import type { CSSProperties } from "react";
import { BrandMark } from "./BrandMark";
import { Wordmark } from "./Wordmark";

/**
 * Horizontal NewFind lockup — mark + wordmark on a shared baseline. Both parts
 * inherit `currentColor`, so set the colour on a wrapper (or via `color` in
 * `style`) and the whole lockup re-tints. In themed surfaces we point that at
 * the `--brand-logo` var (green in light, linen in dark); on the fixed-green
 * footer we point it at `--brand-on-green` so it stays linen in both themes.
 */
export function BrandLogo({
  className,
  style,
  markSize = 28,
  gap = 10,
  title = "NewFind",
}: {
  className?: string;
  style?: CSSProperties;
  /** Height/width of the square mark in px; the wordmark scales with it. */
  markSize?: number;
  gap?: number;
  title?: string;
}) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap, ...style }}
      aria-label={title}
    >
      <BrandMark style={{ width: markSize, height: markSize, flexShrink: 0 }} title={title} />
      {/* 0.58 = the wordmark-to-mark height ratio of the official horizontal
          lockup master (8.001 × 7.2491 scale ÷ 100-unit mark tile). */}
      <Wordmark style={{ height: markSize * 0.58, width: "auto" }} title={title} />
    </span>
  );
}
