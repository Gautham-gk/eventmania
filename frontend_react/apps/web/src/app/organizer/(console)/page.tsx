// ─────────────────────────────────────────────────────────────────────────────
//  Organiser console — Dashboard.
//
//  Three bands, in the order an organiser actually needs them:
//    1. The NEXT event, on the ink panel, with the two or three things that are
//       waiting on them beside it. This is the whole point of the page — the
//       answer to "what do I have to do today" should not require a click.
//    2. Portfolio roll-ups.
//    3. A short table of events, sharing its tabs and its row shape with
//       /organizer/events via lib/organizer-rows.ts.
//
//  The hero and the "needs you" column read from `organizerSource.overview()`,
//  which is fixtures in dummy mode and null in real mode — so in real mode the
//  hero falls back to the organiser's genuine next event and the column says
//  plainly that it has nothing to read from yet. Nothing on this page invents a
//  figure: see the note on NotBuiltYet in ConsoleUI.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { CurrencyCode } from "@eventmind/types";
import { organizerSource, isDummyMode } from "@/lib/data-source";
import { formatPrice } from "@/lib/currency";
import { CONSOLE_TABS, bucketCounts, toConsoleRows, type ConsoleRow } from "@/lib/organizer-rows";
import { useOrganiser, useOrganiserEvents } from "@/components/organizer/useOrganiser";
import { cardImageUrl } from "@/lib/card-adapters";
import { TAG_SHAPE } from "@/components/EventBadges";
import {
  Card, InkPanel, InkStatTile, StatTile, MicroLabel, Pill, Tabs, ProgressBar,
  ConsoleButton, EventThumb, RowAction, TableScroller, TableHead, TableRow,
  TableFooter, EmptyState,
  INK_LINE, ON_INK, ON_INK_SOFT, ACCENT, ON_ACCENT,
} from "@/components/organizer/ConsoleUI";
import { EarningsIcon, EditIcon } from "@/components/organizer/ConsoleIcons";

/**
 * Column widths for the dashboard's short table. Shared with the row below.
 *
 * The first column widened (1.9 → 2.2fr) when the rows grew a 56px thumbnail,
 * and `TableScroller`'s minWidth moved with it — the table keeps its width and
 * scrolls rather than crushing seven columns, the standing rule in CLAUDE.md.
 */
const TEMPLATE = "2.2fr 0.9fr 1fr 0.9fr 0.8fr 104px";

