"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// PARKED 2026-08-14 (MVP) — `communityApi` dropped from this import.
import { organizerApi } from "@eventmind/api";
import { useAuthStore, CITIES } from "@eventmind/store";
import type { City } from "@eventmind/store";
// PARKED 2026-08-14 (MVP) — `Community` dropped from this import.
import type { CurrencyCode } from "@eventmind/types";
import { CURRENCIES, DEFAULT_CURRENCY } from "@eventmind/types";
import { Navbar } from "@/components/navbar/Navbar";
import { FormField, inputCls } from "@/components/FormControls";
import {
  ListEditor,
  dropBlankRows,
  rowErrors,
  toPatch,
  type Row,
} from "@/components/organizer/ListEditor";
import { currencySymbol } from "@/lib/currency";
import { EXTRAS_ARE_LOCAL, eventsSource } from "@/lib/data-source";
import { SKIP_ORGANIZER_VERIFICATION } from "@/lib/dev-flags";
import { EXTRAS_HINT } from "@/lib/event-extras";
import {
  CATEGORIES,
  EVENT_TYPES,
  LANGUAGES,
  TARGET_AUDIENCES,
  type EventType,
} from "@/lib/event-options";
import { GUTTERS } from "@/lib/layout";

const GREEN = "var(--brand-green)";

/* CATEGORIES / EVENT_TYPES / LANGUAGES / TARGET_AUDIENCES were declared here
   until 2026-09-01. They moved to `lib/event-options.ts` when the edit dialog
   gained the same four controls — one list or the two forms drift, which is the
   same reason `FormField` left this file. */

function subFromToken(token: string | null): string {
  if (!token) return "00000000-0000-0000-0000-000000000001";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? "00000000-0000-0000-0000-000000000001";
  } catch {
    return "00000000-0000-0000-0000-000000000001";
  }
}

