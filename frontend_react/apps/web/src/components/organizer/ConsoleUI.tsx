// ─────────────────────────────────────────────────────────────────────────────
//  Shared primitives for the organiser console (app/organizer/(console)/*).
//
//  Six sections render the same handful of shapes — a bordered card, a stat
//  tile, a tab row, a status pill, a wide table, an empty state. They live here
//  once so the sections cannot drift apart, which is the whole point of the
//  consistency rule in CLAUDE.md. Need a variant? Add a PROP; do not fork.
//
//  Token notes, because two choices here look arbitrary and are not:
//
//  · A card is `--brand-surface` on `1px --brand-nav-border`, NOT
//    `--brand-border`. In light mode --brand-surface EQUALS --brand-bg, so the
//    border is the only thing separating a card from the page and the pale
//    token does not do that job. --brand-nav-border is the documented "stronger"
//    card token and is what the event cards already use, so the console reads
//    the same as the rest of the site. Row dividers INSIDE a card stay on
//    --brand-border — there the pale value is correct.
//
//  · The dark panels use --brand-ink, never --brand-green. --brand-green
//    resolves to a light mint in dark mode; a sidebar or hero filled with it is
//    unreadable. See the token note in globals.css.
//
//  ⚠️ TYPE SCALE — THE CONSOLE IS ON THE SITE'S SCALE, NOT AN ADMIN ONE
//  (Gautham, 2026-08-22). It shipped with every size pinned at or just under the
//  15px floor plus 11px uppercase micro-labels, which is generic dashboard
//  vocabulary and appears nowhere else in NewFind — it was the single biggest
//  reason the console read as a different product from home. The scale below is
//  the PUBLIC one (EventsCarousel's card, /event/[id]'s body), one step quieter:
//
//    section / page heading  clamp(24px,4vw,32px) extrabold, tracking -0.5px
//    card + row title        20px bold      (== an event card's title)
//    figure on a stat tile   32px extrabold (a tile's whole point)
//    body, table cells       17px           (card meta is 18px; a 7-column
//                                            table is the "quieter room")
//    controls: buttons       18px bold, tabs 20px semibold (== the home
//                            page's filter tabs, byte for byte)
//    labels, counts, subs    15px — the floor, not a hair under it
//
//  Consequence: `data-keep-type` is GONE from the console. The console was the
//  only region of the app breaking the 15px floor (24 of the app's 29 opt-outs
//  lived here). **Do not reintroduce one to squeeze a label in** — if a label
//  competes with its figure, the figure is too small, not the label too big.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { TAG_SHAPE, TAG_LABEL } from "@/components/EventBadges";
import type { EventBucket } from "@/lib/organizer-rows";
import { HERO_SCRIM } from "@/lib/event-media";
import { ChevronIcon, CaretIcon, CheckIcon } from "./ConsoleIcons";

// ── Token shorthands ─────────────────────────────────────────────────────────

export const INK = "var(--brand-ink)";
export const ON_INK = "var(--brand-on-ink)";

/**
 * The console's ONE accent — badges, the hero's figures, the primary button on
 * the ink panel, the "needs you" list, progress on ink, section counts.
 *
 * ⚠️ This was `GOLD` (`--brand-gold`, #E0B979) until 2026-08-21, when Gautham
 * moved the whole console onto terracotta so the dark panels and the light
 * ground share one accent instead of running gold-on-ink beside
 * terracotta-on-linen. The gold token is GONE from globals.css — **do not bring
 * it back, and do not reach for a second accent here.**
 *
 * Known, accepted cost: terracotta on `--brand-ink` is ~3.3:1 where gold was
 * ~7.5:1, so the small text this colours on the hero (the sold-% line, the
 * "Paid" chip, the "Needs you today" label) sits under WCAG AA. Weighed and
 * taken deliberately, the same trade FeatureBand's white-on-terracotta hover
 * already carries. It does NOT apply to the FILLS — a badge or button painted
 * terracotta uses ON_ACCENT (white) and reads fine.
 */
export const ACCENT = "var(--brand-terracotta)";
export const ON_ACCENT = "var(--brand-on-terracotta)";

/** Secondary text ON the ink panel — linen dialled back so it reads as support. */
export const ON_INK_SOFT = "color-mix(in srgb, var(--brand-on-ink) 62%, transparent)";
/**
 * Hairlines and tile fills on the ink panel.
 *
 * 32%, not the 24% this carried while the accent was gold: terracotta is a much
 * darker colour (relative luminance 0.20 against gold's 0.51), so the same
 * percentage over --brand-ink produced a hairline you could barely see. The
 * number exists to hold the line's VISIBLE weight — re-derive it, don't copy it,
 * if the accent or the panel changes.
 */
