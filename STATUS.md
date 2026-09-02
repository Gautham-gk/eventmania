# NewFind — Current State

> **This file describes the present only.** Rewrite the relevant section in place — never append.
> A stale entry here is a bug. History goes in `CHANGELOG.md`; specs for unbuilt work go in `TODO.md`.

Last reviewed: 2026-08-14

---

## ⚠️ Communities are PARKED for Phase 2 (2026-08-14)

**Communities are built and complete, but switched off for the MVP.** Gautham's requirement is that
a user must not encounter the word "community" anywhere — not in the nav, footer, Explore, hero,
wishlist, Create Event form, browser tab or PWA install prompt.

Nothing was deleted. Every removal is a commented block tagged **`PARKED 2026-08-14 (MVP)`**, so the
restore is one grep. What is switched off:

| Surface | How it is parked |
|---|---|
| `/community/*` routes | New `app/community/layout.tsx` — a server component that `redirect("/")`s the whole segment. The pages beneath it are untouched. |
| `/communities` | Existing redirect stub, retargeted from `/explore?view=communities` to `/` |
| Community OG + story images | `PARKED` const guard → 404. A metadata route and a route handler are separate route entries that a layout redirect never wraps. |
| `/community/[slug]` `generateMetadata` | Replaced by a static `{ title: "NewFind" }`; metadata resolution is a separate pass from rendering |
| Home `CommunityCarousel` | Render site, both React Query fetches, the merge, and three imports |
| `/explore` | Community fetch, cards, and the entire 3-way view switch. `parseView()` is the choke point — it ignores `?view=` and always answers `"events"`, which switches every derived value off on its own. Create Event is now unconditional. |
| Navbar / Footer | Communities dropdown (desktop + mobile) and the footer link |
| Hero, auth, metadata, manifest | Copy edits; the word is gone from every string |
| Wishlist | `kind: "community"` entries stay in localStorage but are filtered out of the view |
| Create Event | The "Add to my community" section, its state, its lookup and its payload field |

**Left running and untouched:** the whole backend (community service, gateway route, models, seed
data) and every frontend community component, fixture, API client and type. ⚠️ **Do not remove the
community service from `shadow_runner.py` / `start.bat`** — it is what creates the `communities`
table, and the user service will otherwise create an incompatible one.

Phase 2 restore checklist: `TODO.md` §12.

---

## Shipped

### Pages

