// Server-side community fetch used by generateMetadata + the OG/story image
// routes. Mirrors lib/event-server.ts: reuses the same data-source switch (dummy
// fixtures vs live gateway) as the pages, and never throws — returns null so
// callers can render a safe fallback.
import "@/lib/api-config"; // ensures the axios base URL is configured on the server
import { communitySource } from "@/lib/data-source";
import type { Community } from "@eventmind/types";

export async function getCommunityForShare(slug: string): Promise<Community | null> {
  try {
    const { data } = await communitySource.getBySlug(slug);
    return (data as Community) ?? null;
  } catch {
    return null;
  }
}
