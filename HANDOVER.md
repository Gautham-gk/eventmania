# NewFind — Project Handover

> You are picking up an active project. Read this file fully before making any changes — it is
> deliberately kept short enough that you can.
>
> **It holds instructions, not history.** Where each kind of writing goes:
>
> | Writing | File |
> |---|---|
> | *How to work on this* — conventions, gotchas, rules still true tomorrow | **`HANDOVER.md`** (here) |
> | *What state things are in right now* — shipped / partial / not started / known-wrong | **`STATUS.md`** (rewritten in place) |
> | *What meaningfully changed* — one short line per feature, decision, or revert | **`CHANGELOG.md`** (appended) |
> | *Specs for what's left to build*, and what's blocked on a decision | **`TODO.md`** |
> | *Why the design is the way it is* — measurements, rejected alternatives | **`DESIGN_NOTES.md`** |
> | *The gotcha for one component* — the thing you'd get wrong without being told | **`COMPONENTS.md`** (read a row, not the file) |
>
> Before you add a line here, check it against the code — see *Keeping this file true* at the end.

> **⚠️ Folder name has a space.** The parent folder is `Event mind` (with a space). Always quote
> paths in the terminal: `cd "c:\...\Event mind\eventmind"`. Forgetting the quotes breaks commands
> silently.

---

## Execution Rules (read before every task)

- Before starting any task, identify the exact files needed. Open **only** those files.
- Do **not** explore the full project structure unless explicitly asked.
- Do **not** read `node_modules`, `.next`, `.venv`, `__pycache__`, or any build/cache directory. **One exception, and it is narrow:** `node_modules/next/dist/docs/` when you are about to use a Next.js API and are unsure of its current shape — this is Next 16 and training data goes stale. **Grep for the one file; never browse the tree.** Conditions in `apps/web/AGENTS.md`.
- Do **not** re-read files you have already read in this session.
- If a task touches only one component, open only that component file.
- **After any TypeScript change**, run `pnpm --filter @eventmind/web type-check`. Do not report a task done if it fails. ⚠️ **The ONE exception is an edit the compiler cannot see** — copy inside JSX, a `--brand-*` value in `globals.css`, a Tailwind class string, a comment, a markdown doc. **A prop, an import, a type, a signature, a conditional, or a file being created / renamed / deleted is NOT that** — run it. **Unsure? Run it.** The check costs seconds; skipping it wrongly costs a bug reported as done.
- **`pnpm lint` is CONDITIONAL, type-check is not.** Run it only when the change can trip a rule it owns — a hook, `<img>` vs `next/image`, `<a>` vs `next/link`, an unused import, `Date.now()` in a component body. It is slower than type-check and finds nothing on a padding tweak.
- **For UI changes, run the dev server and verify visually.** Type-checking does not catch visual bugs. **Scope it to what actually changed:** geometry, a new component, or anything responsive needs real eyes (plus the 1024px re-measure). A colour token or a copy swap does not — **unless it changes a width**, and a longer label always does.
- **If you change something this file describes, fix the description in the same task** — not at the end, not next session. **A stale instruction is worse than no instruction:** it doesn't just waste tokens, it actively produces wrong work.
- After completing a task, list only the files you modified.
- **Before building anything complex, state your interpretation and confirm before proceeding.** Especially when an image or asset is uploaded (do not hand-draw or reconstruct it — ask how to use it), when the request is ambiguous, or when the implementation could go several ways. A brief "Here's what I'm planning — does that sound right?" prevents wasted effort.

---

## What Is NewFind?

NewFind (formerly EventMind internally) is an AI-powered event discovery platform — think Eventbrite
meets Meetup, with an AI layer for personalised recommendations and community matching. Users
discover events, register, buy tickets, and chat with other attendees. Organisers create and manage
events.

The project is mid-build. The frontend is a React/Next.js web app in `frontend_react/`. It was
originally migrated from a Flutter Web prototype; that Flutter app has since been **deleted**.

> **This is React/Next.js — NOT React Native.** React Native is a mobile framework. This is a
> Next.js web app. Do not confuse the two.

`eventmind` survives as the internal package scope (`@eventmind/web`) and the localStorage key
prefix. **NewFind** is the user-facing name.

---

## Repository Layout

```
scratch/
├── Eventmind_files/            ← project DOCUMENTS live here (sibling of "Event mind", not inside it)
│   ├── eventmind_prd.md
│   ├── competitor_analysis.md
│   └── REACT_MIGRATION.md
└── Event mind/
    └── eventmind/              ← repo root (HANDOVER.md, STATUS.md, CHANGELOG.md, TODO.md, DESIGN_NOTES.md)
        ├── frontend_react/     ← Turborepo monorepo
        │   ├── apps/web/       ← Next.js 16, App Router, TypeScript, Tailwind v4
        │   └── packages/       ← types / store / api (shared, for the planned mobile app)
        ├── backend/            ← FastAPI microservices
        │   ├── gateway/        ← API gateway (port 8000)
        │   ├── services/       ← auth, user, event, ticketing, payment, notification,
        │   │                     chat, recommendation, review, agents, community
        │   └── scripts/        ← shadow_runner, postgres_runner, seed_events, sync_ticketmaster, migrations
        ├── start.bat / stop.bat  ← Windows launchers (start.bat holds real keys — git-ignored)
        └── docker-compose.yml
```

**Documentation goes in `Eventmind_files/`, code stays in `eventmind/`.** Keep them separate. The
five handover docs (this file, `STATUS.md`, `CHANGELOG.md`, `TODO.md`, `DESIGN_NOTES.md`) are the
exception — they live at the repo root beside the code they describe.

To map the current file tree:

```powershell
Get-ChildItem -Recurse -File | Where-Object {
  $_.FullName -notmatch 'node_modules|\.next|\.git|\.venv|__pycache__|build'
} | Resolve-Path -Relative | Sort-Object
```

---

## Related Documents

Don't duplicate these; read the source when you need the detail.

> ⚠️ **Read the SECTION, not the file.** `TODO.md` and `COMPONENTS.md` are each **larger than this
> whole file**, and `DESIGN_NOTES.md` is about its size — opening one of them whole costs more
> context than every rule you are working from, to answer one question. **All of them are greppable
> by heading; the third column says how.** A whole-file read of any of these is a mistake, not
> thoroughness. **Grep first, then read only the lines you matched.**

