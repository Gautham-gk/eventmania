"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  ONE dialog behind all three organiser-authored lists: the agenda, the
//  announcements and the FAQ.
//
//  ⚠️ THREE DIALOGS WERE THE OBVIOUS BUILD AND ARE THE WRONG ONE. The lists
//  differ only in their field names and whether order is meaningful; three
//  copies would drift on the things that actually matter — the add/remove
//  affordance, the validation, the empty-row rule, the save path — which is the
//  drift CLAUDE.md's consistency section exists to stop.
//
//  ⚠️ THE ROWS THEMSELVES LIVE IN `ListEditor.tsx`, not here. This file is the
//  dialog and the save; the editor body is shared with `/organizer/create`,
//  which offers the agenda and the FAQ at creation time. **Add a list, a field
//  type or a validation rule THERE**, or the two surfaces drift apart.
//
//  ⚠️ IT SAVES THE WHOLE ARRAY, not a diff. These live in one JSON-ish field on
//  the event, so a partial write has no meaning — and because the dialog is
//  mounted only while open (see the note at its call site in
//  `app/event/[id]/page.tsx`), it always opens on the event's current rows —
//  plus the one blank `extraRow` the call site hands it for an empty list.
//
//  ⚠️ NONE OF THIS PERSISTS AGAINST THE REAL BACKEND — there is no column for
//  any of the three (`lib/event-extras.ts`, TODO.md §19.12). The page never
//  opens this dialog in real mode; every entry point is disabled with
//  `EXTRAS_HINT`. **Do not add a call site that skips that check.**
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event } from "@eventmind/types";
import { eventsSource } from "@/lib/data-source";
import { ModalShell } from "@/components/ModalShell";
import {
  ListEditor,
  SPEC,
  dropBlankRows,
  rowErrors,
  toPatch,
  toRows,
  type ListKind,
  type Row,
} from "@/components/organizer/ListEditor";

export type { ListKind };

export function EditListModal({
  event,
  kind,
  extraRow,
  open,
  onClose,
}: {
  event: Event;
  kind: ListKind;
  /**
   * A blank row to open on, ON TOP of whatever the event already holds.
   *
   * ⚠️ THE CALL SITE MAKES IT, IN THE CLICK HANDLER, and that is not ceremony:
   * `blankRow` goes through `extraId()`, which is exactly the impurity
   * `react-hooks/purity` flags in render — including inside a `useState`
   * initialiser. Passing the finished row in keeps the impure call in the event
   * handler where it belongs.
   *
   * The page passes one when the list is EMPTY, so pressing "Post an
   * announcement" lands on the composer rather than on an empty state offering
   * the same words a second time (Gautham, 2026-09-02). A list that already has
   * rows was opened with "Edit" and opens on those rows, unchanged.
   */
  extraRow?: Row | null;
  open: boolean;
  onClose: () => void;
}) {
  const spec = SPEC[kind];
  const queryClient = useQueryClient();
  // Seeded from props ON MOUNT — the call site mounts this only while open, so
  // it always starts from the event's current rows.
  const [rows, setRows] = useState<Row[]>(() => {
    const existing = toRows(kind, event);
    return extraRow ? [...existing, extraRow] : existing;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (next: Row[]) =>
      eventsSource
        .update(String(event.id), toPatch(kind, next, new Date().toISOString()))
        .then((r) => r.data),
    onSuccess: (updated) => {
      // Straight into the page's cache entry, so the section below re-renders
      // without a refetch — the same write `EditEventModal` does.
      queryClient.setQueryData(["event", String(event.id)], updated);
      queryClient.invalidateQueries({ queryKey: ["organizer-events"] });
      onClose();
    },
    onError: () => setError("Could not save. Please try again."),
  });

  function submit() {
    setError(null);
    const kept = dropBlankRows(kind, rows);
    const found = rowErrors(kind, kept);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setRows(kept);
    save.mutate(kept);
  }

  return (
    <ModalShell
      open={open}
      title={spec.title}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-[16px] font-bold transition-colors"
            style={{ border: "2px solid var(--brand-control-border)", color: "var(--brand-text)" }}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={save.isPending}
            className="flex-[2] py-3.5 rounded-2xl text-[16px] font-bold text-[var(--brand-on-green)] transition-colors disabled:opacity-60"
            style={{ backgroundColor: "var(--brand-green)" }}
          >
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <ListEditor kind={kind} rows={rows} onChange={setRows} errors={errors} />

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</p>
        )}
      </div>
    </ModalShell>
  );
}