| Route | What it does |
|---|---|
| `/` | Discovery — `HeroCarousel`, city-based `EventsCarousel`, `FeatureBand` ("Why NewFind" — both audiences on screen at once, full width: 3 participant tiles left and 4 organiser tiles right, each half ending in its own CTA tile; the "Everything in one feed" card is commented out), `CategoryGrid` ("Browse by category", directly above the footer), `Footer`. ⚠️ `CommunityCarousel` is **parked** — see the Phase 2 section above |
| `/auth` | Login / register toggle. Two-column on `lg+` (hero panel + form), form-only on mobile. Google/Facebook buttons present but **disabled** ("Coming soon") |
| `/explore` | **Events browse.** Search, city picker, Sort by (client-side, `?sort=`), collapsible Filters panel, unconditional Create Event button. ⚠️ Was a unified events-AND-communities browse with a 3-segment view switch; both are **parked** — see the Phase 2 section above |
| `/event/[id]` | Event detail — full-bleed photo hero, description, **announcements / agenda / FAQ (public, and rendered only when the organiser has written one)**, reviews, booking card, sticky booking bar, `SimilarEvents` rail, auth guard. **Every visitor sees a lifecycle status in the hero row**, and the organiser's is editable: **Draft / Live / Registration closed / Cancelled** as a select for the organiser (each option carrying its own explanation; → Live from a draft and → Cancelled still route through their confirmation dialogs, and nothing leaves Cancelled or returns to Draft), and the same chip **fixed and unclickable** for a participant, carrying participant-facing copy on hover. A draft shows a participant nothing at all. ⚠️ **`registration_closed` is not in the backend enum and `/event/search` defaults to `published`** — the option works in `dummy` mode and is **disabled with the reason** in `real` (`TODO.md` §23). "Finished" was dropped, and the backend's `completed` now folds onto Registration closed. A closed event is **not** dimmed and gets **no banner** — it is still happening; only the join is off, so the booking CTA and sticky bar read "Registration closed" and the "spots left" chip is hidden. **The organiser also gets two extra controls in that row, and no bands** — the row's organiser half reads state → lens → actions: the status select (with a **Publish** button beside it on a draft), then a segmented view toggle (Participant view ⇄ Organiser) shown in both modes and defaulting to the **organiser view**, then the three round controls. Every control in that row — including Back, wishlist and share — is 48px on a linen ground with a 2px `--brand-hint` outline (brand-black in light, brand-white in dark) and a label that goes green under the pointer; both labelled controls explain themselves in a hover label rather than in permanent copy. In the organiser view: the hero's wishlist and share controls are replaced by **Edit details · Duplicate event · Cancel event**; the booking card is replaced by an **organiser card** (sold-vs-capacity bar, revenue so far, **Manage attendees** and **Manage revenue** links into the console scoped to this event) and the sticky bar follows it; and each of the three authored sections gains an inline **Edit**. The edit dialog **mirrors `/organizer/create`** (Gautham, 2026-09-01) — category, event type, language, target audience, tags, website, description, start/end date & time, city and venue or online link, allowed number of participants, offer name and cover image. ⚠️ **Title, ticket price and currency are SHOWN AND LOCKED**, each with the reason on the row: the title is on every issued ticket and share image, and the price and currency are chosen once at creation (Gautham, 2026-09-01 — **reversing** the 2026-08-24 decision that made the price editable). ⚠️ **Capacity is still freely editable with a warning and no floor** (Gautham, 2026-08-24) — it can go below `tickets_sold`, nothing voids the surplus tickets. ⚠️ **Agenda, announcements, FAQ, offer name and cover image have no backend column** — they work in `dummy` mode and their controls are **disabled with an explanation** in `real` mode (`TODO.md` §19.12). ⚠️ **Nothing notifies or emails the attendees for any of this, and `PATCH /event/{id}` still checks no ownership** — `TODO.md` §20 |
| `/checkout/[id]` | Order summary + payment. Free events skip the card form (800 ms fake delay); paid events use a Stripe intent (2 s fake delay); success modal → `/dashboard` |
| `/dashboard` | 3 tabs — My Tickets (QR via qrserver.com), My Wishlist, Networking Profile |
| `/chat` | Chat inbox — the user's rooms (ticketed + organised events, deduped), unread first with a terracotta dot |
| `/chat/[roomId]` | Live WebSocket room — connection indicator, left/right alignment by sender |
| `/community/[slug]` | Community detail — **now built on the same template as `/event/[id]`**: full-bleed hero, two-column body ("About this community" + attendee reviews \| join card showing organiser / next event date-time-location / member count / price), full-bleed "Events in this community" rail with an Upcoming ⇄ Previous toggle, "Similar communities" rail, sticky "Join this community" bar. ⚠️ **PARKED — redirects to `/`.** When restored: the Join CTA is inert (no membership backend, `TODO.md` §3b) and reviews are aggregated from the community's past events, not community-scoped (`TODO.md` §11) |
| `/community/create` | Create community (organiser only). Eligibility gate: 2+ published events. ⚠️ **PARKED — redirects to `/`** |
| `/communities` | ⚠️ **PARKED — redirects to `/`** (was `/explore?view=communities`) |
| `/organizer` | **Organiser dashboard v2** — four-section console (`app/organizer/(console)/*`) behind a themed section rail: Dashboard, Events, Attendees, Earnings, under the app navbar and reachable from its own **"Organiser dashboard"** navbar item. **Two sections were deleted on 2026-09-01** (Gautham): **Settings** — organiser profile, event defaults and team & notifications gone outright, its four payment terms now a read-only **Payments** card at the foot of Earnings; and **Event rooms** — attendee conversation belongs to the chat surfaces for organisers and participants alike, and the organiser side of that is the backend's job (`TODO.md` §19.1). Knock-ons: the header's "N need you" pill counts attendees only, and the dashboard hero lost its "Questions" tile and both room CTAs. Dashboard + Events are **real** (organiser-scoped events, sold/capacity, gross revenue in the event's currency). Attendees / Earnings have no backend: they show fixtures in `dummy` data mode and an explicit "needs the backend" state in `real` mode — never an invented figure. **Organiser-only:** signed out → `/auth`; signed in without an organiser profile → an explaining state with one link to `/organizer/onboarding`. Dummy mode treats the signed-in developer as the organiser. `TODO.md` §19 |
| `/organizer/events` · `/attendees` · `/earnings` | The console's three other sections; same shell, same two gates. **Events' two filter dropdowns work** — price (Paid / Free / Paid & free) and date order (soonest / latest first), client-side over rows already fetched. **Attendees and Earnings each now have a working per-event dropdown** bound to `?event=<id>`, which is also how `/event/[id]`'s organiser card deep-links in; **Attendees' Export CSV is real** (proper RFC-4180 escaping, formula-injection guard and a UTF-8 BOM for Excel — `lib/csv.ts`). Their remaining dropdowns — ticket type, status, date range — and the header search are still inert placeholders waiting on an organiser-scoped query endpoint (`TODO.md` §19.7); Earnings' "Download statement" is still unwired. **Earnings also carries the console's only surviving settings** — a read-only **Payments** card (receiving account, convenience fee, refund window, who approves refunds) under the settlement table; nothing there saves, and the window and approver are fixture values, not policy (`TODO.md` §19.5, §21). **No public/private control or badge anywhere in the console** — every event NewFind serves is public, so the filter, the row pill and the invite-link copy were all removed (`TODO.md` §19.8) |
| `/organizer/create` | Create/publish event — Event Type toggle, Save as Draft + Publish, inline validation, verification guard. Two **optional** authored sections at the end — **Agenda of the programme** and **Frequently asked questions** — sharing `ListEditor` with the event page's edit dialog. ⚠️ **Neither has a backend column**, so both are **disabled with an explanation** in `real` mode and work in `dummy` (`TODO.md` §19.12). Also a **cover image URL with a live preview** and an **offer name** (shown only on a paid event), both added 2026-09-01 so the form covers everything `/event/[id]` renders. ⚠️ **Ticket price and currency are FINAL here** — they cannot be changed afterwards (Gautham, 2026-09-01), and the form says so. ⚠️ **Announcements are deliberately not offered here** — an announcement is an update to an event that already exists |
| `/organizer/my-events` | Organiser's own published events, auth guard |
| `/organizer/onboarding` | One-time KYC form — company name, address, country, registration number |

### Systems

- **Theming** — light/dark with a navbar sun/moon toggle, driven entirely by `--brand-*` CSS variables in `globals.css`. Dark palette is "warm green-black".
- **Currency** — `events.currency` (ISO 4217, default `INR`) is the single source; every surface formats through `lib/currency.ts`.
- **Tag system** — one shared family for events and communities (`EventBadges.tsx`), one shared control set (`EventActions.tsx`), one glyph set (`EventIcons.tsx`).
- **Detail-page template** — `/event/[id]` and `/community/[slug]` are now one template, not two lookalikes. The sidebar card and sticky bar come from `DetailCard.tsx`, the bottom rails from `Rail.tsx`, the reviews block from `Reviews.tsx`. Each page supplies only its own copy and data.
- **Sharing** — OG link unfurl + 1080×1920 story card, generated server-side with `next/og`. Live for events; the community pair is **parked** (both routes 404).
- **Responsiveness** — verified by measurement (`document.scrollWidth === clientWidth`) on `/`, `/explore`, `/event/[id]`, `/community/[slug]` at 320 · 375 · 414 · 768 · 1024 · 1100 · 1280 · 1440 · 1920. ⚠️ **The `/community/[slug]` rebuild (2026-08-14) has NOT been re-swept** — no browser driver is installed and adding one needs Gautham's sign-off. Re-run the sweep on both detail pages before trusting this line.
- **Dummy/real data switch** — `NEXT_PUBLIC_DATA_MODE` toggles reads between local fixtures and the live backend.
- **One design signature, console included** (2026-08-22) — the organiser console was token-coherent but signature-incoherent: same `--brand-*` colours, its own type scale, no photography, no hover on anything. It now runs on the **site's type scale** (20px row titles / 17px body / 32px extrabold figures / headings on `EventsCarousel`'s extrabold `-0.5px` recipe), its status chip is an `EventBadge` in all but colour, its filter tab **is** the home page's filter tab, every row and control reacts to the pointer, and **it has photographs** — each table row carries the event's own card picture and the dashboard hero is that photo under `HERO_SCRIM`. The console is now the only region of the app with zero `data-keep-type` opt-outs (it previously held 24 of 29). **One-directional: nothing on home, `/explore` or `/event/[id]` was restyled.** Rationale + the signature/register distinction: `DESIGN_NOTES.md` §11. ⚠️ **Not yet re-swept for responsiveness** — the console's tables widened with the type (`minWidth` moved with them) and no browser driver is installed; see the responsiveness line above.
- **One dummy world, two views** — the organiser console and the public site now draw the same events. `lib/fixtures/events.ts` splits into other organisers' events (discoverable only) and `dummyMyEvents`, the eight the signed-in developer owns; `lib/fixtures/organizer.ts` **derives** every console figure from those eight rather than restating them, so a title or total cannot drift between the dashboard and the table beneath it. Verified: portfolio revenue = earnings net, portfolio tickets = sum of `tickets_sold`, every room and earnings row maps to a real event, no draft or finished event reaches discovery, and all eight resolve at `/event/[id]`.
- **Postgres** — `postgres_runner.py` runs the stack on per-service Postgres databases as an alternative to shadow-mode SQLite.
- **Ticketmaster ingestion** — pipeline runs end to end; the home page auto-ingests on first visit to a city.

