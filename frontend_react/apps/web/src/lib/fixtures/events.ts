// Dummy events for frontend development ("dummy" data mode — see lib/data-source.ts).
//
// These are API-shaped `Event` objects (identical to what the backend returns), so
// they flow through `toCarouselEvent()` and every card/detail component unchanged.
// They exist purely so the UI has something to display while beautifying the site,
// with NO backend running. Edit freely — nothing here ships to production.
//
// Dates are computed relative to "now" at load time so the Today / This Week /
// Selling Fast badges stay meaningful no matter when you run the dev server.

import type { Event } from "@eventmind/types";

const DAY = 24 * 60 * 60 * 1000;

// ISO timestamp `days` from now, at a fixed hour (local-ish; fine for dummy data).
function at(days: number, hour = 19): string {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function ev(e: Partial<Event> & Pick<Event, "id" | "title" | "category" | "start_date">): Event {
  return {
    organizer_id: "dummy-org",
    slug: e.id,
    description: "Dummy event for frontend development.",
    event_type: "in_person",
    location: { name: "Venue TBC", city: "New York", latitude: 40.7128, longitude: -74.006 },
    end_date: e.start_date,
    capacity: 200,
    tickets_sold: 40,
    price: 0,
    status: "published",
    ...e,
  } as Event;
}

// ── Offline / city events (shown for any selected city in dummy mode) ────────────
export const dummyEvents: Event[] = [
  ev({
    id: "dummy-evt-1", title: "Midnight Jazz at the Blue Room", category: "Music",
    location: { name: "The Blue Room", city: "New York", latitude: 40.73, longitude: -73.99 },
    start_date: at(2, 21), capacity: 150, tickets_sold: 118, price: 45, // selling fast
  }),
  ev({
    id: "dummy-evt-2", title: "Street Food Night Market", category: "Food & Drink",
    location: { name: "Riverside Yards", city: "New York", latitude: 40.71, longitude: -74.01 },
    start_date: at(0, 18), price: 0, // today + free
  }),
  ev({
    id: "dummy-evt-3", title: "FutureStack — AI & Cloud Summit", category: "Technology",
    location: { name: "Metro Convention Center", city: "New York", latitude: 40.75, longitude: -73.99 },
    start_date: at(9, 9), capacity: 800, tickets_sold: 260, price: 299,
  }),
  ev({
    id: "dummy-evt-4", title: "Contemporary Art After Dark", category: "Arts & Culture",
    location: { name: "Halcyon Gallery", city: "New York", latitude: 40.72, longitude: -73.98 },
    start_date: at(4, 19), price: 0, // this week + free
  }),
  ev({
    id: "dummy-evt-5", title: "City Marathon Finals", category: "Sports",
    location: { name: "Grand Stadium", city: "New York", latitude: 40.69, longitude: -73.97 },
    start_date: at(12, 8), capacity: 100, tickets_sold: 100, price: 25, // sold out
  }),
  ev({
    id: "dummy-evt-6", title: "Founders & Funders Networking Night", category: "Networking",
    location: { name: "Skyline Rooftop", city: "New York", latitude: 40.74, longitude: -73.99 },
    start_date: at(3, 18), capacity: 120, tickets_sold: 95, price: 15, // selling fast + this week
  }),
  ev({
    id: "dummy-evt-7", title: "Stand-Up Comedy Showcase", category: "Arts & Culture",
    location: { name: "The Laugh Cellar", city: "New York", latitude: 40.73, longitude: -74.0 },
    start_date: at(0, 20), capacity: 90, tickets_sold: 70, price: 20, // today
  }),
  ev({
    id: "dummy-evt-8", title: "Sunrise Yoga & Wellness Retreat", category: "Health & Wellness",
    location: { name: "Greenfield Park", city: "New York", latitude: 40.78, longitude: -73.96 },
    start_date: at(6, 7), price: 0, // this week + free
  }),
  ev({
    id: "dummy-evt-9", title: "Indie Film Premiere Night", category: "Arts & Culture",
    location: { name: "Roxy Cinema", city: "New York", latitude: 40.72, longitude: -74.0 },
    start_date: at(15, 20), capacity: 200, tickets_sold: 60, price: 18,
  }),
  ev({
    id: "dummy-evt-10", title: "Craft Beer & Vinyl Festival", category: "Food & Drink",
    location: { name: "Warehouse 9", city: "New York", latitude: 40.7, longitude: -73.95 },
    start_date: at(8, 16), capacity: 400, tickets_sold: 210, price: 30,
  }),
];

// ── Online events (category "online", location-independent) ──────────────────────
export const dummyOnlineEvents: Event[] = [
  ev({
    id: "dummy-online-evt-1", title: "Live Webinar: Designing for Scale", category: "online",
    event_type: "online", location: { name: "Online", latitude: 0, longitude: 0 },
    start_date: at(1, 17), price: 0,
  }),
  ev({
    id: "dummy-online-evt-2", title: "Virtual Producer Livestream Set", category: "online",
    event_type: "online", location: { name: "Online", latitude: 0, longitude: 0 },
    start_date: at(5, 20), capacity: 5000, tickets_sold: 3800, price: 12,
  }),
  ev({
    id: "dummy-online-evt-3", title: "Remote Watercolour Workshop", category: "online",
    event_type: "online", location: { name: "Online", latitude: 0, longitude: 0 },
    start_date: at(3, 15), price: 0,
  }),
  ev({
    id: "dummy-online-evt-4", title: "Esports Open — Online Qualifiers", category: "online",
    event_type: "online", location: { name: "Online", latitude: 0, longitude: 0 },
    start_date: at(7, 18), capacity: 256, tickets_sold: 190, price: 10,
  }),
  ev({
    id: "dummy-online-evt-5", title: "AMA: Careers in Data Science", category: "online",
    event_type: "online", location: { name: "Online", latitude: 0, longitude: 0 },
    start_date: at(2, 16), price: 0,
  }),
  ev({
    id: "dummy-online-evt-6", title: "Global Startup Pitch Night (Virtual)", category: "online",
    event_type: "online", location: { name: "Online", latitude: 0, longitude: 0 },
    start_date: at(10, 19), capacity: 1000, tickets_sold: 640, price: 5,
  }),
];
