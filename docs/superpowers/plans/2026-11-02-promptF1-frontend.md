# Prompt F1: ClassSync Frontend (Core Screens, Kept Simple) Implementation Plan

> **For agentic workers:** Execute this plan phase by phase. Keep each file under ~250 lines, readable, plain JavaScript React with hooks. Ground rules: no unauthorized npm packages, strict branch `feature/frontend-f1`, commit & push after each phase, never merge into `main`.

**Goal:** Build a clean, responsive, robust React frontend in `frontend/` using Vite, React 19 / 18, React Router (declarative), Tailwind CSS v4, and `date-fns`, strictly integrating with the Spring Boot backend via the Vite proxy (`/api`). Complete backend polish fixes B1–B5 in Phase 0. Deliver unit tests with `vitest` and verify with end-to-end walkthrough scenarios W1–W13.

---

## Phases & Tasks

### Phase 0: Setup and Backend Polish
- [ ] **P0.1 Setup & Branch:**
  - Branch: `feature/frontend-f1`
  - Record `BASE_COMMIT`: `c09eea6db9e3a0ba5698c718fedd96e4efbcf817`
  - Verify environment: `node -v` (v26.13.0), `npm -v` (11.20.0), `java -version` (26.0.1), `mvn -v` (3.9.16)
  - Create plan (`docs/superpowers/plans/2026-11-02-promptF1-frontend.md`) and report skeleton (`docs/reports/PROMPT_F1_REPORT.md`)
- [ ] **B1 Concurrency Test:**
  - In `GenerationConcurrencyIntegrationTests`:
    - Replace `assertTrue(scheduledRows.size() <= 1, ...)` with `assertEquals(1, scheduledRows.size(), ...)`
    - Assert that exactly one of the two operations produced that row
- [ ] **B2 Test 30 Fix:**
  - In `ClassScheduleIntegrationTests`, test 30: count only `DuplicateResourceException` as the expected failure; capture any other exception and fail the test with it
- [ ] **B3 Dead Overload:**
  - In `TimetableVersionService`: remove unused single-argument `activateVersion(Integer id)`
- [ ] **B4 Query List in Docs:**
  - In `README.md` and `PROJECT_PROGRESS_REPORT.md`: correct the generation query list to the 7 queries the code actually runs
- [ ] **B5 No Sessions for Logged-Out Requests:**
  - In `SecurityConfig`: add `.requestCache(cache -> cache.disable())`
  - In `SecurityAuthenticationTests`: add test verifying unauthenticated `GET /api/auth/me` returns 401 and creates no session (`result.getRequest().getSession(false)` is `null`)
- [ ] **P0.2 Verification & Commit:**
  - Run `mvn clean test` (expect 217 tests passed)
  - Commit: `fix(F1-P0): backend polish before frontend` & push

### Phase 1: Frontend Setup, Login, Layout
- [ ] **P1.1 Vite Scaffold & Dependencies:**
  - Scaffold `frontend/` using `npm create vite@latest frontend -- --template react`
  - Install dependencies: `react`, `react-dom`, `react-router`, `tailwindcss`, `@tailwindcss/vite`, `date-fns`, and dev dependency `vitest`
  - Configure `vite.config.js` with proxy to `http://localhost:8080` and `node` test environment
  - Setup `src/index.css` with `@import "tailwindcss";`
- [ ] **P1.2 Core Client & Endpoints:**
  - `src/api/client.js` with `request()` wrapper, `ApiError`, relative URLs, `onUnauthorized` handler
  - `src/api/endpoints.js` covering every endpoint from section 4 of Prompt F1
- [ ] **P1.3 Auth & State Management:**
  - `src/auth/AuthContext.jsx` with `login()`, `logout()`, session restore via `GET /api/auth/me`
  - `src/auth/RequireRole.jsx` route guard
- [ ] **P1.4 Common Components & Layout:**
  - `src/components/Navbar.jsx` with role-based navigation and logout
  - `src/components/Alert.jsx`, `Modal.jsx`, `ConfirmDialog.jsx`, `Loading.jsx`, `StatusBadge.jsx`
  - `src/pages/LoginPage.jsx`
  - `src/pages/NotAllowedPage.jsx`, `NotFoundPage.jsx`
