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
import { CategoryBadge, EventBadges } from "@/components/EventBadges";
import { toCarouselEvent } from "@/lib/card-adapters";
import { eventImageUrl } from "@/lib/event-media";

const GREEN = "var(--brand-green)";

const HERO_SCRIM =
  "linear-gradient(to top, rgba(8,17,15,0.94) 0%, rgba(8,17,15,0.75) 32%, rgba(8,17,15,0.42) 62%, rgba(8,17,15,0.22) 100%)";

/**
 * The hero title always renders on ONE line, so the size has to bend to the
 * title rather than the other way round: the vw term shrinks as the title gets
 * longer (~169/chars keeps a bold line inside the px-12 gutters), while the
 * clamp keeps it sane on very wide screens and very short titles.
 */
function heroTitleSize(title: string) {
  const vw = Math.min(5, 169 / Math.max(title.length, 1));
  return `clamp(20px, ${vw.toFixed(2)}vw, 64px)`;
}

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
          <p className="text-lg font-medium text-gray-500">Event not found.</p>
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
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 px-12 py-6">
          {/* Label opens rightward, away from the left edge it is anchored to. */}
          <EventBackButton onClick={() => router.back()} labelSide="right" size="lg" />
          {/* Same controls as the event cards, one size up so they hold their own
              against a full-bleed photo. Labels open leftward so they grow away
              from the right edge instead of off-screen. */}
          <div className="flex items-center gap-2.5 shrink-0">
            <EventWishlistButton event={card} labelSide="left" size="lg" />
            <EventShareButton event={card} labelSide="left" size="lg" />
          </div>
        </div>

        {/* Title block */}
        <div className="relative z-10 px-12 pb-12 pt-6">
          {/* One line, centred. overflow-hidden is the last-resort guard: a title
              long enough to defeat heroTitleSize() clips instead of wrapping or
              pushing the page into a horizontal scroll. */}
          <h1
            className="font-extrabold text-white leading-[1.05] text-center whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ fontSize: heroTitleSize(event.title) }}
          >
            {event.title}
          </h1>
          {/* Category left, every status tag that applies right. Tags come from
              EventBadges so they match the cards exactly. */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <CategoryBadge category={category} />
            <EventBadges types={card.badgeTypes} className="justify-end" />
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="px-12 py-10" style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Two-column grid */}
        {/* 2.4fr (not 2fr) pulls the booking card's left edge further right; its
            right edge stays on the px-12 line shared with the navbar + sticky bar. */}
        <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr", gap: 64, alignItems: "start" }}>

          {/* ── Left column ── */}
          <div style={{ textAlign: "left" }}>
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
          <div>
            <BookingCard
              dateLabel={fmt(event.start_date, { weekday: "long", month: "short", day: "numeric" })}
              timeLabel={fmtTime(event.start_date)}
              location={location}
              organizer="EventMind Collective"
              price={event.price}
              isFree={isFree}
              going={event.tickets_sold}
              left={Math.max(0, event.capacity - event.tickets_sold)}
              onBook={handleBookNow}
            />
          </div>
        </div>
      </div>

      {/* ── AI Event Assistant widget ── */}
      <EventChatWidget event={event} />

      {/* ── Sticky booking bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-12 bg-[var(--brand-bg)] z-30"
        style={{ height: 88, borderTop: "1px solid var(--brand-border)" }}
      >
        <div style={{ textAlign: "left" }}>
          <p className="text-sm text-[var(--brand-hint)]">Starting from</p>
          <p className="text-[28px] font-bold text-[var(--brand-text)]">
            {isFree ? "FREE" : `$${event.price}`}
          </p>
        </div>
        <button
          onClick={handleBookNow}
          className="px-16 py-4 rounded-2xl text-[18px] font-bold text-[var(--brand-on-green)] transition-colors"
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
      {/* Flat teal header */}
      <div className="px-8 pt-7 pb-8" style={{ backgroundColor: GREEN }}>
        <p
          className="text-[13px] font-bold tracking-[0.08em] mb-1"
          style={{ color: "color-mix(in srgb, var(--brand-on-green) 70%, transparent)" }}
        >
          STARTING FROM
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-[52px] leading-none font-extrabold" style={{ color: "var(--brand-on-green)" }}>
            {isFree ? "FREE" : `$${price}`}
          </span>
          {!isFree && (
            <span
              className="text-[18px] font-medium"
              style={{ color: "color-mix(in srgb, var(--brand-on-green) 70%, transparent)" }}
            >
              / ticket
            </span>
          )}
        </div>
      </div>

      {/* White body */}
      <div className="px-8 py-7" style={{ backgroundColor: "var(--brand-surface)" }}>
        {/* Date + time row */}
        <div className="flex items-center justify-between gap-4">
          <BookingLine icon={<CalendarIcon />} text={dateLabel} />
          <BookingLine icon={<ClockIcon />} text={timeLabel} />
        </div>
        <div className="mt-5">
          <BookingLine icon={<LocationIcon />} text={location} />
        </div>
        <div className="mt-5">
          <BookingLine icon={<PersonIcon />} text={organizer} />
        </div>

        {/* Social proof + scarcity */}
        <div className="flex items-center justify-between gap-3 mt-7">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
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
              className="rounded-full px-3.5 py-2 text-[15px] font-bold whitespace-nowrap"
              style={{ backgroundColor: "color-mix(in srgb, #C1603F 12%, transparent)", color: "#B4542F" }}
            >
              {left} spots left
            </span>
          )}
        </div>

        {/* Book Now */}
        <button
          onClick={onBook}
          disabled={soldOut}
          className="w-full mt-6 py-4 rounded-2xl text-[18px] font-bold text-[var(--brand-on-green)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
function CalendarIcon() {
  return <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>;
}
function LocationIcon() {
  return <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>;
}
function ClockIcon() {
  return <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
}
function PersonIcon() {
  return <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
}
