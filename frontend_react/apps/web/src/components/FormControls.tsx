"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  The form primitives: a labelled field with an optional hint and error, and
//  the input class string every text/select/textarea in a form wears.
//
//  Lifted out of `app/organizer/create/page.tsx`, which is where they were born
//  and which now imports them from here. The organiser's edit dialog needs the
//  same field twice over, and a second copy of `inputCls` is exactly how two
//  forms that should be indistinguishable start drifting.
//
//  ⚠️ These are the FORM controls, not the console's. `ConsoleUI.tsx` owns the
//  organiser console's own shapes (cards, tabs, filter selects) and does not
//  read from here.
// ─────────────────────────────────────────────────────────────────────────────

export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>{label}</label>
        {hint && <span className="text-xs" style={{ color: "var(--brand-hint)" }}>{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs" style={{ color: "#EF4444" }}>{error}</p>}
    </div>
  );
}

export function inputCls(hasError: boolean): string {
  return (
    "w-full px-4 py-3 rounded-xl text-sm transition-colors " +
    "placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 resize-none " +
    (hasError
      ? "border border-red-400 bg-red-50 focus:ring-red-200"
      : "border border-[var(--brand-border)] bg-[var(--brand-bg)] text-[var(--brand-text)] focus:ring-[var(--brand-green)]/20 focus:border-[var(--brand-green)]")
  );
}
