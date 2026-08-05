"use client";

import { useState } from "react";
import type { Event } from "@eventmind/types";
import { shareEvent, type ShareFallback } from "@/lib/share-event";
import { ShareModal } from "./ShareModal";

interface Props {
  event: Pick<Event, "id" | "title"> & { slug?: string };
  /** Extra classes for the circular button (size/position handled by caller). */
  className?: string;
  /** Stop the click from bubbling (e.g. so an event-card tap doesn't navigate). */
  stopPropagation?: boolean;
  /** Tailwind size classes for the icon (default w-5 h-5). */
  iconClassName?: string;
  title?: string;
}

/**
 * Circular share control. Opens the native share sheet (with the story image)
 * where supported, otherwise pops the fallback modal. Self-contained: manages
 * its own busy state and modal.
 */
export function ShareButton({ event, className = "", stopPropagation, iconClassName = "w-5 h-5", title = "Share" }: Props) {
  const [busy, setBusy] = useState(false);
  const [fallback, setFallback] = useState<ShareFallback | null>(null);

  async function onClick(e: React.MouseEvent) {
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (busy) return;
    setBusy(true);
    try {
      const { shared, fallback: fb } = await shareEvent(event);
      if (!shared) setFallback(fb);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={onClick}
        title={title}
        aria-label={title}
        disabled={busy}
        className={`flex items-center justify-center rounded-full transition-colors ${className}`}
      >
        <svg className={iconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
          />
        </svg>
      </button>
      <ShareModal fallback={fallback} onClose={() => setFallback(null)} />
    </>
  );
}
