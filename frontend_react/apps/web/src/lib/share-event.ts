// Client-side share flow for an event OR a community.
//
// On devices that support sharing files (mobile), we fetch the generated story
// PNG and hand it to the native share sheet so it can be posted to a story /
// WhatsApp / Messages. Where that isn't available (most desktops), we report
// back so the caller can open a fallback modal (preview + download + copy link).
//
// ONE flow for both kinds: an event and a community share identically, differing
// only in the URL segment and the invite wording. Both have a `/story` route and
// OG metadata, so neither degrades to a link-only share.

/** What is being shared. Doubles as the URL segment (`/event/…`, `/community/…`). */
export type ShareKind = "event" | "community";

export interface ShareFallback {
  /** Canonical link (unfurls as the 1b card when pasted). */
  url: string;
  /** Same-origin route that returns the 1c story PNG. */
  storyUrl: string;
  title: string;
  /** Carried so the fallback modal can word its heading correctly. */
  kind: ShareKind;
}

/**
 * Absolute, shareable URL.
 *
 * ⚠️ Communities are addressed by the SAME value their cards link to
 * (`CommunityItem.id`). The `/community/[slug]` route resolves by slug, so if
 * the API ever returns `slug !== id` the card link and this URL are wrong
 * together rather than differently — see HANDOVER.md, community slug-vs-id note.
 */
export function shareUrl(kind: ShareKind, id: string): string {
  const path = `/${kind}/${id}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

/** Back-compat alias — events were here first. */
export function eventUrl(id: string): string {
  return shareUrl("event", id);
}

interface ShareableItem {
  id: string;
  title: string;
  slug?: string;
}

export async function shareItem(
  kind: ShareKind,
  item: ShareableItem,
): Promise<{ shared: boolean; fallback: ShareFallback }> {
  const url = shareUrl(kind, item.id);
  const storyUrl = `/${kind}/${item.id}/story`;
  const fallback: ShareFallback = { url, storyUrl, title: item.title, kind };

  const invite =
    kind === "community"
      ? `Join ${item.title} on NewFind`
      : `You're invited to ${item.title} — join on NewFind`;

  const nav = typeof navigator !== "undefined" ? navigator : undefined;

  try {
    if (nav && typeof nav.canShare === "function") {
      const res = await fetch(storyUrl);
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], `${item.slug || item.id}-newfind.png`, {
          type: "image/png",
        });
        if (nav.canShare({ files: [file] })) {
          try {
            await nav.share({ files: [file], title: item.title, text: invite, url });
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

/** Back-compat wrapper — prefer `shareItem("event", …)`. */
export async function shareEvent(
  event: ShareableItem,
): Promise<{ shared: boolean; fallback: ShareFallback }> {
  return shareItem("event", event);
}
