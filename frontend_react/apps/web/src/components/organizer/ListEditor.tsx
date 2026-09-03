"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  The repeating-row editor behind every organiser-authored list — the agenda,
//  the announcements and the FAQ — plus the SPEC that says what a row of each
//  one is made of.
//
//  ⚠️ IT IS THE BODY, NOT THE DIALOG. `EditListModal` wraps it in `ModalShell`
//  and owns the save; `/organizer/create` drops the same editor straight into a
//  form `Section` and folds its rows into the create payload. That split is the
//  whole point: the two surfaces must add, remove, reorder and validate a row
//  identically, and a second copy of this markup is exactly the drift
//  CLAUDE.md's consistency section exists to stop. **Need a fourth list? Add a
//  `SPEC` entry. Need a new field type? Add it to `FieldSpec`. Do not fork.**
//
//  ⚠️ NONE OF THESE LISTS HAS A BACKEND COLUMN (`lib/event-extras.ts`,
//  TODO.md §19.12), so every call site passes `disabled` off `EXTRAS_ARE_LOCAL`
//  and the editor renders read-only with the reason on screen. **Do not add a
//  call site that skips that check** — an organiser typing an agenda that the
//  server silently drops is the exact failure the gate exists to prevent.
//
//  The state lives at the CALL SITE (`rows` / `onChange`), because the two
//  surfaces commit at different moments: the dialog saves one list on its own
//  Save, the create form carries two lists into a single POST.
// ─────────────────────────────────────────────────────────────────────────────

import type { AgendaItem, Announcement, Event, FaqItem } from "@eventmind/types";
import { agendaOf, announcementsOf, extraId, faqOf, type EventExtras } from "@/lib/event-extras";
import { FormField, inputCls } from "@/components/FormControls";
import { ChevronIcon } from "@/components/organizer/ConsoleIcons";

export type ListKind = "agenda" | "announcements" | "faq";

interface FieldSpec {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  /** Blank on save = a field error. An all-blank ROW is dropped instead. */
  required?: boolean;
  max: number;
}

export const SPEC: Record<
  ListKind,
  {
    title: string;
    addLabel: string;
    /** Singular. Used in the row heading and the empty state. */
    noun: string;
    /** False where the rendered order is derived rather than chosen. */
    reorderable: boolean;
    intro: string;
    fields: FieldSpec[];
  }