export const INK_LINE = "color-mix(in srgb, var(--brand-terracotta) 32%, transparent)";
export const INK_FILL = "color-mix(in srgb, var(--brand-on-ink) 7%, transparent)";

/** A tone drives one colour across pills, tile subtitles and bars. */
export type Tone = "neutral" | "good" | "warn";

export const toneColor = (tone: Tone) =>
  tone === "good" ? "var(--brand-green)"
  : tone === "warn" ? "var(--brand-terracotta)"
  : "var(--brand-hint)";

/** The matching 12% wash, for a pill's fill behind `toneColor`. */
export const toneFill = (tone: Tone) =>
  tone === "good" ? "color-mix(in srgb, var(--brand-green) 12%, transparent)"
  : tone === "warn" ? "color-mix(in srgb, var(--brand-terracotta) 14%, transparent)"
  : "color-mix(in srgb, var(--brand-nav-border) 35%, transparent)";

// ── Card ─────────────────────────────────────────────────────────────────────

/**
 * The event card's RESTING shadow, lifted verbatim from `EventCardItem`.
 *
 * It is what makes a card sit ON the page rather than be drawn on it, and in
 * light mode it does most of the separating work — `--brand-surface` equals
 * `--brand-bg` there, so a console card previously had nothing but a 1px
 * hairline holding it off the linen. Keep the 1px border too: the shadow alone
 * disappears on the dark ground, where the border is what shows.
 */
const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.06)";

export function Card({
  children, className = "", padded = true, style,
}: {
  children: ReactNode;
  className?: string;
  /** Off for cards that hold a full-bleed table or list. */
  padded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${padded ? "p-5 sm:p-6" : ""} ${className}`}
      style={{
        backgroundColor: "var(--brand-surface)",
        border: "1px solid var(--brand-nav-border)",
        boxShadow: CARD_SHADOW,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * The deep-green panel: dashboard hero, earnings hero.
 *
 * ⚠️ `image` PUTS THE EVENT'S OWN PHOTOGRAPH BEHIND IT (Gautham, 2026-08-22).
 * NewFind is photo-first everywhere a user looks — every card, both heroes, the
 * category tiles — and the console had not one picture in it, which is a large
 * part of why the dashboard read as somebody else's product. Passed an image,
 * the panel becomes the same object as the /event/[id] hero: photo, then
 * `HERO_SCRIM`, then the copy.
 *
 * The photo sits at 24% over `--brand-ink` (NOT at full strength under the
 * scrim alone, the way the public heroes do it). A hero carries one huge title
 * over the darkest end of the gradient; this panel carries a dozen small
 * figures across its whole height, so the ink has to stay dominant or the
 * numbers land on whatever the photograph happens to be doing there. Together
 * the photo reads clearly and `ON_INK` copy keeps a dark ground under it —
 * re-check both if you change the 24%.
 *
 * The earnings hero passes no image and stays a flat ink panel: it is about
 * money across every event, not about one event.
 */
export function InkPanel({
  children, className = "", image, imageAlt = "",
}: {
  children: ReactNode;
  className?: string;
  /** The event's `cardImageUrl` — same picture as its card. */
  image?: string;
  imageAlt?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden p-6 sm:p-7 ${className}`}
      style={{ backgroundColor: INK, color: ON_INK }}
    >
      {image && (
        <>
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
            style={{ opacity: 0.24 }}
            sizes="(max-width: 1024px) 100vw, 1100px"
          />
          <div className="absolute inset-0 pointer-events-none" style={{ background: HERO_SCRIM }} />
        </>
      )}
      {/* Above both layers. Without the stacking context the photo paints over
          the figures rather than behind them. */}
      <div className="relative">{children}</div>
    </div>
  );
}

// ── Labels and pills ─────────────────────────────────────────────────────────

/**
 * The label above a figure, and every table column head.
 *
 * ⚠️ **NOT uppercase, and not 11px** (Gautham, 2026-08-22). It was
 * `text-[11px] uppercase tracking-[0.1em]` + `data-keep-type` — the generic
 * admin-dashboard micro-label, an idiom that exists nowhere else in NewFind and
 * one of the loudest tells that the console was designed by somebody else. It is
 * now sentence case at the site's 15px floor, carrying its hierarchy the way the
 * rest of the app does: by size, weight and position, never by shouting. See the
 * `--brand-hint` note in globals.css, which is the same principle for colour.
 */
export function MicroLabel({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div className="text-[15px] font-semibold" style={{ color: color ?? "var(--brand-hint)" }}>
      {children}
    </div>
  );
}

