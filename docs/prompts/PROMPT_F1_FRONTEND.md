# PROMPT F1 — ClassSync Frontend (core screens, kept simple)

> **How to run this prompt (for the human):** save this file in the repo as `docs/prompts/PROMPT_F1_FRONTEND.md`, then tell the agent:
> *"Read docs/prompts/PROMPT_F1_FRONTEND.md and execute it exactly, phase by phase."*

---

## 0. Your role and the ground rules

You are adding a React frontend to the existing **ClassSync** repository.

- The Spring Boot backend (Java 21, Spring Boot 3.4.3, MySQL 8) is complete and lives at the repo root.
- The frontend goes into a new folder, **`frontend/`**, in the same repository.

**This is a college project. Simplicity is the top priority.**
- The team must be able to read and explain every file in a viva.
- Prefer plain, readable React over clever abstractions.
- When you're unsure between a simple solution and a "better" one, choose the simple one.

### Ground rules

1. **The tech stack is fixed** (section 2). Do not add any other npm package. If you believe one is essential, stop and ask.
2. **JavaScript, not TypeScript.** Use function components and hooks only.
3. **Backend changes are limited** to the five items in Phase 0, plus a short "Running the frontend" section in the root `README.md`. No other backend file may change.
4. **Never edit Flyway migrations.**
5. **Branch and commit discipline:**
   - Work on branch `feature/frontend-f1`.
   - Commit after each phase and push.
   - Never merge into `main`.
6. **Do not weaken, delete or `@Disabled` any backend test.**
7. **Report honestly.**
   - Paste raw command output.
   - **Do not paste source code into the report**; the reviewer reads the repository directly.
   - Never invent commit hashes, test counts or results.
   - If something fails, or a screenshot can't be saved, say so.
8. **If you are blocked, stop and ask the user.** Examples: MySQL credentials, Node version, permissions.
9. **If you run out of time or context:**
   - stop at a phase boundary with everything passing;
   - update the report, marking the remaining tasks NOT STARTED;
   - commit, push, and print the report.
10. **Do not modify this prompt file.**

---

## 1. What we are building

| Who | Screen | Purpose |
|---|---|---|
| Everyone | Login | Sign in. The session survives a page refresh. Logout. Menu by role |
| Professor | My Week | Weekly calendar of my classes. Cancel or reschedule a class from here |
| Professor | Find a Room | Ranked room recommendations with scores and reasons → book an extra class, or move a class (reschedule mode) |
| Both roles | Occupancy | Rooms × hours grid for one day, showing which rooms are busy |
| Admin | Campus | Manage complexes, rooms and facilities (create, edit, activate/deactivate, show inactive) |
| Admin | Timetables | Versions list, create drafts, edit entries in a draft, activate (with "effective from"), archive |
| Admin | Generate | Generate dated classes for a version and date range; show the conflict report |

**Not in this prompt:** analytics dashboard, notifications, deployment, user management, TypeScript.

---

## 2. Tech stack (fixed — nothing else)

| Purpose | Package(s) | Notes |
|---|---|---|
| Build tool + dev server | `vite`, `@vitejs/plugin-react` | Scaffold with `npm create vite@latest frontend -- --template react` (the JavaScript template; answer **No** to any experimental options) |
| UI | `react`, `react-dom` | From the template |
| Pages | `react-router` | **Declarative mode only:** `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `useNavigate`, `useParams`, `useSearchParams`. No loaders, actions or data routers |
| Styling | `tailwindcss`, `@tailwindcss/vite` | Tailwind v4. Add the plugin in `vite.config.js` and put `@import "tailwindcss";` at the top of `src/index.css`. No `tailwind.config.js`, no PostCSS config, no component library |
| Dates | `date-fns` | |
| Tests (dev only) | `vitest` | Node environment; unit tests for plain JS modules only. No jsdom, no Testing Library. Import `describe/it/expect/vi` from `'vitest'` (no globals) |
| Lint (dev only) | The ESLint setup that comes with the Vite template | Keep it as generated |

**Not allowed:**
- axios, TanStack Query, Redux or any state library;
- form libraries;
- UI kits, icon packs, calendar libraries;
- TypeScript;
- Testing Library, jsdom, MSW.

**Node.js:** run `node -v`. Vite needs Node 20.19+ or 22.12+; if the version is older, stop and ask the user.

**Talking to the backend in development: use the Vite proxy.** The browser only ever talks to `http://localhost:5173`, so the session cookie works without any CORS setup.

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
  },
  test: { environment: 'node' },
})
```

All API calls use relative URLs (`/api/...`). **Never hard-code `localhost:8080` anywhere in `frontend/src`.**

`package.json` scripts:
- `dev`
- `build`
- `preview`
- `lint`
- `test` (`vitest run`)

Commit `package-lock.json`. Make sure `frontend/node_modules` and `frontend/dist` are git-ignored; the template's `.gitignore` does this.

---

## 3. Folder structure (create exactly this)

```
frontend/
  index.html
  package.json
  package-lock.json
  vite.config.js
  eslint.config.js                    (from the template)
  README.md
  src/
    main.jsx                          BrowserRouter + AuthProvider + App
    App.jsx                           all routes in one place
    index.css                         @import "tailwindcss";
    api/client.js                     request() wrapper + ApiError
    api/client.test.js
    api/endpoints.js                  one small function per backend endpoint (section 4)
    auth/AuthContext.jsx              current user, login(), logout(), session restore via /api/auth/me
    auth/RequireRole.jsx              route guard
    components/Navbar.jsx
    components/Alert.jsx              red error / green success message
    components/Modal.jsx
    components/ConfirmDialog.jsx
    components/Loading.jsx
    components/StatusBadge.jsx
    components/WeekNavigator.jsx
    components/WeekCalendar.jsx       professor week view (days × hours)
    components/OccupancyGrid.jsx      rooms × hours for one day
    pages/LoginPage.jsx
    pages/NotAllowedPage.jsx
    pages/NotFoundPage.jsx
    pages/professor/MyWeekPage.jsx
    pages/professor/FindRoomPage.jsx
    pages/shared/OccupancyPage.jsx
    pages/admin/CampusPage.jsx
    pages/admin/TimetablesPage.jsx
    pages/admin/VersionDetailPage.jsx
    pages/admin/GeneratePage.jsx
    utils/dates.js                    date/time helpers (section 6)
    utils/dates.test.js
