'use client'

// ─────────────────────────────────────────────────────────────────────────────
//  Every event tag — ONE definition. Status tags (Free / Selling Fast / This
//  Week / …) at the top; the category tag (Music / Arts & Culture / …) below.
//
//  Rendered by the event cards (EventsCarousel) and the /event/[id] hero, so a
//  tag looks the same wherever it appears. Which tags an event gets is decided
//  in ONE place too: `toCarouselEvent()` in lib/card-adapters.ts.
//
//  Both families are soft-rectangular `rounded-lg` tags carrying a 14px glyph +
//  a label, and they differ ONLY in fill: a category chip is always linen with a
//  dark accent label, a status tag is a solid colour from Gautham's palette with
//  a linen label (a preview — see the CONTRAST note by BADGE_CONFIG). This
//  mirrors a reference design Gautham supplied; see CLAUDE.md inconsistency #6,
//  which records the shapes merging. Do not re-split them, do not round to pills.
//
//  Adding a tag? Add it to BADGE_CONFIG here AND emit it from toCarouselEvent —
//  a config entry with nothing emitting it is dead (see 'today'/'recommended').
//  Glyphs come from EventIcons.tsx; never draw one inline here.
// ─────────────────────────────────────────────────────────────────────────────

import {
  BanIcon,
  BriefcaseIcon,
  CalendarIcon,
  LaptopIcon,
  ClockIcon,
  CutleryIcon,
  FlameIcon,
  GamepadIcon,
  GlobeIcon,
  GraduationCapIcon,
  LotusPoseIcon,
  MountainsIcon,
  MusicNoteIcon,
  PaletteIcon,
  PencilIcon,
  PeopleIcon,
  SparkleIcon,
  StarIcon,
  TagIcon,
  TrophyIcon,
  type EventIcon,
} from './EventIcons'

export type BadgeType =
  | 'free'
  | 'selling-fast'
  | 'today'
  | 'sold-out'
  | 'this-week'
  | 'recommended'

/** Every tag renders its glyph at 14px, a notch under the label's 15/16px. */
const GLYPH = 'w-3.5 h-3.5 shrink-0'

/**
 * The tag silhouette — soft-rectangular, never a pill.
 *
 * Exported on purpose: the /event/[id] booking card's "N going" and "N spots
 * left" chips have to carry this same shape (Gautham's call), but they are NOT
 * tags and cannot use `TAG` below — they hold a 28px avatar stack rather than a
 * 14px glyph, and they sit on the card's light surface rather than the hero's
 * dark photo, so they keep their own padding, gap, weight and fill. Sharing the
 * string is what stops the radius drifting apart again the next time it moves.
 */
export const TAG_SHAPE = 'inline-flex items-center rounded-lg whitespace-nowrap'

/** Shared tag chrome. Fill/label colour is the caller's — that is the only
 *  thing separating a status tag from a category chip.
 *
 *  `leading-5` is load-bearing: the two families sit side by side on the
 *  /event/[id] hero but carry different font sizes (status 16px, category 15px),
 *  so without a pinned line-height their line boxes differ and the status tag
 *  renders visibly shorter. Fixing the line box here means matching vertical
 *  padding is enough to make the heights equal. */
const TAG = `${TAG_SHAPE} gap-1.5 font-bold leading-5`

// Fixed semantic accents — intentionally NOT themed (same in light and dark),
// like the other status colours.
//
// The palette is Gautham's: Mustard/Olive/Coral/Sky/Iris/Plum/Berry (Teal was
// in the original eight but Gautham dropped it). Each tag is a SOLID palette
// fill carrying a LINEN label + glyph (the site's own off-white,
// `--brand-surface` in light mode).
//
// ⚠️ CONTRAST: linen on these fills is effectively white-on-solid, and the
// palette is mid-tone (relative luminance 0.18–0.32, the worst zone for text),
// so EVERY assigned tag FAILS WCAG AA — measured linen-on-fill: Mustard 2.46,
// Sky 3.47, Iris 3.74, Plum 3.95, Coral 3.96 (reserves Olive 3.25, Berry 3.87);
// none reach 4.5. Gautham chose linen anyway to SEE the look; this
// is a preview, not an accessible final. The accessible version is a BLACK label
// (clears AA on all eight, 4.62–7.44) — see git history for the exact mapping.
// Only the label colour changed here; shape, glyphs and sizes are untouched.
//
// The fills being mid-tone holds shape on a dark event-card photo BETTER than
// the dark tints they replace (those measured ~1.2:1 at the near-black end and
// lost their outline against a dark photo).
//
// RESERVE — in the palette, not yet on a tag. Take from here before inventing a
// new colour, and record the assignment when you do:
//   Olive #7E8B3A, Berry #BC5675,
//   Rust #A8543A, Saffron #CFA02E, Lime #8FA83C, Aqua #2FA0A8, Denim #3E6FA0,
//   Grape #6A5AB8, Orchid #B85FB0, Rose #C85888, Slate #5F7080
//
// 'sold-out' deliberately keeps its neutral grey (Gautham's call): grey reads as
// unavailable, and a palette hue would make it compete with the live tags.
//
// 'today' and 'this-week' reuse the clock and calendar the cards already use
// rather than getting a second drawing of the same concept (CLAUDE.md: one icon
// per concept).
const TAG_LABEL = '#F2EFEA'