---

## In progress / partial

- **Chat** — reachable and working live, but the unread glow and inbox are a **frontend-only MVP** (`ChatPresence.tsx`). Messages are not persisted, so nothing received while the app is closed is detected. See `TODO.md`. ⚠️ It is a **group room per event** (room id = event id, membership = ticket-holders ∪ organiser, broadcast to every socket in the room) — verified by reading the code, **not yet by running two clients against one event** (`TODO.md` §3c). In it **nobody is identifiable**: every other sender renders as `Attendee <4 chars of UUID>` with no organiser badge, so the organiser cannot be picked out.
- **Joining a community** — ⚠️ moot while communities are parked. When restored: the "Join this community" CTA is on the page (card + sticky bar) and **does nothing on click, by design**. There is no membership table, no join endpoint and no new-event notification hook; the joined-state UI is not designed yet. Full spec in `TODO.md` §3b.
- **Community reviews** — ⚠️ moot while communities are parked. When restored, the block aggregates reviews from the community's past events, because the review service is event-scoped. `TODO.md` §11.
- **SEO metadata** — `/event/[id]` has `generateMetadata()` + share images. Other dynamic routes do not. `/community/[slug]`'s is **parked** (static title, share images 404).
- **Ticketmaster geocoding** — ingestion runs, but many events land with `lat: 0, lng: 0` because no geocoder is wired up. See `TODO.md`.
- **Organiser-authored event content** — announcements, agenda of the programme, FAQ, offer name ("Early bird") and an editable cover image are **fully built on the frontend** and render publicly on `/event/[id]`. **None of the five has a backend column**, so they persist in `dummy` mode only (in module memory: they survive navigation and die on reload) and every authoring control is **disabled with an explanation** in `real` mode rather than saving into a void. `image_url` is the cheapest to make real — the column exists, it is just missing from `EventUpdate`. Full spec: `TODO.md` §19.12.
- **Postponing / cancelling / publishing an event** — the organiser's controls on `/event/[id]` are built and write through `PATCH /event/{id}`, which persists. **Duplicate** writes a fresh draft through `POST /event/`. **Everything around the write is missing:** the event service does not distinguish a postponement from an edit, publishes no Kafka message for either, sends no notification and no email, and — the live hole — **does not check that the caller owns the event.** Both dialogs state on screen what does not happen, rather than implying it does. Full spec: `TODO.md` §20.