```

Rules for this structure:
- Keep each file under about 250 lines.
- If a page gets too long, a small extra component next to it is fine.
- Don't change the structure otherwise.

---

## 4. Backend API contract (use exactly these names)

The backend source is in this repository (`src/main/java/com/classsync`: controllers + `dto` records). **Before writing `endpoints.js`, check this section against those files. If the code disagrees with this section, the code wins; record it as a deviation.**

### General rules
- **Format:** JSON. Dates are `"yyyy-MM-dd"`.
- **Times:** responses return times as `"HH:mm:ss"`, so display the first 5 characters. Send times as `"HH:mm"`.
- **Errors:** every error response has the body `{ "status", "error", "message" }`. Always show `message` to the user.
- **Login:** uses an HTTP-only session cookie (`JSESSIONID`). The browser handles it; never read or store it.
- **Seed accounts** (password `password123`):
  - `admin@classsync.edu` (ADMIN)
  - `aturing@classsync.edu` (PROFESSOR)
  - `alovelace@classsync.edu` (PROFESSOR)

### Shapes

```
User           { id, name, email, role }
Occurrence     { id, timetableEntryId, professor: {id, name, email, employeeCode},
                 room: {id, roomNumber, roomType, capacity, active, complex: {id, name, code}},
                 scheduleDate, startTime, endTime, eventType, status, courseCode, courseName,
                 createdById, createdByName, createdAt, rescheduledFromId }
Booking        { id, eventType, status, date, startTime, endTime, courseCode, courseName,
                 professor: {id, name, email}, room: {id, roomNumber}, rescheduledFromId }
                 (note: Booking uses "date", Occurrence uses "scheduleDate")
Recommendation { room: {id, roomNumber, roomType, capacity, complexId, complexName}, score, reasons: [string] }
Complex        { id, name, code, active }
RoomSummary    { id, roomNumber, roomType, capacity, active }
RoomDetail     { id, roomNumber, roomType, capacity, active, complex: {id, name, code}, facilities: [Facility] }
Facility       { id, name, active }
UserSummary    { id, name, email, employeeCode, role, status }
Version        { id, academicYear, semester, versionNumber, status, createdById, createdByName, createdAt }
Entry          { id, timetableVersionId, professor: {id, name, email, employeeCode}, courseCode, courseName,
                 room: {id, roomNumber, roomType, capacity, active}, dayOfWeek, startTime, endTime }
EntryBody      { professorId, courseCode, courseName, roomId, dayOfWeek, startTime, endTime }
GenerationResult { timetableVersionId, startDate, endDate, createdCount, skippedExistingCount, conflictCount, conflicts: [Conflict] }
Conflict       { date, timetableEntryId, courseCode, startTime, endTime, roomId, roomNumber, professorId,
                 professorName, type, conflictingOccurrenceId, conflictingEventType, conflictingCourseCode }
                 (the last three are null when type is ROOM_INACTIVE)
