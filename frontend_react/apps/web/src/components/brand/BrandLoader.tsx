import type { CSSProperties } from "react";
import { BrandMark } from "./BrandMark";

/**
 * NewFind "breathing aura" loader. The mark gently breathes (subtle scale),
 * a soft aura pulses outward behind it, and the eyes blink on the exhale —
 * matching the brand loader described in the asset pack README. Colour comes
 * from the theme-aware `--brand-logo` var, so it reads correctly in light and
 * dark. Keyframes live in globals.css (`nf-aura`, `nf-breathe`, `nf-blink`),
 * and honour `prefers-reduced-motion`.
 */
export function BrandLoader({
  message = "Loading, take a deep breath…",
  size = 72,
  className,
  style,
}: {
  message?: string | null;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const box = Math.round(size * 1.5);
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        color: "var(--brand-logo)",
        ...style,
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ position: "relative", width: box, height: box, display: "grid", placeItems: "center" }}>
        <span
          className="nf-aura"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "9999px",
            background: "currentColor",
          }}
        />
        <BrandMark className="nf-breathe" style={{ position: "relative", width: size, height: size }} blinking />
      </div>
      {message ? (
        <p style={{ color: "var(--brand-hint)", fontWeight: 500, margin: 0 }}>{message}</p>
      ) : null}
    </div>
  );
}
