# PROMPT FINAL — Analytics (O7), Polish Fixes and Documentation Refresh

> **How to run this prompt (for the human):** give this file to the agent with the short instruction message from Claude.

---

## 0. Role and ground rules

This is the **last** prompt for the ClassSync project. The repository contains:
- a Spring Boot backend at the repo root;
- a React frontend in `frontend/`;
- a demo-data seeder (`./run.sh --fresh-demo`).

This prompt does four things:
1. Adds the last missing objective, **O7 (utilization analytics)**.
2. Fixes a few small issues found in a project review.
3. Adds two small UI improvements.
4. Refreshes the documentation so it describes the finished project truthfully.

**This is a college project. Simplicity is the top priority.** The team must be able to explain every line in a viva.

### Ground rules

1. **No new packages**, in either `pom.xml` or `frontend/package.json`. **No chart libraries.**
2. **No database schema changes and no new Flyway migration.**
3. **Change only the files listed in section 9.** Do not change the demo-data seeder or its tests, and do not refactor or restyle anything else.
4. **`useEffect` dependencies:**
   - Effects that **fetch data or set state** must depend only on strings, numbers or booleans. Never Date objects, arrays or objects created during render: they cause endless re-fetching.
   - The only exception is the Escape-key effect in fix FX3, which may depend on its close callback, because it neither fetches nor sets state.
5. **Keep every frontend file under about 250 lines.**
6. **Work on branch `feature/final-polish`.**
   - Commit after each phase and push.
   - Never merge into `main`.
   - Do not weaken, delete or `@Disabled` any test.
7. **Report honestly.**
   - Paste raw command output only.
   - No source code in the report.
   - Never invent hashes, counts or results.
   - If something fails, say so.
8. **If you are blocked, stop and ask the user.**
9. **Do not modify this prompt file.** Save it unchanged as `docs/prompts/PROMPT_FINAL_ANALYTICS_POLISH.md`.

---

## 1. Phase 0 — Setup

```bash
git status                          # uncommitted changes? STOP and ask the user
git checkout main && git pull
git checkout -b feature/final-polish
git rev-parse HEAD                  # record as BASE_COMMIT
```

1. Save this prompt.
2. Write the plan to `docs/superpowers/plans/<today>-prompt-final-polish.md`.
3. Create `docs/reports/PROMPT_FINAL_REPORT.md` from section 10, with every task marked NOT STARTED.

Commit: `chore(FINAL-P0): prompt, plan and report skeleton`

---

## 2. Phase 1 — Small fixes

### FX1. Move the test-only controller out of the production code

`SecurityTestController` exposes `/api/test/authenticated`, `/api/test/professor` and `/api/test/admin` in the real API. Only the backend tests use these endpoints.

1. Move the file **unchanged** to the test sources, in the same package:
   ```bash
   git mv src/main/java/com/classsync/controller/SecurityTestController.java \
          src/test/java/com/classsync/controller/SecurityTestController.java
   ```
   Spring Boot tests still find it there through component scanning.
2. **Keep** the three `/api/test/...` rules in `SecurityConfig`. Add one comment line above them: `// Rules for test-only endpoints (controller lives in src/test). Harmless in production: no handler exists.`
3. Verify:
   - `mvn clean test` is green, and `SecurityAuthenticationTests` still passes all its tests;
   - `mvn -q -DskipTests package && unzip -l target/classsync-backend-0.0.1-SNAPSHOT.jar | grep -c SecurityTestController` prints `0`.

### FX2. Check the database timezone (fix only if the check confirms the problem)

Every JDBC URL says `serverTimezone=UTC`, while the app (`app.timezone`) and the local MySQL run on Indian time. That *may* shift TIMESTAMP values such as `createdAt` by 5½ hours. **Check first:**

1. Start the app with `./run.sh --fresh-demo` in the background and wait for `Demo data loaded:`.
2. Run both of these and paste the output:
   ```bash
   date '+%Y-%m-%d %H:%M'
   mysql -u root -e "SELECT NOW(), @@global.time_zone, @@session.time_zone, @@system_time_zone;"
   ```
3. With curl, log in as admin (cookie jar). Then:
   - `POST /api/timetables/versions` with `{"academicYear":"2099-00","semester":"9"}`;
   - `GET /api/timetables/versions`, and paste the `createdAt` of that new version.