**Working docs — these are part of doing the work:**

| Document | Read it when | How to read it |
|---|---|---|
| `STATUS.md` | **First, when picking the project up.** What's shipped, partial, not started, and known-wrong-on-purpose. | Five headings — `## Shipped`, `## In progress / partial`, `## Not started`, `## Known-wrong…`, `## Dead code…`. Read the one that answers your question; the whole file only on a genuine cold start. |
| `TODO.md` | You're about to pick up unbuilt work, or you've hit something that looks broken — check whether it's already logged and whether it's blocked on Gautham. | **Read the index table at the top, then grep `^## N\.` for the one section.** A `§19.12` reference means the heading `## 19.` — sections are numbered and self-contained, with `b`/`c` suffixes (`## 3b.`). |
| `COMPONENTS.md` | **Before you touch a component.** What each file is, and the one thing you'd get wrong without being told. | **Grep the filename** — a single table row is the whole answer. The *Component Registry* index below tells you whether a row exists before you go looking. |
| `DESIGN_NOTES.md` | **Before proposing any layout or visual change to a shared surface.** The measurements behind the rules, and the alternatives already built and rejected. | **Grep `^## N\.` for the § you were sent to.** Sections are numbered and self-contained; a pointer here always names one. |
| `CHANGELOG.md` | You need to know *when* or *why* something changed. Rarely needed to do work. | Newest first under `## YYYY-MM-DD`. Read the top few entries, or grep the feature name. **Never read it whole** — it only grows. |

**Reference docs in `Eventmind_files/` — these exist, and that's all you need to know by default:**

| Document | What's in it |
|---|---|
| `eventmind_prd.md` | Product requirements — long-term plan, goals, feature scope |
| `competitor_analysis.md` | Competitor landscape and positioning |
| `REACT_MIGRATION.md` | Deeper technical handover on the React frontend |

**Open these only when Gautham asks for something from them** — brainstorming a new feature,
weighing whether to build something, or a question about product direction. **Do not read them to
fix a bug, tweak UI, or implement a feature that's already been decided on.** They are large, and
opening one on a normal task is wasted context.

Separately: **don't build a feature that wasn't asked for.** Confirm scope with Gautham first.

---

## Prerequisites

| Tool | Required version | How to check |
|---|---|---|
| Python | 3.10+ | `python --version` |
| Node.js | 20+ (project pins 24.16.0 in `.nvmrc`) | `node --version` |
| pnpm | any recent | `pnpm --version` |

Install pnpm with `npm install -g pnpm`. Git must also be installed.

> **Python version gotcha:** contributors have needed to bump package versions in individual
> `requirements.txt` files to match their interpreter (3.12/3.13). If install or startup fails on a
> dependency, open the failing service's `requirements.txt` and bump the offending pin.

---

## How to Run

Two parts, separate terminals: the **backend** (Python) and the **React frontend** (Node). Both must
run for the app to work.

### Backend — first-time setup

From `eventmind/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python backend\scripts\install_all.py
```

> If PowerShell blocks activation with an execution-policy error, run once:
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

Then seed the database — it starts empty, and without this the discovery page shows "No events
found":

```powershell
python backend\scripts\seed_events.py
```

This seeds **dummy** events for NYC, London, SF, Berlin, Amsterdam, Brussels, Thiruvananthapuram and
online, plus communities for Thiruvananthapuram. Data persists across restarts; re-run only if you
delete `platform_dev.db`.

### Backend — everyday use

**Option A (recommended on Windows):** double-click `start.bat` in `eventmind/`. It opens a terminal
per service with all env vars pre-set and uses the `.venv` Python.

**To stop:** press any key in the main `start.bat` window. If you lost that window, run `stop.bat`.
Stopping the backend does **not** stop the frontend dev server — that's a separate Node process.

> ⚠️ `start.bat` contains real API keys. It is git-ignored and **must never be committed.**

**Option B (cross-platform):** `python backend\scripts\shadow_runner.py` with the venv activated.

Both start every service on SQLite with mocked Kafka and Redis — no Docker needed. Ports are
declared in `shadow_runner.py` / `start.bat`; the gateway is **8000** and is the only one the
frontend talks to.

> **⚠️ The community service must start BEFORE the user service.** Both declare a `communities`
> table in SQLAlchemy — community's schema is the full one, user's is simpler, and `create_all` only
> builds the table once, so whichever starts first wins. Both launchers already order it correctly.
> **Change the startup order and seeding fails with missing-column errors.**

> **Starting a service manually?** Set `PYTHONPATH`, `DATABASE_URL`, `JWT_SECRET`, `MOCK_KAFKA=TRUE`
> and `REDIS_HOST=MOCK` first — see `start.bat` for the exact values.

### Backend on Postgres (optional)

`postgres_runner.py` runs one database per service, matching production. No code or model changes
needed — SQLAlchemy handles both dialects.

```powershell
docker compose up -d postgres          # creates the 8 per-service DBs on first init
python -m pip install psycopg2-binary
python backend\scripts\postgres_runner.py
$env:PYTHONUTF8=1; python backend\scripts\seed_events.py   # UTF8 so seed prints don't crash on cp1252
```

- Only services whose `config.py` declares `DATABASE_URL` get a database. `gateway`, `agents`, `recommendation` and `notification` are stateless.
- **Host port is 55432, not 5432** — `docker-compose.yml` maps `55432:5432` to avoid clashing with a native Postgres. Override via `PG_DSN_BASE`.
- Inspect: `docker compose exec -T postgres psql -U user -d event_db -c "\dt"`.

### Real events from Ticketmaster (optional)

```powershell
# One-time: TICKETMASTER_API_KEY in the project-root .env (free key at developer.ticketmaster.com)
python backend\scripts\migrate_add_source_columns.py
python backend\scripts\migrate_add_currency_column.py   # run AFTER the source migration
python backend\scripts\sync_ticketmaster.py             # full backend must be running
```

