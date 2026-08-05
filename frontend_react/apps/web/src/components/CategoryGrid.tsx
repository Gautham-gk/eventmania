'use client'

// ─────────────────────────────────────────────────────────────────────────────
//  "Browse by category" — the two-row rail that sits directly above the footer
//  on home.
//
//  A category tile is deliberately an EVENT CARD with its content swapped out:
//  same rounded-2xl chassis, same linen body, same borderless-at-rest →
//  2px-green-border + 6px-lift hover, same aspect-video image, and a body row
//  built like the event card's price + "View details" row. Its columns are sized
//  to the home grid's cells so a tile is exactly as wide as an event card above
//  it. If the event card's hover or radius changes, change it here too.
//
//  The tile's colour is NOT a new decision: it is the category's own accent from
//  `categoryStyle()` in EventBadges.tsx, the exact colour its chip already uses,
//  washed over the photo. Never hardcode a tile colour here.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/lib/theme'
import { GUTTERS } from '@/lib/layout'
import { CategoryBadge, categoryStyle } from './EventBadges'
import { EventArrowButton } from './EventActions'

const GREEN = BRAND.green
const LINEN = BRAND.surface
const ON_GREEN = BRAND.onGreen
const TEXT = BRAND.text

// The photo behind each tile. Unsplash is already whitelisted in next.config.ts;
// every id below was opened and eyeballed before it was committed — several
// plausible-looking ones turned out to be the wrong subject (an "arts" id that
// was a rock concert, a "networking" id that was an empty conference hall), so
// **look at the picture before you swap one out**, do not trust the id.
const PHOTO_PARAMS = 'auto=format&fit=crop&w=800&q=70'
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?${PHOTO_PARAMS}`

/**
 * The 11 categories /explore filters on, in its own order. Keep this list and
 * `CATEGORIES` in app/explore/page.tsx in step — a tile whose name is not in
 * that list lands on a filter the Explore page cannot show as selected.
 */
const CATEGORIES: { name: string; image: string; alt: string }[] = [
  { name: 'Technology', image: photo('1540575467063-178a50c2df87'), alt: 'Audience seated at a technology conference' },
  { name: 'Business', image: photo('1552664730-d307ca884978'), alt: 'Team running a workshop around a wall of sticky notes' },
  { name: 'Creative', image: photo('1558618666-fcd25c85cd64'), alt: 'Maker working at a craft bench' },
  { name: 'Summit', image: photo('1475721027785-f74eccf877e2'), alt: 'Microphone on stage in front of a crowd' },
  { name: 'Networking', image: photo('1543269865-cbf427effbad'), alt: 'Four people talking together over coffee' },
  { name: 'Gaming', image: photo('1542751371-adc38448a05e'), alt: 'Players at an esports gaming setup' },
  { name: 'Health & Wellness', image: photo('1544367567-0f2fcb009e0b'), alt: 'Person practising yoga at sunset' },
  { name: 'Education', image: photo('1523240795612-9a054b0db644'), alt: 'Group studying together around a laptop' },
  { name: 'Arts & Culture', image: photo('1503095396549-807759245b35'), alt: 'Performers on stage against a red theatre curtain' },
  { name: 'Sports', image: photo('1461896836934-ffe607ba8211'), alt: 'Sprinter on the starting blocks of a running track' },
  { name: 'Food & Drink', image: photo('1414235077428-338989a2e8c0'), alt: 'Diners sharing plates at a restaurant table' },
]

const EXPLORE_ALL = '/explore?view=events'
const categoryHref = (name: string) =>
  `/explore?view=events&category=${encodeURIComponent(name)}`

const GAP = 20 // matches the gap-5 the event grids use

// A column is sized to the EXACT width a home-page grid cell renders at, so a
// tile here and an event card above it are the same width and four columns fill
// the rail with nothing to scroll. Same percentage maths as SimilarEvents' rail
// — see the long note there for why these are percentages and never `100vw`.
const COLUMNS =
  'auto-cols-[100%] ' +
  'sm:auto-cols-[calc((100%-20px)/2)] ' +
  'xl:auto-cols-[calc((100%-60px)/4)]'

// Identical to the event cards', so a tile in this rail asks the browser for the
// same image widths its neighbours above do.
const IMAGE_SIZES =
  '(max-width: 768px) calc(100vw - 96px), (max-width: 1024px) calc(50vw - 72px), (max-width: 1280px) calc(33vw - 60px), calc(25vw - 60px)'

// The accent wash. It lightens on hover so the photo underneath reads — the
// tile's one moving part besides the lift, and the reason the wash is an opacity
// on a solid fill rather than baked into a gradient.
const WASH_REST = 0.62
const WASH_HOVER = 0.4

// Where a scroll arrow sits. The offsets are GUTTERS + 8px at each step
// (16→24, 24→32, 48→56) because an absolutely positioned child resolves against
// its ancestor's PADDING BOX — i.e. the page edge, not the rail edge — so the
// gutter has to be added back by hand or the button lands out in the margin.
// The result overlaps the outermost tile by ~40px, which is safe here: a
// category tile carries no hover controls of its own for an arrow to cover.
//
// `top` backs out the asymmetric clip room (24 above, 40 below) so the button
// centres on the tiles rather than on the padded box — it lands on the seam
// between the two rows.
const ARROW_POS = 'absolute top-[calc(50%-8px)] -translate-y-1/2 z-10 transition-opacity duration-200'
const ARROW_LEFT = 'left-6 sm:left-8 lg:left-14'
const ARROW_RIGHT = 'right-6 sm:right-8 lg:right-14'

// ─── Tile ──────────────────────────────────────────────────────────────────────

function CategoryTile({ name, image, alt }: { name: string; image: string; alt: string }) {
  const [hovered, setHovered] = useState(false)
  const { accent } = categoryStyle(name)

  return (
    <Link
      href={categoryHref(name)}
      aria-label={`Explore ${name} events`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: LINEN,
        boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
        border: hovered ? `2px solid ${GREEN}` : '2px solid transparent',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Photo + accent wash */}
      <div className="relative w-full aspect-video overflow-hidden">
        <Image src={image} alt={alt} fill className="object-cover" sizes={IMAGE_SIZES} />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundColor: accent,
            opacity: hovered ? WASH_HOVER : WASH_REST,
            transition: 'opacity 0.3s ease',
          }}
        />
      </div>

      {/* Body — the category chip where an event card puts its price, and an
          Explore button where it puts "View details".

          The chip is the shared `CategoryBadge`, so the icon and the accent
          colour are the same ones the chip carries on every card and hero. Its
          linen fill disappears into the linen card body in light mode (which is
          exactly the "icon + name in the category's colour" this is meant to
          read as) and shows as a chip against the dark body in dark mode, where
          the accents — picked to sit ON linen — would otherwise be unreadable.

          `min-w-0` lets the chip give way rather than push the button out of the
          card: the longest chip ("Health & Wellness") and the button together
          run within a few px of the 4-across cell width. */}
      <div className="px-4 pt-3.5 pb-4 flex items-center justify-between gap-2">
        <CategoryBadge category={name} className="min-w-0 overflow-hidden" />
        {/* A span, not a button: the whole tile is already a link to this exact
            destination, so a nested control would be a second tab stop that does
            the same thing. Styling is the event card's "View details" button. */}
        <span
          aria-hidden
          className="shrink-0 px-4 py-1.5 rounded-xl text-[20px] font-bold transition-all duration-150"
          style={{ backgroundColor: GREEN, color: ON_GREEN }}
        >
          Explore
        </span>
      </div>
    </Link>
  )
}

// ─── Section ───────────────────────────────────────────────────────────────────

export function CategoryGrid() {
  const rail = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  const sync = useCallback(() => {
    const el = rail.current
    if (!el) return
    setAtStart(el.scrollLeft <= 1)
    // 1px of slack: sub-pixel widths leave scrollLeft just short of the end.
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = rail.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync])

  // Scroll by exactly one column + gap. Column width is responsive, so measure
  // the first tile live rather than hard-coding it.
  const scrollBy = (dir: -1 | 1) => {
    const el = rail.current
    if (!el) return
    const first = el.firstElementChild as HTMLElement | null
    const step = first ? first.getBoundingClientRect().width + GAP : el.clientWidth * 0.9
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  // Both ends true means the rail does not overflow — nothing to scroll, so no
  // arrow appears however long you hover.
  const overflows = !(atStart && atEnd)

  return (
    <section
      aria-label="Browse by category"
      className="py-8"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Keyboard users never fire mouseenter; without this the arrows would be
      // focusable but invisible.
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className={`flex items-center justify-between ${GUTTERS} mb-5`}>
        <h2
          className="font-extrabold tracking-[-0.5px]"
          style={{ fontSize: 'clamp(22px, 4vw, 30px)', color: TEXT }}
        >
          Browse by category
        </h2>
        <Link
          href={EXPLORE_ALL}
          aria-label="View all events"
          className="flex items-center gap-1.5 text-lg font-semibold transition-opacity hover:opacity-70"
          style={{ color: GREEN }}
        >
          View all
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      <div className={`relative ${GUTTERS}`}>
        {/* TWO ROWS, flowing sideways: `grid-flow-col` fills row 1 then row 2 of
            each column before moving right, so a column is a stacked pair and
            the 4 that fit are the first 8 categories.

            The vertical padding is NOT spacing — it is clip room, and it is why
            the negative margins cancel it exactly. `overflow-x: auto` forces the
            block axis to compute to `auto` too (CSS overflow spec: one
            non-visible axis makes the other non-visible), so this scroll
            container clips vertically as well. The tile lifts 6px on hover and
            draws a 2px border, and its shadow bleeds ~16px up / ~40px down — all
            of which would be cut off at the rail's edges, most visibly as a
            missing top border on hover. Same fix, same numbers, as the
            "Similar events" rail; re-check them if the hover lift changes. */}
        <div
          ref={rail}
          className={`grid grid-rows-2 grid-flow-col ${COLUMNS} overflow-x-auto scrollbar-hide snap-x -mt-6 -mb-10`}
          style={{ gap: GAP, paddingTop: 24, paddingBottom: 40 }}
        >
          {CATEGORIES.map((c) => (
            <div key={c.name} className="snap-start">
              <CategoryTile {...c} />
            </div>
          ))}
        </div>

        {/* Scroll arrows — the /event/[id] back button's chrome, pointing the way
            they scroll. They sit over the rail's edges (not in the header, where
            SimilarEvents keeps its own) because a category tile carries no hover
            controls of its own for them to cover, and because the arrow appearing
            as you move onto the section is the cue that there is more to the
            right. `top` backs out the asymmetric clip room above, so the button
            centres on the tiles rather than on the padded box. */}
        {overflows && (
          <>
            <div className={`${ARROW_POS} ${ARROW_LEFT} ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <EventArrowButton
                direction="left"
                label="Previous categories"
                size="lg"
                labelSide="right"
                disabled={atStart}
                onClick={() => scrollBy(-1)}
              />
            </div>
            <div className={`${ARROW_POS} ${ARROW_RIGHT} ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <EventArrowButton
                direction="right"
                label="More categories"
                size="lg"
                labelSide="left"
                disabled={atEnd}
                onClick={() => scrollBy(1)}
              />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