/**
 * The fill for an EVENT-ROW pill, from the site's own tag palette.
 *
 * ⚠️ **These are `BADGE_CONFIG`'s colours, not the console's** (Gautham,
 * 2026-09-02). An events row carries the same kind of information a card's tag
 * row does — what this event is and whether you can buy a ticket — so its chips
 * are now solid palette fills with a linen label, exactly like "This Week" or
 * "Selling Fast", rather than the 12% wash + coloured label they wore before.
 * The wash read as a form-field hint beside the site's actual tags.
 *
 * Every value is TAKEN FROM the reserve list in `EventBadges.tsx` and recorded
 * there — a console pill never invents a hue. Two are reuses rather than
 * assignments: `free` is `BADGE_CONFIG['free']`'s own Plum, so a free event's
 * chip is the same colour its attendees see on the card, and `drafts` is the
 * 'sold-out' neutral, which already means "not on sale" everywhere else.
 *
 * ⚠️ **CONTRAST: the same accepted shortfall `BADGE_CONFIG` documents.** Linen
 * on these mid-tone fills lands in the 3.2–4.5 band, so most sit under WCAG AA.
 * That is the preview palette's known cost, taken deliberately there and taken
 * here for the same reason — do NOT fix it in the console alone, or the two
 * families diverge again. The accessible version is a black label, on both.
 *
 * No glyph, and that is deliberate: "On sale", "Scheduled" and "Completed" have
 * no one drawing in `EventIcons`, and inventing three would breach the
 * one-icon-per-concept rule. The colour and the shape carry it.
 */
const PILL_FILL: Record<PillType, { bg: string; text: string }> = {
  live: { bg: "#7E8B3A", text: TAG_LABEL },      // Olive
  upcoming: { bg: "#3E6FA0", text: TAG_LABEL },  // Denim
  drafts: { bg: "#4B5158", text: "#E5E7EB" },    // the 'sold-out' neutral
  past: { bg: "#5F7080", text: TAG_LABEL },      // Slate
  free: { bg: "#A05FA0", text: TAG_LABEL },      // Plum — BADGE_CONFIG's own Free
  paid: { bg: "#A8543A", text: TAG_LABEL },      // Rust
};

/**
 * What an event-row pill is describing. The four buckets are `EventBucket`
 * itself, so a row passes `r.bucket` straight through and the map is exhaustive
 * by construction — a new bucket cannot ship without a colour.
 */
export type PillType = EventBucket | "free" | "paid";

/**
 * A status chip — "On sale", "Draft", "₹1,400", "Refund requested".
 *
 * ⚠️ **This is an `EventBadge`** (Gautham, 2026-08-22 for the shape, 2026-09-02
 * for the fill): `TAG_SHAPE` + `gap-1.5 font-bold leading-5 px-2.5 py-1.5
 * text-[16px]`, which is exactly what `EventBadge` renders, and — given `type` —
 * a solid palette fill with a linen label too. An "On sale" chip in the console
 * and a "This Week" tag on an event card are the same object.
 *
 * Those utilities are RESTATED rather than imported because `TAG` is private to
 * EventBadges — only the silhouette is exported, on purpose (FeatureBand's
 * audience badge carries the same note). **So if `EventBadge`'s padding or size
 * changes, change this to match.**
 *
 * TWO FILLS, and the split is not arbitrary:
 *   · `type` — an EVENT row on the dashboard and /organizer/events. A fixed set
 *     of states, so it draws a fixed palette colour, like a status tag does.
 *   · `tone` — everything else, currently the Attendees table, whose states are
 *     good/warn judgements rather than a closed list. Keeps the 12% wash.
 * Passing `type` wins. **Do not add a third fill; extend `PILL_FILL`.**
 */
export function Pill({
  children, type, tone = "neutral",
}: {
  children: ReactNode;
  /** An event row's state. Overrides `tone` and paints a solid palette fill. */
  type?: PillType;
  tone?: Tone;
}) {
  const fill = type ? PILL_FILL[type] : null;
  return (
    <span
      className={`${TAG_SHAPE} gap-1.5 font-bold leading-5 px-2.5 py-1.5 text-[16px]`}
      style={
        fill
          ? { color: fill.text, backgroundColor: fill.bg }
          : { color: toneColor(tone), backgroundColor: toneFill(tone) }
      }
    >
      {children}
    </span>
  );
}

