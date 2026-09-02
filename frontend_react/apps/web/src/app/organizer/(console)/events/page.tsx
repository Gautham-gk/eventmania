// Organiser console — Events.
//
// The full table the dashboard shows five rows of. Both read the same
// `toConsoleRow`, so a figure can never differ between the two surfaces.
// Eight columns have no honest narrow layout, so the table keeps its width and
// scrolls inside the card — the standing rule in CLAUDE.md.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { isDummyMode } from "@/lib/data-source";
import {
  CONSOLE_TABS, PRICE_FILTERS, ROW_SORTS,
  bucketCounts, filterAndSortRows, toConsoleRows,
} from "@/lib/organizer-rows";
import type { PriceFilter, RowSort } from "@/lib/organizer-rows";
import { useOrganiser, useOrganiserEvents } from "@/components/organizer/useOrganiser";
import {
  Card, Pill, Tabs, ProgressBar, FilterSelect, ConsoleButton, EventThumb, RowAction,
  TableScroller, TableHead, TableRow, TableFooter, EmptyState,
} from "@/components/organizer/ConsoleUI";
import { MoreIcon } from "@/components/organizer/ConsoleIcons";

/** Wider first column + minWidth than before: the rows carry a 56px thumbnail
 *  and the type sits on the site's scale rather than at the 15px floor. */
const TEMPLATE = "2.5fr 1fr 1fr 1fr 1fr 0.8fr 116px";

export default function ConsoleEventsPage() {
  const { organiserId } = useOrganiser();
  const { data: events = [], isLoading } = useOrganiserEvents(organiserId);
  const [tab, setTab] = useState<string>("live");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<RowSort>("soonest");

  const rows = useMemo(() => toConsoleRows(events), [events]);

  // Counts sit on the TABS, so they count the bucket only — the price filter and
  // the sort must not change them, or picking "Free" would read as events having
  // disappeared rather than as a filter being on. The footer's "N of M" below is
  // where the filter's effect is stated.
  const counts = useMemo(() => bucketCounts(rows), [rows]);
  const inTab = useMemo(
    () => (tab === "all" ? rows : rows.filter((r) => r.bucket === tab)),
    [rows, tab],
  );
  const visible = useMemo(() => filterAndSortRows(inTab, price, sort), [inTab, price, sort]);

  if (!isLoading && events.length === 0) {
    return (
      <EmptyState
        title="No events yet"
        body="Everything you publish shows up here — tickets sold, revenue, and who walked in."
        action={
          <Link href="/organizer/create">
            <ConsoleButton tone="green">Create your first event</ConsoleButton>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs
          items={CONSOLE_TABS.map((t) => ({ ...t, count: counts[t.key] ?? 0 }))}
          active={tab}
          onSelect={setTab}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <FilterSelect
            label="Filter by price"
            value={price}
            options={PRICE_FILTERS}
            defaultValue="all"
            onChange={setPrice}
          />
          <FilterSelect label="Sort by date" value={sort} options={ROW_SORTS} onChange={setSort} />
        </div>
      </div>

      <Card padded={false}>
        <TableScroller minWidth={1160}>
          <TableHead
            template={TEMPLATE}
            columns={["Event", "When", "Where", "Sold", "Revenue", "Check-ins", <span key="a" className="text-right block">Actions</span>]}
          />
          {visible.map((r) => (
            <TableRow key={r.id} template={TEMPLATE}>
              {/* The event's own picture — the same one its card shows on home
                  and /explore. alt="" because the title sits right beside it. */}
              <div className="flex items-center gap-3 min-w-0">
                <EventThumb src={r.image} alt="" />
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-[20px] font-bold leading-snug" style={{ color: "var(--brand-text)" }}>
                    {r.title}
                  </span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    {/* Both chips are `EventBadge`s in all but name — solid tag
                        palette, linen label. The state's colour comes from the
                        bucket, the price's from whether it IS a price: "Free"
                        wears the same Plum the card's own Free tag does. */}
                    <Pill type={r.bucket}>{r.status}</Pill>
                    <Pill type={r.free ? "free" : "paid"}>{r.price}</Pill>
                  </span>
                </div>
              </div>
              <div className="text-[17px]" style={{ color: "var(--brand-hint)" }}>
                {r.when}
                <div className="text-[15px] opacity-80">{r.whenSub}</div>
              </div>
              <div className="text-[17px]" style={{ color: "var(--brand-hint)" }}>{r.place}</div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[17px] font-semibold" style={{ color: "var(--brand-text)" }}>{r.sold}</span>
                <ProgressBar pct={r.pct} muted={r.finished} />
              </div>
              <div className="text-[17px] font-semibold" style={{ color: "var(--brand-text)" }}>{r.revenue}</div>
              <div className="text-[17px]" style={{ color: "var(--brand-hint)" }}>{r.checkins}</div>
              <div className="flex justify-end items-center gap-1.5">
                <RowAction href={`/event/${r.id}`}>Manage</RowAction>
                {/* Inert until the row actions below have somewhere to post to. */}
                <button
                  type="button"
                  disabled
                  aria-label="More actions"
                  title="Row actions arrive with the organiser backend"
                  className="p-1.5 cursor-not-allowed"
                  style={{ color: "var(--brand-hint)", opacity: 0.6 }}
                >
                  <MoreIcon className="w-5 h-5" />
                </button>
              </div>
            </TableRow>
          ))}
        </TableScroller>

        {!isLoading && visible.length === 0 && (
          <p className="px-5 py-10 text-center text-[17px]" style={{ color: "var(--brand-hint)" }}>
            {/* A filtered-to-nothing tab must say so — otherwise an organiser
                reads "Nothing in this tab" as their events being gone. */}
            {inTab.length > 0
              ? `No ${price === "free" ? "free" : "paid"} events in this tab.`
              : tab === "drafts" && !isDummyMode
                ? "The events endpoint only returns published events, so drafts cannot be listed yet — TODO.md §19."
                : "Nothing in this tab."}
          </p>
        )}

        <TableFooter note={`${visible.length} of ${rows.length} events`} />
      </Card>

      <p className="text-[17px]" style={{ color: "var(--brand-hint)", textWrap: "pretty" }}>
        Row actions (⋯) will cover duplicate, unpublish, cancel &amp; refund all, download the
        attendee list, and copy the shareable link.
      </p>
    </div>
  );
}