---

## Not started

- **Real ticket issuance** — tickets live in Zustand/localStorage only, never written to the database.
- **Notification bell** — icon present, no panel and no backend. **Shape decided 2026-09-02** (both audiences, dropdown panel, chat button left alone): `TODO.md` §24. ⚠️ **It now owes a signal that used to be on screen:** the organiser console's "N need you" header pill was removed the same day, so refund requests and unpaid bookings have no ambient indicator anywhere until this is built. Deliberate — the pill was a dead-end `<span>` duplicating the dashboard column below it — but it is a debt, not a clean deletion.
- **Help page** — link present, no page.
- **Social login** — buttons present, disabled.
- **Event image upload** — the `image_url` column exists and is populated for synced Ticketmaster events. `/event/[id]`'s edit dialog now has a **cover image URL field with a live preview**, but it is `dummy`-mode only (the column is missing from the backend's `EventUpdate` schema — a one-line fix, `TODO.md` §19.12), there is still no **upload** (no file storage anywhere). The **create form has the same field** as of 2026-09-01, under the same `dummy`-mode gate.
- **Ticket tiers** — backend supports a single price per event; multi-tier needs schema changes.
- **Mobile app** — the monorepo is structured for `apps/mobile`, nothing built.
- **Networking Profile** — the interests section on `/dashboard` shows hardcoded values (Technology, AI, Venture Capital).
- **An easy way for an organiser to post an announcement** — one exists, but it is seven steps from sign-in and the composer is the whole-list editor. Raised 2026-08-31 and **blocked on design decisions**: `TODO.md` §22. (The console's "Your updates" room messages, which §22 weighed it against, went with the Event rooms section on 2026-09-01.)

---

## Known-wrong, deliberately shipped

These are live and **not** bugs to fix on sight — each was a conscious call. Full context and fix specs in `TODO.md`.

- **Organiser identity on `/event/[id]` is entirely hardcoded** — name ("NewFind Collective", one `ORGANISER_NAME` constant feeding **both** the participant's and the organiser's card), avatar initial, and the "Verified · 40+ events" trust line. Approved as a stopgap so the card could match the reference design. **Must be wired to real data before launch** — "Verified" is a trust claim, and the name owed there is the organisation's `company_name`, already collected at `/organizer/onboarding`.
- **`Today` and `Recommended` badges can never appear on a real event** — nothing emits them, so the home page's "Recommended" filter tab matches nothing.
- **The event card's meta row truncates the venue at `xl:grid-cols-4`** — 44px of room for the venue at 1440px.
- **The floating chat launcher overlaps the fourth "Similar events" card** at every width.
- **Guarded pages bounce to `/auth` on a hard load even when logged in** — a zustand hydration race. The fix (`_hasHydrated`) already exists in the store and is simply not used by the guards.
- **Home-page filter tabs are `rounded-full` pills**, contradicting the app-wide rounded-rectangle rule.
- **`PATCH /event/{id}` is unauthenticated and unowned** — any caller who knows an event id can rewrite, publish or cancel someone else's event with curl. It was always this way; the organiser Edit/Cancel controls (2026-08-21) made it an ordinary path rather than a theoretical one, and the 2026-08-24 additions (publish, and editing price and capacity) widened what a stranger's curl can change to include the money. The frontend's `ownsEvent()` decides only whether the controls are *drawn*. **`TODO.md` §20.5 — the first thing to fix in that section.**
- **Capacity is editable with no floor and no notice to anyone** — Gautham's call (2026-08-24). It can be set below `tickets_sold`, and no ticket is voided or refunded. The edit dialog states the consequence in words when the field is touched — **that warning is the whole guardrail, do not trim it.** ⚠️ **The ticket PRICE is no longer part of this** (Gautham, 2026-09-01): price and currency are fixed at creation and the dialog shows both read-only, so the 2026-08-24 reversal now stands for capacity alone.
- **Three of `FeatureBand`'s five live cards advertise work that isn't finished.** Gautham's call (2026-08-17). The **pricing** card ("Free to list. Small fee for paid events." — a 2% convenience fee **paid by the participant**, revised 2026-08-19) and the **stats** card have no implementation at all (`TODO.md` §13, §14), and the **chat card** is only half-true — event rooms are live and the organiser is in them, but only for people who already booked, so a prospective attendee cannot yet reach an organiser (`TODO.md` §7b). The lead card's copy deliberately never states *when* you can chat, so it stays accurate either way — **do not "clarify" it into "once you book".** Everything else on the band is shipped.

---

## Dead code (confirm before deleting)

- **Everything tagged `PARKED 2026-08-14 (MVP)` — parked, not dead.** The entire community feature; see the Phase 2 section at the top of this file. **Do not "clean up" any of it.**
- **Four `HeroCarousel` blocks — parked, not dead.** Commented out in place on 2026-08-11 at Gautham's explicit "we might bring it back later": (1) the Events / Communities segmented toggle, (2) the left column's Explore / Publish CTA pair, (3) the per-slide CTA on the photo ("Find offline events", "Find wellness events", …), (4) the terracotta eyebrow. The hero is pinned to `mode = "events"`, so `MODES.communities`, both `primary`/`secondary` CTAs, every slide `href` and both `eyebrow` strings are unreachable but still compile. The panel is now photo + centered dots only. **Do not delete any of it, and do not prune the MODES data as unused** — slide `label` is still the dots' `aria-label`. ⚠️ `MODES.communities` still carries the OLD headline voice ("Every community worth joining."); the events mode has since moved to the two-person dialogue, so restoring the toggle means rewriting the communities copy to match.
- `components/EventCard.tsx` — nothing imports it. The real card is `EventCardItem`, exported from `EventsCarousel.tsx`.
- `components/ShareButton.tsx` — its only importer is `EventCard.tsx`, so it is dead too.
- `eventmind/frontend/` — contains a single stray `.iml` file; the Flutter app it belonged to was deleted.
