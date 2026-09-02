// Organiser console — Attendees.
//
// Who is coming, what they paid, and who walked in. The action column is the
// point of the page: a refund to review, a payment to chase, a door to run.
//
// ⚠️ Check-in mode and the row actions do not post anywhere — the ticketing
// service has no check-in records and no organiser-scoped attendee endpoint
// (TODO.md §19). Every control that would write is disabled and says so, rather
// than appearing to work.
//
// ⚠️ `?event=<id>` PRESELECTS ONE EVENT, and that is how `/event/[id]`'s
// organiser card links here ("Manage attendees"). Arriving from one event and
// landing on every event's attendees means re-finding your way; the param is
// what makes that link a destination rather than a section. It is also the
// URL a filtered view can be shared or bookmarked from, so the control WRITES
// BACK to it — `router.replace`, not `push`, or the back button walks the user
// through every filter they tried instead of leaving the page.
//
// ⚠️ Export CSV is now REAL and is the one control on this page that is (it
// serialises rows already in memory and needs no endpoint). Everything else
// still waits on the backend. `lib/csv.ts` owns the escaping — read its header
// before hand-rolling a join.

"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { organizerSource } from "@/lib/data-source";
import { formatPrice } from "@/lib/currency";
import { csvFilename, downloadCsv } from "@/lib/csv";
import type { DummyAttendee } from "@/lib/fixtures/organizer";
import { useOrganiser, useOrganiserEvents } from "@/components/organizer/useOrganiser";
import {
  Card, Pill, StatTile, FilterButton, FilterSelect, ConsoleButton, EmptyState, NotBuiltYet,
  RowAction, TableScroller, TableHead, TableRow, TableFooter,
} from "@/components/organizer/ConsoleUI";
import { TicketIcon, DownloadIcon, MoreIcon } from "@/components/organizer/ConsoleIcons";

/** Widened with the type scale — see the note on the Events page's TEMPLATE. */
const TEMPLATE = "1.7fr 1.7fr 0.9fr 0.8fr 0.9fr 1.1fr 132px";

/** The "no event filter" value. Not `""` — an empty string is indistinguishable
 *  from a missing param, and `FilterSelect` compares it against `defaultValue`. */
const ALL = "all";

export default function ConsoleAttendeesPage() {
  // `useSearchParams` needs a Suspense boundary — the pattern /explore,
  // /dashboard and /chat/[roomId] already use.
  return (
    <Suspense>
      <AttendeesInner />
    </Suspense>
  );
}

function AttendeesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const picked = params.get("event") ?? ALL;

  const { organiserId } = useOrganiser();
  const { data: events = [] } = useOrganiserEvents(organiserId);

  const { data: attendees = [], isLoading } = useQuery({
    queryKey: ["organizer-attendees"],
    queryFn: () => organizerSource.attendees().then((r) => r.data),
  });

  const titleOf = useMemo(() => {
    const m = new Map(events.map((e) => [String(e.id), e.title]));
    return (id: string) => m.get(id) ?? id;
  }, [events]);

  /**
   * One option per event that actually HAS attendees, plus the current
   * selection even when it has none.
   *
   * ⚠️ That last part matters: an organiser clicking "Manage attendees" on an
   * event nobody has booked would otherwise land on a control whose trigger
   * reads "All events" while the table below shows nothing — the filter saying
   * one thing and the rows another. Keeping the option means the page can say
   * "nobody has booked *this* event" instead.
   */
  const options = useMemo(() => {
    const ids = Array.from(new Set(attendees.map((a) => a.eventId)));
    if (picked !== ALL && !ids.includes(picked)) ids.push(picked);
    return [
      { value: ALL, label: "All events" },
      ...ids.map((id) => ({ value: id, label: titleOf(id) })),
    ];
  }, [attendees, picked, titleOf]);

  const rows = useMemo(
    () => (picked === ALL ? attendees : attendees.filter((a) => a.eventId === picked)),
    [attendees, picked],
  );

  const stats = useMemo(() => {
    const confirmed = rows.filter((a) => a.status === "Confirmed").length;
    const repeat = rows.filter((a) => a.repeat).length;
    const needsAction = rows.filter((a) => a.status !== "Confirmed");
    return {
      confirmed,
      repeat,
      repeatPct: rows.length ? Math.round((repeat / rows.length) * 100) : 0,
      needsAction,
      refunds: needsAction.filter((a) => a.status === "Refund requested").length,
      unpaid: needsAction.filter((a) => a.status === "Awaiting payment").length,
    };
  }, [rows]);

  function selectEvent(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === ALL) next.delete("event");
    else next.set("event", value);
    const qs = next.toString();
    router.replace(qs ? `/organizer/attendees?${qs}` : "/organizer/attendees", { scroll: false });
  }

  function exportCsv() {
    downloadCsv(
      csvFilename("attendees", picked === ALL ? "all-events" : titleOf(picked)),
      ["Event", "Name", "Email", "Phone", "Ticket", "Paid", "Currency", "Booked", "Status", "Repeat"],
      rows.map((a) => [
        titleOf(a.eventId),
        a.name,
        a.email,
        a.phone,
        a.ticket,
        // The bare number plus a separate currency column — a formatted "₹1,400"
        // is a string a spreadsheet cannot sum, and this file exists to be summed.
        a.paid,
        a.currency,
        a.booked,
        a.status,
        a.repeat,
      ]),
    );
  }

  // ⚠️ Tested against the UNFILTERED list. A filter that matches nothing is an
  // empty result, not a missing backend, and the two must not print the same
  // page — one is fixed by clearing the filter, the other by building an
  // endpoint.
  if (!isLoading && attendees.length === 0) {
    return <NotBuiltYet what="Attendee lists" todo="TODO.md §19" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* The rows are already in memory, so this one WORKS — the rule in
              ConsoleUI's FilterSelect note. The other two still wait on a
              backend and stay inert. */}
          <FilterSelect
            label="Event"
            value={picked}
            options={options}
            onChange={selectEvent}
            defaultValue={ALL}
          />
          <FilterButton>All ticket types</FilterButton>
          <FilterButton>Any status</FilterButton>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ConsoleButton tone="accent" title="Check-in mode arrives with the ticketing backend">
            <TicketIcon className="w-5 h-5" /> Start check-in mode
          </ConsoleButton>
          <ConsoleButton
            tone="outline"
            onClick={exportCsv}
            disabled={rows.length === 0}
            title={
              rows.length === 0
                ? "Nothing to export with this filter"
                : `Download ${rows.length} row${rows.length === 1 ? "" : "s"} as a spreadsheet`
            }
          >
            <DownloadIcon className="w-5 h-5" /> Export CSV
          </ConsoleButton>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={`Nobody has booked ${titleOf(picked)} yet`}
          body="When someone buys a ticket they appear here, with what they paid and how to reach them."
        />
      ) : (
        <>
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Confirmed" value={stats.confirmed} sub={`of ${rows.length} booked`} />
            {/* Never a 0 — there are no check-in records at all, which is a different
                statement from "nobody has arrived". */}
            <StatTile label="Checked in" value="—" sub="needs the check-in backend" />
            <StatTile label="Repeat attendees" value={stats.repeat} sub={`${stats.repeatPct}% came before`} tone="good" />
            <StatTile
              label="Needs action"
              value={stats.needsAction.length}
              sub={`${stats.refunds} refund · ${stats.unpaid} unpaid`}
              tone={stats.needsAction.length > 0 ? "warn" : "good"}
            />
          </div>

          <Card padded={false}>
            <TableScroller minWidth={1000}>
              <TableHead
                template={TEMPLATE}
                columns={["Attendee", "Contact", "Ticket", "Paid", "Booked", "Status", <span key="a" className="text-right block">Actions</span>]}
              />
              {rows.map((a) => (
                <AttendeeRow key={a.id} attendee={a} />
              ))}
            </TableScroller>
            <TableFooter
              note={`${rows.length} attendee${rows.length === 1 ? "" : "s"} · ${stats.refunds} refund request${stats.refunds === 1 ? "" : "s"}`}
            />
          </Card>
        </>
      )}
    </div>
  );
}

function AttendeeRow({ attendee: a }: { attendee: DummyAttendee }) {
  const needsAction = a.status !== "Confirmed";
  const action = a.status === "Refund requested" ? "Review" : a.status === "Awaiting payment" ? "Remind" : "Check in";

  return (
    <TableRow template={TEMPLATE}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-[15px] font-bold"
          style={{ backgroundColor: "color-mix(in srgb, var(--brand-green) 14%, transparent)", color: "var(--brand-green)" }}
        >
          {a.initials}
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-[17px] font-semibold truncate" style={{ color: "var(--brand-text)" }}>{a.name}</span>
          {a.repeat && (
            <span className="text-[15px]" style={{ color: "var(--brand-green)" }}>{a.repeat}</span>
          )}
        </span>
      </div>

      <div className="min-w-0 text-[17px]" style={{ color: "var(--brand-hint)" }}>
        <div className="truncate">{a.email}</div>
        <div className="text-[15px] opacity-80">{a.phone}</div>
      </div>

      <div className="text-[17px]" style={{ color: "var(--brand-hint)" }}>{a.ticket}</div>
      {/* The attendee's own currency — the event they bought into priced it.
          Never a literal here; see the rule in lib/currency.ts. */}
      <div className="text-[17px] font-semibold" style={{ color: "var(--brand-text)" }}>
        {formatPrice(a.paid, a.currency, { freeLabel: null })}
      </div>
      <div className="text-[17px]" style={{ color: "var(--brand-hint)" }}>{a.booked}</div>
      <div>
        <Pill tone={needsAction ? "warn" : "good"}>{a.status}</Pill>
      </div>

      <div className="flex justify-end items-center gap-1.5">
        <RowAction disabled title="Attendee actions arrive with the ticketing backend">
          {action}
        </RowAction>
        <button
          type="button"
          disabled
          aria-label="More actions"
          className="p-1.5 cursor-not-allowed"
          style={{ color: "var(--brand-hint)", opacity: 0.6 }}
        >
          <MoreIcon className="w-5 h-5" />
        </button>
      </div>
    </TableRow>
  );
}
