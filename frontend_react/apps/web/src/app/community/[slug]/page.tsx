"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { communitySource, eventsSource } from "@/lib/data-source";
import { Navbar } from "@/components/navbar/Navbar";
import { EventCardItem } from "@/components/EventsCarousel";
import { CategoryBadge, EventBadges } from "@/components/EventBadges";
import { EventBackButton, EventShareButton, EventWishlistButton } from "@/components/EventActions";
import { toCarouselEvent, toCommunityItem } from "@/lib/card-adapters";
import { communityImageUrl } from "@/lib/event-media";
import { heroTitleSize } from "@/lib/hero-title";
import { GUTTERS } from "@/lib/layout";
import { BRAND } from "@/lib/theme";

const GREEN = BRAND.green;
const BG = BRAND.bg;
const SURFACE = BRAND.surface;
const TEXT = BRAND.text;
const BORDER = BRAND.border;
const HINT = BRAND.hint;

// Same scrim as the /event/[id] hero — keep the two in step.
const HERO_SCRIM =
  "linear-gradient(to top, rgba(8,17,15,0.94) 0%, rgba(8,17,15,0.75) 32%, rgba(8,17,15,0.42) 62%, rgba(8,17,15,0.22) 100%)";

export default function CommunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const { data: communityRes, isLoading: communityLoading } = useQuery({
    queryKey: ["community", slug],
    queryFn: () => communitySource.getBySlug(slug).then((r) => r.data),
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["community-events", communityRes?.id],
    queryFn: () =>
      eventsSource
        .search({ community_id: communityRes!.id, limit: 100 })
        .then((r) => r.data),
    enabled: !!communityRes?.id,
  });

  const isLoading = communityLoading || eventsLoading;

  if (communityLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: BG }}>
        <Navbar />
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: `${GREEN} transparent transparent transparent` }} />
        </div>
      </div>
    );
  }

  if (!communityRes) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: BG }}>
        <Navbar />
        <div className="flex flex-col items-center py-24 gap-4">
          <p className="text-[18px] font-semibold" style={{ color: HINT }}>Community not found</p>
          <button
            onClick={() => router.push("/communities")}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-[var(--brand-on-green)]"
            style={{ backgroundColor: GREEN }}
          >
            Explore Communities
          </button>
        </div>
      </div>
    );
  }

  const community = communityRes;
  // The same adapter the cards use, so the wishlist record saved from this page
  // is byte-identical to one saved from a community card.
  const card = toCommunityItem(community);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <Navbar />

      {/* ── Hero: full-bleed photo + title overlay ──
          Mirrors /event/[id] exactly — same scrim, same control set and sizes,
          same one-line centred title, same category + status tag row. */}
      <section className="relative flex flex-col justify-end overflow-hidden min-h-[420px] sm:min-h-[520px] lg:min-h-[600px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={communityImageUrl(community, 1920, 1080)}
          alt={community.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: HERO_SCRIM }} />

        {/* Top row: back / wishlist + share */}
        <div className={`absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 py-6 ${GUTTERS}`}>
          <EventBackButton onClick={() => router.back()} labelSide="bottom" size="lg" />
          <div className="flex items-center gap-2.5 shrink-0">
            <EventWishlistButton item={card} kind="community" labelSide="bottom" size="lg" />
            <EventShareButton item={card} kind="community" labelSide="bottom" size="lg" />
          </div>
        </div>

        {/* Title block */}
        <div className={`relative z-10 pb-12 pt-6 ${GUTTERS}`}>
          <h1
            className="hero-title font-extrabold text-white leading-[1.05] text-center whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ fontSize: heroTitleSize(community.name) }}
          >
            {community.name}
          </h1>
          <div className="mt-6 flex flex-wrap items-end justify-center gap-1.5">
            {community.category && <CategoryBadge category={community.category} />}
            <EventBadges types={card.badgeType ? [card.badgeType] : undefined} align="center" />
          </div>
        </div>
      </section>

      {/* ── About ──
          Same container as /event/[id]'s body (px-12 inside a 1400 cap), so
          "About this community" starts on the same line as "About this event"
          rather than 124px further in — max-w-6xl used to break that. */}
      {(community.description || community.website) && (
        <div className={`pt-10 ${GUTTERS}`} style={{ maxWidth: 1400, margin: "0 auto" }}>
          <h2 className="text-[22px] font-bold" style={{ color: TEXT }}>About this community</h2>
          {community.description && (
            <p className="text-[18px] leading-relaxed mt-4" style={{ color: HINT }}>
              {community.description}
            </p>
          )}
          {community.website && (
            <a
              href={community.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-[16px] font-semibold"
              style={{ color: GREEN }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              {community.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      )}

      {/* Events section */}
      <div className={`py-10 ${GUTTERS}`} style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-[22px] font-bold" style={{ color: TEXT }}>Events</h2>
            <p className="text-sm mt-0.5" style={{ color: HINT }}>
              {isLoading ? "Loading…" : `${events?.length ?? 0} event${events?.length !== 1 ? "s" : ""} from this community`}
            </p>
          </div>
          <button
            onClick={() => router.push(`/explore?community_id=${community.id}`)}
            className="flex items-center gap-1 text-sm font-semibold"
            style={{ color: GREEN }}
          >
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        {eventsLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${GREEN} transparent transparent transparent` }} />
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 rounded-2xl"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
            <svg className="w-9 h-9" style={{ color: HINT }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <p className="text-[18px] font-semibold" style={{ color: HINT }}>No events yet</p>
            <p className="text-[16px]" style={{ color: HINT }}>
              The organiser hasn&apos;t linked any events to this community yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {events.map((event) => (
              <EventCardItem
                key={event.id}
                event={toCarouselEvent(event)}
                onBookNow={(id) => router.push(`/event/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