/**
 * A count that rides inside a tab or a nav item.
 *
 * ⚠️ **Bare type — a count carries NO chip anywhere in the console** (Gautham,
 * 2026-08-21). It was a filled pill (green when the tab was on, a pale
 * `--brand-nav-border` wash when off); both were removed with the rail's, so a
 * count reads the same wherever it appears. **Do not give it a fill again.**
 *
 * Colour follows the console-wide rule documented on `ConsoleSidebar`'s
 * `Badge`: terracotta by default, linen only on a SOLID green fill.
 *
 * ⚠️ `active` IS NOW LIVE. `Tabs` below used to be a 12% green tint, where
 * terracotta was the readable choice; it is now a SOLID green fill (the home
 * page's own filter tab), so an active tab's count takes linen or it drops to
 * ~2.4:1 and vanishes. That is exactly the caller this prop was left here for.
 *
 * ⚠️ CLASSES, NOT AN INLINE `style` — and the inactive count carries
 * `group-hover:`. An unpicked tab now fills green under the pointer (see `Tabs`),
 * which puts terracotta on solid green at that ~2.4:1 for as long as the pointer
 * rests there; the count has to follow its tab to linen. The parent button
 * supplies the `group`. Same trap the whole console was swept for: an inline
 * colour BEATS a hover rule, so this could not have been done inline.
 */
export function CountBadge({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`text-[15px] font-bold shrink-0 transition-colors ${
        active
          ? "text-[var(--brand-on-green)]"
          : "text-[var(--brand-terracotta)] group-hover:text-[var(--brand-on-green)]"
      }`}
    >
      {children}
    </span>
  );
}

// ── Stat tiles ───────────────────────────────────────────────────────────────

/**
 * The figure is `text-[32px] font-extrabold tracking-[-0.5px]` — the weight and
 * the letter-spacing of the site's section headings (`EventsCarousel`'s "Events
 * in {city}"), because on this page the figure IS the heading. It was 26px
 * semibold-ish `font-bold`, close enough to the label above it that the tile had
 * no focal point.
 */
export function StatTile({
  label, value, sub, tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
}) {
  return (
    <Card>
      <MicroLabel>{label}</MicroLabel>
      <div
        className="text-[32px] font-extrabold leading-none mt-2.5 tracking-[-0.5px]"
        style={{ color: "var(--brand-text)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[15px] mt-2.5" style={{ color: toneColor(tone) }}>
          {sub}
        </div>
      )}
    </Card>
  );
}

/** The same tile, on the ink panel — one step down, since four sit in a row. */
export function InkStatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl p-3.5" style={{ backgroundColor: INK_FILL, border: `1px solid ${INK_LINE}` }}>
      <MicroLabel color={ON_INK_SOFT}>{label}</MicroLabel>
      <div className="text-[26px] font-extrabold leading-tight mt-1.5 tracking-[-0.5px]" style={{ color: ON_INK }}>
        {value}
      </div>
      {sub && <div className="text-[15px] mt-1" style={{ color: ON_INK_SOFT }}>{sub}</div>}
    </div>
  );
}

// ── Event thumbnail ──────────────────────────────────────────────────────────

/**
 * An event's picture at row scale.
 *
 * ⚠️ The same photograph its card shows on home and /explore — the URL comes
 * from `cardImageUrl` via `ConsoleRow.image`, never from a second rule here. An
 * organiser scanning their events table sees the pictures they already know
 * their events by, which is what a list of events looks like everywhere else on
 * the site.
 *
 * `rounded-lg`, not the card's `rounded-2xl`: at 56px a 16px radius eats the
 * corners of the image. Same reason the shape rule gives small controls a
 * smaller radius.
 */
export function EventThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <span
      className="relative block w-14 h-14 rounded-lg overflow-hidden shrink-0"
      style={{ backgroundColor: "color-mix(in srgb, var(--brand-nav-border) 35%, transparent)" }}
    >
      {/* Decorative: the title sits beside it, so a screen reader announcing the
          event twice would be noise. Hence alt="" at every call site. */}
      <Image src={src} alt={alt} fill className="object-cover" sizes="56px" />
    </span>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