4. **If `createdAt` differs from the local time by about 5 h 30 min:** replace `serverTimezone=UTC` with `serverTimezone=Asia/Kolkata` in every JDBC URL:
   - the default `DB_URL` in `application.yml`;
   - both demo URLs in `run.sh`;
   - `src/test/resources/application.properties`;
   - any README examples.

   Then rebuild, repeat steps 1–3 (the fresh seed removes the test version), and paste the new `createdAt`.
5. **If it does not differ:** change nothing and paste the evidence.
6. Stop the app with `./stop.sh`.

### FX3. Escape closes dialogs

- **`components/Modal.jsx`:** while `isOpen` is true, pressing Escape calls `onClose`.
- **`components/ConfirmDialog.jsx`:** while open, pressing Escape does the same as its Cancel button, and only when that button is enabled. Escape never confirms.
- Implementation: one `useEffect` per component that adds a `keydown` listener to `window` and removes it in the cleanup.

**Checks:**
- `mvn clean test` green;
- `npm run lint`, `npm test` and `npm run build` green.

**Commit:** `fix(FINAL-P1): test-only controller, timezone check, Escape closes dialogs`

---

## 3. Analytics: definitions (use exactly these, and show them on the page)

**Scope:**
- **Working days:** Monday–Friday. **Teaching day:** 08:00–20:00, so 12 hours. Weekend classes are ignored everywhere.
- **Rooms in scope:** active rooms in active complexes. When a complex is selected, only that complex's rooms.

**Per room:**
- **Available hours** = working days in the range × 12.
- **Booked hours** = total time of its **SCHEDULED** classes on working days, counting only the part inside 08:00–20:00.
  - Example: a class from 07:00 to 09:00 counts as 1 hour.
- **Utilization %** = booked ÷ available × 100. It is 0 when available is 0. Round to 1 decimal.

**Overall utilization %** = total booked ÷ total available × 100. Because every room has the same available hours, this equals the average room's utilization.

**Underused** — a room is underused when its utilization is **below half of the overall utilization**.
- Compare the unrounded values. Report `underusedThresholdPercent` = overall ÷ 2, rounded to 1 decimal.
- When the overall utilization is 0, no room is underused.
- Why this rule: a fixed threshold would flag every room on a lightly used campus. "Used less than half as much as the average room" stays meaningful for any amount of data.

**Heatmap cell** (weekday, hour) = booked minutes of all in-scope rooms in that hour on that weekday ÷ (number of that weekday in the range × number of rooms × 60) × 100.
- Hours are 8…19 (12 columns); weekdays are Monday…Friday (5 rows).
- The cell is 0 when the denominator is 0. Round to 1 decimal.

**Only SCHEDULED classes count as booked.** CANCELLED, RESCHEDULED and SUPERSEDED classes appear only in the counts.

---

## 4. Phase 2 — Analytics backend

### 4.1 `src/main/java/com/classsync/service/UtilizationCalculator.java` (plain Java, no Spring)

- **Constants:** `DAY_START = 08:00`, `DAY_END = 20:00`, `WORKING_DAYS` = Monday–Friday.
- **Static methods:**

| Method | Behaviour |
|---|---|
| `workingDayCount(LocalDate start, LocalDate end)` | Inclusive range |
| `countWeekday(DayOfWeek day, LocalDate start, LocalDate end)` | Inclusive range |
| `overlapMinutes(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd)` | Half-open intervals; back-to-back = 0 |
| `minutesInsideTeachingDay(LocalDate date, LocalTime start, LocalTime end)` | 0 on weekends, otherwise the overlap with 08:00–20:00 |
| `percent(double part, double whole)` | 0 when `whole` is 0, else rounded to 1 decimal |
| `hours(int minutes)` | Rounded to 1 decimal |
| `round1(double value)` | Rounded to 1 decimal |

### 4.2 DTOs in `src/main/java/com/classsync/dto/analytics/`