```

### Enums

| Field | Values | Notes |
|---|---|---|
| `role` | `ADMIN`, `PROFESSOR` | |
| `roomType` | `CLASSROOM`, `LAB`, `LECTURE_HALL`, `SEMINAR_HALL` | Display as "Classroom", "Lab", "Lecture hall", "Seminar hall" |
| `eventType` | `OFFICIAL`, `EXTRA` | |
| Occurrence `status` | `SCHEDULED`, `CANCELLED`, `RESCHEDULED`, `SUPERSEDED` | Only SCHEDULED occupies a room |
| Version `status` | `DRAFT`, `ACTIVE`, `ARCHIVED` | |
| Conflict `type` | `ROOM_BUSY`, `PROFESSOR_BUSY`, `ROOM_INACTIVE` | |
| `dayOfWeek` | `1` = Monday … `7` = Sunday | |

### Endpoints

| Method & path | Who | Body / query | Returns |
|---|---|---|---|
| `POST /api/auth/login` | anyone | `{email, password}` | User (401 = wrong credentials) |
| `GET /api/auth/me` | logged in | – | User (401 = not logged in) |
| `POST /api/auth/logout` | logged in | – | 204, no body |
| `GET /api/schedule-occurrences` | both | query (all optional): `startDate, endDate, professorId, roomId, complexId, status` | Occurrence[] |
| `GET /api/schedule-occurrences/{id}` | both | – | Occurrence |
| `GET /api/rooms/recommendations` | both (UI: professor) | query: `date, startTime, endTime` (required); `capacity, complexId, roomType, facilities` (optional; facilities = comma-separated ids, e.g. `1,3`) | Recommendation[], best first |
| `POST /api/bookings` | PROFESSOR only | `{roomId, date, startTime, endTime, courseCode, courseName}` | Booking |
| `POST /api/classes/{id}/cancel` | PROFESSOR (own) / ADMIN | – | Booking (status CANCELLED) |
| `POST /api/classes/{id}/reschedule` | PROFESSOR (own) / ADMIN | `{date, startTime, endTime, roomId}` | Booking = the **new** replacement class (its `rescheduledFromId` = the old id) |
| `GET /api/complexes` | both | `includeInactive=true` (ADMIN only) | Complex[] |
| `POST /api/complexes` / `PUT /api/complexes/{id}` | ADMIN | `{name, code}` | Complex |
| `PATCH /api/complexes/{id}/status` | ADMIN | `{active: true \| false}` | updated item |
| `GET /api/complexes/{complexId}/rooms` | both | `includeInactive=true` (ADMIN only) | RoomSummary[] |
| `POST /api/complexes/{complexId}/rooms` | ADMIN | `{roomNumber, roomType, capacity, facilityIds: [ids]}` | RoomDetail |
| `GET /api/rooms/{id}` | both | `includeInactive=true` (ADMIN only) | RoomDetail |
| `PUT /api/rooms/{id}` | ADMIN | `{roomNumber, roomType, capacity, facilityIds}` | RoomDetail |
| `PATCH /api/rooms/{id}/status` | ADMIN | `{active}` | updated item |
| `GET /api/facilities` | both | `includeInactive=true` (ADMIN only) | Facility[] |
| `POST /api/facilities` / `PUT /api/facilities/{id}` | ADMIN | `{name}` | Facility |
| `PATCH /api/facilities/{id}/status` | ADMIN | `{active}` | updated item |
| `GET /api/users` | ADMIN | `role=PROFESSOR&status=ACTIVE` (optional) | UserSummary[] |
| `GET /api/timetables/versions` | both | `academicYear, semester` (optional) | Version[] |
| `POST /api/timetables/versions` | ADMIN | `{academicYear, semester}` | Version (DRAFT) |
| `PATCH /api/timetables/versions/{id}/activate` | ADMIN | query `effectiveFrom=yyyy-MM-dd` (optional, default today) | Version + `{archivedVersionId, effectiveFrom, supersededOccurrenceCount}` |
| `PATCH /api/timetables/versions/{id}/archive` | ADMIN | – | Version |
| `GET /api/timetables/versions/{versionId}/entries` | both | – | Entry[] |
| `POST /api/timetables/versions/{versionId}/entries` | ADMIN | EntryBody | Entry |
| `PUT /api/timetables/entries/{entryId}` | ADMIN | EntryBody | Entry |
| `DELETE /api/timetables/entries/{entryId}` | ADMIN | – | empty body |
| `POST /api/schedule-occurrences/generate` | ADMIN | `{timetableVersionId, startDate, endDate}` | GenerationResult |

### Backend rules the UI must respect
- Only SCHEDULED classes can be cancelled or rescheduled; anything else returns 409.
- Booking or rescheduling into the past returns 400.
- Overlaps return 409, with a message such as "Room is already scheduled for the requested time."
- Recommendations return `[]` when the professor already has a class at that time. This includes the class being rescheduled, if the new time overlaps it.
- Version rules:
  - entries can be added, edited or deleted only in DRAFT versions;
  - only DRAFT versions can be activated;
  - generation works only for ACTIVE versions;
  - the generation window is at most 12 months.
- Admins cannot book extra classes; `POST /api/bookings` is professor-only.

---

## 5. Screens (behaviour)

### 5.1 Login, session, navbar, routing

**Login page (`/login`):**
- Email and password fields with a "Sign in" button.
- On 401, show a red alert: "Invalid email or password".
- Show the three demo accounts in small grey text under the form.

**Session restore on app start:**
- Call `GET /api/auth/me` once and show `Loading` while waiting.
- 200 → logged in. 401 → logged out.
- Keep the user **only in React state**: no localStorage, no sessionStorage.

**After login,** go home by role: PROFESSOR → `/my-week`, ADMIN → `/admin/timetables`.

**Navbar** (when logged in):
- "ClassSync" on the left.
- Links for PROFESSOR: My Week, Find a Room, Occupancy.
- Links for ADMIN: Timetables, Generate, Campus, Occupancy.
- On the right: user name + role, and a Logout button. Logout calls `POST /api/auth/logout`, clears the user, and goes to `/login`.

**Session expiry:**
- `client.js` lets `AuthContext` register an `onUnauthorized` callback.
- Any 401 from an endpoint *other than* `/api/auth/login` and `/api/auth/me` triggers it: clear the user, go to `/login`, and show "Your session has expired. Please sign in again."

**Routes:**

| Path | Access |
|---|---|
| `/login` | public |
| `/` | redirects home by role |
| `/my-week`, `/find-room` | PROFESSOR |
| `/occupancy` | both roles |
| `/admin/campus`, `/admin/timetables`, `/admin/timetables/:versionId`, `/admin/generate` | ADMIN |
| anything else | `NotFoundPage` |

**`RequireRole` guard:**
- not logged in → redirect to `/login`;
- wrong role → `NotAllowedPage` ("You don't have access to this page", with a link home).

### 5.2 My Week (PROFESSOR)

**Navigation:**
- `WeekNavigator` with Previous / This week / Next buttons.
- Label like "10–16 Nov 2026". Weeks run Monday–Sunday.

**Data:** load `GET /api/schedule-occurrences?professorId={me.id}&startDate={monday}&endDate={sunday}` (all statuses).

**Checkbox:** "Show cancelled and moved classes", on by default.

**`WeekCalendar` layout:**
- 7 columns (Mon–Sun, with dates) and a time axis from 08:00 to 20:00 with hour lines.
- Each class is a block positioned by its time, showing course code, room number and "09:00–10:00".

**Block colours and labels:**

| Class | How it looks |
|---|---|
| OFFICIAL | blue |
| EXTRA | green |
| Any status other than SCHEDULED | grey, line-through text, a small label (Cancelled / Rescheduled / Superseded); drawn **behind** scheduled blocks with reduced opacity |
| Replacement class (`rescheduledFromId` not null) | adds a small "Moved" tag |

**Clicking a block:**
- Opens a `Modal` with details: course, date, time, room + complex, type, status.
- If the class is SCHEDULED, the modal has two buttons:
  - **Reschedule** → navigate to `/find-room?reschedule={id}`.
  - **Cancel class** → `ConfirmDialog` → `POST /api/classes/{id}/cancel` → green alert → reload.

**Also on the page:**
- A "Book an extra class" button that goes to `/find-room`.
- An empty week shows "No classes this week."

### 5.3 Find a Room (PROFESSOR)

**Form fields:**
- date (default today);
- start and end (default: the next full hour, for 1 hour);
- capacity (optional number);
- complex (optional select, from `GET /api/complexes`);
- room type (optional select);
- facilities (checkboxes, from `GET /api/facilities`).

**Client checks:** date, start and end are required; end must be after start; capacity must be a positive whole number.

**Results:**
- Submitting calls `GET /api/rooms/recommendations`.
- Results show in rank order. Each result has: rank number, room number, complex name, room type, capacity, the score as a number with a simple bar (width = score %), and the reasons as a list.

**Normal mode:**
1. Each result has a **Book** button.
2. It opens a `Modal` asking for Course code and Course name (both required).
3. It calls `POST /api/bookings`.
4. On success, show a green alert "Booked {room} on {date}, {start}–{end}" with a link to My Week for that week.

**Reschedule mode (`/find-room?reschedule={id}`):**
1. Load `GET /api/schedule-occurrences/{id}`.
2. Show a banner: "Rescheduling {courseCode} — {weekday, date}, {start}–{end}, {room}".
3. Result buttons say **Move here** → `ConfirmDialog` → `POST /api/classes/{id}/reschedule` with `{date, startTime, endTime, roomId}`.
4. On success, go to My Week for the new date, with a green alert.
5. If the class is not SCHEDULED, show an error instead of the form.

**Empty results:** show "No rooms are free for this slot. If you already have a class at this time (including the class you are moving), the search returns nothing — try another time."

**Errors:** a 400 or 409 from booking or rescheduling shows the backend `message` in a red alert above the results.

### 5.4 Occupancy (both roles)

**Controls:**
- Day picker (default today) with Previous day / Today / Next day buttons.
- Complex filter: "All", or one complex.

**Data:**
- Rooms: `GET /api/complexes`, then `GET /api/complexes/{id}/rooms` for each complex (active only).
- Classes: `GET /api/schedule-occurrences?startDate={day}&endDate={day}&status=SCHEDULED`, plus `complexId` when filtered.

**`OccupancyGrid` layout:**
- One row per room, grouped by complex, labelled like "SEC-101 · Classroom · 40".
- Columns from 08:00 to 20:00.
- Blocks show course code + professor name, with a `title` tooltip holding the full details.
- Includes a legend (Official = blue, Extra = green). Free time stays white.

This page is read-only in F1.

### 5.5 Campus (ADMIN)

**Layout:**
- Three tabs: Complexes | Rooms | Facilities.
- One "Show inactive" checkbox, which adds `includeInactive=true` to all list calls.

**Complexes tab:**
- Table: name, code, status badge, and actions **Edit** and **Activate/Deactivate** (with a `ConfirmDialog`).
- "Add complex" button → `Modal` with name and code.

**Rooms tab:**
- A complex select.
- Table: room number, type, capacity, status, and actions Edit and Activate/Deactivate.
- "Add room" button → `Modal` with room number, type, capacity and facility checkboxes.
- Edit first loads `GET /api/rooms/{id}?includeInactive=true` so the facility checkboxes are pre-ticked.

**Facilities tab:**
- Table: name, status, Edit, Activate/Deactivate.
- "Add facility" button → `Modal` with the name.

After every successful change: show a green alert and reload the list.

### 5.6 Timetables (ADMIN)

**Versions list (`/admin/timetables`):**
- Table of versions: academic year, semester, version #, status badge, created by, created on.
- Actions:
  - **Open** → `/admin/timetables/{id}`;
  - **Activate** (DRAFT only);
  - **Archive** (DRAFT or ACTIVE, with `ConfirmDialog`).
- "New draft" button → `Modal` with academic year (placeholder `2026-27`) and semester (placeholder `1`).

**Activate modal:**
1. An "Effective from" date field, defaulting to today.
2. This explanation text: *"The current ACTIVE version of the same academic year and semester will be archived. Its official classes on or after this date will be marked SUPERSEDED. Extra classes are not touched."*
3. Confirming calls `PATCH .../activate?effectiveFrom=…`.
4. On success, show a green alert: "Version activated. Archived version: {archivedVersionId or 'none'}. {supersededOccurrenceCount} future classes superseded."

**Version detail (`/admin/timetables/:versionId`):**
- Header: year, semester, version #, status.
- Entries table sorted by day, then start time. Columns: Day, Time, Course, Professor, Room.
- **If DRAFT:** "Add entry", Edit, and Delete (with `ConfirmDialog`). The entry `Modal` fields are:
  - professor: select from `GET /api/users?role=PROFESSOR&status=ACTIVE`;
  - course code and course name;
  - room: select from all active rooms, labelled like "SEC-101 (Science & Engineering Complex)";
  - day: Monday … Sunday → 1 … 7;
  - start and end.
- **If not DRAFT:** read-only, with the note "Only DRAFT versions can be edited."

### 5.7 Generate (ADMIN)

**Form:**
- Version: select ACTIVE versions only. If there are none, explain that a version must be activated first.
- Start date and end date.
- Client checks: end ≥ start, and at most 12 months apart.

**Result** (after `POST /api/schedule-occurrences/generate`):
- Three numbers: Created, Already existed, Conflicts.
- If there are conflicts, a table with columns Date, Time, Course, Room, Professor, Problem. The Problem text:

| Type | Problem text |
|---|---|
| `ROOM_BUSY` | "Room already has {conflictingCourseCode} (Official/Extra)" |
| `PROFESSOR_BUSY` | "Professor already teaching {conflictingCourseCode}" |
| `ROOM_INACTIVE` | "Room or its complex is inactive" |

- A note under the result: *"Running generation again only fills gaps — after fixing a conflict, run it again for the same dates."*

### 5.8 Every page

- **Loading and empty states:** show `Loading` while fetching, and empty-state text for empty lists.
- **Error messages** (red `Alert`):

| Situation | Message |
|---|---|
| Any API error | The backend `message` |
| 403 | "You don't have permission to do that." |
| Network failure | "Cannot reach the server. Is the backend running on port 8080?" |

- **No double submits:** disable buttons while a request is running.
- **Styling:** clean and consistent Tailwind styling. Desktop-first; it must work well at 1024 px and wider. No animations needed.

---

## 6. Dates, times and the two grids

**Rules:**
- **Never use `toISOString()` to make a date string.** India is UTC+5:30, so it returns the *previous day* before 05:30 AM. Use date-fns `format(d, 'yyyy-MM-dd')` and `parseISO('2026-11-10')`.
- Weeks start on Monday: `startOfWeek(d, { weekStartsOn: 1 })`.
- The grids show 08:00–20:00. Blocks are positioned with percentages from `blockPosition`; parts outside that range are clipped.

**`utils/dates.js` must export these helpers, each unit-tested:**

| Helper | Behaviour |
|---|---|
| `toApiDate(date)` | → `"yyyy-MM-dd"` (local date) |
| `parseApiDate(str)` | → Date (local) |
| `weekRange(date)` | → `{ start, end, days }` (Monday–Sunday, 7 days) |
| `formatWeekLabel(start)` | → e.g. `"10–16 Nov 2026"` |
| `toHHmm(time)` | `"09:00:00"` → `"09:00"` |
| `timeToMinutes("09:30")` | → `570` |
| `overlaps(aStart, aEnd, bStart, bEnd)` | Half-open intervals, the same rule as the backend: back-to-back is **not** an overlap |
| `blockPosition(start, end, dayStart = 480, dayEnd = 1200)` | → `{ startPercent, sizePercent }`, clamped to the visible range |

**`api/client.js` behaviour (unit-tested, mocking `globalThis.fetch` with `vi.fn()`):**
1. `request(method, path, { body, query })` builds the URL with query parameters, skipping empty values.
2. It sends JSON with `Content-Type: application/json` when there is a body.
3. It returns parsed JSON, or `null` for 204 or empty bodies.
4. On error, it throws `ApiError { status, message }` using the backend `message`, with a sensible fallback per status.
5. A network failure becomes the "Cannot reach the server…" message.
6. A 401 calls the registered `onUnauthorized` callback, except for `/api/auth/login` and `/api/auth/me`.

**Minimum: 15 unit tests across `dates.test.js` and `client.test.js`.** They must include these cases:

*Date helpers:*
- a Sunday belongs to the week starting the previous Monday;
- `toApiDate(new Date(2026, 10, 10, 0, 30))` returns `"2026-11-10"`;
- `toHHmm`;
- `overlaps`: back-to-back (10:00–11:00 vs 11:00–12:00) → false, and partial overlap → true;
- `blockPosition` clamping.

*Client:*
- 204 → `null`;
- the error message is taken from the response body;
- the network-failure message;
- the 401 callback is called for a normal endpoint but not for `/api/auth/me`.

---

## 7. Phases

At the end of every phase:
1. Run the checks listed for that phase; they must pass.
2. Update `docs/reports/PROMPT_F1_REPORT.md`.
3. Commit, including the report, and `git push`.

### Phase 0 — Setup and backend polish (the ONLY backend code changes)

**Setup:**
```bash
git status                          # uncommitted changes? STOP and ask the user
git checkout main && git pull
git checkout -b feature/frontend-f1
git rev-parse HEAD                  # record as BASE_COMMIT
node -v; npm -v; java -version; mvn -v
```

Then:
- Write your plan to `docs/superpowers/plans/<today>-promptF1-frontend.md`, in the style of the earlier plans.
- Create the report skeleton `docs/reports/PROMPT_F1_REPORT.md` (section 9) with every task marked NOT STARTED.

**Backend fixes:**

- **B1 — concurrency test.** In `GenerationConcurrencyIntegrationTests`:
  - replace `assertTrue(scheduledRows.size() <= 1, …)` with `assertEquals(1, scheduledRows.size(), …)`;
  - make each iteration assert that exactly one of the two operations produced that row.
- **B2 — test 30.** In `ClassScheduleIntegrationTests`, test 30 must count only `DuplicateResourceException` as the expected failure. Capture any other exception and fail the test with it.
- **B3 — dead overload.** In `TimetableVersionService`, delete the unused one-argument `activateVersion(Integer id)`. First confirm with grep that nothing calls it.
- **B4 — query list in the docs.** In `README.md` and `PROJECT_PROGRESS_REPORT.md`, correct the generation query list to the **7** queries the code actually runs, in code order:
  1. version `FOR UPDATE`;
  2. entries (join fetch);
  3. admin user lookup;
  4. professors `FOR UPDATE`;
  5. rooms `FOR UPDATE`;
  6. existing `(entry, date)` keys;
  7. SCHEDULED occurrences in the window.

  Read `ScheduleOccurrenceService.generateOccurrences` first; if its order differs, document the code's order.
- **B5 — no sessions for logged-out requests.**
  - In `SecurityConfig`, add `.requestCache(cache -> cache.disable())`, so requests made while logged out no longer create a session.
  - Add a test to `SecurityAuthenticationTests`: an unauthenticated `GET /api/auth/me` returns 401, and no session was created (`result.getRequest().getSession(false)` is `null`).

**Checks:** `mvn clean test` is green (expected: 217 tests).

**Commit:** `fix(F1-P0): backend polish before frontend`

### Phase 1 — Frontend setup, login, layout

- Scaffold `frontend/` (section 2) and install only the allowed packages.
- Set up Tailwind v4 and the proxy.
- Build: `client.js`, `endpoints.js` (every endpoint in section 4), `AuthContext`, `RequireRole`, `Navbar`, `LoginPage`, `NotAllowedPage`, `NotFoundPage`.
- Create the full route table, with simple placeholder pages for the screens not built yet.

**Checks:** `npm run lint`, `npm run build`.

**Commit:** `feat(F1-P1): frontend setup, login and layout`

### Phase 2 — Professor screens and Occupancy

- Build: `utils/dates.js`, `WeekNavigator`, `WeekCalendar`, `MyWeekPage`, `FindRoomPage` (booking + reschedule mode), `OccupancyGrid`, `OccupancyPage`.

**Checks:** `npm run lint`, `npm run build`.

**Commit:** `feat(F1-P2): professor screens and occupancy grid`

### Phase 3 — Admin screens

- Build: `CampusPage`, `TimetablesPage`, `VersionDetailPage`, `GeneratePage`.

**Checks:** `npm run lint`, `npm run build`.

**Commit:** `feat(F1-P3): admin screens`

### Phase 4 — Tests and docs

- Write `dates.test.js` and `client.test.js` (at least 15 tests; section 6).
- Write `frontend/README.md` covering:
  - prerequisites (Node version);
  - install;
  - start the backend first, then `npm run dev`;
  - open http://localhost:5173;
  - the demo accounts;
  - the npm scripts;
  - the folder structure;
  - how the proxy works.
- Root `README.md`: add a short "Running the frontend" section that links to `frontend/README.md`.

**Checks:** `npm run lint`, `npm test`, `npm run build`.

**Commit:** `docs(F1-P4): frontend tests and docs`

### Phase 5 — Walkthrough, screenshots, final report

**1. Start the backend on a fresh demo database. Never use the dev database `classsync`.**

If `classsync_demo` already exists from an earlier attempt, drop it first.

```bash
mvn -q -DskipTests package
DB_URL="jdbc:mysql://localhost:3306/classsync_demo?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" \
  nohup java -jar target/classsync-backend-0.0.1-SNAPSHOT.jar > /tmp/classsync-f1-backend.log 2>&1 &