- **There is one pipeline.** Fetch + normalisation live in `recommendation/app/services/ticketmaster_ingestion.py`, exposed as `POST /recommendation/ingest-city`. `sync_ticketmaster.py` is a thin launcher over that endpoint — **it duplicates no logic, keep it that way.**
- Ingestion is **idempotent** — upserts via `POST /event/ingest` on `(source, external_id)`. Cron the launcher every 30–60 min for continuous refresh; Celery is not needed yet.
- Aggregated events are **discover-and-redirect** — send users to `event_website` ("Buy on Ticketmaster"), not into native checkout or chat. Native organiser events remain the long-term value.
- The Discovery API caps a query at 1,000 results, so the pipeline slices by classification segment and paginates within each. Ticketmaster segments map onto NewFind categories (Music→Creative, Sports→Networking, …).
- **The ingest is fire-and-forget — never `await` it in the endpoint.** A full city ingest runs ~186s (segment slicing × pagination, above), but the gateway proxies every route on a **30s** timeout, so awaiting it fails *every* call with a misleading `502 … unreachable` while the ingest succeeds underneath. `reco_endpoints` dispatches via `asyncio.create_task` in `_run_ingest()` and returns 202. **Consequence: the 202 carries no `created`/`upserted`/`failed` counts** — poll `/event/search` or read the recommendation service log.
- **`recommendation/main.py` must keep its `logging.basicConfig(level=logging.INFO)`** — without it the root logger has no handler and `_run_ingest`'s completion line (the only report an un-awaited task gives) is silently dropped. Most services still don't configure logging; that's why an app-level `logger.info` can print nothing.
- **The gateway returns `504` on a proxy timeout, not `502`.** `httpx.TimeoutException` subclasses `httpx.RequestError`, so its handler must stay **above** the `RequestError` handler or it is unreachable and a slow-but-healthy service is reported as down again.
- **The home page polls; it does not wait.** `app/page.tsx` re-checks every `INGEST_POLL_MS` (10s) for up to `INGEST_WINDOW_MS` (240s), invalidating the events query so the grid fills as rows land, and only falls back to AI generation if the city is still empty when the window closes. Interval cleared on unmount/city change.
- Respect Ticketmaster's API terms on caching/retention before production.

### Frontend

```powershell
cd "eventmind/frontend_react"
pnpm install                                    # first time only
pnpm --filter @eventmind/web dev:webpack        # http://localhost:3000
```

`apps/web/.env.local` must exist with `NEXT_PUBLIC_API_URL=http://localhost:8000` (copy
`.env.local.example`).

> **⚠️ On low-RAM (8 GB) machines use `dev:webpack`, NOT plain `dev`.** Plain `dev` uses Turbopack,
> which spawns a large parallel worker pool; on 8 GB that exhausts physical RAM, Windows starts
> swapping, and **the entire laptop hangs** (unresponsive mouse — disk thrashing, not a crash). The
> workers then die with `Zone Allocation failed / JavaScript heap out of memory`, leaving orphaned
> `node` processes that pile up across runs. `--max-old-space-size` does **not** help — the limit is
> physical RAM, not the heap. `dev:webpack` spawns ~3 workers instead of hundreds.
>
> This has **nothing to do with the backend** — the dev server uses the same memory either way.

**Add a package:** `pnpm --filter @eventmind/web add <name>` (or `--filter @eventmind/api`).
**Do not add new dependencies without asking.**

### Dummy vs real data mode

Reads can come from local fixtures (no backend) or the live backend, via `NEXT_PUBLIC_DATA_MODE` in
`apps/web/.env.local`:

```
NEXT_PUBLIC_DATA_MODE=dummy   # local fixtures — UI work with no backend running
NEXT_PUBLIC_DATA_MODE=real    # live backend via the gateway (default when unset)
```

- Implemented in `lib/data-source.ts`: pages import `eventsSource` / `communitiesSource` / `communitySource` instead of the `*Api` objects. Same method shapes and `{ data }` envelope, so call sites are identical.
- **Read paths all switch. Of the WRITES, only the event ones do** — `create`, `update` and `duplicate` — because each can carry the organiser-authored extras and dummy mode is the only place those survive. **Payment always hits the real API**: there is no honest fixture for taking someone's money.
  - **`update()`** is the organiser's edit/cancel/publish. An edit writes a row that must already exist, and in dummy mode it does not, so a PATCH would 404 on every fixture id. The dummy branch mutates the fixture object in module memory instead: **an edit made in dummy mode survives navigation and dies on reload.** That is the honest behaviour for a fixture — do not add a localStorage layer to make it look persistent. ⚠️ **It returns a shallow COPY of the fixture, and the spread is load-bearing** — every caller pipes the result into `queryClient.setQueryData(["event", id], …)`, and the cache is already holding that same object, so returning it unchanged writes a referentially-equal value, React Query treats it as no change, and **nothing re-renders even though the write succeeded.** Publish, cancel, edit and the status select all had this. **Any new dummy-mode mutation that mutates in place must return a fresh reference too.** `ownsEvent()` lives beside it for the same reason: who owns an event is answered differently in each mode.
  - **`create()`** backs `/organizer/create`. Real mode POSTs; dummy mode pushes onto `dummyMyEvents`, same module-memory lifetime as an edit — which is what lets the create form's agenda and FAQ editors actually work in the one mode where they can.
  - ⚠️ **BOTH `create()` and `update()` STRIP the five extras in real mode** (`EXTRA_KEYS` — agenda, announcements, faq, offer_name, image_url). There is no column for any of them, so Pydantic would drop them anyway; stripping makes that visible in one place instead of silent in the network tab. It is the **second** lock — the first is that every authoring control is disabled off `EXTRAS_ARE_LOCAL`. **When the columns land, delete BOTH strips AND `EXTRA_KEYS`**, or they will quietly discard the fields they were added to protect.
  - **`eventsSource.duplicate()` is also a create** — `POST /event/` in real mode, a push onto `dummyMyEvents` in dummy. The copy is **always a draft at `tickets_sold: 0`** and drops the original's announcements; see `DuplicateEventModal`.