export default function ConsoleDashboardPage() {
  const { organiserId } = useOrganiser();
  const { data: events = [], isLoading } = useOrganiserEvents(organiserId);
  const { data: overview } = useQuery({
    queryKey: ["organizer-overview"],
    queryFn: () => organizerSource.overview().then((r) => r.data),
  });
  const { data: attendees = [] } = useQuery({
    queryKey: ["organizer-attendees"],
    queryFn: () => organizerSource.attendees().then((r) => r.data),
  });

  const [tab, setTab] = useState<string>("live");

  // toConsoleRows captures ONE clock reading for the whole list — see its note.
  const rows = useMemo(() => toConsoleRows(events), [events]);

  const counts = useMemo(() => bucketCounts(rows), [rows]);
  const visible = tab === "all" ? rows : rows.filter((r) => r.bucket === tab);

  // The real next event: the soonest one that has not finished. Used as the
  // hero's subject in real mode, where there is no overview fixture.
  const nextReal = useMemo(
    () =>
      rows
        .filter((r) => !r.finished && r.bucket !== "drafts")
        .sort((a, b) => a.when.localeCompare(b.when))[0],
    [rows],
  );

  const todos = buildTodos(attendees);

  return (
    <div className="flex flex-col gap-6">
      {overview ? (
        <NextUpHero overview={overview} todos={todos} />
      ) : nextReal ? (
        <RealNextUpHero row={nextReal} />
      ) : null}

      {/* ── Portfolio ── */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        {overview ? (
          <>
            <StatTile label="Events run" value={overview.portfolio.eventsRun}
              sub={`${overview.portfolio.live} live · ${overview.portfolio.drafts} draft`} />
            <StatTile label="Tickets sold" value={overview.portfolio.ticketsSold}
              sub={`↑ ${overview.portfolio.ticketsSoldThisWeek} this week`} tone="good" />
            {/* Ticket sales minus refunds. NOT minus the 2% — the buyer pays
                that on top, so it never leaves the organiser. See TODO.md §13
                and the header note on the Earnings page.
                ⚠️ The currency comes from the ORGANISER'S OWN EVENTS, never a
                literal — that is the rule in lib/currency.ts, and it is what a
                hardcoded "INR" here was quietly breaking. A roll-up can only
                carry one code, so the source asserts its events agree. */}
            <StatTile label="Revenue" value={formatPrice(overview.portfolio.netRevenue, overview.portfolio.currency, { freeLabel: null })}
              sub="after refunds" />
            <StatTile label="Check-in rate" value={`${overview.portfolio.checkInRate}%`}
              sub={`${overview.portfolio.checkedIn} of ${overview.portfolio.pastCapacity} past`} tone="good" />
            <StatTile label="Refunds" value={formatPrice(overview.portfolio.refunded, overview.portfolio.currency, { freeLabel: null })}
              sub={`${overview.portfolio.refundedTickets} of ${overview.portfolio.ticketsSold} tickets`} tone="warn" />
          </>
        ) : (
          <>
            {/* Real mode: only the figures the events endpoint genuinely supports. */}
            <StatTile label="Events run" value={events.length}
              sub={`${counts.live} live · ${counts.drafts} draft`} />
            <StatTile label="Tickets sold" value={events.reduce((n, e) => n + (e.tickets_sold || 0), 0)}
              sub="across all events" />
            <StatTile label="Live now" value={counts.live} sub="on sale in the next 30 days" />
            <StatTile label="Check-in rate" value="—" sub="needs the check-in backend" />
            <StatTile label="Refunds" value="—" sub="needs the payments backend" />
          </>
        )}
      </div>

      {/* ── Events ── */}
      <Card padded={false}>
        <div className="flex items-center justify-between gap-4 flex-wrap px-5 pt-4">
          <Tabs
            items={CONSOLE_TABS.map((t) => ({ ...t, count: counts[t.key] ?? 0 }))}
            active={tab}
            onSelect={setTab}
          />
          <RowAction href="/organizer/events">See all events →</RowAction>
        </div>

        <div className="mt-3">
          <TableScroller minWidth={960}>
            <TableHead template={TEMPLATE} columns={["Event", "When", "Sold", "Revenue", "Check-ins", ""]} />
            {visible.slice(0, 5).map((r) => (
              <TableRow key={r.id} template={TEMPLATE}>
                {/* The event's own picture, same one its card shows. alt="" —
                    the title is right beside it. */}
                <div className="flex items-center gap-3 min-w-0">
                  <EventThumb src={r.image} alt="" />
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="text-[20px] font-bold leading-snug truncate" style={{ color: "var(--brand-text)" }}>
                      {r.title}
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      {/* The bucket picks the colour — one map, in ConsoleUI, so
                          this chip and the Events page's cannot disagree. */}
                      <Pill type={r.bucket}>{r.status}</Pill>
                    </span>
                  </div>
                </div>
                <div className="text-[17px]" style={{ color: "var(--brand-hint)" }}>
                  {r.when}
                  <div className="text-[15px] opacity-80">{r.whenSub}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[17px] font-semibold" style={{ color: "var(--brand-text)" }}>{r.sold}</span>
                  <ProgressBar pct={r.pct} muted={r.finished} />
                </div>
                <div className="text-[17px] font-semibold" style={{ color: "var(--brand-text)" }}>{r.revenue}</div>
                <div className="text-[17px]" style={{ color: "var(--brand-hint)" }}>{r.checkins}</div>
                <div className="flex justify-end">
                  <RowAction href={`/event/${r.id}`}>Open</RowAction>
                </div>
              </TableRow>
            ))}
          </TableScroller>

          {!isLoading && visible.length === 0 && (
            <p className="px-5 py-10 text-center text-[17px]" style={{ color: "var(--brand-hint)" }}>
              {tab === "drafts" && !isDummyMode
                ? "Drafts are not served by the events endpoint yet — see TODO.md §19."
                : "Nothing in this tab."}
            </p>
          )}

          <TableFooter note={`${visible.length} of ${rows.length} events`} />
        </div>
      </Card>

      {!isLoading && rows.length === 0 && (
        <EmptyState
          title="No events yet"
          body="Everything you publish shows up here — tickets sold, revenue, refunds and who walked in."
          action={
            <Link href="/organizer/create">
              <ConsoleButton tone="green">Create your first event</ConsoleButton>
            </Link>
          }
        />
      )}
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

type Overview = NonNullable<Awaited<ReturnType<typeof organizerSource.overview>>["data"]>;

function NextUpHero({ overview, todos }: { overview: Overview; todos: Todo[] }) {
  const { next } = overview;
  const pct = Math.round((next.sold / next.capacity) * 100);

  return (
    // The event's own card picture behind the panel — see InkPanel. alt="" is
    // right: the title is the next thing in the reading order.
    <InkPanel image={cardImageUrl(next.eventId, 1200, 500)} imageAlt="">
      <div className="grid gap-7 lg:grid-cols-[1fr_300px]">
        {/* Left: the event */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Both chips carry EventBadge's own recipe — TAG_SHAPE, gap-1.5,
              font-bold, leading-5, px-2.5 py-1.5, 16px — so they read as the
              same object as the tags on this event's card and on its public
              hero. They were 11px uppercase micro-labels; see the type note in
              ConsoleUI. */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`${TAG_SHAPE} gap-1.5 font-bold leading-5 px-2.5 py-1.5 text-[16px]`}
              style={{ backgroundColor: ACCENT, color: ON_ACCENT }}
            >
              Next up · in {next.inDays} days
            </span>
            {next.paid && (
              <span
                className={`${TAG_SHAPE} gap-1.5 font-bold leading-5 px-2.5 py-1.5 text-[16px]`}
                style={{ color: ACCENT, border: `1px solid ${INK_LINE}` }}
              >
                Paid
              </span>
            )}
          </div>

          <div>
            {/* The hero's subject, on the site's heading recipe. */}
            <h2
              className="font-extrabold leading-tight tracking-[-0.5px]"
              style={{ fontSize: "clamp(24px, 3.4vw, 32px)", color: ON_INK }}
            >
              {next.title}
            </h2>
            <p className="text-[17px] mt-1.5" style={{ color: ON_INK_SOFT }}>{next.when}</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[17px]" style={{ color: ON_INK_SOFT }}>Tickets sold</span>
              <span className="text-[17px] font-semibold" style={{ color: ACCENT }}>
                {next.sold} of {next.capacity} · {pct}%
              </span>
            </div>
            <ProgressBar pct={pct} onInk />
          </div>

          {/* ⚠️ THREE TILES, NOT FOUR. The fourth was "Questions · unanswered",
              read off the event room's unread count; the Event rooms section
              went on 2026-09-01 and nothing counts questions any more, so the
              tile went with it rather than printing a permanent zero — the
              NotBuiltYet rule in ConsoleUI. */}
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-3">
            {/* The event's own currency, not a literal — see the note on the
                Revenue tile below. */}
            <InkStatTile label="Revenue" value={formatPrice(next.revenue, next.currency, { freeLabel: null })} sub="ticket sales" />
            <InkStatTile label="Check-ins" value={`${next.checkedIn} / ${next.sold}`} sub="opens on the day" />
            <InkStatTile label="Refunds" value={next.refunds} sub={`${formatPrice(next.refundValue, next.currency, { freeLabel: null })} returned`} />
          </div>

          {/* ⚠️ "Open event room" and "Message attendees" both pointed at
              /organizer/rooms and both went with it. They are NOT replaced by a
              link into /chat: talking to attendees is a chat-surface job the
              backend does not do for organisers yet (TODO.md §19.1), and a
              button into a room that answers nobody is worse than no button.
              The primary now matches RealNextUpHero's — the event's own page. */}
          <div className="flex gap-2.5 flex-wrap mt-1">
            <Link href={`/event/${next.eventId}`}>
              <ConsoleButton tone="accent">Open event page</ConsoleButton>
            </Link>
            <Link href="/organizer/attendees">
              <ConsoleButton tone="onInk">Check-in mode</ConsoleButton>
            </Link>
          </div>
        </div>

        {/* Right: what is waiting */}
        <div
          className="flex flex-col gap-3 lg:pl-6 pt-5 lg:pt-0"
          style={{ borderTop: `1px solid ${INK_LINE}`, borderLeft: "none" }}
        >
          <MicroLabel color={ACCENT}>Needs you today</MicroLabel>
          {todos.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              /* These ARE links and now say so under the pointer — a 10% lift,
                 the same hover `ConsoleButton`'s onInk tone takes, since a green
                 fill means nothing on a green-black panel. The rest fill is a
                 CLASS, not INK_FILL inline, because an inline background beats
                 `hover:`; on this panel `white/[0.07]` and INK_FILL (7% of the
                 near-white --brand-on-ink) are the same colour. */
              className="flex items-start gap-3 rounded-xl p-3 text-left border bg-white/[0.07] hover:bg-white/[0.14] transition-colors"
              style={{ borderColor: INK_LINE }}
            >
              {/* A SOLID accent chip, not the 20% wash this carried while the
                  accent was gold. Terracotta on a terracotta wash over the ink
                  panel is ~2.8:1 and the glyph all but vanishes (gold on its own
                  wash was ~4.9:1) — and this glyph carries meaning: it is what
                  separates a room question from a refund from an unpaid booking.
                  Filled, the mark is white on terracotta and reads. Do not put
                  the wash back without giving the glyph a lighter colour. */}
              <span
                className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0 mt-0.5"
                style={{ backgroundColor: ACCENT, color: ON_ACCENT }}
              >
                <t.Icon className="w-3.5 h-3.5" />
              </span>
              <span className="flex flex-col gap-1 min-w-0">
                <span className="text-[17px] font-semibold leading-snug" style={{ color: ON_INK }}>{t.title}</span>
                <span className="text-[15px] leading-snug" style={{ color: ON_INK_SOFT }}>{t.sub}</span>
              </span>
            </Link>
          ))}
          <p className="text-[15px]" style={{ color: ON_INK_SOFT }}>
            {todos.length === 0
              ? "Nothing is waiting on you."
              : "Cleared items disappear — an empty column means nothing is waiting."}
          </p>
        </div>
      </div>
    </InkPanel>
  );
}

/**
 * The real-mode hero. Same panel, but built only from what the events endpoint
 * actually returns — no check-ins, no refunds, because neither has a source yet.
 */
function RealNextUpHero({ row }: { row: ConsoleRow }) {
  return (
    // `row.image` is the same picture the event's card shows — see ConsoleRow.
    <InkPanel image={row.image} imageAlt="">
      <div className="flex flex-col gap-4">
        <span
          className={`${TAG_SHAPE} self-start gap-1.5 font-bold leading-5 px-2.5 py-1.5 text-[16px]`}
          style={{ backgroundColor: ACCENT, color: ON_ACCENT }}
        >
          Next up
        </span>
        <div>
          <h2
            className="font-extrabold leading-tight tracking-[-0.5px]"
            style={{ fontSize: "clamp(24px, 3.4vw, 32px)", color: ON_INK }}
          >
            {row.title}
          </h2>
          <p className="text-[17px] mt-1.5" style={{ color: ON_INK_SOFT }}>
            {row.when} · {row.whenSub} · {row.place}
          </p>
        </div>
        <div className="flex flex-col gap-2 max-w-[420px]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[17px]" style={{ color: ON_INK_SOFT }}>Tickets sold</span>
            <span className="text-[17px] font-semibold" style={{ color: ACCENT }}>{row.sold} · {row.pct}%</span>
          </div>
          <ProgressBar pct={row.pct} onInk />
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Link href={`/event/${row.id}`}>
            <ConsoleButton tone="accent">Open event page</ConsoleButton>
          </Link>
          <Link href="/organizer/events">
            <ConsoleButton tone="onInk">All events</ConsoleButton>
          </Link>
        </div>
        <p className="text-[15px]" style={{ color: ON_INK_SOFT }}>
          Check-ins and refunds appear here once the organiser backend serves them — TODO.md §19.
        </p>
      </div>
    </InkPanel>
  );
}

// ── "Needs you" ──────────────────────────────────────────────────────────────

interface Todo {
  title: string;
  sub: string;
  href: string;
  Icon: typeof EarningsIcon;
}

/**
 * Derived from the data on screen, never hardcoded — so an organiser with a
 * clear queue sees an empty column rather than three invented chores.
 *
 * ⚠️ There used to be a third source: unanswered questions in the busiest event
 * room. The Event rooms section went on 2026-09-01 — attendee conversation
 * belongs to the chat surfaces and has no organiser-side backend yet
 * (TODO.md §19.1) — so this reads attendees alone. **Do not put a question item
 * back until something can actually count them.**
 */
function buildTodos(
  attendees: { status: string; name: string; paid: number; currency?: CurrencyCode }[],
): Todo[] {
  const todos: Todo[] = [];

  const refunds = attendees.filter((a) => a.status === "Refund requested");
  if (refunds.length > 0) {
    todos.push({
      title: `${refunds.length} refund request${refunds.length === 1 ? "" : "s"} pending`,
      sub: `${refunds[0].name} · ${formatPrice(refunds[0].paid, refunds[0].currency, { freeLabel: null })}`,
      href: "/organizer/attendees",
      Icon: EarningsIcon,
    });
  }

  const unpaid = attendees.filter((a) => a.status === "Awaiting payment");
  if (unpaid.length > 0) {
    todos.push({
      title: `${unpaid.length} booking${unpaid.length === 1 ? "" : "s"} awaiting payment`,
      sub: "Remind them before the seat is held any longer",
      href: "/organizer/attendees",
      Icon: EditIcon,
    });
  }

  return todos;
}
