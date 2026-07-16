'use client'

// ─────────────────────────────────────────────────────────────────────────────
//  Every event tag — ONE definition. Status tags (Free / Selling Fast / This
//  Week / …) at the top; the category tag (Music / Arts & Culture / …) below.
//
//  Rendered by the event cards (EventsCarousel) and the /event/[id] hero, so a
//  tag looks the same wherever it appears. Which tags an event gets is decided
//  in ONE place too: `toCarouselEvent()` in lib/card-adapters.ts.
//
//  Adding a tag? Add it to BADGE_CONFIG here AND emit it from toCarouselEvent —
//  a config entry with nothing emitting it is dead (see 'today'/'recommended').
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeType =
  | 'free'
  | 'selling-fast'
  | 'today'
  | 'sold-out'
  | 'this-week'
  | 'recommended'

// Fixed semantic accents — intentionally NOT themed (same in light and dark),
// like the other status colours.
export const BADGE_CONFIG: Record<BadgeType, { bg: string; text: string; label: string }> = {
  'free': { bg: '#DC2626', text: '#F2EFEA', label: 'Free' },
  'selling-fast': { bg: '#D97706', text: '#F2EFEA', label: 'Selling Fast' },
  'today': { bg: '#2563EB', text: '#F2EFEA', label: 'Today' },
  'this-week': { bg: '#F59E0B', text: '#F2EFEA', label: 'This Week' },
  'recommended': { bg: '#7C3AED', text: '#F2EFEA', label: 'Recommended' },
  'sold-out': { bg: '#6B7280', text: '#F2EFEA', label: 'Sold Out' },
}

/** A single status pill. */
export function EventBadge({ type }: { type: BadgeType }) {
  const cfg = BADGE_CONFIG[type]
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[16px] font-bold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  )
}

/**
 * The row of status pills for an event. Renders nothing when there are no tags,
 * so callers don't need their own length check.
 *
 * `types` is the caller's choice: the cards pass a sold-out-filtered list (they
 * signal sold-out with a greyed image + a "Sold Out" button instead), while the
 * hero passes everything.
 */
export function EventBadges({ types, className = '' }: { types?: BadgeType[]; className?: string }) {
  if (!types?.length) return null
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {types.map((t) => <EventBadge key={t} type={t} />)}
    </div>
  )
}

// ── Category tag ─────────────────────────────────────────────────────────────
//  One fixed colour per category, so a category is recognisable by colour alone.
//
//  Deliberately a softer family than the status pills above (translucent tint +
//  pale text, vs. solid fill + linen text): on /event/[id] the two sit at either
//  end of the same row, and two sets of loud pills would compete. Like the badge
//  colours these are fixed accents, not themed — the chip renders on the hero's
//  dark photo scrim, which is dark in both light and dark mode.

type CategoryColor = { accent: string; text: string }

/** Keyed by lower-cased category name. Covers the CATEGORIES list used by
 *  /explore + /organizer/create, plus "music" and "online" from the API. */
const CATEGORY_COLORS: Record<string, CategoryColor> = {
  'technology': { accent: '#38BDF8', text: '#BAE6FD' },
  'business': { accent: '#94A3B8', text: '#E2E8F0' },
  'creative': { accent: '#F472B6', text: '#FBCFE8' },
  'summit': { accent: '#A3E635', text: '#D9F99D' },
  'networking': { accent: '#34D399', text: '#A7F3D0' },
  'gaming': { accent: '#A78BFA', text: '#DDD6FE' },
  'health & wellness': { accent: '#2DD4BF', text: '#99F6E4' },
  'education': { accent: '#60A5FA', text: '#BFDBFE' },
  'arts & culture': { accent: '#C084FC', text: '#E9D5FF' },
  'sports': { accent: '#FB923C', text: '#FED7AA' },
  'food & drink': { accent: '#F87171', text: '#FECACA' },
  'music': { accent: '#818CF8', text: '#C7D2FE' },
  'online': { accent: '#22D3EE', text: '#A5F3FC' },
  'other': { accent: '#C1603F', text: '#F0C4B4' },
  'general': { accent: '#C1603F', text: '#F0C4B4' },
}

const CATEGORY_PALETTE = Object.values(CATEGORY_COLORS)

/**
 * The colour for a category. Unlisted categories (the API accepts free-form
 * ones) hash onto the same palette, so any given tag still gets ONE colour that
 * never changes between renders or pages.
 */
export function categoryColor(category: string): CategoryColor {
  const key = category.trim().toLowerCase()
  const known = CATEGORY_COLORS[key]
  if (known) return known
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length]
}

/** The category chip. `rounded-lg`, unlike the `rounded-full` status pills —
 *  the differing shape is intentional (see CLAUDE.md, inconsistency #6). */
export function CategoryBadge({ category, className = '' }: { category: string; className?: string }) {
  const { accent, text } = categoryColor(category)
  return (
    <span
      className={`rounded-lg px-3.5 py-1.5 text-[15px] font-bold uppercase tracking-[0.08em] whitespace-nowrap ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${accent} 22%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`,
        color: text,
      }}
    >
      {category}
    </span>
  )
}