- Fixtures in `lib/fixtures/` are API-shaped, with dates computed relative to now so badges stay live. In dummy mode geo/city/price/date filters are ignored so the UI is always populated; only online-vs-offline, a loose text query, and `limit` are honoured. The home page also skips Ticketmaster auto-ingest.
- ⚠️ **There is ONE set of dummy events, seen from two sides.** `lib/fixtures/events.ts` exports three arrays: `dummyEvents` + `dummyOnlineEvents` (other organisers' — discoverable and nothing more) and **`dummyMyEvents`**, the eight events the signed-in developer *owns*. The organiser console draws that third array and nothing else, and **`lib/fixtures/organizer.ts` derives every console figure from it** — rooms, earnings, roll-ups, the hero. **Never hand-write a title or a total in `organizer.ts`**; that is exactly how the dashboard ended up describing five events the rest of the app had never heard of. Details in both files' headers.
- ⚠️ **`dummyEventSearch` returns only published, not-yet-finished events**, matching the real endpoint's `status: "published"` default. `dummyMyEvents` deliberately contains a draft and three finished events so the console's Drafts and Past tabs are populated — they must never reach discovery. `eventsSource.get()` still resolves them by id, so the console's "Manage" link opens a real event page for every row.
- **`NEXT_PUBLIC_*` vars are inlined at dev-server start — restart the server after changing the mode.**

---

## Architecture

### Backend

Microservices. **All frontend calls go through the gateway at port 8000** — never call a service
port directly from the frontend. Routing pattern: `GET /event/search` →
`http://localhost:8003/events/search`.

### Frontend

Next.js 16 App Router in `apps/web/`; shared logic in `packages/` (`types`, `store`, `api`) so it
can be reused by the planned mobile app.

- **State:** Zustand, persisted to localStorage — `eventmind-auth`, `eventmind-tickets`, `eventmind-wishlist`, `eventmind-theme`, `eventmind-chat-unread`, `eventmind-ingested-cities`. If login or ticket state looks wrong, clear those keys in DevTools → Application → Local Storage.
- **Auth:** JWT decoded with `atob()` + `JSON.parse()`, no external library. Payload carries `sub` (user UUID, used as the organiser id when creating events), `email`, `role`.
- **Auth guard pattern:** protected pages (`/dashboard`, `/checkout`, `/chat`, `/organizer/*`) redirect to `/auth` when `useAuthStore.isAuthenticated` is false. ⚠️ Most guards race zustand hydration — see `TODO.md` §5. `/chat` and `app/page.tsx` show the correct `_hasHydrated` pattern.
- **Home page:** fetches events near the selected city plus a separate online query (lat/lng 0,0, so online events show regardless of city). On first visit to a new city it auto-calls `recommendationsApi.ingestCity()` once (tracked in `eventmind-ingested-cities`); if that returns 0 events it falls back to `generateEventsForCity()` after 3 s.
- **`isOnlineCity`:** `CITIES[0]` in `location-store.ts` is the "Online" pseudo-city (country `""`, lat/lng 0,0). Use the exported `isOnlineCity(city)` to detect it and switch queries to `category="online"` instead of a geo radius.

> **⚠️ Online is a FORMAT, not a category.** `event_type` (In-Person / Online / Hybrid) and
> `category` (Music / Creative / …) are orthogonal axes. Never encode "online" as a category on the
> events side. The **communities** side is the documented exception — it has no format filter at
> all, so online communities are expressed with the `Online` pseudo-city.

---

## Component Registry

**The registry itself is `COMPONENTS.md`** — one row per file carrying the **gotcha** you would get
wrong without being told. **Read the row for a file before you touch that file. Do not read the
whole document as a matter of course** — it is long on purpose, and most of it is irrelevant to any
one task. Below is the index only: what exists, and what it is for.

⚠️ **Before you build any UI, look for it in this index first.** If a share button, heart, date row,
price chip, badge, rail, dialog chassis, form field or empty state already exists, **import it** — a
second version is a bug even when it looks fine on its own. **One control = one component; if it
must look different somewhere, add a prop — do not fork the file.**

⚠️ **Communities are PARKED for Phase 2 (2026-08-14) — parked, NOT dead.** Every community-shaped
file is intact and still type-checked, but unreachable at runtime: `/community/*` redirects home.
**Do not delete any of it as dead code, and do not add a call site back** — the requirement is that
a user never encounters the word "community" anywhere. The full file list, the `CommunityCarousel`
trap (its importers are commented out, so tooling reads it as unreferenced) and the restore
checklist: `COMPONENTS.md` and `TODO.md` §12.

### The shared systems — import these, never re-implement

| File | What it is |
|---|---|
| `components/EventIcons.tsx` | **The** glyph set — every icon in the app |
| `components/EventActions.tsx` | **The** round controls — share / wishlist / back / arrow, plus the organiser's edit / duplicate / cancel |
| `components/ModalShell.tsx` | **The** dialog chassis — overlay, panel, title row, close, Escape, click-outside, portal |
| `components/FormControls.tsx` | **The** form primitives — `FormField` and `inputCls` |
| `components/EventBadges.tsx` | **The** tags — status tags, the category chip, and `CardTagRow` (the card's chip overlay) |
| `components/DetailCard.tsx` | **The** right-column card on both detail pages, plus `DetailStickyBar` |
| `components/Rail.tsx` | **The** full-bleed horizontal card rail |
| `components/Reviews.tsx` | **The** "Attendee Reviews" block |
| `lib/currency.ts` | **The** price formatter — never hand-write a currency symbol |
| `lib/csv.ts` | **The** CSV download — never hand-roll `values.join(",")` |
| `lib/dev-flags.ts` | **The** developer escape hatches — every one gated on `NODE_ENV === "development"` **and** an env var |
| `lib/layout.ts` | `GUTTERS` — **the** standard horizontal padding |
| `lib/share-event.ts` | **The** share pipeline, both kinds |
| `lib/card-adapters.ts` | API shape → card shape; **the** one place status tags are decided, and `cardImageUrl` |
| `lib/event-extras.ts` | The five organiser-authored extras and their readers — **no backend column for any of them** |
| `lib/event-options.ts` | **The** choice lists behind the event form — category, format, language, audience — shared by create and edit |
| `lib/community-events.ts` | `splitCommunityEvents()` — a community's events → upcoming / previous |

### Cards, grids and rails

| File | What it is |
|---|---|
| `components/EventsCarousel.tsx` | Main events grid + online section; exports `EventCardItem`, the card home / `/explore` actually use |
| `components/CategoryGrid.tsx` | "Browse by category" rail above the footer |
| `components/FeatureBand.tsx` | "Why NewFind" — participant tiles left, organiser tiles right |
| `components/HeroCarousel.tsx` | Split hero on home — copy left, image right |
| `components/SimilarEvents.tsx` | "Similar events" rail on `/event/[id]` |
| `components/CommunityCarousel.tsx` | Community cards on home — ⚠️ **parked, no call sites** |
| `components/CommunityEventsRail.tsx` | "Events in this community" rail — ⚠️ **parked** |
| `components/SimilarCommunities.tsx` | "Similar communities" rail — ⚠️ **parked** |
| `components/CommunityJoinCard.tsx` | The sidebar card on `/community/[slug]` — ⚠️ **parked** |
| `components/CommunityReviews.tsx` | Attendee reviews on `/community/[slug]` — ⚠️ **parked** |
| `components/EventCard.tsx` | ⚠️ **DEAD — nothing imports it** (`TODO.md` §10) |
| `components/ShareButton.tsx` | ⚠️ **Effectively dead** — use `EventActions.tsx` |

### Chrome, chat and shared UI

| File | What it is |
|---|---|
| `components/navbar/Navbar.tsx` | Sticky top nav, 72px — split by audience (Participants / Organisers) |
| `components/ChatPresence.tsx` | Invisible app-wide listener that lights the navbar chat glow |
| `components/EventChatWidget.tsx` | AI chat widget on `/event/[id]` |
| `components/CityPicker.tsx` | City selector — `CITIES[0]` is the Online pseudo-city |
| `components/ShareModal.tsx` | Desktop fallback when the native share sheet is unavailable |
| `components/Footer.tsx` | Site footer — **intentionally not themed** |
| `components/brand/*` | Official logo, wordmark, lockup, loader |

### The organiser console (`/organizer`)

Four sections under one shell — Dashboard, Events, Attendees, Earnings — see `TODO.md` §19 for what
is real and what waits on a backend. **Two sections were removed on 2026-09-01 and neither comes
back without asking:** *Settings* (its payment terms are now a card at the foot of Earnings; its
other three groups are gone) and *Event rooms* (attendee conversation belongs to the chat surfaces,
and the organiser side of that is the backend's job — `TODO.md` §19.1).

| File | What it is |
|---|---|
| `app/organizer/(console)/layout.tsx` | The console shell: rail, page header, **both** auth gates |
| `components/organizer/ConsoleUI.tsx` | **Every shape the four sections share** — card, stat tile, tabs, pill, table shell, empty states |
| `components/organizer/ConsoleSidebar.tsx` | The section nav — one list, two shapes |
| `components/organizer/ConsoleIcons.tsx` | Console chrome glyphs — nav, actions, pagination |
| `components/organizer/useOrganiser.ts` | Who is running the console and whether they may be here |
| `lib/organizer-rows.ts` | `Event` → the console row, plus the Events page's filter and sort |
| `lib/fixtures/organizer.ts` | Dummy console data — **derived from `dummyMyEvents`, never hand-written** |
| `lib/use-today.ts` | Today's date + greeting for the console header |
| `components/organizer/OrganiserViewToggle.tsx` | Organiser view ⇄ participant preview, in the hero's control row |
| `components/organizer/OrganiserEventCard.tsx` | The right-column card an organiser gets **instead of** `BookingCard` |
| `components/organizer/EventStatus.tsx` | The Draft / Live / Registration closed / Cancelled state — editable for the organiser, fixed for everyone else — and `lifecycleOf()` |
| `components/organizer/EditEventModal.tsx` | "Edit details" — the organiser's edit dialog |
| `components/organizer/ListEditor.tsx` | **One** repeating-row editor behind all three authored lists, plus their `SPEC` |
| `components/organizer/EditListModal.tsx` | The dialog and the save wrapped around `ListEditor` |
| `components/organizer/DuplicateEventModal.tsx` | "Duplicate event" — copy the plan into a fresh draft |
| `components/organizer/PublishEventModal.tsx` | "Publish event" — the confirmation on a draft |
| `components/organizer/CancelEventModal.tsx` | "Cancel event" — the confirmation |
| `components/EventSections.tsx` | The three authored blocks in `/event/[id]`'s left column — **public**, the edit control is not |

### Sharing routes

Both kinds produce two branded graphics via `next/og`, no extra dependencies: a **link unfurl**
(`app/<kind>/[id|slug]/opengraph-image.tsx`, 1200×630) and a **story card**
(`.../story/route.tsx`, 1080×1920). Helpers: `lib/event-media.ts`, `lib/event-server.ts`,
`lib/community-server.ts`. ⚠️ **`event-media.ts` also exports `HERO_SCRIM`** — the one definition of
the hero-photo wash, shared by `/event/[id]`, `/community/[slug]` and the organiser dashboard panel.
**Import it; do not paste a fourth gradient.** ⚠️ **Set `NEXT_PUBLIC_SITE_URL` in production.**
Details and the client/server split: `COMPONENTS.md`.

---

## Brand & Design

Clean, minimal, premium — inspired by functionhealth.com (aesthetic) and austoentertainment.com
(palette). **User-friendliness, simplicity and consistency are the top priorities. Do not add
unnecessary complexity, decorations, or features.**

### ⚠️ Consistency is a requirement, not a preference

**The same thing must look and behave the same way everywhere.** A user moving from home to an event
page to a community page should never notice that two different people built them. **This outranks
matching a mockup pixel-for-pixel** — if a mockup conflicts with an established pattern, say so and
ask before diverging.

Before you build any UI:

1. **Search for the pattern before you write it.** If a share button, heart, date row, price chip, badge or empty state exists, **import it**. A second version is a bug, even when it looks fine on its own.
2. **One control = one component.** If a control needs to look different on a new surface, add a **prop** — do not fork the file.
3. **One icon per concept.** A calendar is the same glyph everywhere.
4. **Consistent ≠ identical behaviour by accident.** If two surfaces share a look, they must share the code. Copy-paste is how drift starts.
5. **If you find an inconsistency, report it.** Do not quietly work around it, and do not unilaterally restyle a shared surface — flag it and let Gautham decide, because a "fix" in one place changes every other place.

### Colour

**`globals.css` is the source of truth.** Every brand colour is a `--brand-*` CSS variable defined
once there (light in `:root`, dark in `:root[data-theme="dark"]`). **Do not reintroduce raw brand
hexes in components**, and do not restate the palette in this file — read `globals.css`.

Tokens: `--brand-green`, `--brand-green-hover`, `--brand-on-green` (text/icons **on** a green fill),
`--brand-bg` (page), `--brand-surface` (cards/navbar/inputs), `--brand-text`, `--brand-border`,
`--brand-nav-border`, `--brand-control-border`, `--brand-hint`, `--brand-muted`,
`--brand-terracotta` (+ `-hover`, `--brand-on-terracotta`), `--brand-logo`, `--brand-hero-frame` (the hero photo's frame — green in dark, **transparent in light**, which is how that border is made dark-only).

**Naming convention — what Gautham means:**
- **"green" / "green shade"** → always `#184E4A` (`--brand-green`). Never another green, never Tailwind `green-*`.
- **"white" / "white shade"** → always linen `#F2EFEA`. Pure `#FFFFFF` is only for text on dark or coloured backgrounds.

*(Those two hexes are the only ones stated here, because the rule is meaningless without them.)*

**Three token traps:**
- **`--brand-hint` is NOT gray** and must not be "restored" to one. It is full-contrast text in light, linen in dark.
- **`--brand-muted` is the only genuinely-gray token** — form placeholders and muted *fills* only. Never for ordinary secondary text; it would paint a near-black button in light mode.
- **`--brand-control-border` is for controls, `--brand-border` for non-controls.** Do not "simplify" a control onto `--brand-nav-border` — that's the navbar/card token and far too pale.

Usage: `style={{ color: "var(--brand-text)" }}`, or the `BRAND` string map from `@/lib/theme`, or
Tailwind arbitrary values (`text-[var(--brand-hint)]`). **Alpha tints need
`color-mix(in srgb, var(--brand-green) N%, transparent)`** — a CSS var can't take a hex-alpha suffix.

**Intentionally not themed:** `Footer.tsx`, the `HeroCarousel` letterbox, and semantic accents (badge
colours, star gold, error red, status green/amber, Google/Facebook brand colours).

Theme plumbing: `providers/theme-provider.tsx`, persisted to `eventmind-theme`, with a no-flash
`<head>` script in `layout.tsx`. A neutral dark-gray alternate sits commented out in `globals.css` —
uncomment to switch, no component edits needed.

Rationale for all of the above: `DESIGN_NOTES.md` §7.

### Typography

**One font, one place.** The whole app uses a single font (currently **Roboto**) loaded once in
`layout.tsx` and exposed as `--font-app`; `globals.css` maps it to `body` and Tailwind's
`--font-sans`. **There are no per-component font declarations** — do not re-import a font in a
component or set `fontFamily` inline.

**To swap the font:** change only the two marked lines in `layout.tsx` (the `next/font/google` import
and the loader call). Keep `variable: "--font-app"`. Nothing else touches.

**Font-size floor: 15px.** One rule in `globals.css` raises `text-xs`, `text-sm` and arbitrary
`text-[9px]`…`text-[14px]` to 15px. **Do not add new sub-15px sizes.** Opt out with
`data-keep-type` on an element (and its subtree) whose small type is deliberate.

**Prominent copy above the floor:** page subtitle 18px; empty-state heading 18px with a 16px helper
line. Follow this on new pages. See `DESIGN_NOTES.md` §8.

### ⚠️ The type scale — one scale, whole app

**The console had its own** until 2026-08-22 (everything at the 15px floor, plus 11px uppercase
micro-labels), and that — more than any colour — is what made it read as a different product. It is
now on the scale below, and **so is anything new.** Sizes come from `EventsCarousel`'s card and
`/event/[id]`'s body; the console runs one step quieter where a table genuinely needs it.

| Role | Size | Reference |
|---|---|---|
| Section / page heading | `clamp(…)` **extrabold**, `tracking-[-0.5px]` | `EventsCarousel`'s "Events in {city}"; the console `h1` |
| Card or row title | **20px bold** | the event card's title; a console table row |
| Big figure | **32px extrabold**, `-0.5px` | `StatTile`; the earnings hero goes to 44 |
| Body, table cells | **17–18px** | card meta row 18px; console cells 17px |
| Controls | buttons **18px bold**, filter tabs **20px semibold** | the card's "View details" CTA |
| Labels, counts, sub-lines | **15px** — the floor | `MicroLabel`, `CountBadge` |

**Do not add a `data-keep-type` to squeeze a label in.** If a label competes with its figure, the
figure is too small — that is the mistake the console's 11px labels were compensating for. The only
live opt-out left in the app is `EventCard.tsx` (dead code) and one comment in `FeatureBand`.

### Shape

**⚠️ Every button, chip, toggle and filter control is a rounded rectangle. `rounded-full` is not a
button shape.** The reference is the category chip on the event card — `rounded-lg`, the silhouette
exported as `TAG_SHAPE`.

- **Small controls** (filter chips, category chips, date presets, segmented items): `rounded-lg`. Inside a bordered track, the track is `rounded-lg` and its items `rounded-md` so the inner radius nests.
  - **⚠️ The FILTER TAB is the standing exception, and there are now three of them on one silhouette:** `EventsCarousel`'s two tab rows, the card's "View details" CTA, and the organiser console's `Tabs` + `FilterSelect` — all `rounded-xl` (Gautham, 2026-08-21 and 2026-08-22). **Move them together or not at all, and do not "correct" any of them to `rounded-lg`.**
- **Standard buttons** (CTAs, form submits, search/city/sort controls): `rounded-xl` or `rounded-2xl`.
- **The only legitimate `rounded-full` elements** are things that aren't buttons-with-labels: the round icon controls in `EventActions.tsx`, avatars, count badges, carousel dots, and a toggle switch's knob + track. **Do not add to this list without asking.**

### Borders

**Outline controls on a linen/gray background use `2px solid var(--brand-control-border)`.**

- **⚠️ Bump the ACTIVE state to 2px too.** Most of these swap to a green border when selected; if only the inactive state is 2px, **the control changes size when you click it.**
- `--brand-border` is still correct for **non-controls**: card/panel borders, dividers, `border-t`/`border-b` rules, and form text inputs inside a card. **Do not sweep those to 2px.**
- **⚠️ A CARD is not a control.** The `SeeAllTile` in the carousels sits in the same grid as the event cards and must look identical to them — `2px solid transparent` at rest, green on hover, the transparent border holding the space so it never resizes. It must read as a card, not as a big button.
  - **⚠️ The `/event/[id]` HERO ROW is the one place the token itself changes** (Gautham, 2026-08-31): every control there — Back, wishlist, share, edit, duplicate, cancel, the status chip, the view toggle, Publish — wears `2px var(--brand-hint)` via `EventActions`' exported `HERO_EDGE`, so the edge is brand-black in light and brand-white in dark. `--brand-control-border` is a mid tone in both and reads as no edge at all over a photograph. **Approved and scoped to that row — do not sweep it onto outline controls elsewhere, and do not "correct" it back.** ⚠️ That edge also **greens under the pointer**, on every control in the row — the status chip and the view toggle's track included (`HERO_EDGE_HOVER`, and `hoverEdge` for the round ones, whose ring follows the glyph's tone and so goes *terracotta* on the destructive one).
  - **Two standing exceptions**, both approved and both because a 1px `--brand-border` read as no border at all: `/explore`'s filter sidebar and `FeatureBand`'s cards carry `2px --brand-control-border` at rest. This is not licence to sweep card borders generally — a card that sits in a grid *beside event cards* still follows the `SeeAllTile` rule above.
- **First choice is not to hand-write a border at all.** There is no shared Button component, which is why this treatment had to be applied in ~20 places across 12 files. If you add another outline control, **copy an existing one rather than inventing a third width.**

Dark theme is deliberately not lifted — the blending problem is light-only. See `DESIGN_NOTES.md` §7.

### Hover, spacing, tone

- **Hover:** background → green, text/icon → linen. Used throughout the navbar, dropdowns and cards. Maintain it for new interactive elements. **One approved exception:** `FeatureBand`'s four **organiser** tiles hover **terracotta**, because each half of that band is skinned by one accent and terracotta is the organisers' (Gautham, 2026-08-19). Participant tiles still hover green. Do not sweep the organiser tiles back to green.
  - **⚠️ A TABLE ROW takes an 8% green WASH, not the solid fill** (`.nf-console-row` in `globals.css`) — a row carries status pills and a progress bar, which a solid ground would swallow. Its controls still take the full rule. **The trap that made this necessary: an inline `style` colour BEATS a `hover:` rule**, so the console's every control was inert to the pointer until its tones moved to classes. Third time this has bitten — see also `FeatureBand`'s audience badge and `FilterSelect`'s menu items. **Colour anything that hovers with CLASSES.**
- **Navbar** 72px tall. **Page content and navbar share the same horizontal padding** — import `GUTTERS`.
- **Cards** `rounded-2xl`. **Buttons** `rounded-xl` / `rounded-2xl`.
- **Copy:** conversational but professional. Avoid jargon, keep labels short — "Claim Free Ticket", not "Register for Free Event".

### Responsiveness

**Verified by measurement, not by eye** — `document.scrollWidth === clientWidth` on `/`, `/explore`,
`/event/[id]` and `/community/[slug]` at **320 · 375 · 414 · 768 · 1024 · 1100 · 1280 · 1440 ·
1920**. This had *not* been true before: the claim sat in this file while eleven surfaces carried a
flat `px-12`. **Re-run that sweep after any layout change — 1024px especially, where the navbar
breaks first.**

> ⚠️ **A wider breakpoint does NOT automatically beat a narrower one in this Tailwind v4 build.** Both arbitrary (`min-[1400px]:`) and custom registered (`band:`) media variants are emitted **before** the built-in screens, so `band:grid-cols-7 lg:grid-cols-4` on one element renders **four** columns at 1600px — both match, and `lg` is later in the stylesheet. **Fix by making the ranges disjoint, not by reordering the class string:** bound every narrower step with `max-band:` (`max-band:lg:grid-cols-4 band:grid-cols-7`). `FeatureBand` is the worked example, `--breakpoint-band: 1400px` is registered in `globals.css`, and the trap is written up beside it. This shipped once and read as a layout bug. **Verify in the compiled CSS — do not assume the sort order.**

Standard patterns:

- **Grids:** `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` — all built-in screens, which do sort by width among themselves; only mixing in a custom or arbitrary breakpoint hits the trap above.
- **Horizontal padding:** import `GUTTERS`. Never hand-write the trio.
- **Two-column bodies:** `grid-cols-1 lg:grid-cols-[Nfr_1fr]`, never a bare `gridTemplateColumns` — a hard `fr` ratio has no narrow layout, it just squeezes the sidebar until it overflows.
- **Form rows:** `grid-cols-1 sm:grid-cols-N`. A bare `grid-cols-3` puts three ~100px cells on a phone.
- **Wide tables:** keep the width, wrap in `overflow-x-auto` with `min-w-[720px]`. Six columns have no honest narrow layout; scrolling beats crushing.
- **Full-bleed hero titles:** one line via `heroTitleSize()` on `lg+`; below `lg` the `.hero-title` rule in `globals.css` lets it wrap to 3 lines instead.
- When stacked, `/event/[id]` orders the **booking card above the description** so price/date/Book Now are visible without scrolling past the reviews.

---

## Performance Rules

- **Use `next/image` for images.** The one deliberate exception is `HeroCarousel`, which needs `<img>` because its wipe relies on `clip-path` (eslint-disabled inline). **Do not "fix" it.** Any new `<img>` needs the same kind of justification.
- **Use `next/link` for internal navigation.** Never a bare `<a>`.
- **Always give `<Image>` a meaningful `sizes` prop** — do not leave the default.
- Lazy-load below-the-fold components with `next/dynamic` where appropriate.
- **Do not add npm dependencies without asking.** Do not import from `node_modules` paths that aren't in `package.json`.

---

## Contribution Guidelines

1. **(MANDATORY) Update `STATUS.md`** whenever something moves between shipped / partial / not started, or is reverted. **Rewrite the section in place — never append.** It describes the present only, so a stale entry there is a bug.
2. **Add to `CHANGELOG.md` only for a meaningful change** — a feature landing, a decision, a revert — **one short line**, newest first. **Not** every file edit. Skip it entirely for small tweaks, refactors and work in progress, and **never log churn reverted in the same session.** Unsure? Then it isn't meaningful — update `STATUS.md` and skip the changelog.
3. **Update this file only for things still true tomorrow** — conventions and gotchas. It is instructions, not a record and not a status board. "What I did" → `CHANGELOG.md`; "what state it's in" → `STATUS.md`; "what's left" → `TODO.md`; "why it looks like that" → `DESIGN_NOTES.md`.
4. **Update `COMPONENTS.md`** when a component is created or its purpose changes — one row, and only the gotcha someone would get wrong without it. Not a description of the work. **Add the file to this file's *Component Registry* index too** (one short line, no gotcha), or it exists in the registry and nowhere anyone will look. ⚠️ **A row that has grown into an essay is a bug** — the reasoning belongs in `DESIGN_NOTES.md` with a pointer left behind. The registry hit 67 KB before it was split out; **keeping it small is what keeps it read.**
5. **Run `pnpm --filter @eventmind/web type-check` before finishing** — mandatory, with the one narrow exception stated in *Execution Rules*. **Lint and visual verification are conditional; their conditions are stated there too.** Do not restate any of the three here — one definition or they drift.
6. **Match the brand system** — tokens from `globals.css`, one font, no new colours or fonts without approval.
7. **Save new project documents to `Eventmind_files/`**, not inside `eventmind/`.
8. **Never commit `.env.local`, `.env` or `start.bat`** — all git-ignored, all hold secrets.
9. **Keep Node at v20+** — `.nvmrc` pins 24.16.0; run `nvm use` inside `frontend_react/`.
10. **If you delete `platform_dev.db`** — restart all services first (so the community service creates the `communities` table), then re-run `seed_events.py`.
11. **Always stop the dev server with `Ctrl+C` in its terminal** — never just close the window. Killing the terminal on Windows orphans the Next.js worker processes; they accumulate across runs (we once found 321 zombie `node` processes), eat RAM, and cause heap-allocation crashes on later runs. Clean up orphans after a crash:
    ```powershell
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'next' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    ```
12. **Never attribute commits to a tool.** No `Co-Authored-By:` trailers for AI assistants, no "Generated with…" lines, no tool attribution in commit messages or PR descriptions. **Biswajith and Gautham are the only contributors on this repo.**
13. **⚠️ STRIP THE DEV BYPASS BEFORE DEPLOYING.** `lib/dev-flags.ts` holds the developer escape hatches — today `SKIP_ORGANIZER_VERIFICATION`, which opens `/organizer/create` with no verified organiser profile and adds a dev strip to `/organizer/onboarding`. **Remove all of it as part of shipping**, in this order:
    1. Delete `lib/dev-flags.ts`.
    2. In `app/organizer/create/page.tsx` — drop the import, reset `verificationChecked` to `useState(false)`, delete the early return in the gate effect, and put the back button back to a plain `router.back()`.
    3. In `app/organizer/onboarding/page.tsx` — drop the import, delete the early return that suppresses the verified-organiser redirect, and delete the dashed dev strip above the header.
    4. Remove `NEXT_PUBLIC_SKIP_ORGANIZER_VERIFICATION` from `.env.local.example` and from every developer's `.env.local`.
    5. Delete the `lib/dev-flags.ts` row from `COMPONENTS.md` and from this file's *Component Registry*, and this guideline with them.

    **What this is NOT:** it is not a live hole in production. Every flag is `NODE_ENV === "development" && <env var>`, both halves statically replaced at build time, so a production build already evaluates each to `false` and the bundler drops the code behind it — **setting the env var in a deploy environment does nothing.** This item is hygiene, and it is here so the removal is a deliberate step rather than something a release discovers. **The corollary matters more than the checklist: if you ever find a flag in that file missing its `NODE_ENV` half, that one IS a live bypass — fix it before anything else ships.**

---

## Keeping this file true

This file is only worth its tokens if every line is still correct — **and if there are not too many
of them.** Four rules, in priority order:

- **⚠️ THE BUDGET IS 75 KB. Over it, extract a section — do not trim sentences.** Check with
  `(Get-Item CLAUDE.md).Length/1KB`. Nothing enforces this by itself, so **check it whenever you add
  more than a line or two here**; a session that never measures will never notice. **Extraction is
  the move, not compression:** the registry left for `COMPONENTS.md` on 2026-08-31 and took 60 KB
  with it, while every gotcha survived intact. Next in line if the ceiling is hit again: *How to
  Run*'s optional halves (Ticketmaster, Postgres, dummy-vs-real) into a `RUNNING.md`, then *Brand &
  Design*'s rationale into `DESIGN_NOTES.md` — **keeping the rule here and the reasoning there.**
  ⚠️ **Every addition to this file feels individually justified; that is exactly how it reached
  104 KB.** The question is never "is this line worth adding" but "is it worth adding *here*,
  where every session pays for it on every turn."

- **Point at the source of truth; don't copy it.** Colours, fonts, ports, limits and env vars are *defined* in `globals.css`, `layout.tsx`, `start.bat`, `config.py`, `.env.example`. **Name the file instead of restating the value** — a pointer can't rot, a copy silently does. **This is the strongest rule here:** it makes a whole class of drift structurally impossible.
- **Verify before you write.** Check any factual claim against the code — not against memory, and not against what another section of this file says. A wrong line will happily propagate itself.
- **Correct in place; never append.** When a rule changes, **edit the original sentence.** Do not add "actually, now…" underneath it. `CHANGELOG.md` is where the before/after belongs; this file states only what is true right now.

> **Worked example of the failure this prevents:** this file pointed every session at
> `Eventmind_files/eventmind_prd.md` and `Eventmind_files/REACT_MIGRATION.md` — including a
> "read the PRD before building any new feature" instruction — while its own layout diagram put that
> folder one level too deep. **Every one of those pointers resolved to nothing**, and had for a long
> time. It also told sessions to *"add anything that would help the next session"*, which is
> how the file reached 103 KB and ~26k tokens per session. Both corrected 2026-08-10.

