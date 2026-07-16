'use client'

// ─────────────────────────────────────────────────────────────────────────────
//  The round hero/card controls for an event — ONE definition, used everywhere.
//
//  Both the home/explore/community cards (EventsCarousel) and the /event/[id]
//  hero render these, so the two surfaces cannot drift apart again. If you need
//  a share, favourite or back control on a new surface, import it from here; do
//  not hand-roll another one.
//
//  All three share the same chrome: linen circle, muted icon that goes green on
//  hover, and a hover label that opens away from the edge it is anchored to.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useWishlistStore } from '@eventmind/store'
import { BRAND } from '@/lib/theme'
import { shareEvent, type ShareFallback } from '@/lib/share-event'
import { ShareModal } from './ShareModal'
import type { CarouselEvent } from './EventsCarousel'

const GREEN = BRAND.green
const LINEN = BRAND.surface
const MUTED = BRAND.hint

const BTN = 'rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:cursor-not-allowed'
const PILL = 'text-[16px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap'

/** Which side the hover label sits on, so it always grows away from the edge
 *  the button is anchored to. */
type LabelSide = 'left' | 'right'

/** 'sm' = the card overlay (default). 'lg' = standalone surfaces like the
 *  /event/[id] hero, where a 32px control is lost against a full-bleed photo. */
type Size = 'sm' | 'lg'

const SIZES: Record<Size, { btn: string; icon: string }> = {
  sm: { btn: 'w-8 h-8', icon: 'w-4 h-4' },
  lg: { btn: 'w-12 h-12', icon: 'w-6 h-6' },
}

function Label({ children }: { children: string }) {
  return <span className={PILL} style={{ backgroundColor: LINEN, color: GREEN }}>{children}</span>
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
  const [hovered, setHovered] = useState(false)
  const s = SIZES[size]

  return (
    <div className="flex items-center gap-1.5">
      {hovered && labelSide === 'left' && <Label>Go back</Label>}
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        aria-label="Go back"
        className={`${BTN} ${s.btn}`}
        style={{ backgroundColor: LINEN }}
      >
        <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke={hovered ? GREEN : MUTED} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </button>
      {hovered && labelSide === 'right' && <Label>Go back</Label>}
    </div>
  )
}

export function EventShareButton({
  event,
  labelSide = 'right',
  size = 'sm',
}: {
  event: CarouselEvent
  labelSide?: LabelSide
  size?: Size
}) {
  const [hovered, setHovered] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fallback, setFallback] = useState<ShareFallback | null>(null)
  const s = SIZES[size]

  async function onClick(e: React.MouseEvent) {
    // Cards wrap this in a <Link>; never let a share tap navigate to the event.
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      const { shared, fallback: fb } = await shareEvent({ id: event.id, title: event.title })
      if (!shared) setFallback(fb)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {hovered && labelSide === 'left' && <Label>Share</Label>}
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onClick}
          disabled={busy}
          aria-label="Share event"
          className={`${BTN} ${s.btn}`}
          style={{ backgroundColor: LINEN }}
        >
          <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke={hovered ? GREEN : MUTED} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
        </button>
        {hovered && labelSide === 'right' && <Label>Share</Label>}
      </div>
      <ShareModal fallback={fallback} onClose={() => setFallback(null)} />
    </>
  )
}

export function EventWishlistButton({
  event,
  labelSide = 'left',
  size = 'sm',
}: {
  event: CarouselEvent
  labelSide?: LabelSide
  size?: Size
}) {
  const toggle = useWishlistStore((st) => st.toggleItem)
  const liked = useWishlistStore((st) => st.items.some((i) => i.id === event.id))
  const [hovered, setHovered] = useState(false)
  const label = liked ? 'Added!' : 'Add to wishlist'
  const s = SIZES[size]

  return (
    <div className="flex items-center gap-1.5">
      {(hovered || liked) && labelSide === 'left' && <Label>{label}</Label>}
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle({
            kind: 'event',
            id: event.id,
            title: event.title,
            date: event.date,
            time: event.time,
            venue: event.venue,
            price: event.price,
            imageUrl: event.imageUrl,
            badge: event.badge,
            badgeType: event.badgeTypes?.[0],
            isSoldOut: event.isSoldOut,
            category: event.category,
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
      {(hovered || liked) && labelSide === 'right' && <Label>{label}</Label>}
    </div>
  )
}
