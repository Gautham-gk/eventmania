"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { reviewsApi } from "@eventmind/api";
import { eventsSource } from "@/lib/data-source";
import type { Review, ReviewAggregates } from "@eventmind/api";
import { useAuthStore } from "@eventmind/store";
import { Navbar } from "@/components/navbar/Navbar";
import { EventChatWidget } from "@/components/EventChatWidget";
import { EventBackButton, EventShareButton, EventWishlistButton } from "@/components/EventActions";
import { CategoryBadge, EventBadges, TAG_SHAPE } from "@/components/EventBadges";
import { CalendarIcon, ClockIcon, LocationPinIcon, ShieldCheckIcon } from "@/components/EventIcons";
import { SimilarEvents } from "@/components/SimilarEvents";
import { toCarouselEvent } from "@/lib/card-adapters";
import { eventImageUrl } from "@/lib/event-media";
import { heroTitleSize } from "@/lib/hero-title";
import { GUTTERS } from "@/lib/layout";
import { formatPrice } from "@/lib/currency";

const GREEN = "var(--brand-green)";

/** Secondary text/glyphs on the booking card's green header. */
const ON_GREEN_MUTED = "color-mix(in srgb, var(--brand-on-green) 70%, transparent)";

// The booking card runs its date/time/location glyphs bigger than the compact
// card rows the shared default is tuned for.
const BOOKING_ICON = "w-[22px] h-[22px] shrink-0";