```java
public record UtilizationResponse(
        LocalDate startDate, LocalDate endDate, Integer complexId,
        LocalTime dayStart, LocalTime dayEnd, List<DayOfWeek> workingDays, double underusedThresholdPercent,
        UtilizationSummary summary, List<RoomUtilization> rooms, List<HeatmapRow> heatmap) {}
public record UtilizationSummary(
        int roomCount, int workingDayCount, double availableHours, double bookedHours, double utilizationPercent,
        int scheduledClasses, int extraClasses, int cancelledClasses, int rescheduledClasses) {}
public record RoomUtilization(
        Integer roomId, String roomNumber, String complexName, RoomType roomType, Integer capacity,
        int classCount, double bookedHours, double availableHours, double utilizationPercent, boolean underused) {}
public record HeatmapRow(DayOfWeek day, List<HeatmapCell> cells) {}   // 12 cells: hours 8..19
public record HeatmapCell(int hour, double utilizationPercent) {}
```

### 4.3 One read-only query in `RoomRepository`

```java
@Query("""
    SELECT r FROM Room r JOIN FETCH r.complex c
    WHERE r.active = true AND c.active = true
      AND (:complexId IS NULL OR c.id = :complexId)
    ORDER BY c.name ASC, r.roomNumber ASC
""")
List<Room> findActiveRoomsInScope(@Param("complexId") Integer complexId);
```

For classes, **reuse** `scheduleOccurrenceRepository.findWithFilters(startDate, endDate, null, null, complexId, null)`. It returns all statuses and fetches room and complex. Do not add another occurrence query.

### 4.4 `AnalyticsService.getUtilization(startDate, endDate, complexId)` — `@Transactional(readOnly = true)`

**1. Validate the request.** Throw `BadRequestException` (400) when:

| Condition | Message |
|---|---|
| `endDate` is before `startDate` | `"endDate must not be before startDate"` |
| the window exceeds 12 months (same check as generation) | `"Analytics window cannot exceed 12 months"` |
| `complexId` is given but not an existing active complex | `"Requested complex not found or inactive: <id>"` |

**2. Load the data.** Load the rooms (4.3) and the classes (`findWithFilters`). Ignore classes outside the scope rooms, and classes on weekends.

**3. Count the classes** (working days only):

| Count | Rule |
|---|---|
| `scheduledClasses` | SCHEDULED |
| `extraClasses` | SCHEDULED and EXTRA |
| `cancelledClasses` | CANCELLED |
| `rescheduledClasses` | RESCHEDULED |

**4. Per room:**
- `classCount` = its SCHEDULED classes; `bookedHours`; `availableHours`; `utilizationPercent`.
- `underused` = room utilization (unrounded) < overall utilization (unrounded) ÷ 2.
- Sort by `utilizationPercent` descending, then `roomNumber` ascending.

**5. Heatmap** (section 3): for every SCHEDULED class on a working day and each hour 8..19, add `overlapMinutes(class, h:00–h+1:00)` to that cell. Then convert each cell to a percent.

**6. Summary:**
- `roomCount`, `workingDayCount`;
- `availableHours` = working days × 12 × rooms;
- `bookedHours`;
- the overall `utilizationPercent`;
- the four counts.

### 4.5 Controller and security

**Controller:** `AnalyticsController`, mapped as `GET /api/analytics/utilization`.
- Query parameters: `startDate` and `endDate` (both required, ISO dates) and `complexId` (optional).
- Returns 200 with `UtilizationResponse`.

**Security:** in `SecurityConfig`, add `.requestMatchers("/api/analytics/**").hasRole("ADMIN")` before `anyRequest()`.

### 4.6 Tests

**`UtilizationCalculatorTest`** — plain JUnit, at least 8 tests:

| Method | Cases |
|---|---|
| `workingDayCount` | A Monday–Sunday week → 5; Saturday–Sunday → 0 |
| `countWeekday` | One case |
| `minutesInsideTeachingDay` | 09:00–10:30 → 90; 07:00–09:00 → 60; 19:30–21:00 → 30; a Saturday class → 0 |
| `overlapMinutes` | Back-to-back → 0 |
| `percent` | `percent(0, 0)` → 0.0; `percent(1, 3)` → 33.3 |

**`AnalyticsIntegrationTests`** — `@SpringBootTest`, `@AutoConfigureMockMvc`, `@Transactional`.

**Setup:**
- Create a test complex (unique code) with 2 active rooms, A and B.
- Using the repository, create classes in room A during **2026-11-09 (Mon) – 2026-11-15 (Sun)**:

