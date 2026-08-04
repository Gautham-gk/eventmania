/**
 * Shared page-layout constants.
 *
 * `GUTTERS` is THE horizontal padding for any full-width page section. A flat
 * `px-12` (48px) is correct at desktop but eats a quarter of a 375px phone, so
 * every surface steps down through the same three values instead. Import this —
 * do not hand-write the trio, or one page ends up a step out of line with the
 * navbar it sits under.
 */
export const GUTTERS = "px-4 sm:px-6 lg:px-12";

/**
 * The standard capped content column: `GUTTERS` inside a 1400px centred box.
 * Used by `/event/[id]`, `/community/[slug]`, `/dashboard` and the organiser
 * pages, so their headings all start on the same line at every width.
 */
export const PAGE_MAX_WIDTH = 1400;
