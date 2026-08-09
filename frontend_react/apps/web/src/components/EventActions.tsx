'use client'

// ─────────────────────────────────────────────────────────────────────────────
//  The round hero/card controls — ONE definition, used everywhere.
//
//  Serves BOTH events and communities: the event cards (EventsCarousel), the
//  community cards (CommunityCarousel), the /event/[id] hero and the
//  /community/[slug] hero all render these, so no two surfaces can drift apart
//  again. If you need a share, favourite or back control anywhere new, import it
//  from here; do not hand-roll another one.
//
//  ⚠️ The `Event*` export prefix is historical — these are kind-agnostic now.
//  Pass `kind` to say which you are rendering; it drives the share URL, the
//  wishlist record and the aria-label.
//
//  All three share the same chrome: linen circle, muted icon that goes green on
//  hover, and a hover label that opens away from the edge it is anchored to.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useWishlistStore } from '@eventmind/store'
import { BRAND } from '@/lib/theme'
import { shareItem, type ShareFallback, type ShareKind } from '@/lib/share-event'
import { ShareModal } from './ShareModal'
import type { BadgeType } from './EventBadges'

/**
 * The fields these controls need. Both `CarouselEvent` and `CommunityItem`
 * satisfy it structurally, so a call site passes its card object unchanged.
 *
 * The two differ in exactly one place — events carry `badgeTypes` (an array),
 * communities `badgeType` (a single value) — so both are optional here and the
 * wishlist record takes whichever is present.
 */
export interface ActionItem {
  id: string
  title: string
  date: string
  time: string
  venue: string
  price: string
  imageUrl: string
  badge?: string
  badgeTypes?: BadgeType[]
  badgeType?: BadgeType
  isSoldOut?: boolean
  category: string
  memberCount?: string
}

const GREEN = BRAND.green
const LINEN = BRAND.surface
const MUTED = BRAND.hint

const BTN = 'rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:cursor-not-allowed'
const PILL = 'text-[16px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap'

/** Which side the hover label sits on, so it always grows away from the edge
 *  the button is anchored to. 'bottom' drops it underneath instead — use that
 *  where a side label would collide with a neighbouring control or the viewport
 *  edge (the /event/[id] hero: its controls sit in a 48px gutter, too narrow for
 *  a side pill). The label is absolutely positioned in every case, so hovering
 *  NEVER reflows the row — that used to shove the wishlist button sideways. */
type LabelSide = 'left' | 'right' | 'bottom'

/** Out-of-flow placement for the hover label, keyed by side. */
const LABEL_POS: Record<LabelSide, string> = {
  left: 'right-full mr-1.5 top-1/2 -translate-y-1/2',
  right: 'left-full ml-1.5 top-1/2 -translate-y-1/2',
  bottom: 'top-full mt-1.5 left-1/2 -translate-x-1/2',
}

/** 'sm' = the card overlay (default). 'lg' = standalone surfaces like the
 *  /event/[id] hero, where a 32px control is lost against a full-bleed photo. */
type Size = 'sm' | 'lg'

const SIZES: Record<Size, { btn: string; icon: string }> = {
  sm: { btn: 'w-8 h-8', icon: 'w-4 h-4' },
  lg: { btn: 'w-12 h-12', icon: 'w-6 h-6' },
}

function Label({ children, side }: { children: string; side: LabelSide }) {
  return (
    <span
      className={`${PILL} absolute z-20 pointer-events-none ${LABEL_POS[side]}`}
      style={{ backgroundColor: LINEN, color: GREEN }}
    >
      {children}
    </span>
  )
}

/** The long arrow, both ways round. The right-hand path is the exact mirror of
 *  the left, and is the same glyph the section headers' "View all" links draw. */
const ARROW_PATH: Record<'left' | 'right', string> = {
  left: 'M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18',
  right: 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3',
}

/**
 * A round arrow control — the shape the /event/[id] back button established,
 * generalised so anything that needs "go that way" gets the identical chrome.
 * `EventBackButton` below is just this pointing left, and `CategoryGrid`'s rail
 * controls are this pointing right; keeping one body is what stops the two
 * drifting the way the app's icons and badges once did.
 *
 * `label` is the caller's because the wording is surface-specific ("Go back" vs
 * "More categories"), not a property of the arrow.
 */
