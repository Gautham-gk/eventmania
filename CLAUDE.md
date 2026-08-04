# NewFind (EventMind) — Project Handover for Claude

> You are picking up an active project. Read this file fully before making any changes.
> When you make a meaningful contribution, update this file and save any new reference documents to `Eventmind_files/`.

> **⚠️ Folder name has a space:** The parent folder is called `Event mind` (with a space). Always wrap paths in quotes in the terminal, e.g. `cd "c:\...\Event mind\eventmind"`. Forgetting the quotes will break commands silently.

---

## Execution Rules (read before every task)

- Before starting any task, identify the exact files needed. Open **only** those files.
- Do **not** explore the full project structure unless explicitly asked.
- Do **not** read `node_modules`, `.next`, `.venv`, `.dart_tool`, or any build/cache directories.
- Do **not** re-read files you have already read in this session.
- If a task touches only one component, open only that component file.
- Always run `pnpm --filter @eventmind/web type-check` after any TypeScript changes. Do not report a task done if type-check fails.
- After completing a task, list only the files you modified.
- **Before building anything complex, state your interpretation of the task and ask Gautham to confirm before proceeding.** This is especially important when: an image or asset is uploaded (do not hand-draw or reconstruct it — ask how to use it), the request is ambiguous, or the implementation could go several different ways. A brief "Here's what I'm planning — does that sound right?" prevents wasted effort.

---

## What Is NewFind?

NewFind (formerly EventMind internally) is an AI-powered event discovery platform — think Eventbrite meets Meetup, with an AI layer for personalised recommendations and community matching. Users can discover events, register, buy tickets, and chat with other attendees. Organisers can create and manage events.

The project is mid-build. The frontend is a React/Next.js web app (`frontend_react/`). It was originally migrated from a Flutter Web prototype; that Flutter app has since been **deleted** and no longer exists in the repo.

> **Important:** This is React/Next.js — NOT React Native. React Native is a mobile framework. This project is a Next.js web app. Do not confuse the two.

---

## Repository Layout

```
Event mind/
└── eventmind/
    ├── frontend_react/        ← React/Next.js (the frontend)
    │   ├── apps/web/          ← Next.js app
    │   └── packages/          ← shared types, store, api
    ├── backend/               ← FastAPI microservices
    │   ├── gateway/           ← API gateway (port 8000)
    │   ├── services/          ← auth, event, chat, payment, community, etc.
    │   └── scripts/           ← shadow_runner.py, seed_events.py
    ├── start.bat              ← Windows launcher (replaces shadow_runner.py — see below)
    └── CLAUDE.md              ← this file

Eventmind_files/               ← all project documents live here
    ├── eventmind_prd.md       ← full Product Requirements Document
    ├── competitor_analysis.md
    └── REACT_MIGRATION.md     ← React frontend technical handover (read this too)
```

**Important:** All project documentation goes into `Eventmind_files/`, not inside `eventmind/`. Keep those folders separate.

---

## Project Structure

Run this once to map the project (Windows PowerShell). Update this section whenever new files are added.

```powershell
Get-ChildItem -Recurse -File | Where-Object {
  $_.FullName -notmatch 'node_modules|\.next|\.git|\.venv|__pycache__|\.dart_tool|build'
} | Resolve-Path -Relative | Sort-Object
```

Current snapshot (last updated this session):

```
frontend_react/apps/web/src/
├── app/
│   ├── auth/page.tsx
│   ├── chat/[roomId]/page.tsx
│   ├── checkout/[id]/page.tsx
│   ├── communities/page.tsx            ← community listing page (fully built)
│   ├── community/[slug]/page.tsx       ← community detail page (fully built)
│   ├── community/create/page.tsx       ← create community page (fully built)
│   ├── dashboard/page.tsx
│   ├── event/[id]/page.tsx
│   ├── explore/page.tsx                ← explore/browse page
│   ├── globals.css
│   ├── layout.tsx
│   ├── organizer/create/page.tsx
│   ├── organizer/my-events/page.tsx    ← organiser's own events list
│   ├── organizer/onboarding/page.tsx   ← organiser onboarding flow
│   ├── organizer/page.tsx
│   └── page.tsx                        ← home / discovery page (fully API-driven)
├── components/
│   ├── CityPicker.tsx                  ← city selector dropdown
│   ├── EventCard.tsx                   ← card used in the main events grid (API-driven)
│   ├── EventChatWidget.tsx             ← AI chat widget on event detail page
│   ├── EventsCarousel.tsx              ← main grid + online events section (API-driven)
│   ├── CommunityCarousel.tsx           ← community cards carousel (API-driven)
│   ├── Footer.tsx                      ← site footer (green bg, brand links, social icons)
│   ├── HeroCarousel.tsx                ← rotating hero banner
│   └── navbar/Navbar.tsx
├── lib/
│   ├── api-config.ts
│   ├── card-adapters.ts               ← toCarouselEvent() + toCommunityItem() adapters
│   ├── data-source.ts                 ← DUMMY (fixtures) vs REAL (live API) switch — see below
│   └── fixtures/                      ← dummy events.ts + communities.ts (API-shaped)
└── providers/query-provider.tsx

frontend_react/packages/
├── api/src/        ← Axios client + per-service API functions
│   ├── communities.ts     ← communitiesApi: search/get/create with full fields (used by home page)
│   ├── community.ts       ← communityApi: organizer CRUD + getBySlug (used by /communities pages)
│   ├── events.ts          ← eventsApi
│   ├── auth.ts            ← authApi
│   ├── organizer.ts       ← organizerApi
│   ├── payments.ts        ← paymentsApi
│   ├── recommendations.ts ← recommendationsApi incl. ingestCity() + generateEventsForCity()
│   └── reviews.ts         ← reviewsApi
├── store/src/      ← Zustand stores
│   ├── auth-store.ts
│   ├── tickets-store.ts
│   ├── wishlist-store.ts  ← wishlist (fully functional, persisted as "eventmind-wishlist")
│   └── location-store.ts  ← city picker state, CITIES list, DEFAULT_CITY=New York. CITIES[0] is the "Online" pseudo-city (country "", lat/lng 0,0); use exported isOnlineCity(city) to detect it and switch queries to category="online" instead of a geo radius.
└── types/src/      ← shared TypeScript interfaces

backend/
├── gateway/main.py                     ← API gateway (port 8000)
├── scripts/shadow_runner.py            ← starts all services (alternative to start.bat)
├── scripts/seed_events.py              ← seeds SQLite with dummy events + communities
└── services/
    ├── auth/           (port 8001)
    ├── community/      (port 8011)     ← ⚠️ MUST start before user service (see below)
    ├── user/           (port 8002)
    ├── event/          (port 8003)
    ├── ticketing/      (port 8004)
    ├── payment/        (port 8005)
    ├── notification/   (port 8006)
    ├── chat/           (port 8007)
    ├── recommendation/ (port 8008)
    ├── review/         (port 8009)
    └── agents/         (port 8010)
```

---

## Prerequisites

Install these before doing anything else. If you already have them, skip ahead.

| Tool | Required version | How to check |
|---|---|---|
| Python | 3.10 or higher | `python --version` |
| Node.js | 20 or higher (project uses 24.16.0, see `.nvmrc`) | `node --version` |
| pnpm | any recent version | `pnpm --version` |

**Install pnpm** (if not already installed):
```powershell
npm install -g pnpm
```

Git must also be installed. Everything else is handled by the setup steps below.

---

## How to Run

There are two parts to run: the **backend** (Python) and the **React frontend** (Node.js). Run them in separate terminals. Both must be running for the app to work.

---

### Backend — First-Time Setup

Do this once when you first clone the project.

**Step 1 — Create a virtual environment**

A virtual environment keeps the project's Python packages isolated from your system. Run this from inside the `eventmind/` folder:

```powershell
cd "c:\Users\...\Event mind\eventmind"   # navigate to the eventmind folder
python -m venv .venv
```

This creates a `.venv` folder inside `eventmind/`. You only do this once.

**Step 2 — Activate the virtual environment**

Every time you open a new terminal to work on the backend, activate it first:

```powershell
.\.venv\Scripts\Activate.ps1
```

You'll see `(.venv)` appear at the start of your terminal prompt. That means it's active.

> If PowerShell blocks the script with an "execution policy" error, run this first (one time only):
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

**Step 3 — Install all backend dependencies**

With the venv activated, run the installer script. It walks through every service and installs all required packages:

```powershell
python backend\scripts\install_all.py
```

This may take a few minutes the first time. You only need to re-run it if new packages are added to any `requirements.txt`.

> **Python version note:** Some contributors have needed to manually bump certain package versions in the `requirements.txt` files to match their Python version (e.g. Python 3.12 or 3.13). If you get a dependency error during install or startup, open the `requirements.txt` of the failing service and upgrade the version of the conflicting package.

---

### Backend — Everyday Use

**Option A (recommended on Windows) — double-click `start.bat`**

`start.bat` is in the `eventmind/` root. Double-click it — it opens a separate terminal window for each service with all environment variables pre-set (API keys, database path, mock flags). It uses the `.venv` Python automatically.

**To stop the backend:** in the main `start.bat` window, press any key — it kills all uvicorn services and closes their windows. If you lost that window (e.g. closed it with X), run `stop.bat` (also in `eventmind/` root) to kill all services. Closing the service windows with the X icon individually leaves no orphaned ports, but is tedious. Note: stopping the backend does **not** stop the frontend dev server (port 3000) — that is a separate Node process; Ctrl+C its own terminal.

> ⚠️ `start.bat` contains real API keys — it is in `.gitignore` and must never be committed to git. Each developer keeps their own local copy.

**Option B — shadow_runner.py (cross-platform alternative)**

```powershell
cd "eventmind/"
.\.venv\Scripts\Activate.ps1
python backend\scripts\shadow_runner.py
```

Both options start all services on SQLite with mocked Kafka and Redis — no Docker needed:

| Service | Port | Notes |
|---|---|---|
| API Gateway | 8000 | |
| Auth | 8001 | |
| Community | 8011 | ⚠️ Must start BEFORE User service |
| User | 8002 | |
| Event | 8003 | |
| Ticketing | 8004 | |
| Payment | 8005 | |
| Notification | 8006 | |
| Chat (WebSocket) | 8007 | |
| Recommendation | 8008 | |
| Review | 8009 | |
| Agents | 8010 | |

> **⚠️ Community service MUST start before User service.** Both services define a `communities` table in SQLAlchemy. The community service (port 8011) has the full schema (`location`, `member_count`, `price`, `status`, `next_event_date`). The user service (port 8002) has a simpler schema. SQLAlchemy's `create_all` only creates the table once — whichever service starts first wins. `start.bat` and `shadow_runner.py` both start community before user for this reason. If you ever change startup order, seeding will fail with missing column errors.

> **Known manual startup issue (Windows):** If starting a service manually (not via start.bat or shadow_runner.py), set these env vars first:
> ```powershell
> $env:PYTHONPATH = "C:\...\Event mind\eventmind"
> $env:DATABASE_URL = "sqlite:///C:\...\Event mind\eventmind\backend\platform_dev.db"
> $env:JWT_SECRET = "<value from .env>"
> $env:MOCK_KAFKA = "TRUE"
> $env:REDIS_HOST = "MOCK"
> ```

**Step 4 (first time only) — Seed the database with dummy events**

The database starts empty. Without seeding, the discovery page will show "No events found." Run this once after the backend is up for the first time:

```powershell
# In a new terminal, with venv activated, from the eventmind/ folder:
python backend\scripts\seed_events.py
```

This seeds **dummy/fake events** for NYC, London, SF, Berlin, Amsterdam, Brussels, Thiruvananthapuram, and online — plus communities for Thiruvananthapuram. These are not real events; they exist only so the UI has something to display during development.

You only need to do this once per fresh database. The data persists across restarts. If you delete `platform_dev.db` and restart, re-run the seed script.

**Step 5 (optional) — Populate real events from Ticketmaster**

To fill the catalogue with real, ticketed events (concerts, sports, theatre) for the launch cities, sync from the Ticketmaster Discovery API:

```powershell
# One-time: add your free key to the project-root .env (see .env.example)
#   TICKETMASTER_API_KEY=your_key_here   (get one at developer.ticketmaster.com)

# One-time: add the provenance columns to an existing dev DB
python backend\scripts\migrate_add_source_columns.py

# One-time: add the currency column to an existing dev DB. Run this AFTER the
# source-columns migration above — it backfills Ticketmaster rows to USD, and
# skips that backfill (with a warning) if `source` does not exist yet.
python backend\scripts\migrate_add_currency_column.py

# Sync (full backend must be running — gateway + recommendation service).
python backend\scripts\sync_ticketmaster.py
python backend\scripts\sync_ticketmaster.py --city London --radius 150
```

**How aggregated events work:**
- There is **one** Ticketmaster pipeline. The fetch + normalisation logic lives in `backend/services/recommendation/app/services/ticketmaster_ingestion.py`, exposed as `POST /recommendation/ingest-city?city=&lat=&lng=&radius=` (the frontend city picker calls this on-demand). `backend/scripts/sync_ticketmaster.py` is just a thin launcher that calls that endpoint for each launch city — it does not duplicate any logic.
- Every `events` row now carries `source` (`"native"` for organiser events, `"ticketmaster"` for synced), `external_id` (provider id), and `image_url`.
- Ingestion is idempotent — the pipeline upserts via `POST /event/ingest` on `(source, external_id)`, so re-running updates rather than duplicates. Cron the launcher (every 30–60 min) for continuous refresh; Celery is not needed at this stage.
- Aggregated events are **discover-and-redirect**: the frontend should send users to the event's `event_website` ("Buy on Ticketmaster") rather than into the native checkout/chat flow. Treat them as top-of-funnel; native organiser events remain the long-term value. Respect Ticketmaster's API terms on caching/retention before production.
- The Discovery API caps any single query at 1,000 results, so the pipeline slices by classification segment and paginates within each. Ticketmaster segments are mapped onto EventMind categories (Music→Creative, Sports→Networking, …) so aggregated events sit alongside native ones.

---

### React Frontend — First-Time Setup

You need Node.js (v20+) and pnpm installed. If you don't have pnpm:

```powershell
npm install -g pnpm
```

Then install all frontend dependencies (once):

```powershell
cd "eventmind/frontend_react"
pnpm install
```

Make sure `apps/web/.env.local` exists with:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
(There is an `.env.local.example` file you can copy and rename.)

### React Frontend — Everyday Use

```powershell
cd "eventmind/frontend_react"
pnpm --filter @eventmind/web dev:webpack
# Opens at http://localhost:3000
```

#### Dummy vs Real data mode (frontend without a backend)

Events & communities can be sourced from **local fixtures** (no backend needed) or the **live backend**, toggled by `NEXT_PUBLIC_DATA_MODE` in `apps/web/.env.local`:

```
NEXT_PUBLIC_DATA_MODE=dummy   # local fixtures — beautify/UI work, no backend running
NEXT_PUBLIC_DATA_MODE=real    # live backend via the gateway (default when unset)
```

- Implemented in [`src/lib/data-source.ts`](frontend_react/apps/web/src/lib/data-source.ts): pages import `eventsSource` / `communitiesSource` / `communitySource` instead of `eventsApi` / `communitiesApi` / `communityApi`. Same method shapes + `{ data }` envelope, so call sites are identical. Only **read** paths switch; mutations (create/pay) always hit the real API.
- Dummy data lives in [`src/lib/fixtures/`](frontend_react/apps/web/src/lib/fixtures/) as API-shaped `Event[]` / `Community[]` (dates computed relative to now so badges stay live). In dummy mode geo/city/price/date filters are ignored so the UI is always populated; only online-vs-offline (category `"online"`), a loose text query, and `limit` are honoured.
- `NEXT_PUBLIC_*` vars are inlined at dev-server start — **restart the dev server after changing the mode.**
- Switched surfaces: home (`/`), `/explore`, `/event/[id]`, `/checkout/[id]`, `/community/[slug]`. In dummy mode the home page also skips the Ticketmaster auto-ingest.