export default function CreateEventPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tokens = useAuthStore((s) => s.tokens);

  // Event basics
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [eventType, setEventType] = useState<EventType>("In-Person");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [language, setLanguage] = useState("English");
  const [eventWebsite, setEventWebsite] = useState("");

  // Location
  const [city, setCity] = useState<City>(CITIES[0]);
  const [address, setAddress] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");

  // Timing
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Tickets
  const [capacity, setCapacity] = useState("100");
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  /* The two extras the EDIT dialog has always had and this form did not, added
     2026-09-01 so an organiser can author on the way in rather than publishing
     and immediately opening "Edit details". Both are read straight off the
     event by `/event/[id]` — `image_url` is the hero photo, `offer_name` is the
     caption above the price in the booking card.

     ⚠️ Same `EXTRAS_ARE_LOCAL` gate as the agenda and FAQ editors below, for the
     same reason: neither survives a real-mode create (`EXTRA_KEYS` in
     lib/event-extras.ts). `image_url` is the cheapest of the five to make real —
     it is a column already, just missing from the backend schemas. */
  const [offerName, setOfferName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  /* The two optional authored lists an organiser can seed at creation time.
     Both start EMPTY — an event with no agenda is normal, and a pre-added blank
     row would read as something you must fill in.

     ⚠️ ANNOUNCEMENTS ARE DELIBERATELY NOT HERE (Gautham, 2026-08-31). An
     announcement is an update posted to an event people have already booked,
     dated and rendered newest-first; there is nothing to update at the moment
     the event is being written. They stay where they belong — the organiser
     view on `/event/[id]`.

     ⚠️ Neither list survives a real-mode create: `EventCreate` has no column for
     them (TODO.md §19.12), so both editors are disabled off `EXTRAS_ARE_LOCAL`,
     the same gate every other authoring control in the app reads. */
  const [agendaRows, setAgendaRows] = useState<Row[]>([]);
  const [faqRows, setFaqRows] = useState<Row[]>([]);
  const [listErrors, setListErrors] = useState<Record<string, string>>({});

  /* PARKED 2026-08-14 (MVP) — the whole "add this event to my community" feature.
     Communities are deferred to Phase 2. These five pieces are interdependent —
     the state, the lookup, the payload field and the form section — so they park
     as one set; leaving any one live breaks the others.

  // Community
  const [community, setCommunity] = useState<Community | null>(null);
  const [communityId, setCommunityId] = useState<string>("");

  */

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<"publish" | "draft">("publish");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  /* Starts true under the dev bypass — the gate is then already open on the first
     render. Setting it from inside the effect instead would trip
     `react-hooks/set-state-in-effect` and cost a throwaway render. */
  const [verificationChecked, setVerificationChecked] = useState(SKIP_ORGANIZER_VERIFICATION);

  useEffect(() => {
    if (!isAuthenticated) { router.replace("/auth"); return; }
    if (SKIP_ORGANIZER_VERIFICATION) return;
    const userId = subFromToken(tokens?.access_token ?? null);
    if (!userId) return;

    organizerApi.get(userId)
      .then(() => {
        setVerificationChecked(true);
        /* PARKED 2026-08-14 (MVP) — the organiser's community lookup. See the
           parked state block above. setVerificationChecked stays: it gates the
           whole form, not just this section.

        // Check if organizer already has a community
        communityApi.getByOrganizer(userId)
          .then((r) => setCommunity(r.data))
          .catch(() => {});

        */
      })
      .catch(() => router.replace("/organizer/onboarding"));
  }, [isAuthenticated, router, tokens]);

  if (!isAuthenticated || !verificationChecked) return null;

  function toggleAudience(item: string) {
    setTargetAudience((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  }

  /** `agenda` / `faq` arrive already pruned of blank rows — see `handleSubmit`. */
  function validate(agenda: Row[], faq: Row[]): boolean {
    const errors: Record<string, string> = {};
    if (title.trim().length < 5) errors.title = "Title must be at least 5 characters.";
    if (description.trim().length < 20) errors.description = "Description must be at least 20 characters.";
    if (eventType !== "Online" && !address.trim()) errors.address = "Venue address is required for in-person events.";
    if (eventType !== "In-Person" && !onlineUrl.trim()) errors.onlineUrl = "Online link is required for online/hybrid events.";
    if (!startDate) errors.startDate = "Start date is required.";
    if (!endDate) errors.endDate = "End date is required.";
    if (startDate && endDate && new Date(endDate) <= new Date(startDate))
      errors.endDate = "End date must be after start date.";
    if (parseInt(capacity) < 1) errors.capacity = "Capacity must be at least 1.";
    if (parseFloat(price) < 0) errors.price = "Price cannot be negative.";
    if (eventWebsite && !eventWebsite.match(/^https?:\/\/.+/))
      errors.eventWebsite = "Website must start with http:// or https://";
    // Same test as the edit dialog's — a cover image that 404s is the hero of
    // the page the organiser is about to share.
    if (imageUrl.trim() && !/^https?:\/\/\S+$/i.test(imageUrl.trim()))
      errors.imageUrl = "Enter a full image URL starting with http:// or https://";
    setFieldErrors(errors);

    // Keyed by row id, so the two lists share one map without colliding.
    const listErrs = { ...rowErrors("agenda", agenda), ...rowErrors("faq", faq) };
    setListErrors(listErrs);

    return Object.keys(errors).length === 0 && Object.keys(listErrs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent, mode: "publish" | "draft") {
    e.preventDefault();

    // A row the organiser added and then left completely blank is an accident,
    // not data — drop it rather than blocking the save on its required fields.
    const agenda = dropBlankRows("agenda", agendaRows);
    const faq = dropBlankRows("faq", faqRows);
    setAgendaRows(agenda);
    setFaqRows(faq);

    if (!validate(agenda, faq)) return;

    setError(null);
    setIsSubmitting(true);
    setSubmitMode(mode);

    try {
      const organizerId = subFromToken(tokens?.access_token ?? null);
      const location: Record<string, unknown> = {
        event_type: eventType,
        latitude: eventType !== "Online" ? city.lat : null,
        longitude: eventType !== "Online" ? city.lng : null,
      };
      if (address.trim()) location.address = address.trim();
      if (onlineUrl.trim()) location.online_url = onlineUrl.trim();

      const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      // Sent unconditionally; `eventsSource.create` strips them in real mode,
      // where the backend has no column for either (TODO.md §19.12). Both are
      // empty there anyway — the editors below are disabled.
      const now = new Date().toISOString();

      await eventsSource.create({
        organizer_id: organizerId,
        title: title.trim(),
        description: description.trim(),
        category,
        event_type: eventType,
        location,
        target_audience: targetAudience.join(", ") || undefined,
        tags: parsedTags,
        language,
        event_website: eventWebsite.trim() || undefined,
        // PARKED 2026-08-14 (MVP) — community_id: communityId || undefined,
        // The field stays nullable on the event model, so omitting it is valid.
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        capacity: parseInt(capacity) || 100,
        price: parseFloat(price) || 0,
        currency,
        status: mode === "publish" ? "published" : "draft",
        // Both stripped in real mode alongside the two lists, where the
        // controls that set them are disabled and these are empty anyway.
        offer_name: offerName.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        ...toPatch("agenda", agenda, now),
        ...toPatch("faq", faq, now),
      });

      setSuccess(true);
      setTimeout(() => router.push("/organizer"), 1500);
    } catch {
      setError("Failed to save event. Please check all fields and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const descMax = 1000;
  const extrasOff = !EXTRAS_ARE_LOCAL;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--brand-bg)" }}>
      <Navbar />

      <div className={`py-10 max-w-3xl mx-auto ${GUTTERS}`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          {/* Under the dev bypass this walks to /organizer/onboarding rather than
              into history, so the two pages can be reviewed as a pair. For a real
              organiser it stays plain history — they reach this form from the
              console, and sending them to a verification page they have already
              completed would be a bug, not a shortcut. */}
          <button
            onClick={() =>
              SKIP_ORGANIZER_VERIFICATION
                ? router.push("/organizer/onboarding")
                : router.back()
            }
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ border: "2px solid var(--brand-control-border)", backgroundColor: "var(--brand-bg)" }}
          >
            <svg className="w-4 h-4" style={{ color: "var(--brand-hint)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-[28px] font-bold" style={{ color: "var(--brand-text)" }}>Create New Event</h1>
            <p className="text-[18px]" style={{ color: "var(--brand-hint)" }}>Fill in the details below to publish or save as draft.</p>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, submitMode)} className="space-y-6">

          {/* ── Event Basics ── */}
          <Section title="Event Basics">
            <FormField label="Event Title" error={fieldErrors.title}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., NewFind AI Summit 2026"
                className={inputCls(!!fieldErrors.title)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls(false)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>

              <FormField label="Language">
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls(false)}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Event Type">
              <div className="flex rounded-xl overflow-hidden" style={{ border: "2px solid var(--brand-control-border)" }}>
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEventType(t)}
                    className="flex-1 py-3 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: eventType === t ? GREEN : "var(--brand-surface)",
                      color: eventType === t ? "var(--brand-on-green)" : "var(--brand-text)",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label={`Description (${description.length}/${descMax})`} error={fieldErrors.description}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, descMax))}
                placeholder="What is this event about? What will attendees learn or experience?"
                rows={5}
                className={inputCls(!!fieldErrors.description)}
              />
            </FormField>

            <FormField label="Target Audience" hint="Select all that apply">
              <div className="flex flex-wrap gap-2">
                {TARGET_AUDIENCES.map((a) => {
                  const selected = targetAudience.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAudience(a)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: selected ? GREEN : "var(--brand-surface)",
                        color: selected ? "var(--brand-on-green)" : "var(--brand-text)",
                        border: `2px solid ${selected ? GREEN : "var(--brand-control-border)"}`,
                      }}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </FormField>

            <FormField label="Tags / Keywords" hint="Comma-separated, helps with search">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., AI, machine learning, startups"
                className={inputCls(false)}
              />
            </FormField>

            <FormField label="Event Website" hint="Optional" error={fieldErrors.eventWebsite}>
              <input
                type="url"
                value={eventWebsite}
                onChange={(e) => setEventWebsite(e.target.value)}
                placeholder="https://myevent.com"
                className={inputCls(!!fieldErrors.eventWebsite)}
              />
            </FormField>
          </Section>

          {/* ── Time & Location ── */}
          <Section title="Time & Location">
            {eventType !== "Online" && (
              <FormField label="City">
                <select
                  value={city.name}
                  onChange={(e) => setCity(CITIES.find((c) => c.name === e.target.value) ?? CITIES[0])}
                  className={inputCls(false)}
                >
                  {CITIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}, {c.country}</option>
                  ))}
                </select>
              </FormField>
            )}

            {eventType !== "Online" && (
              <FormField label="Venue Address" error={fieldErrors.address}>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Tour & Taxis, Avenue du Port 86C, Brussels"
                  className={inputCls(!!fieldErrors.address)}
                />
              </FormField>
            )}

            {eventType !== "In-Person" && (
              <FormField label="Online Event Link" error={fieldErrors.onlineUrl}>
                <input
                  type="url"
                  value={onlineUrl}
                  onChange={(e) => setOnlineUrl(e.target.value)}
                  placeholder="e.g., https://zoom.us/j/..."
                  className={inputCls(!!fieldErrors.onlineUrl)}
                />
              </FormField>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="Start Date & Time" error={fieldErrors.startDate}>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls(!!fieldErrors.startDate)}
                />
              </FormField>
              <FormField label="End Date & Time" error={fieldErrors.endDate}>
                <input
                  type="datetime-local"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls(!!fieldErrors.endDate)}
                />
              </FormField>
            </div>
          </Section>

          {/* ── Tickets & Pricing ── */}
          <Section title="Tickets & Pricing">
            {/* Capacity · Currency · Price. Three across from sm up; stacked on a
                phone, where a third of the column cannot hold "Capacity (max
                attendees)" above a number input. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField label="Capacity (max attendees)" error={fieldErrors.capacity}>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="100"
                  className={inputCls(!!fieldErrors.capacity)}
                />
              </FormField>

              {/* Currency the attendee is charged in. Stored on the event, so
                  every surface renders this event's price with THIS symbol —
                  see lib/currency.ts. Defaults to INR, the platform's home
                  currency; the field sits before Price so the price input's
                  prefix is already showing the right symbol as you type. */}
              <FormField label="Currency">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className={inputCls(false)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Ticket Price" error={fieldErrors.price}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: "var(--brand-hint)" }}>
                    {currencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className={`${inputCls(!!fieldErrors.price)} pl-8`}
                  />
                </div>
                {parseFloat(price) === 0 && (
                  <p className="text-xs font-medium mt-1" style={{ color: GREEN }}>This will be a FREE event.</p>
                )}
              </FormField>
            </div>

            {/* ⚠️ PRICE AND CURRENCY ARE FINAL (Gautham, 2026-09-01). Neither can
                be changed after this form — the edit dialog shows both read-only.
                Say so HERE, where the decision is actually being made, rather
                than only in the dialog that refuses it later. */}
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--brand-hint)" }}>
              The ticket price and currency are fixed once the event is created — they are what a
              ticket, a receipt and every earnings total are written in. Everything else on this page
              can be edited later.
            </p>

            {/* An offer name on a free event names a discount off nothing —
                same condition the edit dialog uses. */}
            {parseFloat(price) > 0 && (
              <FormField
                label="Offer name"
                hint={extrasOff ? "needs the backend" : "shown above the price"}
              >
                <input
                  type="text"
                  value={offerName}
                  disabled={extrasOff}
                  title={extrasOff ? EXTRAS_HINT : undefined}
                  onChange={(e) => setOfferName(e.target.value.slice(0, 40))}
                  placeholder="e.g., Early bird"
                  className={`${inputCls(false)} ${extrasOff ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </FormField>
            )}
          </Section>

          {/* ── Cover image (optional) ── */}
          <Section title="Cover image" optional>
            <FormField
              label="Image URL"
              hint={extrasOff ? "needs the backend" : "leave blank for the default photo"}
              error={fieldErrors.imageUrl}
            >
              <input
                type="url"
                value={imageUrl}
                disabled={extrasOff}
                title={extrasOff ? EXTRAS_HINT : undefined}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className={`${inputCls(!!fieldErrors.imageUrl)} ${extrasOff ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </FormField>

            {/* ⚠️ A PLAIN <img>, and it must stay one — `next/image` refuses a
                host that is not in next.config.ts's `remotePatterns`, and the
                whole point of this field is that an organiser types their own.
                The edit dialog and the event hero render it the same way. */}
            {imageUrl.trim() && !fieldErrors.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl.trim()}
                alt=""
                className="w-full aspect-video object-cover rounded-xl"
                style={{ border: "1px solid var(--brand-border)" }}
              />
            )}

            <p className="text-[15px] leading-relaxed" style={{ color: "var(--brand-hint)" }}>
              There is no upload yet — paste a link to an image you already host. It becomes the
              photo at the top of the event page; the event cards keep their own picture.
            </p>
          </Section>

          {/* ── Agenda (optional) ── */}
          <Section title="Agenda of the programme" optional>
            <ListEditor
              kind="agenda"
              rows={agendaRows}
              onChange={setAgendaRows}
              errors={listErrors}
              disabled={!EXTRAS_ARE_LOCAL}
              disabledNote={`An agenda cannot be saved yet. ${EXTRAS_HINT}`}
            />
          </Section>

          {/* ── FAQ (optional) ── */}
          <Section title="Frequently asked questions" optional>
            <ListEditor
              kind="faq"
              rows={faqRows}
              onChange={setFaqRows}
              errors={listErrors}
              disabled={!EXTRAS_ARE_LOCAL}
              disabledNote={`An FAQ cannot be saved yet. ${EXTRAS_HINT}`}
            />
          </Section>

          {/* ── PARKED 2026-08-14 (MVP): the Community section ──
              An opt-in "Add to {community}" toggle, shown only to organisers who
              already had a community. Deferred to Phase 2 with the rest of the
              feature; see the parked state block near the top of this file.

          {community && (
            <Section title="Community">
              <p className="text-sm" style={{ color: "var(--brand-hint)" }}>
                You have a community called <span className="font-semibold" style={{ color: "var(--brand-text)" }}>{community.name}</span>.
                Adding this event to your community groups it with your other events on your community page.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setCommunityId(communityId ? "" : community.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: communityId ? GREEN : "var(--brand-surface)",
                    color: communityId ? "var(--brand-on-green)" : "var(--brand-text)",
                    border: `2px solid ${communityId ? GREEN : "var(--brand-control-border)"}`,
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                  {communityId ? `Added to ${community.name}` : `Add to ${community.name}`}
                </button>
              </div>
            </Section>
          )}

          */}

          {/* Error */}
          {error && (
            <p className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</p>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl" style={{ color: GREEN, backgroundColor: "color-mix(in srgb, var(--brand-green) 10%, transparent)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              {submitMode === "publish" ? "Event published!" : "Draft saved!"} Redirecting…
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || success}
              onClick={() => setSubmitMode("draft")}
              className="flex-1 py-4 rounded-2xl text-sm font-bold transition-colors disabled:opacity-50"
              style={{ border: `2px solid ${GREEN}`, color: GREEN, backgroundColor: "var(--brand-bg)" }}
            >
              {isSubmitting && submitMode === "draft" ? "Saving…" : "Save as Draft"}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || success}
              onClick={() => setSubmitMode("publish")}
              className="flex-[2] py-4 rounded-2xl text-[var(--brand-on-green)] text-sm font-bold transition-colors disabled:opacity-50"
              style={{ backgroundColor: GREEN }}
            >
              {isSubmitting && submitMode === "publish" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-[var(--brand-on-green)]" />
                  Publishing…
                </span>
              ) : "Publish Event"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

/** `optional` marks a section the organiser may skip entirely — said once, in
 *  the heading, rather than "(optional)" on every field inside it. */
function Section({ title, optional, children }: { title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 sm:p-8 space-y-6" style={{ backgroundColor: "var(--brand-bg)", border: "1px solid var(--brand-border)" }}>
      <h2 className="text-[18px] font-bold" style={{ color: "var(--brand-text)" }}>
        {title}
        {optional && (
          <span className="ml-2 font-medium" style={{ color: "var(--brand-hint)" }}>Optional</span>
        )}
      </h2>
      {children}
    </div>
  );
}

// `FormField` and `inputCls` used to live here. They moved to
// `components/FormControls.tsx` when the organiser's edit dialog needed the same
// fields — one definition, so the two forms cannot drift.