- [ ] **P1.5 App Routing & Placeholders:**
  - `src/App.jsx` and `src/main.jsx`
  - Placeholder pages for `MyWeekPage`, `FindRoomPage`, `OccupancyPage`, `CampusPage`, `TimetablesPage`, `VersionDetailPage`, `GeneratePage`
- [ ] **P1.6 Verification & Commit:**
  - Run `npm run lint` and `npm run build`
  - Commit: `feat(F1-P1): frontend setup, login and layout` & push

### Phase 2: Professor Screens and Occupancy
- [ ] **P2.1 Date Utilities:**
  - `src/utils/dates.js`: `toApiDate`, `parseApiDate`, `weekRange`, `formatWeekLabel`, `toHHmm`, `timeToMinutes`, `overlaps`, `blockPosition`
- [ ] **P2.2 Professor My Week:**
  - `src/components/WeekNavigator.jsx`
  - `src/components/WeekCalendar.jsx` (days × hours grid with block styling, statuses, tags)
  - `src/pages/professor/MyWeekPage.jsx` (cancellation & modal flow)
- [ ] **P2.3 Professor Find a Room:**
  - `src/pages/professor/FindRoomPage.jsx`
  - Booking mode (regular extra class booking)
  - Reschedule mode (`/find-room?reschedule={id}`)
- [ ] **P2.4 Occupancy Grid:**
  - `src/components/OccupancyGrid.jsx` (rooms × hours grid grouped by complex)
  - `src/pages/shared/OccupancyPage.jsx`
- [ ] **P2.5 Verification & Commit:**
  - Run `npm run lint` and `npm run build`
  - Commit: `feat(F1-P2): professor screens and occupancy grid` & push

### Phase 3: Admin Screens
- [ ] **P3.1 Campus Management:**
  - `src/pages/admin/CampusPage.jsx` (tabs: Complexes, Rooms, Facilities; includeInactive support)
- [ ] **P3.2 Timetables Management:**
  - `src/pages/admin/TimetablesPage.jsx` (versions list, create draft modal, activate modal with effectiveFrom)
  - `src/pages/admin/VersionDetailPage.jsx` (entries table, add/edit/delete entry modal)
- [ ] **P3.3 Occurrence Generation:**
  - `src/pages/admin/GeneratePage.jsx` (generate date range, conflict report table with explanations)
- [ ] **P3.4 Verification & Commit:**
  - Run `npm run lint` and `npm run build`
  - Commit: `feat(F1-P3): admin screens` & push

### Phase 4: Tests and Documentation
- [ ] **P4.1 Frontend Unit Tests:**
  - `src/utils/dates.test.js`: test all date helpers, edge cases (Sunday start, back-to-back overlaps, clamping)
  - `src/api/client.test.js`: test 204 parsing, ApiError creation, network error, 401 callback behavior
  - Ensure $\ge 15$ unit tests total
- [ ] **P4.2 Frontend Documentation:**
  - `frontend/README.md`: Node version, install, dev server, ports, demo accounts, npm scripts, architecture, proxy details
- [ ] **P4.3 Root README Update:**
  - Update root `README.md` with "Running the frontend" section linking to `frontend/README.md`
- [ ] **P4.4 Verification & Commit:**
  - Run `npm run lint`, `npm test`, `npm run build`
  - Commit: `docs(F1-P4): frontend tests and docs` & push

### Phase 5: Walkthrough, Screenshots, Final Report
- [ ] **P5.1 Fresh Demo Database:**
  - Package backend: `mvn -q -DskipTests package`
  - Launch backend on `classsync_demo`
  - Verify `curl -s -i http://localhost:8080/api/auth/me` returns 401 and NO `Set-Cookie` header
- [ ] **P5.2 Walkthrough Execution:**
  - Execute scenarios W1 through W13 against `http://localhost:5173`
  - Capture and save screenshots in `docs/screenshots/`
- [ ] **P5.3 Final Report:**
  - Complete `docs/reports/PROMPT_F1_REPORT.md` with raw outputs, checklists, test results
  - Commit: `docs(F1-P5): walkthrough screenshots and report` & push
  - Print full report in final response