| Day | Time | Status / type | Why it's there |
|---|---|---|---|
| Mon | 09:00–10:00 | SCHEDULED, OFFICIAL | counts |
| Tue | 14:00–15:00 | RESCHEDULED | must not count as booked |
| Wed | 10:00–12:00 | SCHEDULED, EXTRA | counts |
| Thu | 09:00–10:00 | CANCELLED | must not count as booked |
| Fri | 07:00–09:00 | SCHEDULED | counts as 1 hour (clipped) |
| Sat | 10:00–11:00 | SCHEDULED | ignored (weekend) |

**Expected results** for that week and `complexId` = the test complex, as ADMIN:

- **Summary:** `roomCount` 2, `workingDayCount` 5, `availableHours` 120.0, `bookedHours` 4.0, `utilizationPercent` 3.3, `scheduledClasses` 3, `extraClasses` 1, `cancelledClasses` 1, `rescheduledClasses` 1.
- **`underusedThresholdPercent`:** 1.7.
- **`rooms[0]` = room A:** `classCount` 3, `bookedHours` 4.0, `availableHours` 60.0, `utilizationPercent` 6.7, `underused` **false**.
- **`rooms[1]` = room B:** 0.0 h, 0.0 %, `underused` **true**.
- **Heatmap:**

| Cell | Expected |
|---|---|
| MONDAY 9 | 50.0 |
| WEDNESDAY 10 | 50.0 |
| WEDNESDAY 11 | 50.0 |
| FRIDAY 8 | 50.0 |
| MONDAY 10 | 0.0 |
| THURSDAY 9 | 0.0 |
| TUESDAY 14 | 0.0 |

**Plus these cases:**

| Case | Expected |
|---|---|
| Weekend range 2026-11-14 → 15 | `workingDayCount` 0, everything 0.0, **no** room underused |
| `endDate` before `startDate` | 400 |
| Window longer than 12 months | 400 |
| Unknown `complexId` | 400 |
| PROFESSOR | 403 |
| Unauthenticated | 401 |

**Checks:** `mvn clean test` green.

**Commit:** `feat(FINAL-P2): utilization analytics endpoint`

---

## 5. Phase 3 — Frontend: Analytics page and two small additions

### 5.1 Analytics page

**Wiring:**
- `api/endpoints.js`: add `apiGetUtilization({ startDate, endDate, complexId })` → `GET /api/analytics/utilization`.
- `App.jsx`: add the route `/admin/analytics` (ADMIN, inside `RequireRole`).
- `Navbar.jsx`: add an "Analytics" link for ADMIN after Occupancy.

**`pages/admin/AnalyticsPage.jsx` controls:**
- Start and end dates, kept in state **as strings** (`toApiDate`). They default to **the last 3 full weeks**: Monday 3 weeks before the current week, to the Sunday just before the current week.
- Complex select: "All complexes" or one complex.
- Buttons "Last 3 weeks" and "This week".

**Loading:**
- Fetch in a `useEffect` with dependencies `[startDate, endDate, complexId]`.
- Show `Loading`; show errors in a red `Alert` using the backend message.

**Page content:**
- **Six summary cards:**
  1. Overall utilization %
  2. Booked h / Available h
  3. Scheduled classes
  4. Extra classes
  5. Cancelled
  6. Rescheduled
- **Definition line** under the cards: *"Utilization = booked ÷ available hours on working days (Mon–Fri), 08:00–20:00. Only scheduled classes count. Underused = used less than half as much as the average room (below {underusedThresholdPercent}%)."*
- **Rooms table** (API order): Room, Complex, Type, Capacity, Classes, Booked h, Available h, Utilization. Utilization shows the number plus a simple bar. Underused rooms get an amber "Underused" badge.
- **Empty state:** when `summary.roomCount` is 0, show "No active rooms in this selection."

**`components/UtilizationHeatmap.jsx`:**
- A plain table: rows Mon…Fri, columns 08:00…19:00. Each cell shows its percent.
- Colour cells with `heatColorClass(percent, maxPercent)`, where `maxPercent` is the largest cell in the heatmap.
- Title: *"Peak hours — share of rooms busy"*.
- Legend: *"Colours are relative to the busiest hour in this selection."*

**`utils/heatmap.js` — `heatColorClass(percent, maxPercent)`:**

| Condition | Class |
|---|---|
| `percent` is 0 or `maxPercent` is 0 | `bg-gray-50 text-gray-400` |
| ratio `percent / maxPercent` ≤ 0.25 | `bg-blue-100` |
| ratio ≤ 0.5 | `bg-blue-200` |
| ratio ≤ 0.75 | `bg-blue-400 text-white` |
| ratio > 0.75 | `bg-blue-600 text-white` |

