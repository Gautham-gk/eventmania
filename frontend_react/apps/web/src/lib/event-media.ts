// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers for an event's shareable media + labels.
//
// Used by the link-unfurl (Open Graph) image, the story image, and the share
// flow so a shared event always shows the SAME picture and copy as its card.
// No `window` / DOM access here — safe to import on both server and client.
// ─────────────────────────────────────────────────────────────────────────────

import type { Event } from "@eventmind/types";

/**
 * The event's own picture. Prefers a real uploaded/synced image (`image_url`,
 * e.g. Ticketmaster events) and otherwise falls back to the same deterministic
 * picsum placeholder the EventCard uses, so the shared image matches the card.
 */
export function eventImageUrl(event: Pick<Event, "id"> & { image_url?: unknown }, w: number, h: number): string {
  const uploaded = (event as { image_url?: unknown }).image_url;
  if (typeof uploaded === "string" && uploaded.length > 0) return uploaded;
  return `https://picsum.photos/seed/${event.id}/${w}/${h}`;
}

/** "Free" or "$42" — the short price chip. */
export function priceLabel(event: Pick<Event, "price">): string {
  return event.price === 0 ? "Free" : `$${event.price.toFixed(0)}`;
}

/** Human-readable place for an event. */
export function locationLabel(event: Pick<Event, "location">): string {
  const loc = event.location as Record<string, unknown> | undefined;
  return (
    (loc?.address as string) ??
    (loc?.city as string) ??
    "Online Event"
  );
}

/** "Fri, Aug 15" style short date for the unfurl meta line. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
