"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { EVENT_FORMATS } from "@eventmind/types";

// Local hero images live in apps/web/public/hero/. Paths are served from the public
// root, so "/hero/hero-2.png" → public/hero/hero-2.png. (hero-1 and hero-6 removed.)
//
// The hero has two MODES — Events and Communities — driven by the segmented toggle.
// A mode owns everything on both sides: the left copy AND the five slide CTAs. The
// five photos are shared; only their labels and destinations change, so the carousel
// keeps its position across a toggle.
//
// Each slide's href applies the filter its label promises, so the click delivers what
// it says. For EVENTS, offline/online are the event_type FORMAT filter, never a
// category (format and category are orthogonal; "online" is not a category). For
// COMMUNITIES there is no format filter at all — /explore's community query only
// honours q + category + city — so "online" is expressed with the `Online` pseudo-city
// instead, and the food-market photo takes a category rather than a bogus format.
type Slide = { src: string; label: string; href: string };
type ModeKey = "events" | "communities";

type Mode = {
  toggleLabel: string;
  eyebrow: string;
  headline: [string, string];
  subcopy: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  slides: Slide[];
};

const EVENTS = "/explore?view=events";
const COMMUNITIES = "/explore?view=communities";

const cat = (base: string, c: string) => `${base}&category=${encodeURIComponent(c)}`;

const IMG = {
  market: "/hero/hero-3.png", // night food market
  videoCall: "/hero/hero-2.png", // woman on a video call
  meditation: "/hero/hero-4.png", // sunrise meditation
  tableTennis: "/hero/hero-5.png", // table tennis match
  painting: "/hero/hero-7.png", // kids painting at easels
} as const;

const MODES: Record<ModeKey, Mode> = {
  events: {
    toggleLabel: "Events",
    eyebrow: "Online & offline",
    headline: ["Every event worth", "showing up for."],
    subcopy:
      "Workshops, gigs, food nights, sports leagues and livestreams. Discover what’s on near you or online — or publish your own in minutes.",
    primary: { label: "Explore events", href: EVENTS },
    secondary: { label: "Publish an event", href: "/organizer/create" },
    slides: [
      { src: IMG.market, label: "Find offline events", href: `${EVENTS}&event_type=${encodeURIComponent(EVENT_FORMATS.inPerson)}` },
      { src: IMG.videoCall, label: "Find online events", href: `${EVENTS}&event_type=${encodeURIComponent(EVENT_FORMATS.online)}` },
      { src: IMG.meditation, label: "Find wellness events", href: cat(EVENTS, "Health & Wellness") },
      { src: IMG.tableTennis, label: "Find sports events", href: cat(EVENTS, "Sports") },
      { src: IMG.painting, label: "Find workshops", href: cat(EVENTS, "Creative") },
    ],
  },
  communities: {
    toggleLabel: "Communities",
    eyebrow: "Find your people",
    headline: ["Every community", "worth joining."],
    subcopy:
      "Runners, builders, painters, home cooks and night-owl gamers. Join a group that meets near you or online — or start your own.",
    primary: { label: "Explore communities", href: COMMUNITIES },
    secondary: { label: "Publish a community", href: "/community/create" },
    slides: [
      // No format filter exists for communities, so this photo takes the category
      // that actually matches it rather than a fake "offline" filter.
      { src: IMG.market, label: "Find food & drink communities", href: cat(COMMUNITIES, "Food & Drink") },
      { src: IMG.videoCall, label: "Find online communities", href: `${COMMUNITIES}&city=Online` },
      { src: IMG.meditation, label: "Find wellness communities", href: cat(COMMUNITIES, "Health & Wellness") },
      { src: IMG.tableTennis, label: "Find sports communities", href: cat(COMMUNITIES, "Sports") },
      { src: IMG.painting, label: "Find creative communities", href: cat(COMMUNITIES, "Creative") },
    ],
  },
};

const SLIDE_COUNT = MODES.events.slides.length;

const DURATION = 1500;
// DX controls how pronounced the diagonal is (% of width offset between top and bottom edge)
const DX = 8;
// Extra sweep range so the full image is covered at t=1
const SWEEP = 100 + 22 + DX * 2;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Diagonal clip-path that mirrors Flutter's ShaderMask wipe:
// bottom-left reveals first, top-right last.
// topEdge is behind bottomEdge, creating the counterclockwise tilt.
function buildClipPath(progress: number): string {
  const gx = progress * SWEEP - 22; // sweeps from -22% to (100 + DX*2)%
  const topEdge = gx - DX;
  const bottomEdge = gx + DX;
  return `polygon(0% 0%, ${topEdge}% 0%, ${bottomEdge}% 100%, 0% 100%)`;
}