Add `utils/heatmap.test.js` with at least 5 tests, covering zero and each boundary.

### 5.2 Small addition SA1 — admins can cancel a class from the Occupancy grid

The backend already allows admins to cancel any class with `POST /api/classes/{id}/cancel`; only the UI is missing.

- **`components/OccupancyGrid.jsx`:** add an optional `onBlockClick(occurrence)` prop. When it is given, blocks become clickable (a `<button type="button">`, or `cursor-pointer` with keyboard access). When it is not given, nothing changes.
- **`pages/shared/OccupancyPage.jsx`:**
  - **ADMIN only:** pass `onBlockClick`. Clicking a block opens a `Modal` showing course, professor, room, date, time and type, with a **"Cancel class"** button → `ConfirmDialog` → `apiCancelClass(id)` → green alert → reload.
  - Reload with a numeric `refreshKey` added to the effect's dependencies.
  - **PROFESSOR:** no change; the grid stays read-only.

### 5.3 Small addition SA2 — a "now" line in My Week

- **`utils/dates.js`:** add `timeOfDayPercent(date, dayStart = 480, dayEnd = 1200)`. It returns `(minutes − dayStart) / (dayEnd − dayStart) × 100`, or `null` when the time is outside 08:00–20:00.
  - Add tests: 08:00 → 0; 14:00 → 50; 07:59 → null; 20:00 → null.
- **`components/WeekCalendar.jsx`:**
  - Keep `now` in state, initialised with `new Date()`.
  - Update it every 60 seconds with `setInterval` inside a `useEffect` with dependencies `[]`, cleared in the cleanup.
  - In **today's column only**, and only when `timeOfDayPercent(now)` is not null, draw a 2 px red horizontal line (`bg-red-500`, `pointer-events-none`) at that percent, above the class blocks.

**Checks:** `npm run lint`, `npm test` and `npm run build` green. `npm ls --depth=0` must show the same packages as on `main`.

**Commit:** `feat(FINAL-P3): analytics page, admin cancel from occupancy, now line`

---

## 6. Phase 4 — Documentation refresh

Every number you write must come from actual command output: surefire for backend tests, vitest for frontend tests.

**Do not use these words:** "production-grade", "guaranteed", "mathematically impossible", "bulletproof", "100% resolved", or "Zero …" as hype. A heading such as "Zero N+1 Query Optimization" becomes "Avoiding N+1 queries with fetch joins".

### 6.1 `PROJECT_PROGRESS_REPORT.md`

This currently reads as a backend-only report. Update it:

1. **Title:** "ClassSync: Smart Classroom & Lecture Hall Scheduling System — Project Report". Remove "Backend" from the title and the conclusion.
2. **Status line:** list everything delivered: milestones 1–11, hardening (11H), React frontend (F1), demo data (S1), and analytics (O7). Add the real backend and frontend test counts, plus today's date.
3. **New section "Frontend (React)":**
   - the stack: Vite, React, React Router, Tailwind, date-fns, JavaScript, and the Vite proxy;
   - a table of screens per role;
   - the key design choices: session cookie only, no state libraries, two custom grids;
   - how it is tested: unit tests plus walkthrough screenshots.
4. **New section "Demo data":** what it contains, the command `./run.sh --fresh-demo`, and why it is not a migration.
5. **New section "Utilization analytics (O7)":** the section 3 definitions, including the relative underused rule and the relative heatmap colours.
6. **Objectives table O1–O7:** each objective's status (all DONE) and where it is implemented (backend feature + screen).
7. **Phase 8 heading:** "Cancellation & Rescheduling Workflows (Prompt 10; made non-destructive in 11H)". Make its text match the current non-destructive behaviour.
8. **Testing section:**
   - the real numbers;
   - the list of backend test classes with counts, from surefire;
   - the frontend unit-test files with counts, from vitest.
   - Remove every "216".
9. **Rename "Remaining Work & Future Roadmap" to "Future Work"** and list:
   - Redis caching (not needed at this scale);
   - notifications and audit logging (tables reserved, not used yet);
   - hosting/deployment;
   - a user-management screen.

   Remove "Phase 14: Analytics & Frontend" as future work.
10. **Conclusion:** rewrite it as factual and full-stack.
11. **Footer:** today's date and the branch.

