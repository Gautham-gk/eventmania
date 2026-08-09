// Server-side event fetch used by generateMetadata + the OG/story image routes.
// Reuses the same data-source switch (dummy fixtures vs live gateway) as the
// pages, and never throws — returns null so callers can render a safe fallback.
import "@/lib/api-config"; // ensures the axios base URL is configured on the server
import { eventsSource } from "@/lib/data-source";
import type { Event } from "@eventmind/types";

export async function getEventForShare(id: string): Promise<Event | null> {
  try {
    const { data } = await eventsSource.get(id);
    return (data as Event) ?? null;
  } catch {
    return null;
  }
}

/** Absolute origin for building shareable links / metadataBase. */
export function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}