/**
 * The section's filter tabs.
 *
 * ⚠️ **THIS IS THE HOME PAGE'S FILTER TAB** (Gautham, 2026-08-22) — the row
 * above the event grid in `EventsCarousel`, down to the `rounded-xl`, the 20px
 * semibold label, the `2px` border on both states and the SOLID green fill when
 * picked. The console had its own dialect: `rounded-lg`, 15px, and a 12% green
 * tint with a green label. Neither the shape nor the selected-state fill existed
 * anywhere else in the app, and this is the control an organiser touches most,
 * so it is the one most worth having be literally the same object.
 *
 * Three things ride on that fill being SOLID:
 *   · it is the app-wide active/hover signal — green ground, linen copy;
 *   · `CountBadge` must therefore be told `active` (terracotta on solid green is
 *     ~2.4:1); and
 *   · `--brand-control-border` on the inactive state is load-bearing in light
 *     mode, where `--brand-surface` equals `--brand-bg` and a transparent border
 *     leaves the tab with no edge at all.
 *
 * `rounded-xl` on a small control is the standing exception `EventsCarousel`'s
 * rows already carry (Gautham, 2026-08-21): those tabs match the card's "View
 * details" CTA rather than the shape rule's `rounded-lg`. **These three now move
 * together — do not "correct" any of them to `rounded-lg`.**
 *
 * ⚠️ IT MOVES LIKE `RowAction`, AND IT HOVERS LIKE ONE (Gautham, 2026-09-02).
 * Two changes, one point — a tab and the "See all events" control sit inches
 * apart in the dashboard's events header and behaved like different products:
 *
 *   · **No `.nf-chip`.** That class popped the tab to 1.09 on selection and
 *     squished it to 0.95 while held. Nothing else in this row moves, and
 *     `EventsCarousel`'s tabs — the control this one IS — have never had the pop
 *     either, so dropping it puts all three back in step. `transition-colors` is
 *     `RowAction`'s exact motion. **Do not put the chip class back**; it belongs
 *     to /explore's filter chips, which are a different, smaller control.
 *   · **An unpicked tab fills green under the pointer** — the app-wide rule
 *     (green ground, linen label, green border), which is what `RowAction` does
 *     and what this control did not do at all.
 *
 * ⚠️ Consequently EVERY COLOUR HERE IS A CLASS. It was an inline `style`, and an
 * inline colour beats a `hover:` rule — the trap `BUTTON_TONE`, `FilterSelect`'s
 * menu and FeatureBand's audience badge all carry. The button is also a `group`,
 * because `CountBadge` has to follow its tab to linen on hover.
 *
 * `sm` is the same control one step down, for a tab row inside a card (rooms).
 */
