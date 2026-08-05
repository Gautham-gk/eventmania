// Dummy communities for frontend development ("dummy" data mode — see lib/data-source.ts).
//
// API-shaped `Community` objects, so they flow through `toCommunityItem()` and the
// community cards/detail pages unchanged. Exist only to populate the UI while
// beautifying the site with NO backend running. Edit freely.

import type { Community } from "@eventmind/types";

const DAY = 24 * 60 * 60 * 1000;

function at(days: number, hour = 18): string {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function co(
  c: Partial<Community> & Pick<Community, "id" | "name" | "category">,
): Community {
  return {
    organizer_id: "dummy-org",
    slug: c.id,
    description: "Dummy community for frontend development.",
    location: { name: "Community Hub", city: "New York" },
    next_event_date: at(5),
    member_count: 120,
    price: 0,
    status: "active",
    ...c,
  } as Community;
}

// ── Offline / city communities (shown for any selected city in dummy mode) ───────
export const dummyCommunities: Community[] = [
  co({
    id: "dummy-com-1", name: "Shutter & Street — Photography Collective", category: "Arts & Culture",
    location: { name: "Old Town Studio", city: "New York" }, member_count: 842, price: 0, next_event_date: at(3),
  }),
  co({
    id: "dummy-com-2", name: "Dawn Runners Club", category: "Health & Wellness",
    location: { name: "Riverside Track", city: "New York" }, member_count: 1560, price: 0, next_event_date: at(1),
  }),
  co({
    id: "dummy-com-3", name: "Metro Python & Data Guild", category: "Technology",
    location: { name: "Tech Loft", city: "New York" }, member_count: 2310, price: 0, next_event_date: at(7),
  }),
  co({
    id: "dummy-com-4", name: "The Supper Club", category: "Food & Drink",
    location: { name: "Corner Kitchen", city: "New York" }, member_count: 430, price: 12, next_event_date: at(4),
  }),
  co({
    id: "dummy-com-5", name: "Chapter One — Book Lovers", category: "Arts & Culture",
    location: { name: "Ivy Library", city: "New York" }, member_count: 690, price: 0, next_event_date: at(9),
  }),
  co({
    id: "dummy-com-6", name: "Founders Circle", category: "Business",
    location: { name: "Innovation Hub", city: "New York" }, member_count: 980, price: 20, next_event_date: at(6),
  }),
];

// ── Online communities (category "online", location-independent) ─────────────────
export const dummyOnlineCommunities: Community[] = [
  co({
    id: "dummy-online-com-1", name: "Remote Designers United", category: "online",
    location: { name: "Online" }, member_count: 5400, price: 0, next_event_date: at(2),
  }),
  co({
    id: "dummy-online-com-2", name: "Indie Game Dev Hangout", category: "online",
    location: { name: "Online" }, member_count: 3120, price: 0, next_event_date: at(8),
  }),
  co({
    id: "dummy-online-com-3", name: "Async Writers' Room", category: "online",
    location: { name: "Online" }, member_count: 1740, price: 5, next_event_date: at(5),
  }),
  co({
    id: "dummy-online-com-4", name: "Cloud & DevOps Nomads", category: "online",
    location: { name: "Online" }, member_count: 4260, price: 0, next_event_date: at(11),
  }),
];