export const BADGE_CONFIG: Record<BadgeType, { bg: string; text: string; label: string; icon: EventIcon }> = {
  'free': { bg: '#A05FA0', text: TAG_LABEL, label: 'Free', icon: TagIcon },              // Plum    linen 3.95:1
  'selling-fast': { bg: '#C6503F', text: TAG_LABEL, label: 'Selling Fast', icon: FlameIcon }, // Coral   linen 3.96:1
  'today': { bg: '#4E82C0', text: TAG_LABEL, label: 'Today', icon: ClockIcon },          // Sky     linen 3.47:1
  'this-week': { bg: '#B3982B', text: TAG_LABEL, label: 'This Week', icon: CalendarIcon }, // Mustard linen 2.46:1
  'recommended': { bg: '#7C6FC0', text: TAG_LABEL, label: 'Recommended', icon: StarIcon }, // Iris    linen 3.74:1
  'sold-out': { bg: '#4B5158', text: '#E5E7EB', label: 'Sold Out', icon: BanIcon },      // neutral, unchanged
}

/** A single status pill. */
export function EventBadge({ type }: { type: BadgeType }) {
  const cfg = BADGE_CONFIG[type]
  const Icon = cfg.icon
  return (
    <span
      className={`${TAG} px-2.5 py-1.5 text-[16px]`}
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <Icon color={cfg.text} className={GLYPH} />
      {cfg.label}
    </span>
  )
}

/**
 * Hard cap: an event or a community shows at most THREE status tags (Gautham's
 * call). Enforced here, at the single render point, so it holds no matter what
 * a caller or the adapter hands over — do not cap at the call site instead.
 */
export const MAX_BADGES = 3

/** Which edge the tag block hugs. Cards right-align; the heroes centre. */
type BadgeAlign = 'end' | 'center'

/**
 * The status tags for an event or community. Renders nothing when there are no
 * tags, so callers don't need their own length check.
 *
 * `types` is the caller's choice: the cards pass a sold-out-filtered list (they
 * signal sold-out with a greyed image + a "Sold Out" button instead), while the
 * heroes pass everything.
 *
 * LAYOUT — at three tags the block splits into two lines: **the third tag alone
 * on top, the first two below** (Gautham's call). This is laid out explicitly
 * rather than left to `flex-wrap`, because wrapping inside a ~285px card gave
 * each tag its own line and produced a three-high vertical stack. The bottom
 * line is the one that sits beside the category chip, so callers must align the
 * enclosing row to `items-end` — otherwise the category chip floats to the
 * vertical middle of the two lines instead of sharing the bottom one.
 */
export function EventBadges({
  types,
  align = 'end',
  className = '',
}: {
  types?: BadgeType[]
  align?: BadgeAlign
  className?: string
}) {
  if (!types?.length) return null

  const shown = types.slice(0, MAX_BADGES)
  const rows = shown.length === MAX_BADGES ? [[shown[2]], [shown[0], shown[1]]] : [shown]
  const cross = align === 'center' ? 'items-center' : 'items-end'
  const main = align === 'center' ? 'justify-center' : 'justify-end'

  return (
    <div className={`flex flex-col gap-1.5 ${cross} ${className}`}>
      {rows.map((row, i) => (
        <div key={i} className={`flex items-center gap-1.5 ${main}`}>
          {row.map((t) => <EventBadge key={t} type={t} />)}
        </div>
      ))}
    </div>
  )
}

// ── Category chip ────────────────────────────────────────────────────────────
//  ALWAYS linen, whatever the category and whatever the theme — Gautham's call.
//  The per-category colour it used to carry as a solid fill now tints the label
//  and the glyph instead, so a category is still recognisable at a glance
//  without the chip competing with the status pills beside it.
//
//  Linen is hardcoded, not `var(--brand-surface)`, for the same reason the
//  status colours are: the chip renders on the /event/[id] hero's dark photo
//  scrim, which is dark in BOTH themes. A themed surface would turn the chip
//  near-black-on-black in dark mode.
//
//  The accents are a shade darker than the fills they replace. The old values
//  were picked to sit BEHIND linen text; as text ON linen, six of the fourteen
//  failed WCAG AA (summit was worst at 2.69:1). Each moved to a darker shade of
//  the same hue — all now clear 4.5:1, the lowest being summit at 6.17:1.
//  Re-check contrast before changing any of these.

const CHIP_FILL = '#F2EFEA'

type CategoryStyle = { accent: string; icon: EventIcon }