export function Tabs({
  items, active, onSelect, size = "md",
}: {
  items: TabItem[];
  active: string;
  onSelect: (key: string) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {items.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            aria-pressed={on}
            /* 2px on BOTH states so the control cannot resize when picked. */
            className={`group inline-flex items-center gap-2 rounded-xl font-semibold border-2 transition-colors ${
              size === "sm" ? "px-3.5 py-1.5 text-[18px]" : "px-4 py-1.5 text-[20px]"
            } ${
              on
                ? "bg-[var(--brand-green)] text-[var(--brand-on-green)] border-[var(--brand-green)]"
                : "bg-transparent text-[var(--brand-text)] border-[var(--brand-control-border)] hover:bg-[var(--brand-green)] hover:text-[var(--brand-on-green)] hover:border-[var(--brand-green)]"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && <CountBadge active={on}>{t.count}</CountBadge>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * An INERT filter control — the placeholder shape.
 *
 * Use this only where the section genuinely has nothing to filter against
 * (Attendees and Earnings draw from fixtures with no query behind them,
 * TODO.md §19). A dropdown that changes nothing is worse than one that visibly
 * isn't wired yet, so it is a <button> with `disabled` rather than a <span> —
 * still announced as a control, obviously not usable.
 *
 * ⚠️ **Where the rows are already in memory, use `FilterSelect` below instead.**
 * Events filters and sorts client-side and does not wait on the backend; that
 * page is the reference. Do not leave a disabled control on a section that
 * could honestly do the work.
 */
export function FilterButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      title="Filtering arrives with the organiser backend"
      className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[18px] font-semibold cursor-not-allowed"
      style={{
        border: "2px solid var(--brand-control-border)",
        backgroundColor: "var(--brand-surface)",
        color: "var(--brand-hint)",
        opacity: 0.7,
      }}
    >
      {children}
      <CaretIcon className="w-4 h-4 shrink-0" />
    </button>
  );
}

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

/**
 * The WORKING filter dropdown — same silhouette as `FilterButton`, but it opens
 * and it selects. The trigger always shows the current choice, so the row of
 * controls reads as the state of the table rather than as a set of labels.
 *
 * Notes that are choices, not accidents:
 *
 * · `rounded-xl` and a 2px `--brand-control-border` on BOTH states — a control
 *   that changes width when you click it is the exact bug the border rule exists
 *   to prevent. The radius is `rounded-xl` rather than the shape rule's small-
 *   control `rounded-lg` because CLAUDE.md files a SORT control under standard
 *   buttons, and because it sits inches from `Tabs`, which is the home page's
 *   `rounded-xl` filter tab. Two silhouettes in one toolbar is the drift this
 *   whole pass removed.
 *
 * · When the selection is anything other than `defaultValue` the border and
 *   label go green — the same "this is on" signal `Tabs` uses. It stays a TINT
 *   here rather than the solid fill a picked tab takes: a tab says which slice
 *   of the table you are looking at, a filter says a filter is applied, and the
 *   softer state keeps the row of controls from reading as two active tabs.
 *
 * · Menu-item colour is CLASSES, not an inline `style`. An inline colour beats
 *   the `hover:` rule, which is what the app-wide green-fill/linen-text hover
 *   depends on — the same trap written up on FeatureBand's audience badge.
 *
 * · Closes on outside `pointerdown` and on Escape, and the trigger keeps focus
 *   so Escape lands somewhere sensible. No portal: unlike `ShareModal` this sits
 *   in ordinary page flow with no transformed ancestor to trap it.
 */
export function FilterSelect<T extends string>({
  label, value, options, onChange, defaultValue,
}: {
  /** What the control filters — announced to screen readers, never drawn. */
  label: string;
  value: T;
  options: readonly FilterOption<T>[];
  onChange: (value: T) => void;
  /** The "no filter applied" value. Defaults to the first option. */
  defaultValue?: T;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value) ?? options[0];
  const applied = value !== (defaultValue ?? options[0]?.value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="nf-chip inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[18px] font-semibold"
        style={{
          border: `2px solid ${applied ? "var(--brand-green)" : "var(--brand-control-border)"}`,
          backgroundColor: applied
            ? "color-mix(in srgb, var(--brand-green) 12%, transparent)"
            : "var(--brand-surface)",
          color: applied ? "var(--brand-green)" : "var(--brand-hint)",
        }}
      >
        {current?.label}
        {/* Wrapped, not styled directly: IconProps takes className and colour only. */}
        <span className={`inline-flex transition-transform ${open ? "rotate-180" : ""}`}>
          <CaretIcon className="w-4 h-4 shrink-0" />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute top-full right-0 mt-1.5 py-1.5 rounded-xl shadow-xl min-w-full whitespace-nowrap z-40"
          style={{ backgroundColor: "var(--brand-surface)", border: "1px solid var(--brand-nav-border)" }}
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left flex items-center justify-between gap-4 px-4 py-2.5 text-[17px] font-semibold transition-colors hover:bg-[var(--brand-green)] hover:text-[var(--brand-on-green)] ${
                  on ? "text-[var(--brand-green)]" : "text-[var(--brand-text)]"
                }`}
              >
                {o.label}
                {/* Holds its space when unselected so the labels cannot shift. */}
                <CheckIcon className={`w-4 h-4 shrink-0 ${on ? "" : "invisible"}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────

/** `accent` is the primary on the INK panel; `green` is the primary on the page. */
type ButtonTone = "accent" | "green" | "outline" | "onInk";

/**
 * 18px bold, taken from the event card's "View details" CTA (`EventsCarousel`).
 * It was 15px — the same shape as the public CTA at two thirds the size, which
 * is the kind of near-miss that reads as a different design rather than as a
 * deliberate variation. 18px rather than the card's 20px is the console's one
 * concession to density: these sit in toolbars of three.
 *
 * ⚠️ `transition-colors` AND NO PRESS SCALE (Gautham, 2026-09-01). This carried
 * `transition-all duration-150 active:scale-[0.98]`, lifted from the card CTA,
 * and it was the one thing making the console's buttons move differently from
 * everything else a user touches. **The reference is the /event/[id] button** —
 * `DetailCTA` and `DetailStickyBar` in `DetailCard.tsx`, and every organiser
 * modal's pair — all of which cross-fade their colours and do nothing else. This
 * component renders on that page too (the section edit control in
 * `EventSections`), inches from a `DetailCTA`, so the two could not be allowed to
 * press differently. **Do not put the squish back.** The `active:scale` that
 * remains in the app is on controls of a different kind: the round icon buttons
 * (`EventActions`, at 0.90) and the filter chips (`.nf-chip`, at 0.95, shared
 * with /explore) — a labelled button is not one of those.
 *
 * ⚠️ NO WEIGHT HERE. Each tone supplies its own (`font-bold` / `font-semibold`),
 * because two conflicting weight utilities in one class string do NOT resolve by
 * string order in Tailwind v4 — the stylesheet's order decides. Same rule the
 * `CategoryBadge` sizes follow: never declare a utility twice.
 */
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[18px] whitespace-nowrap transition-colors";

/**
 * ⚠️ TONES ARE CLASSES, NOT AN INLINE `style` — every colour, fill and border.
 * An inline colour BEATS a `hover:` rule, so the previous inline version could
 * not have had a hover state even if one had been written: that is why every
 * button in the console was inert to the pointer while the rest of the app
 * turned green under it. Same trap as `FilterSelect`'s menu items and
 * FeatureBand's audience badge.
 *
 * Hover per tone:
 *   green / accent — darken via the token's own `-hover` value, as the public
 *                    CTAs do.
 *   outline        — the app-wide rule: green ground, linen label, green border.
 *   onInk          — a 10% white lift. It sits ON the green-black panel, where a
 *                    green fill would say nothing; the same reasoning
 *                    `OrganiserViewToggle` records for its terracotta segment.
 */
const BUTTON_TONE: Record<ButtonTone, string> = {
  green: "font-bold bg-[var(--brand-green)] text-[var(--brand-on-green)]",
  accent: "font-bold bg-[var(--brand-terracotta)] text-[var(--brand-on-terracotta)]",
  outline:
    "font-semibold bg-[var(--brand-surface)] text-[var(--brand-text)] border-2 border-[var(--brand-control-border)]",
  onInk: "font-semibold bg-transparent text-[var(--brand-on-ink)] border",
};

/**
 * The hover half, kept SEPARATE so a disabled button can drop it.
 *
 * ⚠️ This is not tidiness. `:hover` still matches a disabled `<button>` in every
 * major browser, so a single combined string would light a dead control green
 * under the pointer — advertising an action that cannot be taken, which is worse
 * than no feedback. `RowAction` below solves the same problem the same way:
 * hold the silhouette, swap only the colours. **Keep the two maps in step —
 * every key in `BUTTON_TONE` needs one here, even if it is empty.**
 */
const BUTTON_HOVER: Record<ButtonTone, string> = {
  green: "hover:bg-[var(--brand-green-hover)]",
  accent: "hover:bg-[var(--brand-terracotta-hover)]",
  outline:
    "hover:bg-[var(--brand-green)] hover:text-[var(--brand-on-green)] hover:border-[var(--brand-green)]",
  onInk: "hover:bg-white/10",
};

export function ConsoleButton({
  children, tone = "green", onClick, title, disabled = false, type = "button", className = "",
}: {
  children: ReactNode;
  tone?: ButtonTone;
  onClick?: () => void;
  /** The tooltip. On a disabled button this is the ONLY explanation a user
   *  gets, so it must say why — never leave it off one. */
  title?: string;
  /**
   * ⚠️ A disabled button here means "this cannot work yet", not "not now" — the
   * same meaning `RowAction` and the check-in control already carry. It keeps
   * its silhouette and drops `BUTTON_HOVER`; **do not add `pointer-events-none`**,
   * which would suppress the `title` tooltip that is the user's only explanation.
   */
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  // The one value that cannot be a class: INK_LINE is a `color-mix()` string.
  // Safe to leave inline — nothing hovers it.
  const style: CSSProperties | undefined =
    tone === "onInk" ? { borderColor: INK_LINE } : undefined;

  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`${BUTTON_BASE} ${BUTTON_TONE[tone]} ${
        disabled ? "opacity-60 cursor-not-allowed" : BUTTON_HOVER[tone]
      } ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

/**
 * The small outline control at the end of a table row — "Open", "Manage",
 * "Review".
 *
 * ⚠️ **Use this; do not hand-roll another.** Three separate copies of the same
 * bordered green link existed across the dashboard, Events and Attendees, none
 * of which had a hover state — so the console's rows were the one place in the
 * app where pointing at a control did nothing at all. This carries the app-wide
 * rule (green fill, linen label) and one definition of the shape.
 *
 * Renders a `<button disabled>` rather than a link when there is nowhere to go
 * yet, for the reason `FilterButton` documents: still announced as a control,
 * obviously not usable.
 */
export function RowAction({
  children, href, disabled = false, title,
}: {
  children: ReactNode;
  href?: string;
  disabled?: boolean;
  title?: string;
}) {
  // Colours are classes for the reason BUTTON_TONE records: an inline colour
  // beats `hover:`, which is what left every row control in the console inert.
  const shape =
    "inline-flex items-center rounded-lg px-3.5 py-1.5 text-[17px] font-semibold transition-colors border-2 border-[var(--brand-control-border)]";

  if (disabled || !href) {
    return (
      <button
        type="button"
        disabled
        title={title}
        className={`${shape} cursor-not-allowed text-[var(--brand-hint)] opacity-75`}
      >
        {children}
      </button>
    );
  }

  return (
    <Link
      href={href}
      title={title}
      className={`${shape} text-[var(--brand-green)] hover:bg-[var(--brand-green)] hover:text-[var(--brand-on-green)] hover:border-[var(--brand-green)]`}
    >
      {children}
    </Link>
  );
}

// ── Table shell ──────────────────────────────────────────────────────────────
//
// Wide tables keep their width and scroll inside the card — the standing rule in
// CLAUDE.md. Seven columns have no honest narrow layout, and crushing them is
// worse than a horizontal scroll the user controls.

export function TableScroller({ minWidth, children }: { minWidth: number; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}

export function TableHead({ columns, template }: { columns: ReactNode[]; template: string }) {
  return (
    <div
      className="grid gap-3.5 px-5 py-3.5"
      style={{ gridTemplateColumns: template, borderBottom: "1px solid var(--brand-border)" }}
    >
      {columns.map((c, i) => (
        <MicroLabel key={i}>{c}</MicroLabel>
      ))}
    </div>
  );
}

/**
 * ⚠️ A ROW HOVERS. `nf-console-row` (globals.css) washes it with 8% green on
 * pointer-over — the same tint the rooms list uses for its picked room, which is
 * the console's established quiet form of the app-wide "green ground" rule.
 *
 * A full green fill is what a card or a menu item takes, and it is wrong here:
 * a row carries coloured status pills and a progress bar, which a solid fill
 * would swallow. The tint is the concession; having NO hover at all — which is
 * what the console shipped with, on lists whose whole purpose is to be scanned
 * and clicked — was the thing worth fixing.
 */
export function TableRow({ template, children }: { template: string; children: ReactNode }) {
  return (
    <div
      className="nf-console-row grid gap-3.5 px-5 py-4 items-center"
      style={{ gridTemplateColumns: template, borderBottom: "1px solid var(--brand-border)" }}
    >
      {children}
    </div>
  );
}

/** The footer strip under a table: a count on the left, paging on the right. */
export function TableFooter({ children, note }: { children?: ReactNode; note: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 flex-wrap">
      <span className="text-[15px]" style={{ color: "var(--brand-hint)" }}>{note}</span>
      <div className="flex items-center gap-3">
        {children}
        <div className="flex gap-1.5">
          <PagerButton dir="left" />
          <PagerButton dir="right" />
        </div>
      </div>
    </div>
  );
}

/** Paging is inert until a paged endpoint exists — disabled, not fake. */
function PagerButton({ dir }: { dir: "left" | "right" }) {
  return (
    <button
      type="button"
      disabled
      aria-label={dir === "left" ? "Previous page" : "Next page"}
      className="inline-flex items-center justify-center rounded-lg w-9 h-9 cursor-not-allowed"
      style={{ border: "2px solid var(--brand-control-border)", color: "var(--brand-hint)", opacity: 0.7 }}
    >
      <ChevronIcon dir={dir} className="w-4 h-4" />
    </button>
  );
}

/** A thin progress bar — tickets sold, capacity. */
export function ProgressBar({ pct, muted = false, onInk = false }: { pct: number; muted?: boolean; onInk?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <span
      className="block rounded-full overflow-hidden"
      style={{
        height: onInk ? 8 : 6,
        backgroundColor: onInk ? INK_FILL : "color-mix(in srgb, var(--brand-nav-border) 45%, transparent)",
      }}
    >
      <span
        className="block h-full rounded-full"
        style={{
          width: `${clamped}%`,
          backgroundColor: onInk ? ACCENT : muted ? "var(--brand-muted)" : "var(--brand-green)",
        }}
      />
    </span>
  );
}

// ── Empty / not-built states ─────────────────────────────────────────────────

/**
 * What a section renders in REAL data mode, where its endpoint does not exist.
 *
 * ⚠️ This must never be softened into something that looks like real-but-empty
 * data. An organiser seeing a zeroed revenue table would read it as "I earned
 * nothing", not as "this is not built". It says which mode shows the design and
 * points at the TODO entry the work is tracked under.
 */
export function NotBuiltYet({ what, todo }: { what: string; todo: string }) {
  return (
    <Card className="text-center" >
      <div className="py-12 px-4 flex flex-col items-center gap-3">
        <p className="text-[20px] font-bold" style={{ color: "var(--brand-text)" }}>
          {what} needs the organiser backend
        </p>
        <p className="text-[17px] max-w-[520px]" style={{ color: "var(--brand-hint)" }}>
          There is no endpoint serving this yet, so nothing is shown rather than a
          figure that would not be true. Set{" "}
          <code
            className="rounded px-1.5 py-0.5"
            style={{ backgroundColor: "color-mix(in srgb, var(--brand-nav-border) 35%, transparent)" }}
          >
            NEXT_PUBLIC_DATA_MODE=dummy
          </code>{" "}
          in <code>apps/web/.env.local</code> to see the full design against sample data.
        </p>
        <p className="text-[15px]" style={{ color: "var(--brand-hint)", opacity: 0.8 }}>
          Tracked as {todo}
        </p>
      </div>
    </Card>
  );
}

/** A section that has a working query but genuinely no rows. */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card>
      <div className="py-12 px-4 flex flex-col items-center gap-3 text-center">
        <p className="text-[20px] font-bold" style={{ color: "var(--brand-text)" }}>{title}</p>
        <p className="text-[17px] max-w-[460px]" style={{ color: "var(--brand-hint)" }}>{body}</p>
        {action}
      </div>
    </Card>
  );
}