> **⚠️ On low-RAM (8 GB) machines, use `dev:webpack`, NOT plain `dev`.**
> The default `pnpm --filter @eventmind/web dev` uses **Turbopack**, which spawns a large
> parallel worker pool to compile routes. On an 8 GB machine that exhausts physical RAM, so
> Windows starts swapping to disk and the **entire laptop hangs** (unresponsive mouse/windows —
> that's disk thrashing, not a crash). The workers then die with `Zone Allocation failed /
> JavaScript heap out of memory`, leaving orphaned `node` processes that pile up across runs.
> `--max-old-space-size` does NOT help (the limit is physical RAM, not the heap).
>
> **Always run the webpack dev server instead** — it spawns ~3 workers instead of hundreds:
> ```powershell
> pnpm --filter @eventmind/web dev:webpack
> ```
>
> Note: whether the laptop hangs has **nothing to do with the backend**. The frontend dev server
> uses the same memory with or without the backend running — a missing backend only makes API
> calls fail *inside the page*, it does not hang the machine.

---

## Architecture

### Backend
Microservices architecture. All API calls from the frontend go through the gateway at port 8000, which routes to the appropriate service. Do not call individual service ports directly from the frontend.

Gateway routing pattern: `GET /event/search` → `http://localhost:8003/events/search`

### React Frontend (Turborepo monorepo)
```
frontend_react/
├── apps/web/                  ← Next.js 16, App Router, TypeScript, Tailwind v4
└── packages/
    ├── types/                 ← shared TypeScript interfaces
    ├── store/                 ← Zustand stores (persisted to localStorage)
    └── api/                   ← Axios client + per-service API functions
```

All pages are in `apps/web/src/app/`. Shared logic goes into `packages/` so it can later be reused by the mobile app (planned).

Auth state and tickets are stored in Zustand, persisted to localStorage under the keys `eventmind-auth` and `eventmind-tickets`. If something looks wrong with login or ticket state, clear those keys in DevTools → Application → Local Storage.

The JWT access token payload contains `sub` (user UUID), `email`, and `role`. The `sub` field is used as the organiser ID when creating events.

**Adding a new npm package** to the web app:
```powershell
pnpm --filter @eventmind/web add <package-name>
# or to a shared package:
pnpm --filter @eventmind/api add <package-name>
```

Environment variable — create `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Component Registry

Keep this updated as components are created or significantly changed.

| File | Purpose | Notes |
|---|---|---|
| `components/EventsCarousel.tsx` | Main events grid + online events section | API-driven via `toCarouselEvent()`. Exports `CarouselEvent` type **and `EventCardItem`** — the card actually used by home, `/explore` and `/community/[slug]` (not `EventCard.tsx`). Accepts `events`, `isLoading`, `onBookNow`, `locationSlot` props. Share/wishlist come from `EventActions.tsx` and date/time/location icons from `EventIcons.tsx`; it no longer defines its own of either. The card's meta row is **icon-delimited** — calendar+date, clock+time, pin+venue with **no `·` separators** (they were dropped when the clock was added, since every field now carries its own glyph). The row is **packed left** (`gap-1.5`, date/time `shrink-0`). Spreading it (`justify-between`: date pinned left, venue pinned right, time in the slack) was **built and reverted — Gautham looked at it and said it looked bad**. Thirds (`grid-cols-3`, truly centred time) was rejected before that on measurement: at `xl:grid-cols-4` a third is ~95px but date+icon needs ~119px, so it truncates the date. **Don't re-propose either without new information.** `OnlineEventCard` carries the identical row (its third glyph is `VideoCallIcon`, not the pin); **change both together or they drift**. |
| `components/SimilarEvents.tsx` | The "Similar events" horizontal rail at the bottom of `/event/[id]`. | **One of the app's two horizontal scrollers** (the other is home's `CategoryGrid` rail, which copies this file's clip-room fix) — every other surface (home's event/community grids, `/explore`, `/community/[slug]`) is a grid. Cards are `EventCardItem` from `EventsCarousel`, so a card here is byte-identical to one on home; the loading state is that file's **now-exported `SkeletonCard`**, for the same reason. **The section is deliberately FULL-BLEED** — rendered as a sibling *after* the page's `maxWidth:1400` column, carrying home's own `px-4 sm:px-6 lg:px-12` gutters (`GUTTERS`). That is what lets **a row of four fill without scrolling at home's card size**; inside the capped column four cards only fit by shrinking to ~311px, narrower than home at every width. The trade Gautham accepted: above 1400px viewport the section's edges sit outside the column above it (~260px at 1920), and the full-width divider is what makes that read as a section break rather than a misalignment. **Card width then reproduces the home grid's cell exactly** via `CARD_BASIS` — `basis-full sm:basis-[calc((100%-20px)/2)] xl:basis-[calc((100%-60px)/4)]`, mirroring `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` + `gap-5`. **⚠️ Percentages, NOT `100vw`.** An earlier viewport-based version was wrong twice: it had to double-count padding (needing a 4th `lg` breakpoint for home's px-6→px-12 step), and `100vw` **includes the vertical scrollbar** while a container's width excludes it — so four cards came to ~15px more than the row could hold and the fourth clipped into a scroll. Percentages have neither problem, and work only *because* the section is full-bleed with home's gutters, making both containers the same width. Verified: **4 cards, zero scroll, arrows hidden, card width 321px @1440 and 441px @1920 — identical to home at both**; 6 cards overflow and the arrows appear. A first pass used a fixed 320px — it matched home only at 1440px and Gautham spotted it as "smaller"; **do not go back to a fixed width, and do not move this back inside the capped column.** Equal height comes from `items-stretch` + `[&>a]:h-full`, which reproduces the grid row's stretch (verified: three cards with 24/25/27-char titles all render 327px). Card height itself stays content-driven, exactly as on home — do NOT pin a fixed height, it would clip long titles. **⚠️ The rail's vertical padding (`paddingTop: 24` / `paddingBottom: 40`) is CLIP ROOM, not spacing — that is why `-mt-6 -mb-10` cancel it exactly.** `overflow-x: auto` forces the block axis to compute to `auto` as well (CSS overflow spec: one non-visible axis makes the other non-visible), so the rail clips vertically too; the card's 6px hover lift + 2px border was being cut off, which showed up as a **missing top border on hover** (the home grid never shows this — a grid has no overflow container). Delete the padding and the bug returns; re-check the numbers if the card's hover lift or shadow changes. **Two queries, merged:** same `category` within `RADIUS_KM = 100` of **the viewed event's own coordinates** (NOT the city picker — a Berlin event must suggest Berlin events no matter what the picker says; the picker is only the fallback), plus a separate `event_type: Online` query in the same category, because online events carry no real coordinates and any radius search drops them. Nearby first, then online, deduped by id (a **Hybrid** event matches both queries) with the current event filtered out, capped at `MAX_CARDS = 12`. `eventCoords()` treats **lat/lng 0,0 as "no coordinates"** — that is where failed Ticketmaster geocoding lands (see "What Is Not Built Yet"), and it is a real point in the Atlantic, so a radius search around it returns nothing useful. **Renders `null` — including its own top divider — when there is nothing to suggest**, so an empty rail never leaves an orphaned rule on the page; keep the divider inside the component if you move it. Scroll is **arrow buttons + `scrollbar-hide`** (Gautham's call over a visible native bar, which is a grey Windows bar on linen); the arrows sit in the section header rather than as overlays on the row, so they never cover a card's own hover share/wishlist controls, and they **hide entirely when the rail does not overflow** (verified: 3 cards at 1440px do not overflow, so no arrows appear; at 900px they do). |
| `components/CommunityCarousel.tsx` | Community cards carousel on the home page | API-driven via `toCommunityItem()`. Exports `CommunityItem` **and `CommunityCardItem`** (the card `/explore` renders). **Owns no chrome of its own any more** — status tags come from `EventBadges.tsx`, share + wishlist from `EventActions.tsx` (`kind="community"`), so a community card is visually identical to an event card. It used to keep private copies of all three (`BADGE_CONFIG`, `ShareButton`, `HeartButton`) and that is exactly how the two drifted; **do not re-add them.** Both card variants show, on hover over the image, the **category chip bottom-left + status tag bottom-right**, the same pairing the event cards use. |
| `components/CategoryGrid.tsx` | **"Browse by category"** — the two-row, horizontally scrolling category rail directly above the footer on home. | A category tile is deliberately an **event card with its content swapped out**: same `rounded-2xl` chassis, same linen body, same borderless-at-rest → `2px` green border + 6px lift on hover, same `aspect-video` image. **If `EventCardItem`'s hover or radius changes, change it here too.** **Layout is `grid grid-rows-2 grid-flow-col` in an `overflow-x-auto` rail — TWO ROWS, four columns visible, the rest reached by scrolling right** (Gautham's call; an earlier 3-row wrapped grid with a 12th "View all" tile was **built and replaced — do not put the See-all tile back**). Columns are sized to the home grid's cell (`auto-cols-[100%] sm:…/2 xl:…/4`, same percentage maths as `SimilarEvents` — see the long note there for why percentages and never `100vw`), so a tile is **exactly as wide as an event card above it: measured 321px at 1440px, identical to home**. It carries the **same clip-room fix as `SimilarEvents`** (`paddingTop: 24` / `paddingBottom: 40` cancelled by `-mt-6 -mb-10`) because `overflow-x: auto` clips the block axis too and would cut the hover lift's top border. The tile's colour is **not a new decision** — it is the category's own accent from `categoryStyle()` in `EventBadges.tsx`, the exact colour its chip already uses, washed over the photo at 62% opacity, lightening to 40% on hover so the picture reads. **Never hardcode a tile colour here.** **Body row = the event card's price + "View details" row**: the shared `CategoryBadge` where the price sits, and an **Explore** button (`--brand-green`, "for the time being" per Gautham) where "View details" sits. The chip's linen fill dissolves into the linen card body in light mode — which is exactly the "icon + name in the category's colour" it is meant to read as — and shows as a chip against the dark body in dark mode, where the accents (picked to sit ON linen) would otherwise be unreadable. **Measured: the longest chip, "Health & Wellness", needs 282px of the 285px a 4-across body gives it** — nothing clips, but that is 3px of headroom, so **re-measure if the chip or button type size changes**. The Explore button is a `<span>`, not a `<button>`: the whole tile is already a link to the same destination, so a nested control would be a second tab stop doing the same thing. **Scroll arrows** are `EventArrowButton` from `EventActions.tsx` at `size="lg"` — the `/event/[id]` back button's exact chrome, pointing the way they scroll. They **fade in on hover of the section** (and on focus-within, or a keyboard user would have an invisible tab stop), sit **over the rail's left/right edges on the seam between the two rows** rather than in the header where `SimilarEvents` keeps its own — safe here because a category tile carries no hover controls of its own to cover — and **do not render at all when the rail does not overflow**. Their offsets are GUTTERS + 8px at each step because an absolutely positioned child resolves against its ancestor's *padding box*, i.e. the page edge, not the rail edge. Tiles are the **11 categories `/explore` filters on, in its own order** — keep this list and `CATEGORIES` in `app/explore/page.tsx` in step, or a tile lands on a filter Explore cannot show as selected. **There is no event count** on a tile — the reference design had one, but `/event/search` returns rows, not totals, and there is no count endpoint. Do not fake a number. Photos are **Unsplash ids** (`images.unsplash.com` is already whitelisted in `next.config.ts`); every one was opened and eyeballed before it was committed, because several plausible-looking ids turned out to be the wrong subject — an "arts" id that was a rock concert, a "networking" id that was an empty conference hall. **Look at the picture before swapping one; do not trust the id.** ⚠️ **Two known issues, flagged not fixed:** (1) **11 tiles across 2 rows leaves a hole** — the 6th column holds one tile and an empty cell, visible at the scrolled-to-end position. Fixing it means a 12th category, and Gautham explicitly chose the 11 Explore categories over adding Music. (2) Business's accent `#334155` is a desaturated slate, and over that tile's bright office photo the wash barely reads as a colour. Faithful to the category system (it IS Business's chip colour), so it was left alone rather than given a hand-picked exception. |
| `components/EventBadges.tsx` | **The** event tags — both families. **Status tags** (Free / Selling Fast / This Week / Today / Recommended / Sold Out): `BadgeType`, `BADGE_CONFIG`, `EventBadge`, `EventBadges`. **Category chip** (Music / Arts & Culture / …): `CategoryBadge`, `categoryStyle`. | **Max THREE status tags**, enforced by `MAX_BADGES` inside `EventBadges` — the single render point, so the cap holds whatever a caller or adapter passes. **Do not cap at a call site**, and do not slice in `toCarouselEvent`: `badgeTypes` is also read by the filter tabs, so trimming the data would change filtering as well as display. **Layout at three tags: the third tag alone on the line ABOVE, the first two below** (Gautham's rule), laid out explicitly rather than by `flex-wrap` — wrapping gave each tag its own line and produced a three-high stack. **⚠️ The cap and the split count STATUS tags ONLY — the category chip does not count toward the three and is expected to sit in the same row as two of them** (`[category][tag][tag]` is the intended bottom line, not an overflow). **Cards use `CardTagRow` (below), not `EventBadges` directly.** — **Import these — never re-declare BADGE_CONFIG or pick your own category colour.** Used by **events AND communities**: the event cards (`EventsCarousel`), the community cards (`CommunityCarousel`), the `/event/[id]` hero and the `/community/[slug]` hero. Both families are shared now, so one category — and one status tag — renders identically whichever it is attached to (they sit in the same mixed grid on `/explore?view=both`). Communities carry a single `badgeType`, events an array `badgeTypes`; wrap the single one (`types={t ? [t] : undefined}`) rather than adding a second component. `EventBadges` renders nothing for an empty/absent list, so callers need no length check. **Both families are soft-rectangular `rounded-lg` tags with a 14px glyph + label, and differ ONLY in fill** (closed inconsistency #6 — do not re-split the shapes, do not round them into pills). The silhouette itself is exported as **`TAG_SHAPE`** (`inline-flex items-center rounded-lg whitespace-nowrap`); `TAG` = `TAG_SHAPE` + `gap-1.5 font-bold`. **`TAG_SHAPE` is exported for the `/event/[id]` booking card's "N going" + "N spots left" chips**, which Gautham asked to match the tags' shape but which are NOT tags and must not use `EventBadge`: they carry a 28px avatar stack rather than a 14px glyph, and they sit on the card's light surface, so they keep their own padding, gap, weight and **light fills** — the status tags' dark tints are tuned for the hero's photo scrim and read as heavy blocks on a white body. Import `TAG_SHAPE` for any future chip that must share the silhouette; **do not hand-write `rounded-lg` at the call site**, or the radius drifts apart the next time it moves. All colours are fixed semantic accents (same in light + dark) — the tags render on the hero's dark photo scrim, which is dark in both themes. **Which** status tags an event gets is decided in ONE place: `toCarouselEvent()` in `lib/card-adapters.ts` — a `BADGE_CONFIG` entry that nothing emits is dead (see "Known design inconsistencies"). **Status tags: a SOLID fill from Gautham's palette + a LINEN `#F2EFEA` label/glyph.** The palette is Mustard `#B3982B` · Olive `#7E8B3A` · Coral `#C6503F` · Sky `#4E82C0` · Iris `#7C6FC0` · Plum `#A05FA0` · Berry `#BC5675` (Teal `#2E8F8A` was in the original eight but Gautham dropped it), assigned this-week→Mustard, selling-fast→Coral, today→Sky, recommended→Iris, free→Plum. **`sold-out` keeps its neutral grey `#4B5158` + light label** (Gautham's call — grey reads as unavailable; a hue would make it compete with the live tags). **RESERVE — Olive `#7E8B3A`, Berry `#BC5675`, Rust `#A8543A`, Saffron `#CFA02E`, Lime `#8FA83C`, Aqua `#2FA0A8`, Denim `#3E6FA0`, Grape `#6A5AB8`, Orchid `#B85FB0`, Rose `#C85888`, Slate `#5F7080`:** in the palette, not yet on a tag. **Take from the reserves before inventing a new colour, and record it here when you do.** **⚠️ The linen label is a PREVIEW Gautham asked to see, not an accessible final — every assigned tag FAILS WCAG AA:** linen-on-fill measures Mustard 2.46, Sky 3.47, Iris 3.74, Plum 3.95, Coral 3.96 (reserves Olive 3.25, Berry 3.87); none reach 4.5, because the palette is mid-tone (luminance 0.18–0.32, the worst zone for text) and linen is effectively white-on-solid — the exact look Gautham had previously rejected. **The accessible alternative is a BLACK label**, which clears AA on all eight (4.62–7.44); it's flat `#000` rather than a dark shade per hue because Coral sets the floor (luminance 0.181 → best-possible 4.62:1, reached only at pure black; even brand text `#111827` on Coral is 3.90:1). The `TAG_LABEL` constant in `EventBadges.tsx` is the single switch between the two — flip it to `#000000` to ship the accessible version. Mid-tone fills do hold shape on a dark event-card photo *better* than the old dark tints (those measured ~1.2:1 at the near-black end and lost their outline). **Category chip:** **always linen** (`CHIP_FILL`, hardcoded for the same reason the status colours are — a themed surface would go near-black-on-black on the dark scrim); the per-category colour it used to carry as a fill now tints the label + glyph instead. Those accents are a shade darker than the old fills: as text ON linen, six of the fourteen failed WCAG AA (summit worst at 2.69:1), so each moved to a darker shade of the same hue — all now clear 4.5:1, lowest is summit at 6.17:1. **Re-check contrast before changing an accent.** An unlisted category still hashes onto the accent palette (one stable colour) but always gets the neutral sparkle glyph — an arbitrary colour is fine, an arbitrary glyph would put a briefcase on a yoga class. Glyphs come from `EventIcons.tsx`; never draw one inline here. |
| `components/EventBadges.tsx` → `CardTagRow` | **The** chip overlay for a CARD (category + status tags). Used by the event cards AND the community cards. | **Use this on any card — do not hand-place `CategoryBadge` + `EventBadges` in a card overlay again.** Renders Gautham's rule: **the cap and the two-row split count STATUS tags only — the category chip is never one of the three and is meant to share a row with two of them.** So the bottom line is `[category] … [tag] [tag]` and a third status tag goes on the line above. **The bottom line does not always fit** and the line therefore uses `flex-wrap-reverse`, which pushes the overflow UP instead of clipping (it was clipping on 12 of 23 fixture cards; plain `flex-wrap` had hidden that by stacking tags three-high). Measured at `xl:grid-cols-4` (327px card → 323px row): a category chip runs **91–175px** ("Music" … "Health & Wellness"), a status tag **72–124px** ("Free" … "Selling Fast"), so category + two tags spans **175–414px** — only the shorter combinations make one row (**5 of 17** tagged fixture cards at 1440px). **To get all of them on one row the cards must be wider** — a 3-across grid gives ~434px, which clears even the 426px worst case. Nothing is ever cut off either way. **The heroes are NOT affected** — they have ~1344px, fit one line, and use `CategoryBadge` + `EventBadges` directly. |
| `components/EventIcons.tsx` | **The** glyph set — every icon in the app lives here. **Date / time / location / verification:** `CalendarIcon`, `ClockIcon`, `LocationPinIcon`, `ShieldCheckIcon`. **Tag glyphs** (the icon inside a category chip or status pill, mapped to a tag in `EventBadges.tsx`): `ChipIcon`, `BriefcaseIcon`, `PencilIcon`, `MountainsIcon`, `PeopleIcon`, `GamepadIcon`, `LotusPoseIcon`, `GraduationCapIcon`, `PaletteIcon`, `TrophyIcon`, `CutleryIcon`, `MusicNoteIcon`, `GlobeIcon`, `SparkleIcon`, `TagIcon`, `FlameIcon`, `StarIcon`, `BanIcon`. | **Import these — never draw another calendar/clock/pin.** Closed inconsistency #1 (the app drew each concept three ways). **Tag glyphs are named for what they DRAW, not the tag they serve**, so a re-map never leaves a `MusicIcon` drawing a trophy. They render at 14px inside a pill, so they are deliberately chunky — thin strokes and fine detail turn to mush (`SparkleIcon` is one sparkle, not the usual three, for exactly this reason). Status `today`/`this-week` reuse `ClockIcon`/`CalendarIcon` rather than getting a second drawing of the same concept. **There is deliberately no heart here:** `EventActions.tsx` owns the heart, where it means "wishlisted" — a second heart meaning "health & wellness" would read as a saved event, so Health & Wellness takes `LotusPoseIcon` — a figure seated in lotus pose, **Gautham's call over the leaf**, which read as "eco/plants" rather than wellbeing. It is drawn as three *separate* solids (head / torso-with-arms / crossed legs) because at 14px the gaps are what make it read as a person; a first pass merged the hands into the leg mound, so keep the ~2-unit gap under the arms if you retouch it. `LeafIcon` itself is kept for reuse (the `/badge-preview` Olive swatch still draws it). **The set is FILLED**, not outline — chunky calendar with a dot grid, solid teardrop pin, ring clock — picked by Gautham off the event cards. `ClockIcon` was drawn for this set (the filled family had no clock); its ring + hands are 1.5/24 thick, matching the calendar frame's 6.25% of viewBox, so they don't look mismatched at 16px. `LocationPinIcon` punches its hole with `evenodd` rather than painting it `--brand-surface`, so it survives any background (e.g. the city picker button turning green when open). `ShieldCheckIcon` is the odd one out in section 1 — it is **not** a tag glyph (it sits inline in the `/event/[id]` booking-card trust line, not inside a chip); its tick is punched with `evenodd` for the same background reason (it renders on the card's green header) and is drawn 1.7/24 thick to match the calendar frame's weight, because a hairline tick inside a shield is the first thing to mush at 15px. **Colour is deliberately NOT unified** — `color` defaults to `currentColor`, so each surface keeps its own (cards near-black, `/event/[id]` booking card green); pass `color` only where the icon differs from the surrounding text. Size via `className` (default `w-4 h-4 shrink-0`). **Out of the set on purpose:** big decorative empty-state calendars, the `/checkout` "Expiry Date" field icon (belongs to the payment form's outline family), and the organiser console's stat glyphs. |
| `components/EventActions.tsx` | **The** round controls: `EventShareButton`, `EventWishlistButton`, `EventBackButton`, `EventArrowButton`. | **Import these — never hand-roll another share/heart/back/arrow.** `EventArrowButton` is the generalised arrow — `direction` ('left' \| 'right'), a caller-supplied `label` (the wording is surface-specific: "Go back" vs "More categories", it is not a property of the arrow), plus `disabled`. **`EventBackButton` is now just this pointing left**, so the two cannot drift; `CategoryGrid`'s rail controls are the same thing pointing right. The right-hand path is the exact mirror of the back arrow, and the same glyph the section headers' "View all" links draw. Serves **events AND communities** — the event cards, the community cards, `/event/[id]` and `/community/[slug]` all render them, so no two surfaces can drift. ⚠️ **The `Event*` prefix is historical; these are kind-agnostic.** Pass `kind` (`'event'` default \| `'community'`) — it drives the share URL, the wishlist record's `kind`, and the aria-label. Share + wishlist take `item: ActionItem`, a structural shape **both `CarouselEvent` and `CommunityItem` satisfy**, so a call site passes its card object unchanged (hold an API object? call `toCarouselEvent()` / `toCommunityItem()` first, and a save is then identical from any surface). The one asymmetry is handled inside: events carry `badgeTypes` (array), communities `badgeType` (single), and the wishlist record takes whichever is present. All three share one chrome: linen circle, muted icon that goes **green on hover**, hover label pill. Props: `labelSide` ('left' \| 'right') puts the hover label on the side away from the anchored edge; `size` ('sm' = 32px, the card overlay default \| 'lg' = 48px, for standalone surfaces like the event hero). `EventBackButton` also takes `onClick` — it is a dumb button, the caller decides where "back" goes; its label says "Go back" (not a named destination) because `/event/[id]` passes `router.back()`. **Need a variant? Add a prop here — do not fork the file.** |
| `components/EventCard.tsx` | ⚠️ **DEAD CODE — nothing imports it.** The real card is `EventCardItem` in `EventsCarousel.tsx`. | Kept only to avoid an unrequested deletion; see "Known design inconsistencies". Uses `@eventmind/types Event` (different from `CarouselEvent`). |
| `components/HeroCarousel.tsx` | Split hero at the top of the home page — copy on the left, rotating image panel on the right | **No longer a full-width image band.** `lg:grid-cols-2` inside the standard `maxWidth: 1400` column with `px-4 sm:px-6 lg:px-12` gutters; stacks to one column below `lg`. **Layout is COPY LEFT, IMAGE RIGHT, contained + centered** in the standard 1400px page column (`mx-auto`, `maxWidth: 1400`, standard `px-4 sm:px-6 lg:px-12` gutters). Columns are **`lg:grid-cols-[1fr_1.35fr]`** — the image panel is deliberately wider than the copy. The copy is `order-1`, the image `order-2`, so on the stacked mobile layout the **copy leads and the image sits below it**. Uses `<img>` (not `next/image`) because the wipe relies on `clip-path`. The panel is fully `rounded-2xl` (no off-screen edge) and its height is **explicit at lg — `lg:h-[min(82vh,820px)]`, not an aspect ratio** — so it stays large no matter how short the copy beside it is; it falls back to `aspect-[4/3]` on the stacked mobile layout.
**⚠️ Layout history — do NOT re-propose either without new information.** Gautham tried three arrangements: (1) copy-left/image-right **contained** — the current one; (2) the same but with the image **bleeding off the right viewport edge** — rejected, "looks almost incomplete"; (3) **image-left/copy-right, bleeding off the left edge** — also rejected. The `.hero-bleed` class that powered the bleed variants was **deleted** from `globals.css`; if you ever revive an edge-bleed layout, zero the padding on the bleed side and grow the other to `max(3rem, calc((100% - 1400px) / 2 + 3rem))`, using `100%` not `100vw` (the scrollbar trap documented on `SimilarEvents`).
**There are no quick-filter chips.** The reference mockup's In person / Online / This weekend / Free row was built, then **removed at Gautham's request for both modes** — don't re-add it. Its removal is what killed the `weekendRange()` helper and the `Chip` type; the left column now ends at the two CTAs.
**⚠️ The hero has two MODES — Events and Communities — and the segmented toggle swaps BOTH columns, not just the left.** `MODES: Record<ModeKey, Mode>` is the single source: a mode owns its eyebrow, headline, subcopy, both CTAs (Explore events / Publish an event ↔ Explore communities / Publish a community), AND its five slide CTAs. **The toggle is local `useState`, not a link** — clicking Communities re-dresses the hero in place; it does not navigate. The five photos are shared across modes (`IMG`), so only labels and hrefs change and **the carousel keeps its position across a toggle**; `SLIDE_COUNT` assumes both modes have the same number of slides, so add a slide to both or the index maths breaks.
**`IMAGES` is now per-mode `slides`** — each entry is `{ src, label, href }`, so a photo, its CTA label and its `/explore` filter move together, and every label is matched to what the photo actually shows. **The two modes filter differently and must not be copy-pasted onto each other:** for events, offline/online are the `event_type` FORMAT filter, never `category` (see the online-is-a-format rule); **for communities there is no format filter at all** — `/explore`'s community query only honours `q` + `category` + `city` — so "online communities" is expressed with the **`Online` pseudo-city** (`&city=Online`), and the food-market photo takes `category=Food & Drink` rather than a fake offline format. The CTA and dots both swap at the wipe's halfway point (`progress > 0.5`) so the label matches whichever photo covers most of the panel; a bottom scrim keeps both legible.
**The slide CTA is terracotta** (`--brand-terracotta`, hover `--brand-terracotta-hover`), not green — Gautham's call, so it reads as an accent against the green Explore/Publish CTAs on the left. **The dots are therefore white, not terracotta** — two terracotta elements on one photo read as the same control. **Deliberate divergences from the reference mockup:** the image panel is contained in the page gutters rather than bleeding to the right viewport edge, and events' "Find workshops" maps to `category=Creative` — there is no Workshops category in `/explore`'s `CATEGORIES`, and Creative fits the painting photo better than Education. |
| `components/CityPicker.tsx` | City selector dropdown | Uses `useLocationStore`. CITIES list includes NYC, London, Berlin, etc. Default city is New York. |
| `components/EventChatWidget.tsx` | AI chat widget on event detail page | Allows attendees to chat with an AI about the event. The floating launcher button is **terracotta** (`--brand-terracotta`), not green — so it reads as a distinct accent instead of competing with the green Book Now / booking card CTAs. The panel internals (send button, user bubbles) remain green. |
| `components/Footer.tsx` | Site footer, rendered on the home page | Green (#184E4A) background, linen text, link columns (Discover / For Organisers / Company), social icons. |
| `components/navbar/Navbar.tsx` | Sticky top navigation | Desktop nav on `lg+`, hamburger mobile menu on `<lg`. Search bar with inline city picker, Events + Communities dropdowns, a **chat button** + notification bell (bell still a no-op), auth-aware avatar menu (My Dashboard, My Wishlist, My Organised Events [org only], Organiser Console, Settings, Log Out). The **chat button** (`ChatButton`, to the LEFT of the bell, authed only) opens `/chat` and **glows** (`.nf-chat-glow` green halo in `globals.css` + a terracotta dot) whenever any room has unread activity, read from `useChatUnreadStore().unreadRooms`. The mobile hamburger has a matching **Messages** row with an unread dot. Detects organizer status via `organizerApi.get()` (5-min React Query cache). Includes the sun/moon **theme toggle** (desktop: after "Help"; mobile: a row in the hamburger panel) via `useTheme()`. |
| `components/ChatPresence.tsx` | **Invisible** app-wide listener (mounted once in `layout.tsx`) that lights the navbar chat glow. | ⚠️ **FRONTEND-ONLY MVP — the glow is not backed by a real unread system.** A room == an event; the user "belongs to" a room if they hold a ticket for it (`useTicketsStore`) OR organise it (`eventsApi.search({ organizer_id })`). It opens **one WebSocket per room while the app is open** and calls `useChatUnreadStore().markUnread(roomId)` on any inbound message whose `sender_id` isn't the user's — covering both asked-for cases (organiser gets a message; attendee gets a reply). **Limitations, by design:** messages received while the app is CLOSED cannot be detected (chat backend still doesn't persist — see `chat_endpoints.py`), and there is no read-receipt/room-list endpoint, so this is not survivable state. Replace with a backend unread-count endpoint when the chat service persists messages + read state. Room ids share the WS base (`CHAT_WS_BASE`) with the room page via `lib/chat.ts`. Unread state lives in `packages/store/src/chat-unread-store.ts` (persisted map `eventmind-chat-unread`, plus a non-persisted `activeRoom` so the room you're viewing never glows). |
| `lib/card-adapters.ts` | Type adapters from API shapes to card component shapes | `toCarouselEvent(Event → CarouselEvent)`, `toCommunityItem(Community → CommunityItem)`. Uses `picsum.photos/seed/<id>` for placeholder images. Prices go through `formatPrice` — see `lib/currency.ts`. |
| `lib/currency.ts` | **The** price formatter: `formatPrice`, `formatEventPrice`, `currencySymbol`, `paymentCurrency`. | **Import this — never hand-write a currency symbol in a component.** Closed the app's worst data inconsistency: prices were formatted at each call site and the call sites drifted, so the home/explore cards rendered `₹` while `/event/[id]`, `/checkout`, `/dashboard`, the organiser console and the OG/story share images all hardcoded `$` — the same event showed two currencies depending on where you looked. Every amount is now a number **plus the event's own `currency`** (ISO 4217, on the `events` table, default `INR`). **Always pass the currency**; omitting it falls back to INR, which is right for native events but WRONG for Ticketmaster-synced rows, which carry real USD/GBP/EUR amounts. Grouping follows the currency's locale, so INR keeps lakh/crore grouping (`₹1,20,000`) rather than a thousands split. `freeLabel` defaults to `"Free"` for a price of 0 (pass `null` where 0 must render as an amount, e.g. a checkout service-fee line); `decimals` defaults to false because most surfaces want whole numbers — **checkout opts in**, because it sums a subtotal and fee and rounded parts wouldn't reconcile against the total. Unknown/absent codes fall back to the default rather than throwing. The currency **list** (`CURRENCIES`, `CurrencyCode`, `DEFAULT_CURRENCY`) lives in `packages/types` next to `EVENT_FORMATS` — that's the data contract, this file is display. No DOM access, so the server-rendered share images can import it. |
| `components/brand/*` | Official NewFind logo/wordmark/loader, built from the assets in `eventmind/logo_and_wordmark/`. | Inline SVG so they tint via `currentColor`: `BrandMark` (face glyph, fixed terracotta dot), `Wordmark` (Lobster Two "NewFind" — exact master paths, injected via `dangerouslySetInnerHTML`), `BrandLogo` (horizontal lockup = mark + wordmark), `BrandLoader` ("breathing aura" loading state). Colour is driven by the theme-aware `--brand-logo` var (green in light, linen in dark); set `color` on a wrapper to re-tint. Used by Navbar, Footer (fixed linen), `/auth` hero, and `app/loading.tsx`. Loader keyframes (`nf-aura/nf-breathe/nf-blink`) live in `globals.css` and respect `prefers-reduced-motion`. Favicon/PWA/OG assets are in `public/brand/` + `public/manifest.webmanifest`, referenced from `layout.tsx` metadata. |
| `components/ShareButton.tsx` | ⚠️ **Effectively dead** — its only importer is the dead `EventCard.tsx`. Use `EventActions.tsx` instead. | Opens the native share sheet with the generated **story image** (`navigator.share({ files })`) on supported devices; otherwise pops `ShareModal`. Props: `event`, `className` (size/position), `iconClassName`, `stopPropagation`. |
| `components/ShareModal.tsx` | Desktop fallback for the share flow. | Previews the 9:16 story card and offers **Download image** + **Copy link**. Shown only when the native share sheet is unavailable (i.e. **not** on Chrome/Edge on Windows, which do support Web Share — you'll get the OS share sheet there instead). **Portalled to `<body>` via `createPortal` — do not remove.** It is opened from inside event cards / the event hero, which are `overflow-hidden`, fade to `opacity-0` when un-hovered, and apply a `transform` on hover; a transformed ancestor becomes the containing block for `position: fixed`, so rendering in place pins the overlay inside the card and clips it away. |

> Add new components here as they are created.

### Event sharing — link unfurl (1b) + story card (1c)

Sharing an event produces two branded graphics, both generated server-side with `next/og` `ImageResponse` (no new deps) from the event's **own** picture (`image_url`, or the same `picsum.photos/seed/<id>` placeholder the card uses):

- **Link unfurl (paste anywhere — iMessage/WhatsApp/Slack):** `app/event/[id]/opengraph-image.tsx` renders the 1200×630 card (event image left, NewFind mark → title → "place · date · price"). `app/event/[id]/layout.tsx` is a server component whose only job is `generateMetadata()` (title/description/OG/Twitter); Next auto-wires the `opengraph-image` route into `og:image`/`twitter:image`. The page itself stays a client component.
- **Share button → story (post to a story):** `app/event/[id]/story/route.tsx` returns a 1080×1920 PNG (full-bleed event image, "YOU'RE INVITED" → title → "category · place" → "Join on NewFind"). `lib/share-event.ts` fetches it and hands it to `navigator.share`; falls back to `ShareModal`.
- Shared helpers in `lib/event-media.ts` (`eventImageUrl`/`priceLabel`/`locationLabel`/`shortDate`) and `lib/event-server.ts` (`getEventForShare`/`siteOrigin`). Set `NEXT_PUBLIC_SITE_URL` in production so absolute share URLs/`metadataBase` are correct (defaults to `http://localhost:3000`).

**Communities share exactly the same way** — same three files, same shapes, under `app/community/[slug]/`: `opengraph-image.tsx`, `layout.tsx` and `story/route.tsx`, with `getCommunityForShare` in `lib/community-server.ts` and `communityImageUrl` in `lib/event-media.ts`. Only the copy differs: the story eyebrow reads **JOIN THE COMMUNITY** (not "YOU'RE INVITED"), the chip shows the **member count** (not a price), and the meta line is "category · place". Communities have no `image_url` column, so their share art is always the seeded placeholder — the same picture as the card.

`lib/share-event.ts` drives both. **`shareItem(kind, item)` is the entry point** — `kind` (`'event' | 'community'`) doubles as the URL segment, so `/event/…` and `/community/…` are derived, never hardcoded. `shareEvent()` remains as a thin back-compat wrapper. `ShareFallback` carries `kind` so `ShareModal` titles itself "Share this event" / "Share this community". **Adding a third shareable type? Extend `ShareKind` and add the three route files — do not write a second share flow.**

> ⚠️ **Community links use `id`, but the route resolves by `slug`.** The cards link to `/community/${CommunityItem.id}` and `shareUrl()` deliberately matches that, so the card link and the share link are always the same string. In dummy fixtures `slug === id` so it works; **if the API ever returns a slug that differs from the id, both break together.** Pre-existing, not introduced by the share work — fix by threading the real `slug` through `toCommunityItem()`.

---

## Brand & Design — Read Before Building Any New Page

Before building a new feature, read the PRD at `Eventmind_files/eventmind_prd.md` to understand the product intent. Do not build features that are not in the PRD without confirming with the team first.

EventMind's design is clean, minimal, and premium — inspired by functionhealth.com (aesthetic) and austoentertainment.com (colour palette). **User-friendliness, simplicity, and consistency are the top priorities.** Do not add unnecessary complexity, decorations, or features.

### ⚠️ Consistency is a requirement, not a preference — read this first

**The same thing must look and behave the same way everywhere in the app.** A user moving from the home page to an event page to a community page should never notice that two different people built them. This outranks matching a mockup pixel-for-pixel: if a mockup conflicts with an established pattern, say so and ask before diverging.

Concretely, before you build any UI:

1. **Search for the pattern before you write it.** If a share button, favourite/heart, date row, price chip, badge, or empty state already exists somewhere, **import that component**. Do not hand-roll a second version. A second version is a bug, even when it looks fine on its own.
2. **One control = one component.** Share + wishlist controls live in [`components/EventActions.tsx`](frontend_react/apps/web/src/components/EventActions.tsx) and are used by BOTH the cards and the `/event/[id]` hero. If a control needs to look different on a new surface, add a **prop** (see `labelSide`), do not fork the file.
3. **One icon per concept.** A calendar means the same glyph everywhere; same for location, time, person. Do not introduce a new icon for a concept that already has one.
4. **Consistent ≠ identical behaviour by accident.** If two surfaces share a look, they must share the code — otherwise they silently drift. Copy-paste is how the drift starts.
5. **If you find an inconsistency, report it.** Do not quietly work around it, and do not unilaterally restyle a shared surface to fix it — flag it and let Gautham decide, because a "fix" in one place changes every other place.

> **Known outstanding inconsistencies** are tracked under "Known design inconsistencies (open)" below. Check that list before assuming something is intentional.

### Colour palette — use these exact values everywhere, no substitutes

| Token | Hex | Where |
|---|---|---|
| Green | `#184E4A` | Buttons, CTAs, wordmark, active states, icons |
| Linen | `#F2EFEA` | Navbar bg, page bg, dropdown bg, scaffold bg |
| Text | `#111827` | All body text and headings |
| Border | `#E2DDD5` | Input borders, card borders, dividers |
| Nav border | `#C8C1B8` | Navbar bottom border, event card borders |
| Secondary text | `#111827` light / `#F2EFEA` dark | Secondary labels, meta rows, empty states, muted icons. **Not gray** — see below. |
| Muted | `#9CA3AF` light / `#8B938F` dark | Form placeholders and muted *fills* (sold-out buttons, typing dots) **only**. |

**Why linen and not white for backgrounds?** `#184E4A` reads as near-black on pure white. Linen gives it the clearly-green appearance the brand needs.

**Colour naming convention (user instructions):**
- When Gautham says **"green"** or **"green shade"** → always use `#184E4A`. Never use any other green (e.g. `#16a34a`, Tailwind `green-*`).
- When Gautham says **"white"** or **"white shade"** (unless he explicitly means pure white) → always use linen `#F2EFEA`. Pure white `#FFFFFF` is only acceptable for text on dark/coloured backgrounds (e.g. badge labels, button text on green).

### Theming — light/dark (IMPORTANT: colours are now CSS variables)

The app has a **light/dark theme** with a sun/moon toggle in the navbar. The brand palette above is no longer hardcoded — every colour is a `--brand-*` CSS variable defined **once** in `apps/web/src/app/globals.css` (light in `:root`, dark in `:root[data-theme="dark"]`). **Do not reintroduce raw brand hexes** (`#184E4A`, `#F2EFEA`, etc.) in components — use the variables:

- Tokens: `--brand-green`, `--brand-green-hover`, `--brand-on-green` (text/icons that sit ON a green fill), `--brand-bg` (page), `--brand-surface` (cards/navbar/inputs), `--brand-text`, `--brand-border`, `--brand-nav-border`, `--brand-control-border` (outline buttons/chips/toggles — see "Outline-control border" below), `--brand-hint`, `--brand-muted`.
- **⚠️ `--brand-hint` is no longer gray.** Gautham's call: every gray secondary label on the site was washed out, so the token now resolves to the brand **text** colour in light (`#111827`) and the brand **white/linen** in dark (`#F2EFEA` — deliberately the linen, *not* `--brand-text`'s `#ECEAE4`). Secondary copy reads at full contrast; hierarchy is carried by size, weight and position instead. This covers ~96 text usages across 20 files and, per the same decision, the ~26 muted **icons** that share the token (search glyph, card meta icons, chevrons, empty-state art). The name is kept only to avoid touching 127 call sites — **do not "restore" it to a gray**.
- **`--brand-muted` is the one remaining genuinely-gray token**, and exists because two things must NOT follow the above: **form placeholders** (a full-contrast placeholder makes an empty input look pre-filled) and muted **fills** — the sold-out/full CTA backgrounds in `EventsCarousel`/`CommunityCarousel` (aliased there as `MUTED_FILL`, distinct from the text alias `MUTED`) and `EventChatWidget`'s typing dots. Reusing `--brand-hint` for a fill would paint a near-black button in light mode. **Never use `--brand-muted` for ordinary secondary text.**
- **Terracotta accent:** `--brand-terracotta` (`#C1603F`), `--brand-terracotta-hover`, `--brand-on-terracotta` (white). Used by the event-assistant chat button. (It used to be the `/event/[id]` category badge too; that chip is now always linen with a per-category accent from `EventBadges.tsx`, where a darkened terracotta — `#8F4229`, the token itself fails AA as text on linen — survives as the "Other"/"General" accent.) **Deliberately the same hex in both themes** — it is a semantic accent, not a themed surface, so it sits with the badge reds/golds rather than the green/linen system. Use the token, not the hex: `BRAND.terracotta` or `var(--brand-terracotta)`. (Some older raw `#C1603F` literals still exist — e.g. the "spots left" chip and social-proof avatars on `/event/[id]`; migrate them to the token when you next touch that code.)
- In inline styles: `style={{ color: "var(--brand-text)" }}` or import the `BRAND` string map from `@/lib/theme` (`BRAND.green`, `BRAND.onGreen`, …).
- In Tailwind classes: arbitrary values with the var, e.g. `text-[var(--brand-hint)]`, `bg-[var(--brand-surface)]`.
- **The old `LINEN` was overloaded** (page bg AND text-on-green). These diverge in dark mode — map background uses to `--brand-surface`/`--brand-bg` and text-on-green uses to `--brand-on-green`.
- Alpha tints: use `color-mix(in srgb, var(--brand-green) N%, transparent)` — a CSS var can't take a hex-alpha suffix like `${GREEN}14`.
- Theme plumbing: `ThemeProvider`/`useTheme()` in `apps/web/src/providers/theme-provider.tsx`; persisted to localStorage key `eventmind-theme`; a no-flash `<head>` script in `layout.tsx` sets `data-theme` before first paint.
- **Dark palette is "warm green-black".** To switch to neutral dark-gray, uncomment the `.dark-gray alternate` block inside the `[data-theme="dark"]` rule in `globals.css` — no component edits needed.
- **Intentionally left fixed (not themed):** `Footer.tsx` (deep-green block), `HeroCarousel` letterbox, and semantic accent colours (badge reds/oranges/blues, star gold, error red, status green/amber, Google/Facebook brand colours).

### Typography

**Single-font architecture (one source of truth).** The whole app uses **one font by default** — currently **Roboto** — loaded exactly once in `layout.tsx` and exposed as the CSS variable `--font-app`. `globals.css` maps that variable to the `body` font-family and to Tailwind's `--font-sans` token, so every page and component inherits it automatically. There are **no per-component font declarations** — do not re-import a font in a component or set `fontFamily` inline.

**To swap the font** (e.g. Roboto → Inter): change only the two marked lines in `layout.tsx` — the `next/font/google` import and the loader call (`Roboto({ … })` → `Inter({ … })`). Keep `variable: "--font-app"` unchanged. Nothing else needs to touch.

Do not introduce a second font without explicit approval. If a component genuinely needs to opt out, it should reference its own scoped font, but the default for everything is `--font-app`.

**Font-size floor: 15px minimum.** No text renders below **15px** anywhere. A single rule in `globals.css` raises `text-xs` (12px), `text-sm` (14px), and arbitrary `text-[9px]`…`text-[14px]` to `15px !important`; sizes already ≥15px are untouched. This gives the site a comfortable, Talk_to_file-like scale (their effective minimum was ~14–15px). This is safe because the app uses no responsive text scaling (no `md:text-*` etc.) — if you ever add responsive size-ups from a small base, revisit the `!important`. To change the minimum site-wide, edit the single `font-size` value in that rule. Do not add new sub-15px font sizes.

**Prominent-copy scale (above the floor).** So key copy doesn't sit at the 15px minimum, these use fixed sizes: a **page subtitle** (the `<p>` under a page `<h1>`) is **18px**; an **empty-state heading** is **18px** and its **helper line** is **16px**. Applied consistently across Explore, Organizer console, My Events, Create Event, Onboarding, Create Community, and Community detail. Follow this on new pages. Card type is exempt (see below).

**Opt-out via `data-keep-type`.** An element (and its subtree) carrying the `data-keep-type` attribute is exempt from the floor, so components with deliberately small, hand-tuned type keep it. Currently only [`EventCard.tsx`](frontend_react/apps/web/src/components/EventCard.tsx) uses it (its 11/12/14px type is intentional and must not change). The event/community **carousels** already use no sub-15px type, so they need no marker and the floor never affects them. Add `data-keep-type` to any future card whose small type must be preserved.

### Known design inconsistencies (open)

Found during the `/event/[id]` hero work. **Not yet fixed — do not assume these are intentional.** Agreed with Gautham to tackle the icon unification as a separate task.

1. ~~**Three different icon sets for the same concepts.**~~ **RESOLVED.** Date/time/location now come from one place: [`components/EventIcons.tsx`](frontend_react/apps/web/src/components/EventIcons.tsx) (filled set — see the Component Registry). `EventsCarousel`, `CommunityCarousel`, `event/[id]`, `dashboard`, `CityPicker` and `EventCard` all import it; the duplicate local definitions are gone, as is `EventsCarousel`'s dead fourth `PinIcon`. Colour stays per-surface by design.
   The booking card's odd-one-out **outline person heroicon is now gone too** — the organiser moved into the card's green header (avatar initial + name), so the row that carried that glyph no longer exists. The card's only glyphs are now the filled calendar / clock / pin, plus the filled `ShieldCheckIcon`.
   **Still open, deliberately out of scope** (flagged to Gautham, not yet decided):
   - Decorative **empty-state** calendars (`EventsCarousel`, `community/[slug]`), the `/checkout` event thumbnail, and the organiser console's `EventIcon` stat glyph are all still outline heroicons.
   - `/checkout`'s "Expiry Date" field keeps its outline calendar on purpose — it matches the payment form's own icon family (`CardIcon`, `LockIcon`, `PersonIcon`), and it is a card expiry, not an event date.
2. **`components/EventCard.tsx` is dead code.** Nothing imports it. The card actually rendered on home / `/explore` / `/community/[slug]` is `EventCardItem`, exported from `EventsCarousel.tsx` — a confusingly similar name. `EventCard.tsx` is the only remaining consumer of `components/ShareButton.tsx`, so **that file is effectively dead too**. Both are candidates for deletion; confirm with Gautham first.
3. **Two of the six badge types are dead for real data.** `BADGE_CONFIG` defines `today` and `recommended`, but `toCarouselEvent()` only ever emits `sold-out`, `selling-fast`, `this-week`, `free`. Nothing else produces `badgeTypes`, so **a real event can never be tagged Today or Recommended** — those two only appear on the hardcoded sample array inside `EventsCarousel.tsx`. Consequence: the **"Recommended" filter tab** on the home page filters on `badgeTypes?.includes('recommended')`, so it cannot match a live event. Either emit the tags from `toCarouselEvent` (needs a "recommended" signal from the backend) or drop the tab + config entries.
4. ~~**`CommunityCarousel.tsx` has its own copy of `BADGE_CONFIG`.**~~ **RESOLVED — communities and events are now one system.** Gautham's call: whatever exists on both sides must look identical. `CommunityCarousel` no longer defines a `BADGE_CONFIG`, a `ShareButton` or a `HeartButton`; status tags come from `EventBadges.tsx` and the controls from `EventActions.tsx`, both with `kind="community"`. Verified byte-identical on `/explore` (View Both): share + wishlist both `32×32`, `rounded-full`, linen; status tags both `rounded-lg` with a glyph from the shared palette. The old note read:
   > (communities use a subset). Not merged with `EventBadges.tsx` because community badges are a different domain — but the colours are duplicated and **have now badly drifted**. Its copy (line ~50) is still the **original white-on-solid** style — `free: #DC2626`, `selling-fast: #D97706`, `today: #2563EB`, `recommended: #7C3AED`, `sold-out: #6B7280`, all with `#F2EFEA` labels. It **missed both redesigns**: the dark-tint/light-label pass, and the palette pass. So a community card's "Free" chip is a bright solid red with a linen label, while an event card's "Free" chip is Plum with a linen label and a tag glyph — same word, two unrelated looks. Measured on `/explore` (View Both): event `radius 8px, rgb(160,95,160), glyph ✓` vs community `rounded-full, rgb(220,38,38), glyph ✗`.
5. ~~**`CommunityCarousel.tsx` still has a decorative share button.**~~ **RESOLVED.** Its local `ShareButton` did nothing on click. Communities now use the shared `EventShareButton` with `kind="community"`, backed by a **real community share pipeline** built to mirror the event one: `app/community/[slug]/story/route.tsx` (1080×1920 PNG), `opengraph-image.tsx` (1200×630 unfurl) and `layout.tsx` (`generateMetadata`). Verified end to end — the story renders at 1080×1920 and a pasted community link unfurls with title/description/og:image.
6. ~~**The `/event/[id]` category badge is a different shape to the status tags.**~~ **Resolved (merged).** Both families are now soft-rectangular `rounded-lg` tags carrying a 14px glyph + a label, built to match a reference design Gautham supplied. This supersedes the earlier "keep the shapes different" decision — **fill** now signals category-vs-status (linen chip vs dark accent tint) and shape no longer has to. Do not re-split the shapes, and do not round them into pills — `rounded-full` was tried and rejected.
7. **The whole organiser block is hardcoded** on `/event/[id]` — name, avatar initial AND the "Verified · 40+ events" trust line, now rendered prominently in the booking card's green header. Approved by Gautham as a deliberate stopgap; see "What Is Not Built Yet" for the wiring needed. **Do not treat the trust line as real data.**
8. **The event card's meta row is over-stuffed at `xl:grid-cols-4`.** Measured at 1440px: the row is 285px and the fixed content (calendar+date+clock+time+pin, all `shrink-0` at 18px) eats 241px, leaving the venue **44px** — so even a short venue like "The Blue Room" truncates to "The…". **Pre-existing, not caused by the clock icon:** the old `date · time · pin venue` layout left the venue 47px, a 3px difference. It only looks fine at `sm:grid-cols-2` (wider cards). Fixing it needs a real decision — drop the venue from the row, wrap to a second line, or shrink the row's 18px type (which the 15px font floor limits).
9. ~~**Prices rendered in two different currencies depending on the page.**~~ **RESOLVED.** The home/explore cards rendered `₹` (via `toCarouselEvent`) while `/event/[id]`, `/checkout`, `/dashboard`, the organiser console and the OG/story share images hardcoded `$` — so one event showed two currencies. There was no currency concept at all: `price` was a bare number. Now `events.currency` (ISO 4217, default `INR`) is the single source, and **every** surface formats through `formatPrice` in [`lib/currency.ts`](frontend_react/apps/web/src/lib/currency.ts). **Never hand-write a currency symbol in a component again** — that is exactly how this drifted. The dead `EventCard.tsx` was fixed too, so reviving it can't reintroduce the bug.
10. ~~**`/event/[id]` is not responsive below the hero.**~~ **RESOLVED**, along with the same problem on ten other surfaces — see "Responsiveness" below. The grid is now `grid-cols-1 lg:grid-cols-[2.4fr_1fr]`, the page carries the standard gutters, and when stacked the booking card is ordered ABOVE the description (Gautham's call) so price/date/Book Now are visible without scrolling past the reviews.

11. **The floating chat launcher overlaps the last "Similar events" card.** `EventChatWidget`'s terracotta button is `position: fixed` bottom-right, and the Similar events rail is now full-bleed, so the button sits over the **fourth card's lower-right corner** — measured at 1440px (card ends x=1392, button spans 1360–1416) and at 1920px (card ends 1872, button 1840–1896). It covers part of that card's "View details" CTA; the rest of the card still works, since the whole card is a link. Partly pre-existing (the two already collided at 1440px when the rail sat inside the capped column) but **full-bleed made it happen at every width**. Not fixed because every obvious remedy has a cost: right-padding the rail breaks the four-across maths and home parity, and moving or hiding the launcher changes a shared component used across the page. **Needs a decision — flagged to Gautham, do not silently work around it.**

12. **Guarded pages bounce to `/auth` on a hard load even when you ARE logged in.** Every guard is `useEffect(() => { if (!isAuthenticated) router.replace("/auth") })`, which fires on the first client render — before zustand's `persist` has rehydrated `eventmind-auth` from localStorage. So `isAuthenticated` is still `false`, the guard redirects, and `/auth` (seeing the now-hydrated session) sends you on to `/`. Reproduced repeatedly while screenshotting `/dashboard`, `/organizer`, `/organizer/my-events`: a hard load lands on `/`, a soft client-side navigation usually survives — which is exactly the timing-dependent signature of a hydration race, and why it looks intermittent in normal use. **The fix already exists in the codebase and is simply not used here:** the store exposes `_hasHydrated`, and `app/page.tsx` gates on it (`hasHydrated ? _selectedCity : DEFAULT_CITY`). The guards should do the same — wait for `_hasHydrated` before deciding, and render the loader until then. Not fixed here because it is an auth-behaviour change, not a layout one. **Do not "fix" it by removing the guard.**

13. **The desktop navbar switched on 126px before it fit** (fixed, recorded so it is not reintroduced). The desktop cluster is `hidden lg:flex`, i.e. it appears at 1024px, but with the search bar at `w-[420px]` the row measured **1135px** — so at every viewport from 1024 to ~1150 *every page in the app* carried a horizontal scrollbar, including pages with no other problem. The search box was the only elastic element in the row, so it now takes the difference (`w-[280px] xl:w-[440px]`) and returns to full width at `xl`. **If you widen anything in that row — a new nav item, a longer label, a bigger logo — re-measure at exactly 1024px**, because nothing else in the row can absorb it.

### Hover states (navbar and interactive elements)
On hover: background → `#184E4A`, text/icon → `#F2EFEA`. This pattern is used throughout the navbar, all dropdown items, and event cards. Maintain it for any new interactive elements.

### Spacing and layout
- Navbar height: 72px, horizontal padding: `px-12` (48px)
- Page content: `px-12` horizontal padding to align with navbar
- Cards: `rounded-2xl`, border `#C8C1B8`, linen background (`#F2EFEA`)
- Buttons: `rounded-xl` or `rounded-2xl`

### ⚠️ Button shape: rectangular with rounded corners — NEVER pills

**Every button, chip, toggle and filter control in the app is a rounded rectangle. `rounded-full` is not a button shape.** Gautham's call, made when the `/explore` filter bar was first built with pill chips — the reference for the shape is the **category chip on the event card**, i.e. `rounded-lg`, the same silhouette exported as `TAG_SHAPE` from [`components/EventBadges.tsx`](frontend_react/apps/web/src/components/EventBadges.tsx).

- **Small controls** (filter chips, category chips, date presets, active-filter chips, segmented-control items): `rounded-lg`. Inside a bordered track (e.g. a segmented control), the track is `rounded-lg` and its items `rounded-md`, so the inner radius nests instead of fighting the outer one.
- **Standard buttons** (CTAs, form submits, search/city/sort controls): `rounded-xl` or `rounded-2xl`, as above.
- This supersedes the earlier pill styling anywhere it survives. `rounded-full` on a *tag* was already rejected once (see inconsistency #6) — the same answer applies to buttons.

**The only legitimate `rounded-full` elements** are things that are not buttons-with-labels: the round icon controls in [`EventActions.tsx`](frontend_react/apps/web/src/components/EventActions.tsx) (share / wishlist / back — circles by design), avatars, count badges, carousel dots, and the sliding knob + track of a **toggle switch** (a switch is a switch, not a button). Do not add to this list without asking.

### ⚠️ Outline-control border: `2px solid var(--brand-control-border)` — not the pale 1px

**Every outline control that sits on a linen/gray background uses `2px solid var(--brand-control-border)` (`#8B8172` light).** Gautham's call: with `--brand-surface` equal to `--brand-bg` in light mode, a control's border is the *only* thing separating it from the page — and the old `1px solid var(--brand-border)` (#E2DDD5) is so close to linen that buttons "almost blend with the background so it doesn't even feel like one". Thickness alone doesn't fix it; **the pale colour was the bigger half of the problem**, so both changed together.

**Measured against linen `#F2EFEA`:** `--brand-border` **1.24:1**, `--brand-nav-border` **1.55:1**, `--brand-control-border` **3.34:1**, brand black `#111827` **15.8:1**. An intermediate 2px `--brand-nav-border` pass was shipped first and still read as blending — 1.55:1 is essentially invisible, so it was only making an invisible thing thicker. Gautham chose `#8B8172` off a side-by-side against brand black, which was unambiguous but too heavy at 2px (every outline control started competing with the green CTAs). **Do not "simplify" this back onto `--brand-nav-border`** — that is the navbar/card token and it is far too pale for a control.

**Dark theme is deliberately NOT lifted** — `--brand-control-border` resolves to `#33433F` there, the same as the nav border, because dark mode's `--brand-surface` (#16211F) already sits off `--brand-bg` (#0F1A18). The blending problem is light-only.

Applies to: secondary/outline buttons, filter chips, filter tabs, segmented-control **tracks**, toggles, the city/sort/search controls in the `/explore` filter bar, the `/explore` filters sidebar panel, and round back/arrow buttons.

- **⚠️ Bump the ACTIVE state to 2px too.** Most of these controls swap to a green border when selected (`2px solid ${GREEN}`). If only the inactive state goes to 2px, the control **changes size when you click it**. `ActiveChip` on `/explore` must also stay at 2px — it is deliberately the same silhouette as a selected `Chip`.
- `--brand-border` (#E2DDD5) is still correct for **non-controls**: card/panel borders, dividers, `border-t`/`border-b` rules, and form text inputs inside a card (`inputCls` on the create/auth forms). Do not sweep those to 2px.
- **⚠️ A CARD is not a control — never give one this border.** The `SeeAllTile` ("View all events" / "Browse all communities") in `EventsCarousel.tsx` / `CommunityCarousel.tsx` is a **card in the same grid as the event cards** and must look identical to them: `border: hovered ? 2px solid GREEN : '2px solid transparent'` — i.e. **no visible border at rest**, green on hover, with the transparent 2px holding the space so it never resizes. It previously carried its own `1px NAV_BORDER` outline and Gautham flagged it: the tile has to read as a card, not as a big button. Its resting shadow was also aligned to the card's (`rgba(0,0,0,0.06)`, was `0.04`).
- **First choice is still to not hand-write a border at all** — there is no shared Button component, which is exactly why this treatment had to be applied in ~20 places across 12 files. If you add another outline control, copy an existing one rather than inventing a third width.

**Known violation (open, flagged not fixed):** the home-page filter tabs in `EventsCarousel.tsx` / `CommunityCarousel.tsx` ("All / Recommended / This week / Free") are `rounded-full` **pills**, which contradicts the rounded-rectangle rule above (small controls should be `rounded-lg`). Their borders were updated, their shape was not — changing it is a visual decision for Gautham.

### Tone of UI copy
Conversational but professional. Avoid jargon. Keep labels short. Example: "Claim Free Ticket" not "Register for Free Event".

---

## Performance Rules

- Use `next/image` for all images. **Never use `<img>` tags.**
- Use `next/link` for all internal navigation. **Never use `<a>` tags directly.**
- Lazy-load components below the fold with `next/dynamic` where appropriate.
- Always provide a meaningful `sizes` prop on `<Image>` components — do not leave it as the default.
- Do not add new npm dependencies without asking first.
- Do not import from `node_modules` paths that are not in `package.json`.

---

## What Has Been Built (React)

For the full technical breakdown, read `Eventmind_files/REACT_MIGRATION.md`.

Summary of working pages:

| Route | What it does |
|---|---|
| `/` | Discovery page — hero carousel, city-based EventsCarousel + CommunityCarousel (API-driven), the "Browse by category" grid (`CategoryGrid`, directly above the footer), Footer |
| `/auth` | Login / register toggle — two-column layout (hero panel on `lg+`, form-only on mobile), Google/Facebook buttons (disabled, "Coming soon") |
| `/event/[id]` | Event detail — **full-bleed hero** (edge-to-edge event photo under a dark scrim, no side gutters, no corner radius) with a back button top-left, wishlist + share top-right, and a **centre-aligned, always-one-line** title; on the line below it the **category tag sits left** and **every status tag that applies sits right** (Free / Selling Fast / This Week / Sold Out — rendered by `EventBadges.tsx`, so a tag is identical to the one on a card); then description, reviews with star ratings, booking card, sticky booking bar, auth guard. **Date/time/location live in the booking card, not the hero.** **Booking card layout** (built to a reference screenshot from Gautham): the green header carries the **organiser** — "ORGANIZED BY" label, rounded-square avatar holding the name's initial, the name at 24px, and a `ShieldCheckIcon` + "Verified · 40+ events" trust line (**all hardcoded — see inconsistency #7**). The white body runs date+time, location, the "N going" + "N spots left" chips (both take **`TAG_SHAPE`** from `EventBadges.tsx`, so their silhouette matches Selling Fast / Music — shape only, their light fills stay), a divider, then the **price as a baseline-aligned row** ("STARTING FROM" left, green "$45 / ticket" right) directly above Book Now. The price used to sit at 52px in the green header and the organiser was a body row with an outline person icon; both moved. All three round controls (back / wishlist / share) come from `EventActions.tsx` at `size="lg"`, so they match the event cards and each other. The category chip is always linen with a per-category accent tinting its label + glyph, from `EventBadges.tsx`; the status tags are a dark tint of their accent with a light-accent label. Both are `rounded-lg` and carry a glyph. Main grid is `2.4fr 1fr` (not `2fr`) to pull the booking card right while keeping its right edge on the shared px-12 line. **One-line title:** `heroTitleSize()` in `page.tsx` scales the font down as the title gets longer (`clamp(20px, min(5, 169/chars)vw, 64px)`) and the `h1` is `whitespace-nowrap`; `overflow-hidden`+ellipsis is the last-resort guard so a pathological title clips instead of wrapping or forcing a horizontal page scroll. Verified 1-line for the seeded titles at 1440px. Below the two-column grid, full width, sits the **"Similar events" horizontal rail** (`SimilarEvents.tsx` — see the Component Registry): same category, near **this event's own coordinates** rather than the city picker's city, plus online events in the category. |
| `/checkout/[id]` | Checkout — order summary + payment; free events skip card form (800ms fake delay); paid events use Stripe intent (2s fake delay); success modal → `/dashboard` |
| `/dashboard` | User dashboard — 3 tabs: My Tickets (QR codes via qrserver.com), My Wishlist, Networking Profile (hardcoded interests) |
| `/organizer` | Organiser console — 3 stat cards (Active Events real, Revenue + Attendees mocked), events table |
| `/organizer/create` | Create/publish event — Event Type toggle (In-Person/Online/Hybrid), Save as Draft + Publish, inline validation, organizer verification guard. **Tickets & Pricing is a 3-column row: Capacity · Currency · Ticket Price.** The Currency `<select>` (from `CURRENCIES` in `packages/types`, default INR) sits *before* Price so the price input's symbol prefix is already correct as you type; the prefix is driven by `currencySymbol(currency)`, not a hardcoded `$`. |
| `/organizer/my-events` | Organiser's own published events list, auth guard |
| `/organizer/onboarding` | One-time KYC form — company name, address, country, registration number (label changes per country) |
| `/chat` | **Chat inbox** — lists the user's rooms (ticketed + organised events, deduped), unread rooms first with a terracotta dot; a row opens `/chat/[roomId]`. Auth-guarded on `_hasHydrated` (avoids the #12 bounce). Reached from the navbar chat button. |
| `/chat/[roomId]` | Live WebSocket chat room — connection status indicator, left/right message alignment by sender. Marks the room active + read while open (`useChatUnreadStore`) so the navbar glow reflects only other rooms. |
| `/explore` | **Unified browse page for events AND communities.** 3-segment view switch below the search row — `View Events` / `View Communities` / `View Both` (default Both), synced to `?view=` (omitted = both). A contextual **Create** button sits inline to the right of the switch: `Create Event` in events view (→ `/organizer/create`), `Create Community` in communities view (→ `/community/create`), **none** in Both view. In **View Both** events + communities render as a single mixed grid (interleaved, no section headings); single-content views show just that type. Controls: shared search box, city picker, **Sort by** (Relevance / Date / Name / Price / Popularity — client-side, synced to `?sort=`), and a collapsible **Filters** panel (category for both; format/availability/date/free apply to events only and hide in communities-only view). **The Availability section (`[All] [Selling Fast]`) is the card's status tags as a filter, and is the panel's ONE client-side filter** — "selling fast" is derived from `tickets_sold / capacity > 0.7`, a test `/event/search` cannot express, so it narrows the fetched rows inside the `items` useMemo rather than the query. **`itemSellingFast` must stay in step with the `selling-fast` badge in `toCarouselEvent`** (`lib/card-adapters.ts`) — move the 70% threshold in one and the filter starts returning cards that carry no Selling Fast tag. It deliberately does **not** filter communities (they have no capacity, and emptying the other half of "View Both" would read as a broken filter), matching how price/date/format already behave. **Only Selling Fast lives there:** Free is the Price toggle and This Week is a Date Range preset, so nothing has two homes; Sold Out was rejected as something nobody browses *for* (those cards already sink via `soldOutLast`). It is **not** a Category chip — Category is single-select, so filing it there would make "Music" and "selling fast" mutually exclusive, which is the same axis-confusion as the online-is-a-format rule. `Today`/`Recommended` are unfilterable for the same reason they are undisplayable (inconsistency #3 — nothing emits them). When city = `Online`, both queries switch to `category=online` instead of a geo radius. Events use `eventsApi`, communities use `communitiesApi` (city-aware). |
| `/communities` | **Permanent redirect → `/explore?view=communities`** (server-side `redirect()`). The old standalone listing was merged into `/explore`. |
| `/community/[slug]` | Community detail — **full-bleed photo hero mirroring `/event/[id]`**: same scrim, same back + wishlist + share controls (`size="lg"`, `kind="community"`), same one-line centred title (`heroTitleSize`), same category chip + status tag row. Then "About this community" (description + website) and the linked events grid. The old green banner + logo lockup are gone (Gautham's call). Body sits in the same `px-12` inside `maxWidth: 1400` container as the event page, so both "About …" headings start on the same line — **do not put it back to `max-w-6xl`.** Communities have no `image_url` column, so the hero photo is always the seeded placeholder, matching the card. Has `layout.tsx` (`generateMetadata`), `opengraph-image.tsx` and `story/route.tsx` alongside, exactly like `/event/[id]`. |
| `/community/create` | Create community (organiser only) — eligibility gate: requires 2+ published events (progress bar shown if ineligible), redirects if already has a community |

Additional pages (all now active):

| Route | What it does |
|---|---|
| `/communities` | Redirects to `/explore?view=communities` (community browsing now lives on the unified Explore page) |
| `/community/[slug]` | Community detail page |
| `/community/create` | Create a community (organiser only) |
| `/explore` | Unified browse page for events + communities (see table above) |
| `/organizer/my-events` | Organiser's own events list |
| `/organizer/onboarding` | Organiser onboarding flow |

**Home page behaviour (important):**
- On load, fetches events near the selected city via `eventsApi.search()` and separately fetches online events (lat/lng 0,0 — so they show regardless of city).
- On first visit to a new city, auto-calls `recommendationsApi.ingestCity()` to pull events from Ticketmaster. This is done **once per city**, tracked in localStorage under `eventmind-ingested-cities`. If ingestion returns 0 events, falls back to `recommendationsApi.generateEventsForCity()` (AI generation) after a 3-second delay.
- Wishlist is fully functional — persisted to localStorage under `eventmind-wishlist`.

**Responsiveness:**
All pages are responsive, and this is now **verified by measurement, not by eye** — `document.scrollWidth === clientWidth` (i.e. no horizontal scrollbar) on `/`, `/explore`, `/event/[id]` and `/community/[slug]` at **320 · 375 · 414 · 768 · 1024 · 1100 · 1280 · 1440 · 1920**. It had NOT been true before: the claim used to sit in this file while eleven surfaces carried a flat `px-12` and hard `gridTemplateColumns`. **Re-run that sweep after any layout change — 1024px in particular, which is where the navbar breaks first (inconsistency #13).**

Standard patterns used throughout:
- Grids: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`
- Horizontal padding: **import `GUTTERS` from [`lib/layout.ts`](frontend_react/apps/web/src/lib/layout.ts)** (`px-4 sm:px-6 lg:px-12`). Do not hand-write the trio — that is how eleven pages ended up on a flat `px-12` while the navbar above them stepped down correctly. `SimilarEvents` had its own private copy; it imports the shared one now.
- Two-column page bodies: `grid-cols-1 lg:grid-cols-[Nfr_1fr]`, never a bare `gridTemplateColumns` — a hard `fr` ratio has no narrow layout, it just squeezes the sidebar until it overflows.
- Form rows: `grid-cols-1 sm:grid-cols-N`. A bare `grid-cols-3` puts three ~100px cells on a phone.
- Wide tables (organiser console, my-events): keep the table's width and wrap it in `overflow-x-auto` with a `min-w-[720px]` on the table. Six columns have no honest narrow layout; scrolling the table is better than crushing it.
- Navbar: desktop layout on `lg+`, hamburger + collapsible menu on `<lg`
- Auth page: two-column (hero + form) on `lg+`, form-only on mobile
- HeroCarousel: 16:9 aspect ratio (`aspectRatio: "16 / 9"`, `maxHeight: 85vh`)
- **Full-bleed hero titles** (`/event/[id]`, `/community/[slug]`): one line with `heroTitleSize()` shrink-to-fit on `lg+`; below `lg` the `.hero-title` rule in `globals.css` lets the title WRAP to 3 lines instead. Shrink-to-one-line bottoms out at the 20px floor on a phone and then ellipsises the title away, which is the one string the page exists to show.

**Auth guard pattern:**
Protected pages (`/dashboard`, `/checkout`, `/chat`, `/organizer/*`) use a `useEffect` that reads `useAuthStore.isAuthenticated` and redirects to `/auth` if false. JWT is decoded with `atob()` + `JSON.parse()` (no external library). Tokens persisted in localStorage under `eventmind-auth`.

---

## What Is Not Built Yet

Read the full breakdown in `Eventmind_files/REACT_MIGRATION.md` under "What Is Not Built Yet". Key gaps:

- **Chat** — now reachable: a **chat button in the navbar** (glows on unread) and a **`/chat` inbox** listing the user's rooms (ticketed + organised events). ⚠️ The glow + inbox are a **frontend-only MVP** — see `components/ChatPresence.tsx`. Still needs backend: message persistence (`chat_endpoints.py` has `db.add`/`commit` commented out), a room-list endpoint, and a real unread/read-receipt mechanism so the glow survives a refresh and detects messages received while offline.
- **Notification bell** — icon present, no panel or backend integration.
- **Help page** — link present, no page.
- **Real ticket issuance** — tickets saved to Zustand/localStorage only, not to the database.
- **Social login** — buttons present but disabled.
- **SEO metadata** — event pages now have `generateMetadata()` + OG/story share images (see "Event sharing" above). Other dynamic routes (`/community/[slug]`, etc.) still need their own `generateMetadata()`.
- **Mobile app** — monorepo is structured for it (`apps/mobile`), not started yet.
- **Event image/banner upload** — the schema now has an `image_url` column (populated for synced Ticketmaster events). Native organiser upload (file → storage → `image_url`) is still not wired up; the create form has no image field yet.
- **Ticket tiers** — backend only supports a single price per event; multi-tier (Free/Standard/VIP) needs schema changes.
- **Ticketmaster geocoding** — Ticketmaster ingestion runs but many events have no venue coordinates. Currently saved with `lat:0, lng:0`. Needs geocoding API (Google Maps or Nominatim) to resolve real coordinates. See `backend/services/recommendation/app/services/ticketmaster_ingestion.py`.
- **Hardcoded organiser identity on event detail (PENDING — agreed with Gautham)** — the `/event/[id]` booking card's green header shows an organiser block (avatar initial, name, "✓ Verified · 40+ events"). **Every part of it is hardcoded and none of it is real:** the name is the literal `"EventMind Collective"` passed at the `<BookingCard>` call site, the avatar is just that string's first letter, and the trust line is a fixed string — there is no organiser lookup, no verification flag and no event count behind it. Gautham approved hardcoding it **for now** so the card could match the reference design; it must be wired to real data before launch, since "Verified" is a trust claim.
  **To fix:** look the organiser up by `event.organizer_id` (`organizerApi`), then pass real `organizer` / `verified` / `eventCount` props into `BookingCard` in [`app/event/[id]/page.tsx`](frontend_react/apps/web/src/app/event/%5Bid%5D/page.tsx). `OrganizerProfile` in `packages/types` already has `VerificationStatus` (`"unverified" | "pending" | "verified"`), so the verified flag is `verification_status === "verified"`; the **event count has no backend field yet** and needs one. Hide the trust line (not fake it) when an organiser is unverified or the count is unknown.
- **Networking Profile tab** — interests section on `/dashboard` profile tab shows hardcoded values (Technology, AI, Venture Capital). Needs real user profile storage.
- **Chat entry point** — ✅ done (frontend MVP): navbar chat button + glow (`ChatButton` / `ChatPresence`) and a `/chat` inbox room list. The dashboard ticket card still links straight into `/chat/[roomId]` too. Backend unread/persistence still pending (see the Chat bullet above).

## Planned Work

### Ticketmaster Event Ingestion
- Lives in `backend/services/recommendation/app/services/ticketmaster_ingestion.py`
- Triggered by `POST /recommendation/ingest-city?city=...&lat=...&lng=...&radius=100` via the gateway
- **The home page now calls this automatically** on first visit to any city (tracked in `eventmind-ingested-cities` in localStorage). If the city is still empty after ingestion, it falls back to `recommendationsApi.generateEventsForCity()` for AI-generated events.
- Events are fetched from Ticketmaster and saved directly into `platform_dev.db` via the event service — there is no separate file
- **Current bug:** Many Ticketmaster events have no venue coordinates. Temporary fix saves them with `lat:0, lng:0`. Real fix requires geocoding (not yet implemented).
- Once geocoding is added and this works end-to-end, `seed_events.py` becomes unnecessary for populating events (though it will still be useful for seeding communities)

### Running on PostgreSQL (implemented)
Shadow mode (`shadow_runner.py`) uses one shared SQLite file. To run on Postgres instead — one database per service, matching production — use `postgres_runner.py`. No code/model changes are needed; SQLAlchemy handles both dialects and `create_all` builds the schema on startup.

```powershell
# 1. Start Postgres (creates the 8 per-service DBs on first init via
#    backend/db/init/01-create-databases.sql; data persists in the pgdata volume)
docker compose up -d postgres

# 2. Install the driver (also in each DB-backed service's requirements.txt)
python -m pip install psycopg2-binary

# 3. Start all services against Postgres (Kafka + Redis still mocked)
python backend\scripts\postgres_runner.py

# 4. Load data (use PYTHONUTF8=1 on Windows so seed prints don't crash on cp1252)
$env:PYTHONUTF8=1; python backend\scripts\seed_events.py
python backend\scripts\sync_ticketmaster.py
```

- **Per-service DBs:** only services whose `config.py` declares `DATABASE_URL` get one — `auth_db, user_db, event_db, ticketing_db, payment_db, chat_db, review_db, community_db`. `gateway`, `agents`, `recommendation`, `notification` are stateless.
- **Host port 55432**, not 5432 — `docker-compose.yml` maps `55432:5432` to avoid clashing with a native Postgres that may already own 5432. Connect with `postgresql://user:password@localhost:55432/<svc>_db`. Override via `PG_DSN_BASE`.
- **Inspect:** `docker compose exec -T postgres psql -U user -d event_db -c "\dt"`.

---

## Contribution Guidelines

When you complete work in a session:

1. **Update this file (`CLAUDE.md`)** — add anything that would help the next Claude instance pick up without re-asking. Keep it factual and forward-looking, not a session log.
2. **Save new documents to `Eventmind_files/`** — not inside `eventmind/`. That folder is for code only.
3. **Keep `Eventmind_files/REACT_MIGRATION.md` current** — update the "Pages Built" table and "What Is Not Built Yet" section as features are completed.
4. **Update the Component Registry above** — whenever a component is created or its purpose changes significantly.
5. **Run `pnpm --filter @eventmind/web type-check` before finishing** — all changes must be type-error free. This is non-negotiable.
6. **Match the brand palette exactly** — do not introduce new colours or fonts without approval. The app uses a single font (currently Roboto) defined once in `layout.tsx` as `--font-app`; everything inherits it. See the Typography section.
7. **Test in the browser** — for UI changes, run the dev server and visually verify the change before reporting it done. Type-checking does not catch visual bugs.
8. **Keep Node.js at v20+** — the project `.nvmrc` pins 24.16.0. If you use nvm, run `nvm use` inside `frontend_react/` to switch automatically.
9. **Do not commit `.env.local` or `start.bat`** — both are in `.gitignore`. Never commit secrets or local environment files.
10. **If you delete `platform_dev.db`** — restart all services first (so the community service creates the communities table), then re-run `seed_events.py`.
11. **Always stop the dev server with `Ctrl+C` in its terminal** — do not just close the window or kill the terminal. On Windows, killing the terminal leaves the Next.js Turbopack worker processes orphaned. They accumulate across runs (we once found 321 zombie `node` processes), eat RAM, and cause `Zone Allocation failed / JavaScript heap out of memory` crashes on subsequent runs — especially on low-RAM (8 GB) machines. If a run ever crashes, clean up the orphans before retrying:
    ```powershell
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'next' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    ```
