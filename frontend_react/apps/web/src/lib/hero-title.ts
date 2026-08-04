/**
 * Font size for a full-bleed hero title (`/event/[id]`, `/community/[slug]`).
 *
 * The title always renders on ONE line, so the size has to bend to the title
 * rather than the other way round: the vw term shrinks as the title gets longer
 * (~169/chars keeps a bold line inside the px-12 gutters), while the clamp keeps
 * it sane on very wide screens and very short titles.
 *
 * Shared so both heroes size their titles identically — an event and a community
 * with the same-length name render at the same size.
 */
export function heroTitleSize(title: string): string {
  const vw = Math.min(5, 169 / Math.max(title.length, 1));
  return `clamp(20px, ${vw.toFixed(2)}vw, 64px)`;
}
