'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { isOnlineEvent } from '@eventmind/types'
import { BRAND } from '@/lib/theme'
import { EventShareButton, EventWishlistButton } from './EventActions'
import { CardTagRow, type BadgeType } from './EventBadges'
import { CalendarIcon, ClockIcon, LocationPinIcon } from './EventIcons'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CarouselEvent {
  id: string
  title: string
  date: string
  time: string
  venue: string
  price: string
  imageUrl: string
  badge?: string
  badgeTypes?: BadgeType[]
  startDate?: string
  rating?: number
  reviewCount?: number
  isSoldOut?: boolean
  category: string
  /**
   * Event FORMAT — "In-Person" | "Online" | "Hybrid". Orthogonal to `category`:
   * an online event still carries a real category, so never test this by looking
   * for `category === 'online'`. Use inOnlineRow/inCityRow below.
   */
  eventType?: string
  organiser?: string
}

// Which row(s) an event belongs in. A Hybrid event appears in BOTH — it is
// attendable either way.
//
// The `category === 'online'` fallback is for DB rows written before the format
// split, which carry the default event_type "In-Person" alongside category
// "online". Measured 2026-07-19: 6 such rows in platform_dev.db — deleting the
// fallback drops them out of the Online row entirely. Re-run seed_events.py
// (it wipes and re-inserts), confirm the query below returns 0, then delete both
// fallbacks here and in isOnlineEvent():
//   select count(*) from events
//    where lower(category)='online'
//      and lower(coalesce(event_type,'')) not in ('online','hybrid');
const inOnlineRow = (e: CarouselEvent) =>
  e.eventType ? isOnlineEvent({ event_type: e.eventType }) : e.category === 'online'

const inCityRow = (e: CarouselEvent) =>
  e.eventType ? e.eventType.toLowerCase() !== 'online' : e.category !== 'online'

export interface EventsCarouselProps {
  events: CarouselEvent[]
  location: string
  seeAllHref: string
  /** "View all" target for the Online Events row. Defaults to seeAllHref. */
  onlineSeeAllHref?: string
  isLoading?: boolean
  onBookNow?: (id: string) => void
  /** Optional control rendered in place of the default edit-location button (e.g. <CityPicker variant="icon" />). */
  locationSlot?: ReactNode
}

// ─── Brand constants ───────────────────────────────────────────────────────────

const GREEN = BRAND.green
const LINEN = BRAND.surface     // linen-as-background → surface
const ON_GREEN = BRAND.onGreen  // linen-as-text-on-green → stays light-on-green
const BORDER = BRAND.border
const TEXT = BRAND.text
const MUTED = BRAND.hint
// Sold-out button FILL. Deliberately not MUTED: --brand-hint is the brand text
// colour now, so reusing it here would paint a near-black button in light mode.
// A disabled control has to read as gray.
const MUTED_FILL = BRAND.muted
const NAV_BORDER = BRAND.navBorder
// Outline CONTROLS (the filter tabs) — deliberately far darker than BORDER so a
// tab cannot blend into the linen page. Not for cards: see SeeAllTile.
const CONTROL_BORDER = BRAND.controlBorder

// Badge colours/labels + the pill itself now live in ./EventBadges so the cards
// and the /event/[id] hero render an identical tag. Import; do not re-create.

const FILTER_TABS = ['All', 'Recommended', 'This Week', 'Free', 'Music', 'Food']
const ONLINE_FILTER_TABS = ['All', 'Recommended', 'Free', 'This Week', 'Selling Fast']

// ─── Skeleton card ─────────────────────────────────────────────────────────────

// Exported so the /event/[id] "Similar events" rail loads with the same
// skeleton the grids use — a second hand-rolled one would drift.
export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ border: `1px solid ${NAV_BORDER}`, backgroundColor: LINEN }}
    >
      <div className="w-full aspect-video bg-gray-200" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="h-2.5 bg-gray-200 rounded-full w-16" />
        <div className="h-4 bg-gray-200 rounded-full w-full" />
        <div className="h-4 bg-gray-200 rounded-full w-4/5" />
        <div className="h-3 bg-gray-200 rounded-full w-1/2 mt-1" />
        <div className="h-3 bg-gray-200 rounded-full w-3/5" />
        <div className="flex justify-between mt-3">
          <div className="h-4 bg-gray-200 rounded-full w-20" />
          <div className="h-3 bg-gray-200 rounded-full w-16" />
        </div>
      </div>
    </div>
  )
}

