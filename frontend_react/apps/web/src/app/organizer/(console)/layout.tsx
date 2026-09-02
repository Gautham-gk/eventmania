// ─────────────────────────────────────────────────────────────────────────────
//  Organiser console shell — the sidebar, the page header, and the auth guard
//  every section shares.
//
//  ⚠️ WHY THIS IS IN A (console) ROUTE GROUP. `/organizer/create`,
//  `/organizer/onboarding` and `/organizer/my-events` are siblings that render
//  their own <Navbar/> and are NOT part of this console. A layout at
//  `app/organizer/layout.tsx` would wrap them too and give each of them a second
//  navbar plus a sidebar they have no use for. The group applies the shell to
//  the four console sections only, and changes no URL.
//
//  The section titles live here rather than in each page because the header is
//  one continuous element across the console — a page that set its own would
//  drift in size or spacing the first time one of them was edited.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { GUTTERS, PAGE_MAX_WIDTH } from "@/lib/layout";
import { useToday } from "@/lib/use-today";
import { isDummyMode } from "@/lib/data-source";
import { ConsoleSidebar } from "@/components/organizer/ConsoleSidebar";
import { ConsoleButton, EmptyState } from "@/components/organizer/ConsoleUI";
import { useOrganiser, useOrganiserEvents } from "@/components/organizer/useOrganiser";
import { SearchIcon } from "@/components/organizer/ConsoleIcons";

/** Title + standfirst per section. `null` sub = the section needs no explaining. */
const SECTIONS: Record<string, { title: string; sub: string | null }> = {
  "/organizer": { title: "", sub: null }, // greeting — filled in below
  "/organizer/events": {
    title: "Events",
    // ⚠️ Says nothing about private events, on purpose: every event NewFind
    // serves is public and discoverable, so describing a private one would
    // promise a state no event can be in. See the note on `PRICE_FILTERS` in
    // lib/organizer-rows.ts — the same reason there is no visibility filter.
    sub: "Everything you've created — live, scheduled, drafted or done.",
  },
  "/organizer/attendees": {
    title: "Attendees",
    sub: "Who's coming, what they paid, and who walked in. Filter to one event to run the door.",
  },
  "/organizer/earnings": { title: "Earnings", sub: null },
};

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { organiserId, name, ready, isOrganiser, organiserKnown } = useOrganiser();
  const { data: events = [] } = useOrganiserEvents(organiserId);

  // Browser-only: the server has no user clock. See lib/use-today.ts.
  const today = useToday();

  const section = SECTIONS[pathname] ?? SECTIONS["/organizer"];
  const title =
    pathname === "/organizer"
      ? `${today?.greeting ?? "Welcome"}, ${name.split(" ")[0]}`
      : section.title;

  // Nothing until zustand has rehydrated AND we know whether this person is an
  // organiser — see useOrganiser. Rendering the shell first would flash a
  // signed-in console at a signed-out visitor on the way to /auth, flash an
  // empty sidebar at a signed-in one on every refresh, and flash the
  // "not an organiser" page at an organiser while their profile loads.
  if (!ready || !organiserKnown) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--brand-bg)" }}>
        <Navbar />
      </div>
    );
  }

  // Signed in, but not an organiser. No rail and no sections — there is nothing
  // behind them for this person — just what the console is and the one door into
  // it. See the two-gates note in useOrganiser.
  if (!isOrganiser) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--brand-bg)" }}>
        <Navbar />
        <main className={`${GUTTERS} py-12`}>
          <div className="mx-auto" style={{ maxWidth: 720 }}>
            <EmptyState
              title="The organiser console is for organisers"
              body="This is where you'd manage the events you run — tickets sold, questions from attendees, who walked in, and what you earned. Set yourself up as an organiser and it opens, showing only your own events."
              action={
                <Link href="/organizer/onboarding">
                  <ConsoleButton tone="green">Become an organiser</ConsoleButton>
                </Link>
              }
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--brand-bg)" }}>
      <Navbar />

      <div className="flex items-start">
        <ConsoleSidebar badges={{ "/organizer/events": events.length }} />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-7 lg:py-8">
          <div className="mx-auto flex flex-col gap-6" style={{ maxWidth: PAGE_MAX_WIDTH }}>
            {/* ── Page header ── */}
            <header className="flex items-end justify-between gap-5 flex-wrap">
              <div className="min-w-0">
                <div className="text-[15px]" style={{ color: "var(--brand-hint)" }}>
                  {/* Empty on the server pass, filled on hydration. The
                      non-breaking space holds the line's height either way, so
                      the heading below does not jump. */}
                  {today?.label ?? " "}
                </div>
                {/* ⚠️ THE SITE'S SECTION-HEADING RECIPE, not a dashboard title
                    (Gautham, 2026-08-22): `font-extrabold` + `-0.5px` tracking +
                    a clamp, exactly as EventsCarousel sets "Events in {city}"
                    and one step larger because this is an h1 over a whole
                    section rather than a row. It was `text-[28px] font-bold
                    tracking-[-0.01em]` — near enough to the public heading to
                    look like a mistake rather than a difference. */}
                <h1
                  className="font-extrabold mt-1 tracking-[-0.5px]"
                  style={{ fontSize: "clamp(24px, 4vw, 32px)", color: "var(--brand-text)" }}
                >
                  {title}
                </h1>
                {section.sub && (
                  <p
                    className="text-[17px] mt-1.5 max-w-[680px]"
                    style={{ color: "var(--brand-hint)", textWrap: "pretty" }}
                  >
                    {section.sub}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Inert until there is an organiser-scoped search endpoint —
                    a box that swallows a query is worse than one that says it
                    is not ready. Disabled, not hidden, so the header keeps its
                    designed shape. */}
                <div
                  className="hidden sm:flex items-center gap-2 rounded-xl px-3.5 py-2.5 min-w-[240px]"
                  style={{
                    backgroundColor: "var(--brand-surface)",
                    border: "1px solid var(--brand-nav-border)",
                    color: "var(--brand-muted)",
                    opacity: 0.85,
                  }}
                  title="Console search arrives with the organiser backend"
                >
                  <SearchIcon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-[17px]">Search events, attendees…</span>
                </div>

                {/* ⚠️ No "N need you" pill here — removed 2026-09-02 (Gautham).
                    It was a <span>, not a link, so it named a number of chores
                    and gave you nowhere to go, while the dashboard's "Needs you
                    today" column said the same thing WITH links one screen
                    below. Its two signals (refund requested, awaiting payment)
                    are owed to the navbar's notification bell instead —
                    TODO.md §24. Do not reinstate a counter here. */}
              </div>
            </header>

            {children}

            {isDummyMode && (
              <p className="text-[15px]" style={{ color: "var(--brand-hint)", opacity: 0.75 }}>
                Sample data — <code>NEXT_PUBLIC_DATA_MODE=dummy</code>. Figures here are made up.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