export function HeroCarousel() {
  const [mode, setMode] = useState<ModeKey>("events");
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [progress, setProgress] = useState(0);

  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const animatingRef = useRef(false);
  const currentRef = useRef(0);

  const runAnimation = useCallback((targetIdx: number) => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setNext(targetIdx);
    setAnimating(true);
    setProgress(0);
    startRef.current = performance.now();

    function frame(now: number) {
      const raw = Math.min((now - startRef.current) / DURATION, 1);
      setProgress(easeInOut(raw));
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        currentRef.current = targetIdx;
        setCurrent(targetIdx);
        setAnimating(false);
        setProgress(0);
        animatingRef.current = false;
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  const advance = useCallback(() => {
    if (animatingRef.current) return;
    runAnimation((currentRef.current + 1) % SLIDE_COUNT);
  }, [runAnimation]);

  useEffect(() => {
    timerRef.current = setInterval(advance, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [advance]);

  function goTo(index: number) {
    if (animatingRef.current || index === currentRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    runAnimation(index);
    timerRef.current = setInterval(advance, 4000);
  }

  // The CTA swaps at the wipe's halfway point, so the label matches whichever
  // photo is covering most of the panel. The dots follow the same rule.
  const activeIdx = animating ? (progress > 0.5 ? next : current) : current;
  const m = MODES[mode];
  const activeSlide = m.slides[activeIdx];
  const clipPath = buildClipPath(progress);

  return (
    // Contained + centered in the standard 1400px page column — copy LEFT, image
    // RIGHT, both inside the gutters (no edge bleed). Gautham's call after trying
    // both the copy-left/image-right-bleed and image-left variants.
    <section className="w-full px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
      {/* Image column (right) is deliberately wider than the copy column (1 : 1.35). */}
      <div
        className="mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-8 lg:gap-12 items-center"
        style={{ maxWidth: 1400 }}
      >
        {/* ── Right: rotating image panel ──────────────────────────────── */}
        {/* order-2 everywhere: on mobile the copy leads and the image sits below;
            at lg the image takes the wider right column. Fully rounded — it is
            contained now, no off-screen edge. Height is explicit at lg (not an
            aspect ratio) so the panel stays big regardless of the copy's height. */}
        <div
          className="relative w-full overflow-hidden rounded-2xl aspect-[4/3] lg:aspect-auto lg:h-[min(82vh,820px)] order-2"
          style={{ backgroundColor: "#111827" }}
        >
          {/* Outgoing image — static, no animation */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.slides[current].src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => runAnimation((currentRef.current + 1) % SLIDE_COUNT)}
          />

          {/* Incoming image — revealed by diagonal clip-path wipe */}
          {animating && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.slides[next].src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ clipPath }}
            />
          )}

          {/* Bottom scrim so the CTA and dots stay legible on any photo */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}
          />

          {/* Per-slide CTA — label + destination change with the photo */}
          <Link
            href={activeSlide.href}
            className="absolute bottom-5 left-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-colors"
            style={{ backgroundColor: "var(--brand-terracotta)", color: "var(--brand-on-terracotta)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--brand-terracotta-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--brand-terracotta)"; }}
          >
            {activeSlide.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 12h15m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Navigation dots */}
          <div className="absolute bottom-8 right-5 flex items-center gap-2">
            {m.slides.map((slide, i) => (
              <button
                key={slide.src}
                onClick={() => goTo(i)}
                aria-label={slide.label}
                className="h-1 rounded-full transition-all duration-300"
                // White, not terracotta — the CTA is terracotta now, and two
                // terracotta elements on one photo read as the same control.
                style={{
                  width: activeIdx === i ? 28 : 8,
                  backgroundColor: activeIdx === i ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Left: copy (everything here is mode-driven) ──────────────── */}
        <div className="order-1">
          {/* Events / Communities segmented toggle — swaps BOTH columns */}
          <div
            className="inline-flex p-1 rounded-xl mb-6"
            style={{ backgroundColor: "var(--brand-bg)", border: "2px solid var(--brand-control-border)" }}
          >
            {(Object.keys(MODES) as ModeKey[]).map((key) => {
              const active = key === mode;
              return (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  aria-pressed={active}
                  className="px-5 py-2 rounded-lg font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? "var(--brand-green)" : "transparent",
                    color: active ? "var(--brand-on-green)" : "var(--brand-text)",
                  }}
                >
                  {MODES[key].toggleLabel}
                </button>
              );
            })}
          </div>

          <p
            className="font-bold tracking-widest uppercase mb-3"
            style={{ color: "var(--brand-terracotta)" }}
          >
            {m.eyebrow}
          </p>

          <h1
            className="font-bold leading-[1.05] mb-6"
            style={{ color: "var(--brand-green)", fontSize: "clamp(36px, 4.4vw, 60px)" }}
          >
            {m.headline[0]}
            <br />
            {m.headline[1]}
          </h1>

          <p className="mb-8 max-w-md" style={{ color: "var(--brand-text)", fontSize: 18, lineHeight: 1.6 }}>
            {m.subcopy}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href={m.primary.href}
              className="px-7 py-3.5 rounded-xl font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--brand-green)", color: "var(--brand-on-green)" }}
            >
              {m.primary.label}
            </Link>
            <Link
              href={m.secondary.href}
              className="px-7 py-3.5 rounded-xl font-bold transition-colors"
              style={{
                backgroundColor: "var(--brand-surface)",
                color: "var(--brand-text)",
                border: "2px solid var(--brand-control-border)",
              }}
            >
              {m.secondary.label}
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