// Share + wishlist controls now live in ./EventActions so the cards and the
// /event/[id] hero share one definition. Import them; do not re-create them.

// ─── Edit location button ─────────────────────────────────────────────────────

function EditLocationButton() {
  const [hovered, setHovered] = useState(false)
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        aria-label="Edit location"
        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
        style={{ color: hovered ? GREEN : MUTED }}
      >
        <svg className="w-4 h-4" viewBox="0 -0.5 21 21" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd"
            d="M0,20 L20.616532,20 L20.616532,18.042095 L0,18.042095 L0,20 Z M7.215786,13.147332 L7.215786,10.51395 L13.094591,5.344102 L15.146966,7.493882 L9.903151,13.147332 L7.215786,13.147332 Z M16.244797,2.64513 L18.059052,4.363191 L16.645788,5.787567 L14.756283,3.993147 L16.244797,2.64513 Z M21,4.64513 L16.132437,0 L5.154133,9.687714 L5.154133,15.105237 L10.78657,15.105237 L21,4.64513 Z"
          />
        </svg>
      </button>
      {hovered && (
        <span
          className="absolute left-full ml-2 whitespace-nowrap text-[16px] font-semibold px-3 py-1 rounded-full z-10"
          style={{ backgroundColor: LINEN, color: GREEN, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          Click here to edit location
        </span>
      )}
    </span>
  )
}

// ─── Individual event card ─────────────────────────────────────────────────────

export function EventCardItem({
  event,
  onBookNow,
}: {
  event: CarouselEvent
  onBookNow?: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  // Sold-out is signalled by the greyed image + "Sold Out" button, not a pill.
  const activeBadges = (event.badgeTypes ?? []).filter(t => t !== 'sold-out')
  const priceFg = event.isSoldOut ? MUTED : GREEN

  return (
    <Link
      href={`/event/${event.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: LINEN,
        boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
        border: hovered ? `2px solid ${GREEN}` : '2px solid transparent',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Image */}
      <div className={['relative w-full aspect-video overflow-hidden', event.isSoldOut ? 'grayscale opacity-60' : ''].join(' ')}>
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) calc(100vw - 96px), (max-width: 1024px) calc(50vw - 72px), (max-width: 1280px) calc(33vw - 60px), calc(25vw - 60px)"
        />
        <div className={`absolute top-2 left-2 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}><EventShareButton item={event} /></div>
        <div className={`absolute top-2 right-2 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}><EventWishlistButton item={event} /></div>
        {/* Category left, status tags right — the same pairing /event/[id] uses,
            so a card and the page it opens read as the same event. A sold-out
            card keeps its category but drops the status pills (sold-out is
            signalled by the greyed image + the "Sold Out" button instead). */}
        <CardTagRow
          category={event.category}
          types={event.isSoldOut ? undefined : activeBadges}
          className={`absolute bottom-2 left-2 right-2 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {/* Card body */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col gap-1.5 flex-1">

        {/* Title */}
        <h3 className="text-[20px] font-bold leading-snug line-clamp-2" style={{ color: TEXT }}>
          {event.title}
        </h3>

        {/* Date + venue. Each glyph is bound tight to its own label (gap-[3px]) and the
            pairs are spaced apart (gap-3.5), so the row reads as three fields
            rather than six evenly-spaced things. */}
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex items-center gap-[3px] shrink-0">
            <CalendarIcon color={TEXT} />
            <span className="text-[18px]" style={{ color: TEXT }}>
              {event.date}
            </span>
          </span>
          <span className="flex items-center gap-[3px] shrink-0">
            <ClockIcon color={TEXT} />
            <span className="text-[18px]" style={{ color: TEXT }}>
              {event.time}
            </span>
          </span>
          {event.venue && (
            <span className="flex items-center gap-[3px] min-w-0">
              <LocationPinIcon color={TEXT} />
              <span className="text-[18px] line-clamp-1 min-w-0" style={{ color: TEXT }}>
                {event.venue}
              </span>
            </span>
          )}
        </div>

        {/* Price (left) + View details button (right) */}
        <div className="flex items-center justify-between mt-auto pt-1.5 gap-2">
          <span style={{ color: priceFg }}>
            {event.isSoldOut ? (
              <span className="text-[20px] font-bold">Sold Out</span>
            ) : event.price.includes('onwards') ? (
              <>
                <span className="text-[20px] font-bold">{event.price.replace(' onwards', '')}</span>
                <span className="text-[18px] font-normal"> onwards</span>
              </>
            ) : (
              <span className="text-[20px] font-bold">{event.price}</span>
            )}
          </span>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookNow?.(event.id) }}
            aria-label={`View details for ${event.title}`}
            disabled={event.isSoldOut}
            className="shrink-0 px-4 py-1.5 rounded-xl text-[20px] font-bold transition-all duration-150 active:scale-[0.98]"
            style={{
              backgroundColor: event.isSoldOut ? MUTED_FILL : GREEN,
              color: ON_GREEN,
              cursor: event.isSoldOut ? 'not-allowed' : 'pointer',
            }}
          >
            {event.isSoldOut ? 'Sold Out' : 'View details'}
          </button>
        </div>
      </div>
    </Link>
  )
}

// ─── Online event card (kept separate for future experimentation) ──────────────

function OnlineEventCard({
  event,
  onBookNow,
}: {
  event: CarouselEvent
  onBookNow?: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  // Sold-out is signalled by the greyed image + "Sold Out" button, not a pill.
  const activeBadges = (event.badgeTypes ?? []).filter(t => t !== 'sold-out')
  const priceFg = event.isSoldOut ? MUTED : GREEN

  return (
    <Link
      href={`/event/${event.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: LINEN,
        boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
        border: hovered ? `2px solid ${GREEN}` : '2px solid transparent',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Image */}
      <div className={['relative w-full aspect-video overflow-hidden', event.isSoldOut ? 'grayscale opacity-60' : ''].join(' ')}>
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) calc(100vw - 96px), (max-width: 1024px) calc(50vw - 72px), (max-width: 1280px) calc(33vw - 60px), calc(25vw - 60px)"
          style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.3s ease' }}
        />
        <div className={`absolute top-2 left-2 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}><EventShareButton item={event} /></div>
        <div className={`absolute top-2 right-2 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}><EventWishlistButton item={event} /></div>
        {/* Category left, status tags right — the same pairing /event/[id] uses,
            so a card and the page it opens read as the same event. A sold-out
            card keeps its category but drops the status pills (sold-out is
            signalled by the greyed image + the "Sold Out" button instead). */}
        <CardTagRow
          category={event.category}
          types={event.isSoldOut ? undefined : activeBadges}
          className={`absolute bottom-2 left-2 right-2 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">

        {/* Title */}
        <h3 className="text-[20px] font-bold leading-snug line-clamp-2" style={{ color: TEXT }}>
          {event.title}
        </h3>

        {/* Date, time + venue in one row — same glyph/label pairing as EventCardItem */}
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex items-center gap-[3px] shrink-0">
            <CalendarIcon color={TEXT} />
            <span className="text-[18px]" style={{ color: TEXT }}>
              {event.date}
            </span>
          </span>
          <span className="flex items-center gap-[3px] shrink-0">
            <ClockIcon color={TEXT} />
            <span className="text-[18px]" style={{ color: TEXT }}>
              {event.time}
            </span>
          </span>
          {event.venue && (
            <span className="flex items-center gap-[3px] min-w-0">
              <VideoCallIcon color={TEXT} />
              <span className="text-[18px] line-clamp-1 min-w-0" style={{ color: TEXT }}>
                {event.venue}
              </span>
            </span>
          )}
        </div>

        {/* Price (left) + View details button (right) */}
        <div className="flex items-center justify-between mt-auto pt-1.5 gap-2">
          <span style={{ color: priceFg }}>
            {event.isSoldOut ? (
              <span className="text-[20px] font-bold">Sold Out</span>
            ) : event.price.includes('onwards') ? (
              <>
                <span className="text-[20px] font-bold">{event.price.replace(' onwards', '')}</span>
                <span className="text-[18px] font-normal"> onwards</span>
              </>
            ) : (
              <span className="text-[20px] font-bold">{event.price}</span>
            )}
          </span>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookNow?.(event.id) }}
            aria-label={`View details for ${event.title}`}
            disabled={event.isSoldOut}
            className="shrink-0 px-4 py-1.5 rounded-xl text-[20px] font-bold transition-all duration-150 active:scale-[0.98]"
            style={{
              backgroundColor: event.isSoldOut ? MUTED_FILL : GREEN,
              color: ON_GREEN,
              cursor: event.isSoldOut ? 'not-allowed' : 'pointer',
            }}
          >
            {event.isSoldOut ? 'Sold Out' : 'View details'}
          </button>
        </div>
      </div>
    </Link>
  )
}

// ─── Online events row ─────────────────────────────────────────────────────────

function OnlineEventsRow({
  events,
  seeAllHref,
  onBookNow,
  isLoading = false,
}: {
  events: CarouselEvent[]
  seeAllHref: string
  onBookNow?: (id: string) => void
  isLoading?: boolean
}) {
  const [activeTab, setActiveTab] = useState('All')
  const onlineEvents = events.filter(inOnlineRow)

  const filteredOnline: CarouselEvent[] = (() => {
    if (activeTab === 'All') return onlineEvents
    if (activeTab === 'Recommended')
      return onlineEvents.filter((e) => e.badgeTypes?.includes('recommended'))
    if (activeTab === 'Free')
      return onlineEvents.filter((e) => e.price === 'Free')
    if (activeTab === 'This Week')
      return onlineEvents.filter((e) => e.badgeTypes?.includes('this-week'))
    if (activeTab === 'Selling Fast')
      return onlineEvents.filter((e) => e.badgeTypes?.includes('selling-fast'))
    return onlineEvents
  })()

  const showSeeAll = onlineEvents.length > GRID_LIMIT
  const visibleOnlineEvents = showSeeAll ? filteredOnline.slice(0, GRID_LIMIT - 1) : filteredOnline

  return (
    <section aria-label="Online Events" className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 mb-4">
        <h2 className="font-extrabold tracking-[-0.5px]" style={{ fontSize: "clamp(18px, 4vw, 30px)", color: TEXT }}>
          Online Events
        </h2>
        <Link
          href={seeAllHref}
          aria-label="View all online events"
          className="hidden sm:flex items-center gap-1.5 text-lg font-semibold transition-opacity hover:opacity-70"
          style={{ color: GREEN }}
        >
          View all
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="px-4 sm:px-6 lg:px-12 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {ONLINE_FILTER_TABS.map((tab) => {
            const active = tab === activeTab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={active}
                className="flex-none px-4 py-1.5 rounded-full text-[20px] font-semibold whitespace-nowrap transition-all duration-150"
                style={
                  active
                    ? { backgroundColor: GREEN, color: ON_GREEN, border: `2px solid ${GREEN}` }
                    : { backgroundColor: 'transparent', color: TEXT, border: `2px solid ${CONTROL_BORDER}` }
                }
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-12 pb-3">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {Array.from({ length: GRID_LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : onlineEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: MUTED }}>
            <VideoCallIcon color={MUTED} />
            <p className="text-lg">No online events right now. Check back soon.</p>
          </div>
        ) : filteredOnline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: MUTED }}>
            <VideoCallIcon color={MUTED} />
            <p className="text-lg">No online events in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {visibleOnlineEvents.map((event) => (
              <OnlineEventCard key={event.id} event={event} onBookNow={onBookNow} />
            ))}
            {showSeeAll && <SeeAllTile events={onlineEvents} href={seeAllHref} />}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── "See All" grid tile ───────────────────────────────────────────────────────

function SeeAllTile({ events, href }: { events: CarouselEvent[]; href: string }) {
  const [hovered, setHovered] = useState(false)
  const previews = events.slice(0, 4)
  const placeholders = Math.max(0, 4 - previews.length)

  const tileBg = hovered ? GREEN : LINEN
  const labelFg = hovered ? ON_GREEN : TEXT
  const subFg = hovered ? 'rgba(242,239,234,0.8)' : MUTED

  return (
    <Link
      href={href}
      aria-label="View all events"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl flex flex-col items-center justify-center gap-5"
      style={{
        backgroundColor: tileBg,
        // Borderless at rest, exactly like EventCardItem — this tile IS a card in
        // the same grid, so an outline of its own made it read as a different kind
        // of thing. The 2px transparent border holds the space the green hover
        // border will occupy, so the tile never resizes on hover.
        border: hovered ? `2px solid ${GREEN}` : '2px solid transparent',
        minHeight: 240,
        boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.15s ease',
      }}
    >
      {/* 2×2 preview grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 136, height: 136 }}>
        {previews.map((e, i) => (
          <div key={i} className="relative rounded-lg overflow-hidden" style={{ backgroundColor: BORDER }}>
            <Image src={e.imageUrl} alt="" fill className="object-cover" sizes="65px" />
          </div>
        ))}
        {Array.from({ length: placeholders }).map((_, i) => (
          <div key={`ph-${i}`} className="rounded-lg"
            style={{ backgroundColor: hovered ? 'rgba(242,239,234,0.2)' : BORDER }} />
        ))}
      </div>

      {/* Label — font sizes intentionally match event title (text-[20px] font-bold)
          and date/venue line (text-[18px]) so they stay in sync when those change */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-[20px] font-bold" style={{ color: labelFg, transition: 'color 0.15s ease' }}>
          View all
        </span>
        <span className="text-[18px] flex items-center gap-1"
          style={{ color: labelFg, transition: 'color 0.15s ease' }}>
          Browse all events
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function StarIcon({ color = '#F59E0B' }: { color?: string }) {
  return (
    <svg className="w-3 h-3" style={{ color }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  )
}

function VideoCallIcon({ color = TEXT }: { color?: string }) {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill={color}>
      <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
    </svg>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

const GRID_LIMIT = 4 // max cells before the See All tile takes the last slot (keeps grid to one row at XL)

export function EventsCarousel({
  events,
  location,
  seeAllHref,
  onlineSeeAllHref,
  isLoading = false,
  onBookNow,
  locationSlot,
}: EventsCarouselProps) {
  const [activeTab, setActiveTab] = useState('All')

  const offlineEvents = events.filter(inCityRow)

  const filteredEvents: CarouselEvent[] = (() => {
    if (activeTab === 'All') return offlineEvents
    if (activeTab === 'Recommended')
      return offlineEvents.filter((e) => e.badgeTypes?.includes('recommended'))
    if (activeTab === 'Free')
      return offlineEvents.filter((e) => e.price === 'Free')
    if (activeTab === 'This Week')
      return offlineEvents.filter((e) => e.badgeTypes?.includes('this-week'))
    return offlineEvents.filter((e) => e.category.toLowerCase() === activeTab.toLowerCase())
  })()

  // When there are more events than the grid limit, show 7 cards + See All tile = 8 cells.
  const showSeeAll = offlineEvents.length > GRID_LIMIT
  const visibleEvents = showSeeAll
    ? filteredEvents.slice(0, GRID_LIMIT - 1)
    : filteredEvents

  return (
    <section aria-label={`Events in ${location}`} className="py-8">

      {/* ── Section header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 mb-5">
        <h2 className="font-extrabold tracking-[-0.5px] flex items-center gap-1" style={{ fontSize: "clamp(18px, 4vw, 30px)", color: TEXT }}>
          Events in{' '}
          <span className="relative inline-flex items-center gap-2">
            <span style={{ color: GREEN }}>{location}</span>
            {locationSlot ?? <EditLocationButton />}
          </span>
        </h2>
        <Link
          href={seeAllHref}
          aria-label={`View all events in ${location}`}
          className="hidden sm:flex items-center gap-1.5 text-lg font-semibold transition-opacity hover:opacity-70"
          style={{ color: GREEN }}
        >
          View all
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* ── Filter tabs ── */}
      <div className="px-4 sm:px-6 lg:px-12 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTER_TABS.map((tab) => {
            const active = tab === activeTab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={active}
                className="flex-none px-4 py-1.5 rounded-full text-[20px] font-semibold whitespace-nowrap transition-all duration-150"
                style={
                  active
                    ? { backgroundColor: GREEN, color: ON_GREEN, border: `2px solid ${GREEN}` }
                    : { backgroundColor: 'transparent', color: TEXT, border: `2px solid ${CONTROL_BORDER}` }
                }
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Event grid ── */}
      <div className="px-4 sm:px-6 lg:px-12 pb-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {Array.from({ length: GRID_LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: MUTED }}>
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} role="img" aria-label="Sad face">
              <circle cx="12" cy="12" r="9" />
              <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
              <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
              <path strokeLinecap="round" d="M8.5 16c.9-1.2 2.1-1.8 3.5-1.8s2.6.6 3.5 1.8" />
            </svg>
            <p className="text-lg">No events in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {visibleEvents.map((event) => (
              <EventCardItem key={event.id} event={event} onBookNow={onBookNow} />
            ))}
            {showSeeAll && <SeeAllTile events={events} href={seeAllHref} />}
          </div>
        )}
      </div>

      <OnlineEventsRow events={events} seeAllHref={onlineSeeAllHref ?? seeAllHref} onBookNow={onBookNow} isLoading={isLoading} />
    </section>
  )
}