export function EventArrowButton({
  direction,
  label,
  onClick,
  disabled = false,
  labelSide = 'right',
  size = 'sm',
}: {
  direction: 'left' | 'right'
  label: string
  onClick: () => void
  disabled?: boolean
  labelSide?: LabelSide
  size?: Size
}) {
  const [hovered, setHovered] = useState(false)
  const s = SIZES[size]
  const active = hovered && !disabled

  return (
    <div className="relative flex items-center">
      {active && <Label side={labelSide}>{label}</Label>}
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`${BTN} ${s.btn} disabled:opacity-35`}
        style={{ backgroundColor: LINEN }}
      >
        <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke={active ? GREEN : MUTED} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={ARROW_PATH[direction]} />
        </svg>
      </button>
    </div>
  )
}

/**
 * Back control for the /event/[id] hero. Same chrome as share + wishlist so the
 * three read as one set. It returns to the previous page, not to `/`, so the
 * label deliberately says "Go back" rather than naming a destination.
 */
export function EventBackButton({
  onClick,
  labelSide = 'right',
  size = 'sm',
}: {
  onClick: () => void
  labelSide?: LabelSide
  size?: Size
}) {
  return (
    <EventArrowButton
      direction="left"
      label="Go back"
      onClick={onClick}
      labelSide={labelSide}
      size={size}
    />
  )
}

export function EventShareButton({
  item,
  kind = 'event',
  labelSide = 'right',
  size = 'sm',
}: {
  item: ActionItem
  kind?: ShareKind
  labelSide?: LabelSide
  size?: Size
}) {
  const [hovered, setHovered] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fallback, setFallback] = useState<ShareFallback | null>(null)
  const s = SIZES[size]

  async function onClick(e: React.MouseEvent) {
    // Cards wrap this in a <Link>; never let a share tap navigate to the item.
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      const { shared, fallback: fb } = await shareItem(kind, { id: item.id, title: item.title })
      if (!shared) setFallback(fb)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="relative flex items-center">
        {hovered && <Label side={labelSide}>Share</Label>}
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onClick}
          disabled={busy}
          aria-label={`Share ${kind}`}
          className={`${BTN} ${s.btn}`}
          style={{ backgroundColor: LINEN }}
        >
          <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke={hovered ? GREEN : MUTED} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
        </button>
      </div>
      <ShareModal fallback={fallback} onClose={() => setFallback(null)} />
    </>
  )
}

export function EventWishlistButton({
  item,
  kind = 'event',
  labelSide = 'left',
  size = 'sm',
}: {
  item: ActionItem
  kind?: ShareKind
  labelSide?: LabelSide
  size?: Size
}) {
  const toggle = useWishlistStore((st) => st.toggleItem)
  const liked = useWishlistStore((st) => st.items.some((i) => i.id === item.id))
  const [hovered, setHovered] = useState(false)
  const label = liked ? 'Added!' : 'Add to wishlist'
  const s = SIZES[size]

  return (
    <div className="relative flex items-center">
      {(hovered || liked) && <Label side={labelSide}>{label}</Label>}
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle({
            kind,
            id: item.id,
            title: item.title,
            date: item.date,
            time: item.time,
            venue: item.venue,
            price: item.price,
            imageUrl: item.imageUrl,
            badge: item.badge,
            // Events carry an array, communities a single value — take whichever.
            badgeType: item.badgeTypes?.[0] ?? item.badgeType,
            isSoldOut: item.isSoldOut,
            category: item.category,
            memberCount: item.memberCount,
          })
        }}
        aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={liked}
        className={`${BTN} ${s.btn}`}
        style={{ backgroundColor: LINEN }}
      >
        {/* Hovering brings the outline to full strength (same as the share icon);
            an actual save additionally fills it. */}
        <svg className={s.icon} viewBox="0 0 24 24" fill={liked ? GREEN : 'none'} stroke={liked || hovered ? GREEN : MUTED} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      </button>
    </div>
  )
}