### 6.2 `README.md`

- **Test counts:** backend + frontend, from real output.
- **`notifications` / `audit_logs`:** "Reserved for future work (not used by the application yet)".
- **"3 RESCHEDULED (with non-destructive audit pointers to replacements)"** becomes "3 RESCHEDULED (each linked from its replacement via `rescheduled_from_id`)".
- **Analytics:** add `GET /api/analytics/utilization` (ADMIN) to the API table, plus a short "Utilization analytics" section with the definitions and a sample response.
- **UI features list:** mention "Admins can cancel a class from the Occupancy grid".

### 6.3 `docs/DEMO_GUIDE.md`

1. Replace the past-weeks sentence with: "The past 3 weeks contain 108 classes: 104 scheduled and 4 cancelled."
2. Remove the "Under Renovation" note. Rooms have no note field; MB-G05 simply shows an **Inactive** badge.
3. Add an **Analytics** section, "Admin → Analytics, default range = last 3 weeks, all complexes". Expected results:
   - overall utilization **4.2%**;
   - **129.5** of **3060** hours booked;
   - **104** scheduled and **4** cancelled classes;
   - busiest room **SEC-202 (10.0%)**;
   - **SEC-101** and **HSS-101** marked **Underused**.
4. Add **"Admin → Occupancy → click a class → Cancel class"**, and mention the red "now" line in My Week.

### 6.4 `frontend/README.md`

Mention the Analytics page, the admin cancel from Occupancy, the now line, and that Escape closes dialogs.

**Commit:** `docs(FINAL-P4): refresh report, README and demo guide`

---

## 7. Phase 5 — Walkthrough, evidence, report

**1. Start the app.** Run `./run.sh --fresh-demo` in the background and paste the `Demo data loaded:` line. Let **W0** = the Monday of the current week.

**2. A1 — API end-to-end check.**
- With curl as admin, `GET /api/analytics/utilization?startDate=<W0−3 weeks, Monday>&endDate=<W0−1 day, Sunday>`, with no `complexId`.
- Paste the full JSON.
- Fill in this table with what the JSON shows. These values are calculated from the seeded data, so they must match exactly:

| Field | Expected |
|---|---|
| `summary.roomCount` | 17 |
| `summary.workingDayCount` | 15 |
| `summary.availableHours` | 3060.0 |
| `summary.bookedHours` | 129.5 |
| `summary.utilizationPercent` | 4.2 |
| `summary.scheduledClasses` / `extraClasses` / `cancelledClasses` / `rescheduledClasses` | 104 / 0 / 4 / 0 |
| `underusedThresholdPercent` | 2.1 |
| `rooms[0]`, `rooms[1]`, `rooms[2]` | SEC-202 18.0 h 10.0 % · SEC-301 15.0 h 8.3 % · LHC-1 14.0 h 7.8 % |
| Rooms with `underused: true` | exactly SEC-101 (0.0 %) and HSS-101 (1.7 %) |
| Heatmap MONDAY 9 / MONDAY 10 / THURSDAY 14 / WEDNESDAY 8 | 11.8 / 5.9 / 9.8 / 0.0 |

**3. Other API checks.** Paste the summary part of each:
- The Saturday and Sunday just before W0 (W0 − 2 days … W0 − 1 day) → `workingDayCount` 0 and no room underused.
- The same request as Turing → 403.

**4. Screenshots** in `docs/screenshots/`:

| File | What it shows |
|---|---|
| `final-01-analytics.png` | Admin Analytics with the default range (last 3 weeks), all complexes; full page if possible |
| `final-02-analytics-sec.png` | The same range, complex = Science & Engineering Complex |
| `final-03-analytics-invalid.png` | End date before start date → red alert |
| `final-04-analytics-not-allowed.png` | Turing opens `/admin/analytics` → "You don't have access" |
| `final-05-occupancy-cancel.png` | Admin Occupancy for the Monday of week W0+1, with the class modal open showing "Cancel class". Then cancel CS201 09:00 in SEC-301 and confirm it disappears from the grid |
| `final-06-now-line.png` | Turing's My Week for the current week, showing the red now line. If the current time is outside 08:00–20:00, say so instead |

**5. Escape check.** Open any dialog, press Escape, and confirm it closes. Note PASS or FAIL.

