// Client-side share flow for an event.
//
// On devices that support sharing files (mobile), we fetch the generated story
// PNG and hand it to the native share sheet so it can be posted to a story /
// WhatsApp / Messages. Where that isn't available (most desktops), we report
// back so the caller can open a fallback modal (preview + download + copy link).
import type { Event } from "@eventmind/types";

export interface ShareFallback {
  /** Canonical event link (unfurls as the 1b card when pasted). */
  url: string;
  /** Same-origin route that returns the 1c story PNG. */
  storyUrl: string;
  title: string;
}

/** Absolute, shareable URL for an event. */
export function eventUrl(id: string): string {
  if (typeof window !== "undefined") return `${window.location.origin}/event/${id}`;
  return `/event/${id}`;
}

type ShareableEvent = Pick<Event, "id" | "title"> & { slug?: string };

export async function shareEvent(
  event: ShareableEvent,
): Promise<{ shared: boolean; fallback: ShareFallback }> {
  const url = eventUrl(event.id);
  const storyUrl = `/event/${event.id}/story`;
  const fallback: ShareFallback = { url, storyUrl, title: event.title };

  const nav = typeof navigator !== "undefined" ? navigator : undefined;

  try {
    if (nav && typeof nav.canShare === "function") {
      const res = await fetch(storyUrl);
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], `${event.slug || event.id}-newfind.png`, {
          type: "image/png",
        });
        if (nav.canShare({ files: [file] })) {
          try {
            await nav.share({
              files: [file],
              title: event.title,
              text: `You're invited to ${event.title} — join on NewFind`,
              url,
            });
          } catch {
            // User cancelled or the sheet failed — nothing more to do.
          }
          return { shared: true, fallback };
        }
      }
    }
  } catch {
    // Network / API failure — fall back to the modal below.
  }

  return { shared: false, fallback };
}