# wait until  curl -s http://localhost:8080/api/health  responds
curl -s -i http://localhost:8080/api/auth/me     # expect 401 and NO Set-Cookie header (proves B5)
cd frontend && npm run dev
```

**2. Run the walkthrough.**
- Use your browser tool to run scenarios W1–W13 (section 8) at http://localhost:5173.
- Use dates from **next week** onward, never past dates.

**3. Save screenshots** as PNG files in `docs/screenshots/`, with the file names given in section 8. If your browser tool cannot save files into the repo, say so in the report and keep the screenshots in your walkthrough artifact instead.

**4. Clean up.**
- Stop the backend and the dev server.
- Leave `classsync_demo` in place, since the team can use it for demos, and say so in the report.

**5. Finish the report.** Complete the report, then commit `docs(F1-P5): walkthrough screenshots and report`, push, and print the **entire** report as your final message.

---

## 8. Walkthrough scenarios

Definitions:
- **N** = the Monday after today.
- **N2** = N + 7 days.
- Each scenario is marked PASS or FAIL, with a screenshot.

| ID | Steps | Expected | Screenshot |
|---|---|---|---|
| W1 | Log in as admin; refresh the page | Lands on Timetables; still logged in after the refresh | `f1-01-admin-home.png` |
| W2 | Create draft `2026-27` / `1`; open it; add entries (see list below) | Entries table shows all three | `f1-02-version-entries.png` |
| W3 | Activate it (effective from today) | Success message | `f1-03-activated.png` |
| W4 | Generate N … N+6 | Created 3, Conflicts 0 | `f1-04-generate-ok.png` |
| W5 | Log out. Log in as Ada; Find a Room for N2 Monday 09:00–10:00, capacity 30; book **SEC-101** as `MA299` "Extra Tutorial". Log out. Log in as admin; generate N2 … N2+6 | Created 2, Conflicts 1: ROOM_BUSY for CS101, conflicting MA299 (Extra) | `f1-05-generate-conflict.png` |
| W6 | Log in as Turing; My Week for week N | CS101 (Mon) and CS205 (Thu) in blue | `f1-06-my-week.png` |
| W7 | Turing: Find a Room for N Tuesday 10:00–11:00, capacity 30, facility Projector | Ranked list with scores and reasons | `f1-07-recommendations.png` |
| W8 | Book the top result as `CS299` "Extra Lab" | Appears green on Tuesday in My Week | `f1-08-booked.png` |
| W9 | Reschedule CS205 to N Friday 10:00–11:30 | Thursday block grey "Rescheduled"; Friday block blue with "Moved" | `f1-09-rescheduled.png` |
| W10 | Cancel CS299 | Grey "Cancelled" | `f1-10-cancelled.png` |
| W11 | (a) Find a Room for N Monday 09:00–10:00 (Turing already has CS101 then). (b) Book any room for a free slot, then click Book on the same result again | (a) Empty-state message. (b) Red alert with the backend 409 message | `f1-11-empty-state.png`, `f1-12-conflict-409.png` |
| W12 | As Turing, type `/admin/campus` in the address bar | "You don't have access" page | `f1-13-not-allowed.png` |
| W13 | Admin: Occupancy for N Monday. Then Campus: deactivate HSS-101 and tick "Show inactive". Reactivate it afterwards. Then log out and open `/my-week` directly | Occupancy: SEC-101 shows CS101. Campus: HSS-101 listed with an Inactive badge. After logout: redirected to Login | `f1-14-occupancy.png`, `f1-15-campus-inactive.png`, `f1-16-logged-out.png` |

**Entries for W2:**
- CS101 "Intro to Computing" — Dr. Alan Turing, SEC-101, Monday 09:00–10:00
- MA201 "Linear Algebra" — Dr. Ada Lovelace, HSS-201, Wednesday 11:00–12:00
- CS205 "Data Structures" — Dr. Alan Turing, SEC-301, Thursday 14:00–15:30

---

## 9. REPORT TEMPLATE (mandatory; fill in every section; raw output only; no source code)

~~~markdown
# PROMPT F1 — Execution Report

## A. Run metadata
- Branch:
- BASE_COMMIT (paste the output of `git rev-parse HEAD` taken in Phase 0):
- HEAD after final push (paste the output of `git rev-parse HEAD`):
- Pushed to origin: yes/no (paste the last lines of `git push`)
- node -v / npm -v / java -version (first line) / mvn -v (first line):
- Agent / model (if known):

## B. Commits
(paste `git log --oneline BASE_COMMIT..HEAD`)

## C. Files changed
(paste `git diff --stat BASE_COMMIT..HEAD`)

## D. Task status
| Task | Status (DONE / PARTIAL / NOT STARTED / DEVIATED) | Notes |
|---|---|---|
| P0 setup | | |
| B1 | | |
| B2 | | |
| B3 | | |
| B4 | | |
| B5 | | |
| P1 setup + login + layout | | |
| P2 professor + occupancy | | |
| P3 admin | | |
| P4 tests + docs | | |
| P5 walkthrough + report | | |

## E. Deviations
For each: what the prompt said, what you did instead, and why. Include any API-contract mismatch you found in the backend code.

## F. Backend tests
(paste `grep -h "Tests run" target/surefire-reports/*.txt` after the final `mvn clean test`, plus the total line and the BUILD line)

## G. Frontend checks (raw output)
- G1. `npm ls --depth=0`
- G2. `npm run lint`
- G3. `npm test` (summary lines)
- G4. `npm run build` (last ~10 lines)

## H. Walkthrough
- H1. The raw output of `curl -s -i http://localhost:8080/api/auth/me`
- H2. Scenario results:
| ID | PASS/FAIL | Screenshot file(s) | Notes |
|---|---|---|---|
| W1 | | | |
| W2 | | | |
| W3 | | | |
| W4 | | | |
| W5 | | | |
| W6 | | | |
| W7 | | | |
| W8 | | | |
| W9 | | | |
| W10 | | | |
| W11 | | | |
| W12 | | | |
| W13 | | | |

## I. Acceptance checklist
| ID | Criterion | PASS/FAIL | Evidence (paste command output) |
|---|---|---|---|
| C1 | Only the allowed npm packages | | `npm ls --depth=0` |
| C2 | JavaScript only | | `find frontend/src -name "*.ts" -o -name "*.tsx"` (must be empty) |
| C3 | No hard-coded backend URL | | `grep -rn "8080" frontend/src` (only the network-error message may match) |
| C4 | No toISOString in the frontend | | `grep -rn "toISOString" frontend/src` (must be empty) |
| C5 | Backend changes limited to B1–B5 + root README | | `git diff --stat BASE_COMMIT..HEAD -- . ':(exclude)frontend' ':(exclude)docs'` |
| C6 | Backend green; frontend lint/test/build green | | sections F and G |
| C7 | All walkthrough scenarios pass | | section H |
| C8 | Folder structure matches section 3 | | `find frontend/src -type f \| sort` |

## J. Open issues and questions for the reviewer
~~~