**6. Clean up.** Paste the FX1 jar check and the FX2 evidence. Then leave a pristine dataset: run `./stop.sh`, then `./run.sh --fresh-demo`, wait for `Demo data loaded:`, then `./stop.sh`.

**7. Finish.** Complete the report, then commit `docs(FINAL-P5): walkthrough evidence and report`, push, and print the entire report.

---

## 8. Final checks (all must pass)

```bash
mvn clean test
cd frontend && npm run lint && npm test && npm run build && npm ls --depth=0
git diff --stat BASE_COMMIT..HEAD -- pom.xml frontend/package.json src/main/resources/db   # must be empty
git diff --stat BASE_COMMIT..HEAD -- src/main/java/com/classsync/demo src/test/java/com/classsync/demo   # must be empty
```

---

## 9. Files allowed to change

| Area | Files |
|---|---|
| Backend — moved | `SecurityTestController.java` (src/main → src/test, same package) |
| Backend — changed | `SecurityConfig.java` (one comment + one analytics rule), `RoomRepository.java` (one query), `application.yml` (FX2, only if confirmed) |
| Backend — new | `service/UtilizationCalculator.java`, `service/AnalyticsService.java`, `controller/AnalyticsController.java`, `dto/analytics/*.java`, `UtilizationCalculatorTest.java`, `AnalyticsIntegrationTests.java` |
| Test config | `src/test/resources/application.properties` (FX2, only if confirmed) |
| Scripts | `run.sh` (FX2, only if confirmed) |
| Frontend — changed | `api/endpoints.js`, `App.jsx`, `components/Navbar.jsx`, `components/Modal.jsx`, `components/ConfirmDialog.jsx`, `components/OccupancyGrid.jsx`, `components/WeekCalendar.jsx`, `pages/shared/OccupancyPage.jsx`, `utils/dates.js`, `utils/dates.test.js` |
| Frontend — new | `pages/admin/AnalyticsPage.jsx`, `components/UtilizationHeatmap.jsx`, `utils/heatmap.js`, `utils/heatmap.test.js` |
| Docs | `README.md`, `PROJECT_PROGRESS_REPORT.md`, `docs/DEMO_GUIDE.md`, `frontend/README.md`, `docs/prompts/…`, `docs/reports/…`, `docs/superpowers/plans/…`, `docs/screenshots/final-*.png` |

**Nothing else.**

---

## 10. REPORT TEMPLATE (mandatory; raw output only; no source code)

~~~markdown
# PROMPT FINAL — Execution Report

## A. Run metadata
- Branch:
- BASE_COMMIT (`git rev-parse HEAD` from Phase 0):
- HEAD after final push (`git rev-parse HEAD`, taken AFTER the last commit):
- Pushed: yes/no (last lines of `git push`)

## B. Commits
(`git log --oneline BASE_COMMIT..HEAD`)

## C. Files changed
(`git diff --stat BASE_COMMIT..HEAD`)

## D. Task status
| Task | Status (DONE / PARTIAL / NOT STARTED / DEVIATED) | Notes |
|---|---|---|
| P0 setup | | |
| FX1 test controller moved | | |
| FX2 timezone (checked; fixed or not needed) | | |
| FX3 Escape closes dialogs | | |
| P2 analytics backend | | |
| P3 analytics page | | |
| SA1 admin cancel from Occupancy | | |
| SA2 now line | | |
| P4 docs refresh | | |
| P5 walkthrough + report | | |

## E. Deviations
For each: what the prompt said, what you did instead, and why.

## F. Backend tests
(`grep -h "Tests run" target/surefire-reports/*.txt`, plus the total and BUILD lines)

## G. Frontend checks
- G1. `npm ls --depth=0`
- G2. `npm run lint`
- G3. `npm test` (summary)
- G4. `npm run build` (last ~10 lines)

## H. Evidence
- H1. The `Demo data loaded:` line
- H2. FX1 jar check output
- H3. FX2 evidence (time, MySQL zones, createdAt before and after if changed)
- H4. A1 JSON (full, raw), plus the expected-vs-actual table:
| Field | Expected | Actual | PASS/FAIL |
|---|---|---|---|
- H5. The weekend check and the professor 403 output
- H6. Screenshots:
| File | PASS/FAIL | Notes |
|---|---|---|
- H7. Escape check: PASS/FAIL
- H8. Section 8 final checks output

## I. Open issues and questions for the reviewer
~~~