> = {
  agenda: {
    title: "Agenda of the programme",
    addLabel: "Add an item",
    noun: "Item",
    // The rendered order IS this array's order — `AgendaSection` does not sort,
    // because `time` is free text and cannot be compared.
    reorderable: true,
    intro:
      "The running order, as attendees will read it. “When” is free text, so “10:00 AM”, “Day 2 · morning” and “After the break” all work.",
    fields: [
      { key: "time", label: "When", placeholder: "10:00 AM", required: true, max: 40 },
      { key: "title", label: "What", placeholder: "Doors open and welcome", required: true, max: 120 },
      { key: "detail", label: "Details (optional)", multiline: true, max: 500 },
    ],
  },
  announcements: {
    title: "Announcements",
    addLabel: "Post an announcement",
    noun: "Announcement",
    // Rendered newest-first off `posted_at`, so a hand-picked order would be
    // silently discarded the moment the page re-read it.
    reorderable: false,
    intro:
      "Everyone who opens the event page reads these, newest first. Nobody is emailed or notified — posting here does not reach anyone who does not come back to the page.",
    fields: [
      { key: "title", label: "Headline (optional)", placeholder: "Venue has changed", max: 120 },
      {
        key: "body",
        label: "Announcement",
        placeholder: "What has changed, and what should people do about it?",
        multiline: true,
        required: true,
        max: 1000,
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    addLabel: "Add a question",
    noun: "Question",
    reorderable: true,
    intro: "The questions you keep being asked. Put the most common ones first.",
    fields: [
      { key: "question", label: "Question", placeholder: "Is there parking?", required: true, max: 200 },
      {
        key: "answer",
        label: "Answer",
        placeholder: "Street parking is free after 6pm; the multi-storey next door is ₹40/hour.",
        multiline: true,
        required: true,
        max: 1000,
      },
    ],
  },
};

/**
 * The editor's own row shape — every field a string, whatever the stored type.
 *
 * `posted_at` rides along untouched for an announcement so that **editing a typo
 * is not a repost**: the original timestamp is what an attendee dated the notice
 * by, and re-stamping it would shuffle the feed and imply news that is not new.
 */
export interface Row {
  id: string;
  values: Record<string, string>;
  posted_at?: string;
}

const s = (v: unknown): string => (typeof v === "string" ? v : "");

/** An event's stored list → editor rows. */
export function toRows(kind: ListKind, event: Event): Row[] {
  if (kind === "agenda") {
    return agendaOf(event).map((a) => ({
      id: a.id,
      values: { time: s(a.time), title: s(a.title), detail: s(a.detail) },
    }));
  }
  if (kind === "faq") {
    return faqOf(event).map((f) => ({
      id: f.id,
      values: { question: s(f.question), answer: s(f.answer) },
    }));
  }
  return announcementsOf(event).map((a) => ({
    id: a.id,
    values: { title: s(a.title), body: s(a.body) },
    posted_at: a.posted_at,
  }));
}

/**
 * A fresh empty row.
 *
 * ⚠️ Call from an EVENT HANDLER, never a component body — `extraId()` is impure
 * and `react-hooks/purity` flags it in render.
 */
export function blankRow(kind: ListKind): Row {
  const values: Record<string, string> = {};
  for (const f of SPEC[kind].fields) values[f.key] = "";
  return { id: extraId(), values };
}

/**
 * Drop the rows an organiser added and then left completely blank.
 *
 * An empty row is an accident, not data — dropping it silently beats blocking a
 * save on a field nobody meant to fill.
 */
export function dropBlankRows(kind: ListKind, rows: Row[]): Row[] {
  return rows.filter((r) => SPEC[kind].fields.some((f) => r.values[f.key]?.trim()));
}

/**
 * Required-field errors, keyed `${row.id}:${field.key}`.
 *
 * Row ids are uuids, so two lists edited on one page can share a single error
 * map without colliding — which is what `/organizer/create` does.
 */
export function rowErrors(kind: ListKind, rows: Row[]): Record<string, string> {
  const found: Record<string, string> = {};
  for (const r of rows) {
    for (const f of SPEC[kind].fields) {
      if (f.required && !r.values[f.key]?.trim()) {
        found[`${r.id}:${f.key}`] = `${f.label} is required.`;
      }
    }
  }
  return found;
}

/**
 * Rows → the patch for `eventsSource.update` / the extras on a create payload.
 *
 * ⚠️ Returns the whole `{ key: rows }` object rather than a bare array, and that
 * is not ceremony: a computed key (`{ [kind]: rows }`) widens to an index
 * signature that no longer satisfies `EventExtras`, so TypeScript stops
 * checking the one thing worth checking here — that an agenda cannot be written
 * into the FAQ field.
 */
export function toPatch(kind: ListKind, rows: Row[], now: string): EventExtras {
  if (kind === "agenda") {
    return { agenda: rows.map<AgendaItem>((r) => ({
      id: r.id,
      time: r.values.time.trim(),
      title: r.values.title.trim(),
      // Omit rather than store "" — `AgendaSection` tests for truthiness, and an
      // empty string would render an empty paragraph with its own margin.
      detail: r.values.detail?.trim() || undefined,
    })) };
  }
  if (kind === "faq") {
    return { faq: rows.map<FaqItem>((r) => ({
      id: r.id,
      question: r.values.question.trim(),
      answer: r.values.answer.trim(),
    })) };
  }
  return { announcements: rows.map<Announcement>((r) => ({
    id: r.id,
    title: r.values.title?.trim() || undefined,
    body: r.values.body.trim(),
    // Only a row that has never been posted gets today's date. See `Row`.
    posted_at: r.posted_at ?? now,
  })) };
}

export function ListEditor({
  kind,
  rows,
  onChange,
  errors,
  disabled,
  disabledNote,
  showAdd = true,
}: {
  kind: ListKind;
  rows: Row[];
  onChange: (next: Row[]) => void;
  /** Keyed `${row.id}:${field.key}` — see `rowErrors`. */
  errors?: Record<string, string>;
  /** True when a save could not survive. Renders the editor read-only. */
  disabled?: boolean;
  /** Why it is disabled. Shown in place of the intro; required when disabled. */
  disabledNote?: string;
  /**
   * The dashed "add another row" button at the foot.
   *
   * ⚠️ `/organizer/create` NEEDS IT — that form starts at zero rows, so without
   * it the agenda and FAQ sections cannot be filled in at all. `EditListModal`
   * turns it off (Gautham, 2026-09-02): the dialog is opened by a control that
   * already said "Post an announcement", and a second button repeating those
   * words inside it is the same question asked twice. **A new call site keeps
   * the default unless it seeds its own row the way the dialog does.**
   */
  showAdd?: boolean;
}) {
  const spec = SPEC[kind];

  function setValue(rowId: string, key: string, value: string, max: number) {
    onChange(
      rows.map((r) =>
        r.id === rowId ? { ...r, values: { ...r.values, [key]: value.slice(0, max) } } : r,
      ),
    );
  }

  function move(index: number, delta: number) {
    const to = index + delta;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-[var(--brand-hint)]">
        {disabled && disabledNote ? disabledNote : spec.intro}
      </p>

      {/* "below" names the add button, so the line goes when the button does —
          otherwise it points at nothing. Without the button an empty editor is
          the organiser having removed every row, and Save is what commits it. */}
      {rows.length === 0 && !disabled && showAdd && (
        <p className="text-[16px] text-[var(--brand-hint)]">
          Nothing here yet. Add the first one below.
        </p>
      )}

      {rows.map((row, i) => (
        <div
          key={row.id}
          className="rounded-2xl px-4 py-4 space-y-4"
          style={{ border: "1px solid var(--brand-border)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-bold text-[var(--brand-text)]">
              {spec.noun} {i + 1}
            </span>
            <div className="flex items-center gap-1">
              {spec.reorderable && (
                <>
                  <IconStep
                    dir="up"
                    label={`Move ${spec.noun.toLowerCase()} ${i + 1} up`}
                    disabled={disabled || i === 0}
                    onClick={() => move(i, -1)}
                  />
                  <IconStep
                    dir="down"
                    label={`Move ${spec.noun.toLowerCase()} ${i + 1} down`}
                    disabled={disabled || i === rows.length - 1}
                    onClick={() => move(i, 1)}
                  />
                </>
              )}
              {/* Terracotta because it destroys content, matching the one
                  destructive control on the event page. No confirm: the change
                  is not committed until Save, and Discard undoes the lot. */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
                className="px-2.5 py-1 rounded-lg text-[15px] font-bold transition-colors
                           text-[var(--brand-terracotta)] disabled:opacity-35 disabled:cursor-not-allowed
                           enabled:hover:bg-[var(--brand-terracotta)] enabled:hover:text-[var(--brand-on-terracotta)]"
              >
                Remove
              </button>
            </div>
          </div>

          {spec.fields.map((f) => {
            const value = row.values[f.key] ?? "";
            const err = errors?.[`${row.id}:${f.key}`];
            return (
              <FormField
                key={f.key}
                label={f.label}
                hint={value.length > f.max * 0.8 ? `${value.length}/${f.max}` : undefined}
                error={err}
              >
                {f.multiline ? (
                  <textarea
                    value={value}
                    rows={3}
                    disabled={disabled}
                    placeholder={f.placeholder}
                    onChange={(e) => setValue(row.id, f.key, e.target.value, f.max)}
                    className={`${inputCls(!!err)} disabled:opacity-60`}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    disabled={disabled}
                    placeholder={f.placeholder}
                    onChange={(e) => setValue(row.id, f.key, e.target.value, f.max)}
                    className={`${inputCls(!!err)} disabled:opacity-60`}
                  />
                )}
              </FormField>
            );
          })}
        </div>
      ))}

      {showAdd && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...rows, blankRow(kind)])}
          className="w-full py-3 rounded-2xl text-[16px] font-bold transition-colors
                     text-[var(--brand-text)] disabled:opacity-40 disabled:cursor-not-allowed
                     enabled:hover:bg-[var(--brand-green)] enabled:hover:text-[var(--brand-on-green)]"
          style={{ border: "2px dashed var(--brand-control-border)" }}
        >
          {spec.addLabel}
        </button>
      )}
    </div>
  );
}

/** A square reorder control. Bare chevron, no fill — it is chrome inside a row. */
function IconStep({
  dir,
  label,
  disabled,
  onClick,
}: {
  dir: "up" | "down";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        disabled
          ? "opacity-35 cursor-not-allowed"
          : "text-[var(--brand-text)] hover:bg-[var(--brand-green)] hover:text-[var(--brand-on-green)]"
      }`}
    >
      <ChevronIcon dir={dir} className="w-[18px] h-[18px]" />
    </button>
  );
}