const HERO_SCRIM =
  "linear-gradient(to top, rgba(8,17,15,0.94) 0%, rgba(8,17,15,0.75) 32%, rgba(8,17,15,0.42) 62%, rgba(8,17,15,0.22) 100%)";

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-US", opts);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsSource.get(id).then((r) => r.data),
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["reviews", id],
    queryFn: () => reviewsApi.forEvent(id).then((r) => r.data),
    retry: false,
  });

  const { data: aggregates } = useQuery<ReviewAggregates>({
    queryKey: ["review-aggregates", id],
    queryFn: () => reviewsApi.aggregates(id).then((r) => r.data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--brand-bg)" }}>
        <div
          className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: `${GREEN} transparent transparent transparent` }}
        />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--brand-bg)" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg font-medium text-[var(--brand-hint)]">Event not found.</p>
        </div>
      </div>
    );
  }

  const isFree = event.price === 0;
  const category = event.category ?? "General";
  // The shared card controls speak CarouselEvent, so a wishlist save from here is
  // byte-identical to one from a card and renders the same in /dashboard.
  const card = toCarouselEvent(event);
  const location =
    (event.location?.address as string) ??
    (event.location?.city as string) ??
    "Online Event";

  function handleBookNow() {
    router.push(isAuthenticated ? `/checkout/${id}` : "/auth");
  }

  return (
    <div className="min-h-screen bg-[var(--brand-bg)] text-left">
      <Navbar />

      {/* ── Hero: full-bleed photo + title overlay ── */}
      <section className="relative flex flex-col justify-end overflow-hidden min-h-[420px] sm:min-h-[520px] lg:min-h-[600px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={eventImageUrl(event, 1920, 1080)}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: HERO_SCRIM }} />

        {/* Top row: back / wishlist + share */}
        <div className={`absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 py-6 ${GUTTERS}`}>
          {/* All three labels drop BELOW their button here. A side label would
              either collide with the neighbouring control or run past the 48px
              gutter into the hero's overflow-hidden edge; dropping it keeps the
              three buttons pinned no matter which one is hovered. */}
          <EventBackButton onClick={() => router.back()} labelSide="bottom" size="lg" />
          {/* Same controls as the event cards, one size up so they hold their own
              against a full-bleed photo. */}
          <div className="flex items-center gap-2.5 shrink-0">
            <EventWishlistButton item={card} labelSide="bottom" size="lg" />
            <EventShareButton item={card} labelSide="bottom" size="lg" />
          </div>
        </div>

        {/* Title block */}
        <div className={`relative z-10 pb-12 pt-6 ${GUTTERS}`}>
          {/* One line, centred, on lg+. overflow-hidden is the last-resort guard:
              a title long enough to defeat heroTitleSize() clips instead of
              wrapping or pushing the page into a horizontal scroll. BELOW lg the
              `hero-title` class (globals.css) lets it wrap to 3 lines instead —
              shrink-to-one-line hits the 20px floor on a phone and truncates the
              title away. */}
          <h1
            className="hero-title font-extrabold text-white leading-[1.05] text-center whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ fontSize: heroTitleSize(event.title) }}
          >
            {event.title}
          </h1>
          {/* Category then every status tag that applies, centred under the
              title. Tags come from EventBadges so they match the cards exactly.
              gap-1.5 matches EventBadges' own internal gap, so the space between
              the category chip and the first status tag is identical to the space
              between two status tags — change both together or they drift. */}
          {/* items-end (not -center) so the category chip shares the BOTTOM line
              when three tags split the block into two rows. */}
          <div className="mt-6 flex flex-wrap items-end justify-center gap-1.5">
            <CategoryBadge category={category} />
            <EventBadges types={card.badgeTypes} align="center" />
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className={`py-10 ${GUTTERS}`} style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Two-column grid on lg+, stacked below it. */}
        {/* 2.4fr (not 2fr) pulls the booking card's left edge further right; its
            right edge stays on the gutter line shared with the navbar + sticky bar.
            Stacked, the booking card comes FIRST (order-1/order-2 below) so price,
            date and Book Now are visible without scrolling past the description. */}
        <div className="grid grid-cols-1 lg:grid-cols-[2.4fr_1fr] gap-10 lg:gap-16 items-start">

          {/* ── Left column ── */}
          <div className="order-2 lg:order-1" style={{ textAlign: "left" }}>
            <h2 className="text-[22px] font-bold text-[var(--brand-text)] mb-4">
              About this event
            </h2>
            <p className="text-[18px] leading-relaxed text-[var(--brand-hint)]">
              {event.description ?? "No description provided."}
            </p>

            <div className="my-12 h-px bg-[var(--brand-border)]" />

            {/* Reviews */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[22px] font-bold text-[var(--brand-text)]">Attendee Reviews</h2>
              {aggregates && (
                <div className="flex items-center gap-1.5">
                  <StarIcon />
                  <span className="text-[18px] font-bold text-[var(--brand-text)]">
                    {Number(aggregates.average_rating).toFixed(1)}
                  </span>
                  <span className="text-[var(--brand-hint)]">({aggregates.review_count})</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-[var(--brand-hint)] text-[16px]">
                No reviews yet. Be the first to attend and share your experience!
              </p>
            ) : (
              <div className="space-y-8">
                {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </div>

          {/* ── Right sidebar: booking card ── */}
          <div className="order-1 lg:order-2">
            <BookingCard
              dateLabel={fmt(event.start_date, { weekday: "long", month: "short", day: "numeric" })}
              timeLabel={fmtTime(event.start_date)}
              location={location}
              organizer="EventMind Collective"
              price={event.price}
              currency={event.currency}
              isFree={isFree}
              going={event.tickets_sold}
              left={Math.max(0, event.capacity - event.tickets_sold)}
              onBook={handleBookNow}
            />
          </div>
        </div>

      </div>

      {/* ── Similar events ── */}
      {/* Deliberately OUTSIDE the maxWidth:1400 column above: it is full-bleed,
          carrying the home page's own `px-4 sm:px-6 lg:px-12` gutters, so its
          cards render at exactly the home grid's size and a full row of four
          fits without scrolling. Inside the capped column four cards could only
          fit by shrinking to ~311px — narrower than home at every width. The
          trade is that above 1400px its edges sit outside the column above it;
          the full-width divider it carries is what makes that read as a
          deliberate section break rather than a misalignment. It carries its own
          top divider and renders NOTHING when there is nothing to suggest, so an
          empty rail leaves no orphaned rule behind. */}
      <SimilarEvents event={event} />

      {/* ── AI Event Assistant widget ── */}
      <EventChatWidget event={event} />

      {/* ── Sticky booking bar ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 flex items-center justify-between gap-4 bg-[var(--brand-bg)] z-30 ${GUTTERS}`}
        style={{ height: 88, borderTop: "1px solid var(--brand-border)" }}
      >
        {/* shrink-0 on the price, so on a narrow bar the button loses its
            generous padding rather than the amount being squeezed out. */}
        <div className="shrink-0" style={{ textAlign: "left" }}>
          <p className="text-sm text-[var(--brand-hint)]">Starting from</p>
          <p className="text-[22px] sm:text-[28px] font-bold text-[var(--brand-text)]">
            {formatPrice(event.price, event.currency)}
          </p>
        </div>
        <button
          onClick={handleBookNow}
          className="px-6 sm:px-10 lg:px-16 py-4 rounded-2xl text-[18px] font-bold text-[var(--brand-on-green)] transition-colors whitespace-nowrap"
          style={{ backgroundColor: GREEN }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-green-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GREEN)}
        >
          Book Now
        </button>
      </div>

      <div className="h-24" />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BookingCard({
  dateLabel,
  timeLabel,
  location,
  organizer,
  price,
  currency,
  isFree,
  going,
  left,
  onBook,
}: {
  dateLabel: string;
  timeLabel: string;
  location: string;
  organizer: string;
  price: number;
  currency?: string;
  isFree: boolean;
  going: number;
  left: number;
  onBook: () => void;
}) {
  const soldOut = left <= 0;
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ border: "1px solid var(--brand-border)", boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }}
    >
      {/* Flat teal header: who is running this. The price used to live here and
          now sits above the CTA instead, so the header carries the organiser. */}
      <div className="px-5 sm:px-8 pt-7 pb-8" style={{ backgroundColor: GREEN }}>
        <p className="text-[13px] font-bold tracking-[0.08em] mb-3" style={{ color: ON_GREEN_MUTED }}>
          Organised by
        </p>
        <div className="flex items-center gap-4">
          {/* Initial stands in for an organiser avatar — there is no organiser
              lookup on this page yet (CLAUDE.md, "What Is Not Built Yet"). */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "color-mix(in srgb, var(--brand-on-green) 14%, transparent)",
              border: "1px solid color-mix(in srgb, var(--brand-on-green) 22%, transparent)",
            }}
          >
            <span className="text-[24px] font-extrabold" style={{ color: "var(--brand-on-green)" }}>
              {organizer.trim().charAt(0).toUpperCase() || "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p
              className="text-[24px] font-extrabold leading-tight truncate"
              style={{ color: "var(--brand-on-green)" }}
            >
              {organizer}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheckIcon color={ON_GREEN_MUTED} className="w-[15px] h-[15px] shrink-0" />
              <span className="text-[15px] truncate" style={{ color: ON_GREEN_MUTED }}>
                Verified · 40+ events
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* White body */}
      <div className="px-5 sm:px-8 py-7" style={{ backgroundColor: "var(--brand-surface)" }}>
        {/* Date + time row. The glyphs are the shared filled set; only the size
            and the green tint are this surface's own. Wraps rather than truncating:
            in the stacked mobile layout the card is the full column, but a long
            weekday date plus a time is still more than a 375px phone holds. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4">
          <BookingLine icon={<CalendarIcon color={GREEN} className={BOOKING_ICON} />} text={dateLabel} />
          <BookingLine icon={<ClockIcon color={GREEN} className={BOOKING_ICON} />} text={timeLabel} />
        </div>
        <div className="mt-5">
          <BookingLine icon={<LocationPinIcon color={GREEN} className={BOOKING_ICON} />} text={location} />
        </div>

        {/* Social proof + scarcity. Both chips take the tag silhouette from
            EventBadges (TAG_SHAPE) so they match Selling Fast / Music, but keep
            their own light fills — the tags' dark tints are tuned for the hero's
            photo scrim and would read as heavy blocks on this white body. */}
        <div className="flex items-center justify-between gap-3 mt-7">
          <div
            className={`${TAG_SHAPE} gap-3 px-4 py-3`}
            style={{ backgroundColor: `color-mix(in srgb, var(--brand-green) 5%, transparent)` }}
          >
            <div className="flex">
              {["#C1603F", GREEN, "#4A5FA5"].map((c, i) => (
                <span
                  key={i}
                  className="w-7 h-7 rounded-full"
                  style={{ backgroundColor: c, border: "2px solid var(--brand-surface)", marginLeft: i === 0 ? 0 : -10 }}
                />
              ))}
            </div>
            <span className="text-[15px] whitespace-nowrap text-[var(--brand-hint)]">
              <b className="text-[var(--brand-text)]">{going}</b> going
            </span>
          </div>

          {!soldOut && (
            <span
              className={`${TAG_SHAPE} px-3.5 py-2 text-[15px] font-bold`}
              style={{ backgroundColor: "color-mix(in srgb, #C1603F 12%, transparent)", color: "#B4542F" }}
            >
              {left} spots left
            </span>
          )}
        </div>

        <div className="my-7 h-px bg-[var(--brand-border)]" />

        {/* Price. Label and figure share a baseline so "Starting from" reads as
            a caption on "₹45" rather than as its own row. */}
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-bold tracking-[0.08em] text-[var(--brand-hint)]">Starting from</p>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[38px] leading-none font-extrabold" style={{ color: GREEN }}>
              {formatPrice(price, currency)}
            </span>
            {!isFree && <span className="text-[16px] font-medium text-[var(--brand-hint)]">/ ticket</span>}
          </div>
        </div>

        {/* Book Now */}
        <button
          onClick={onBook}
          disabled={soldOut}
          className="w-full mt-5 py-4 rounded-2xl text-[18px] font-bold text-[var(--brand-on-green)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: GREEN }}
          onMouseEnter={(e) => !soldOut && (e.currentTarget.style.backgroundColor = "var(--brand-green-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GREEN)}
        >
          {soldOut ? "Sold Out" : "Book Now"}
        </button>
      </div>
    </div>
  );
}

function BookingLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="shrink-0">{icon}</span>
      <span className="text-[16px] font-semibold text-[var(--brand-text)] truncate">{text}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div style={{ textAlign: "left" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, var(--brand-green) 8%, transparent)` }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
          </div>
          <span className="font-bold text-[var(--brand-text)]">Verified Attendee</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill={i < review.rating ? "#F59E0B" : "var(--brand-border)"}>
              <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354l-4.543 2.826c-.999.625-2.227-.276-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
            </svg>
          ))}
        </div>
      </div>
      <p className="text-[16px] leading-relaxed text-[var(--brand-hint)]">{review.content}</p>
    </div>
  );
}

function StarIcon() {
  return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#F59E0B"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354l-4.543 2.826c-.999.625-2.227-.276-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" /></svg>;
}