/** Keyed by lower-cased category name. Covers the CATEGORIES list used by
 *  /explore + /organizer/create, plus "music" and "online" from the API. */
const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  'technology': { accent: '#075985', icon: LaptopIcon },
  'business': { accent: '#334155', icon: BriefcaseIcon },
  'creative': { accent: '#9D174D', icon: PencilIcon },
  'summit': { accent: '#3F6212', icon: MountainsIcon },
  'networking': { accent: '#065F46', icon: PeopleIcon },
  'gaming': { accent: '#5B21B6', icon: GamepadIcon },
  'health & wellness': { accent: '#115E59', icon: LotusPoseIcon },
  'education': { accent: '#1E40AF', icon: GraduationCapIcon },
  'arts & culture': { accent: '#6B21A8', icon: PaletteIcon },
  'sports': { accent: '#9A3412', icon: TrophyIcon },
  'food & drink': { accent: '#9F1239', icon: CutleryIcon },
  'music': { accent: '#3730A3', icon: MusicNoteIcon },
  'online': { accent: '#155E75', icon: GlobeIcon },
  'other': { accent: '#8F4229', icon: SparkleIcon },
  'general': { accent: '#8F4229', icon: SparkleIcon },
}

const ACCENT_PALETTE = Object.values(CATEGORY_STYLES).map((s) => s.accent)

/**
 * The style for a category. Unlisted categories (the API accepts free-form
 * ones) hash onto the same accent palette, so any given tag still gets ONE
 * colour that never changes between renders or pages.
 *
 * They do NOT hash onto a glyph: a stable-but-arbitrary colour is fine, an
 * arbitrary glyph is a lie — it would put a briefcase on a yoga class. Anything
 * we have no drawing for gets the neutral sparkle.
 */
export function categoryStyle(category: string): CategoryStyle {
  const key = category.trim().toLowerCase()
  const known = CATEGORY_STYLES[key]
  if (known) return known
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return { accent: ACCENT_PALETTE[hash % ACCENT_PALETTE.length], icon: SparkleIcon }
}

/**
 * Sentence-case the label — the API hands back categories in whatever case it
 * happens to store ('music', 'Arts & Culture'), and the chip renders in normal
 * capitalisation (Gautham's call: "Music", never "MUSIC"), so it has to be
 * normalised here rather than trusted.
 */
function categoryLabel(category: string): string {
  return category
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** The category chip. */
export function CategoryBadge({ category, className = '' }: { category: string; className?: string }) {
  const { accent, icon: Icon } = categoryStyle(category)
  return (
    <span
      className={`${TAG} px-3.5 py-1.5 text-[15px] tracking-[0.02em] ${className}`}
      style={{ backgroundColor: CHIP_FILL, color: accent }}
    >
      <Icon color={accent} className={GLYPH} />
      {categoryLabel(category)}
    </span>
  )
}

// ── Card overlay row ─────────────────────────────────────────────────────────

/**
 * The whole chip overlay for a CARD: category chip + status tags. Used by the
 * event cards and the community cards, so the two can't drift — do not lay these
 * chips out by hand at a call site.
 *
 * THE RULE (Gautham's, and it counts STATUS tags only — the category chip is
 * never one of the three and is happy to share a row with two of them):
 *   • at most three status tags (`MAX_BADGES`)
 *   • with three, the third sits on the line ABOVE the other two
 *
 * So the bottom line is `[category] … [tag] [tag]` — three chips in a row is
 * exactly right when one of them is the category.
 *
 * WHY `flex-wrap-reverse` ON THE BOTTOM LINE. That line does not always fit a
 * 327px card (323px of row): measured, a category chip runs 91–175px ("Music" …
 * "Health & Wellness") and a status tag 72–124px ("Free" … "Selling Fast"), so
 * the combination ranges 175–414px. Rather than clip the right-hand tag (which
 * it did — on 12 of 23 fixture cards), the line wraps, and `-reverse` sends the
 * overflow UP. That is the same direction the third tag goes, so the block only
 * ever grows upward off the bottom edge and nothing is ever cut off. Give the
 * cards more width (a 3-across grid) and the wrapping stops on its own.
 *
 * The heroes have room for one line and use `CategoryBadge` + `EventBadges`
 * directly instead.
 */
export function CardTagRow({
  category,
  types,
  className = '',
}: {
  category: string
  types?: BadgeType[]
  className?: string
}) {
  const shown = (types ?? []).slice(0, MAX_BADGES)
  const bottom = shown.slice(0, 2)
  const third = shown[2]

  return (
    <div className={`flex flex-col items-end gap-1.5 ${className}`}>
      {third && <EventBadge type={third} />}
      <div className="flex w-full flex-wrap-reverse items-center justify-end gap-1.5">
        {/* mr-auto keeps the category hard left while the tags stay right. */}
        <CategoryBadge category={category} className="mr-auto" />
        {bottom.map((t) => <EventBadge key={t} type={t} />)}
      </div>
    </div>
  )
}
