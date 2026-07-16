import { BrandLoader } from "@/components/brand";

/**
 * Route-level loading UI (App Router). Shown automatically during navigation
 * to any route while its server work streams in. Uses the brand
 * "breathing aura" loader so every transition is on-brand and theme-aware.
 */
export default function Loading() {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      style={{ minHeight: "60vh", backgroundColor: "var(--brand-bg)" }}
    >
      <BrandLoader />
    </div>
  );
}
