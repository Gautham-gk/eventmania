"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useQuery } from "@tanstack/react-query";
import { EVENT_FORMATS, type Event } from "@eventmind/types";
import { useLocationStore } from "@eventmind/store";
import { eventsSource } from "@/lib/data-source";
import { toCarouselEvent } from "@/lib/card-adapters";
import { EventCardItem, SkeletonCard, type CarouselEvent } from "./EventsCarousel";
import { BRAND } from "@/lib/theme";
import { GUTTERS } from "@/lib/layout";

// Same radius the home page uses for its city row, so "near this event" means
// the same distance everywhere in the app.
const RADIUS_KM = 100;

/** Cards shown at most. Beyond this the row stops being browsable and becomes a list. */
const MAX_CARDS = 12;

const GAP = 20; // matches the gap-5 the event grids use

// Each card is sized to the EXACT width a home-page grid cell renders at, so a
// card here and a card on home are the same size, and a row of four fills the
// rail with nothing to scroll. The home grid is `grid-cols-1 sm:grid-cols-2
// xl:grid-cols-4` with `gap-5`, i.e. a cell is (container − gaps) / cols — so
// these percentages, resolved against this rail's own inner width, reproduce it
// exactly. That works ONLY because the section is full-bleed with the same
// gutters as home; both containers are then the same width.
//
// ⚠️ Percentages, NOT `100vw`. An earlier version used viewport math and it was
// wrong twice over: it double-counted the padding (needing a 4th `lg` breakpoint
// for home's px-6→px-12 step), and `100vw` INCLUDES the vertical scrollbar while
// a container's width excludes it — so four cards came to ~15px more than the
// row could hold and the fourth was clipped into a scroll. Percentages have
// neither problem: padding is already subtracted and the scrollbar never counts.
const CARD_BASIS =
  "grow-0 shrink-0 " +
  "basis-full " +
  "sm:basis-[calc((100%-20px)/2)] " +
  "xl:basis-[calc((100%-60px)/4)]";

/**
 * Coordinates of the event being viewed. Ticketmaster rows that failed geocoding
 * are stored at 0,0 (see CLAUDE.md), which is a real point in the Atlantic — a
 * radius search around it returns nothing useful, so treat it as "no coords".
 */
function eventCoords(event: Event): { lat: number; lng: number } | null {
  const loc = event.location as Record<string, unknown> | undefined;
  const lat = Number(loc?.latitude);
  const lng = Number(loc?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

export function SimilarEvents({ event }: { event: Event }) {
  const rail = useRef<HTMLDivElement>(null);
  const selectedCity = useLocationStore((s) => s.selectedCity);
  const category = event.category;

  // Anchor the geo search on the event itself, so a Berlin event suggests Berlin
  // events regardless of what the city picker says. The picker is only the
  // fallback for events with no usable coordinates.
  const coords = eventCoords(event) ?? { lat: selectedCity.lat, lng: selectedCity.lng };

  const { data: nearby = [], isLoading: nearbyLoading } = useQuery({
    queryKey: ["similar-events", "nearby", category, coords.lat, coords.lng],
    queryFn: () =>
      eventsSource
        .search({ category, lat: coords.lat, lng: coords.lng, radius: RADIUS_KM, limit: 24 })
        .then((r) => r.data),
  });

  // Online events sit outside any radius (they carry no real coordinates), so
  // they need their own query — the same split the home page makes.
  const { data: online = [], isLoading: onlineLoading } = useQuery({
    queryKey: ["similar-events", "online", category],
    queryFn: () =>
      eventsSource
        .search({ category, event_type: EVENT_FORMATS.online, limit: 24 })
        .then((r) => r.data),
  });

  const isLoading = nearbyLoading || onlineLoading;

  // Nearby first, then online. A Hybrid event matches both queries, so dedupe by
  // id — and never suggest the event the user is already looking at.
  const seen = new Set<string>([String(event.id)]);
  const events: CarouselEvent[] = [...nearby, ...online]
    .filter((e) => {
      const id = String(e.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, MAX_CARDS)
    .map(toCarouselEvent);

  if (!isLoading && events.length === 0) return null;

  return (
    <section
      aria-label="Similar events"
      className={`mt-14 pt-12 pb-4 ${GUTTERS}`}
      style={{ textAlign: "left", borderTop: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-[22px] font-bold text-[var(--brand-text)]">Similar events</h2>
        <Arrows rail={rail} deps={events.length} />
      </div>

      {/* items-stretch (the flex default, stated for intent) makes every wrapper
          as tall as the tallest card, and `[&>a]:h-full` makes the card fill it —
          so the rail is equal-height like the home grid's row, not ragged.

          The vertical padding is NOT spacing — it is clip room, and it is why the
          negative margins cancel it exactly. `overflow-x: auto` forces the block
          axis to compute to `auto` too (CSS overflow spec: one non-visible axis
          makes the other non-visible), so this scroll container clips vertically
          as well. EventCardItem lifts 6px on hover and draws a 2px border, and
          its shadow bleeds ~16px up / ~40px down — all of which was being cut off
          at the rail's edges, most visibly as a MISSING TOP BORDER on hover. The
          home grid never showed this because a grid has no overflow container.
          If you change the card's hover lift or shadow, re-check these numbers. */}
      <div
        ref={rail}
        className="flex items-stretch overflow-x-auto scrollbar-hide snap-x -mt-6 -mb-10"
        style={{ gap: GAP, paddingTop: 24, paddingBottom: 40 }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={CARD_BASIS}>
                <SkeletonCard />
              </div>
            ))
          : events.map((e) => (
              <div key={e.id} className={`${CARD_BASIS} snap-start [&>a]:h-full`}>
                <EventCardItem event={e} />
              </div>
            ))}
      </div>
    </section>
  );
}

// ─── Arrows ───────────────────────────────────────────────────────────────────

/**
 * Scroll controls for a rail owned by the caller. They render in the section
 * header rather than as overlays on the row, so they never cover a card's own
 * hover controls (share / wishlist).
 */
function Arrows({
  rail,
  deps,
}: {
  rail: RefObject<HTMLDivElement | null>;
  /** Re-measure when the rail's contents change (skeletons → cards). */
  deps: number;
}) {
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    // 1px of slack: sub-pixel widths leave scrollLeft just short of the end.
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, [rail]);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [rail, sync, deps]);

  // Scroll by exactly one card + gap. The card width is responsive, so measure
  // the first card live rather than hard-coding it; fall back to ~90% of the
  // viewport if the rail is somehow empty.
  const scrollBy = (dir: -1 | 1) => {
    const el = rail.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.getBoundingClientRect().width + GAP : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  // Both ends true means the rail does not overflow — there is nothing to scroll.
  if (atStart && atEnd) return null;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <ArrowButton dir={-1} disabled={atStart} onClick={() => scrollBy(-1)} />
      <ArrowButton dir={1} disabled={atEnd} onClick={() => scrollBy(1)} />
    </div>
  );
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: -1 | 1;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const active = hovered && !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === -1 ? "Scroll to previous similar events" : "Scroll to more similar events"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
      style={{
        backgroundColor: active ? BRAND.green : BRAND.surface,
        border: `2px solid ${active ? BRAND.green : BRAND.controlBorder}`,
        color: active ? BRAND.onGreen : BRAND.text,
      }}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={dir === -1 ? "M15.75 19.5 8.25 12l7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"}
        />
      </svg>
    </button>
  );
}
