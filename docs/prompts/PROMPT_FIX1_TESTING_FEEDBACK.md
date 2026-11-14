# PROMPT FIX1 — Fixes from User Testing (past classes, room deactivation, login)

> **How to run this prompt (for the human):** give this file to the agent with the short instruction message from Claude.

---

## 0. Role and ground rules

You are fixing three issues the team found while testing ClassSync. The project is otherwise finished and tagged `v2.0.0-final`.

**This is a college project. Keep every change small and easy to explain.**

1. **No new packages, no migrations, no schema changes.**
2. **Change only the files listed in section 6.**
3. **Work on branch `fix/testing-feedback`.**
   - Commit after each phase and push.
   - Never merge into `main`.
4. **Do not weaken, delete or `@Disabled` any test.** If an existing test breaks because it cancels or reschedules a class that is in the past relative to the fixed test clock (2026-10-01 09:00), change only that test's date, and list it under Deviations.
5. **Report honestly.**
   - Paste raw command output only.
   - No source code in the report.
   - Never invent hashes, counts or results.
   - Take the final HEAD hash after your last commit.
6. **If you are blocked, stop and ask the user.**
7. **Do not modify this prompt file.** Save it unchanged as `docs/prompts/PROMPT_FIX1_TESTING_FEEDBACK.md`.

---

## 1. The three issues and their causes

| # | What the team saw | Cause | Fix |
|---|---|---|---|
| 1 | Deactivating a room leaves its upcoming classes scheduled in a room that no longer exists for booking and no longer appears in Occupancy | `RoomService` / `ComplexService` change the `active` flag without checking for classes | **Block** deactivation while the room (or complex) has upcoming scheduled classes, with a clear message (Fix B). Auto-cancelling is rejected on purpose: it would silently remove professors' classes, there are no notifications, and reactivating the room would not bring them back |
| 2 | "Can't log in by entering username and password" | The login field is `type="email"`, so the browser blocks a username such as `admin` and only shows a small native tooltip. Full emails work | Accept a username **or** an email (Fix C) |
| 3 | Classes in the past can be cancelled or rescheduled | Only *targets* in the past were blocked, not past *originals* | A class that has already **started** can no longer be cancelled or rescheduled, by anyone (Fix A) |

---

## 2. Phase 0 — Setup

```bash
git status                          # uncommitted changes? STOP and ask the user
git checkout main && git pull
git checkout -b fix/testing-feedback
git rev-parse HEAD                  # record as BASE_COMMIT (expected 1a60c9bc6e997c0b5d0c540ec2198df2f1bd6aa9)
```

1. Save this prompt.
2. Write the plan to `docs/superpowers/plans/<today>-fix1-testing-feedback.md`.
3. Create the report skeleton `docs/reports/PROMPT_FIX1_REPORT.md` from section 8.

Commit: `chore(FIX1-P0): prompt, plan and report skeleton`

---

## 3. Phase 1 — Backend

### Fix A: classes that have started are locked

**Definition:** a class **has started** when `LocalDateTime.of(scheduleDate, startTime)` is **not after** `LocalDateTime.now(clock)`.

**`ClassScheduleService`:**

| Method | Where to add the check | Response when the class has started |
|---|---|---|
| `cancelOccurrence` | After the existing status and authorization checks | `BadRequestException` (400): `"Cannot cancel a class that has already started"` |
| `rescheduleOccurrence` | After the existing authorization check (the original class must not have started) | `BadRequestException` (400): `"Cannot reschedule a class that has already started"` |

The existing rule that the *target* must not be in the past stays as it is.

**`DemoDataSeeder`** (necessary, otherwise `./run.sh --fresh-demo` breaks):
- Cancellations **C1–C4** are in past weeks, so they are *historical records*.
- For each cancellation, find the class as today. Then:
  - **If it has already started:** set its status to `CANCELLED` directly and save it with `scheduleOccurrenceRepository`. Add the comment: `// Historical record: the app no longer allows cancelling classes that have started.`
  - **Otherwise (C5, C6):** keep calling `classScheduleService.cancelOccurrence(...)`.
- Every seeded total and every existing seeder test must stay exactly the same.

### Fix B: block deactivating rooms and complexes that have upcoming classes

**Definition:** an **upcoming** class is a `SCHEDULED` class that has not started: `scheduleDate > today`, or `scheduleDate = today` and `startTime > now`.

**`ScheduleOccurrenceRepository`:** add two read-only queries.
- **`findUpcomingInRoom(roomId, today, nowTime)`:** the upcoming classes in that room, ordered by `scheduleDate`, then `startTime`.
- **`findUpcomingInComplex(complexId, today, nowTime)`:** the same, for every room of the complex.

**`RoomService.updateRoomStatus`:** only when the request sets `active = false`:
1. Load the upcoming classes (inject `Clock` for today and now).
2. If there are any, throw `DuplicateResourceException` (409, the existing conflict exception) with: `"Cannot deactivate room <roomNumber>: it has <n> upcoming scheduled class(es), the next on <yyyy-MM-dd>. Cancel or reschedule them, or move this room's classes in a new timetable version, first."`

**`ComplexService.updateComplexStatus`:** the same check across the complex's rooms, with the message: `"Cannot deactivate complex <name>: its rooms have <n> upcoming scheduled class(es), the next on <yyyy-MM-dd>. Cancel or reschedule them, or move these classes in a new timetable version, first."`

What does **not** change:
- Reactivating is always allowed.
- Past classes and non-SCHEDULED classes never block deactivation.
- Facilities are unchanged.
- The seeder's MB-G05 has no classes, so its deactivation still works.

### Backend tests

**Fix A** — in `ClassScheduleIntegrationTests`, using the fixed test clock 2026-10-01 09:00:

| # | Case | Expected |
|---|---|---|
| 1 | Cancel a SCHEDULED class dated 2026-09-30 | 400 with the exact message |
| 2 | Reschedule a SCHEDULED class dated 2026-09-30 to a future slot | 400 with the exact message |
| 3 | Cancel a class on 2026-10-01 from 08:00 to 09:30 (it started at 08:00) | 400 |
| 4 | Cancel a class on 2026-10-01 at 10:00 (not started yet) | 200 |

**Fix B** — new class `DeactivationGuardIntegrationTests` (`@SpringBootTest`, `@AutoConfigureMockMvc`, `@Transactional`). For each case, create a fresh complex and room:

| # | Case | Expected |
|---|---|---|
| 1 | Room with one upcoming class (2026-11-10) → `PATCH /api/rooms/{id}/status` `{"active":false}` | 409, message contains `1 upcoming` and `2026-11-10` |
| 2 | The same room after that class is set to CANCELLED | 200 |
| 3 | Room with only a past class (2026-09-30) | 200 |
| 4 | Complex whose room has an upcoming class → `PATCH /api/complexes/{id}/status` `{"active":false}` | 409 |
| 5 | Reactivating an inactive room | 200 |

**Checks:** `mvn clean test` green. Paste the new total.

**Commit:** `fix(FIX1-P1): lock started classes; block deactivating rooms with upcoming classes`

---

## 4. Phase 2 — Frontend

### Fix C: log in with a username or an email

**New `src/utils/login.js`:**
- Constant `DEFAULT_EMAIL_DOMAIN = 'classsync.edu'`.
- Function `toLoginEmail(input)`:
  1. Trim and lowercase the input.
  2. If it is empty, return `''`.
  3. If it contains `@`, return it as is.
  4. Otherwise, return `<input>@classsync.edu`.

**New `src/utils/login.test.js`**, with at least these 4 tests:

| Input | Expected output |
|---|---|
| `admin` | `admin@classsync.edu` |
| `aturing@classsync.edu` | unchanged |
| `"  ATuring@ClassSync.edu "` | `aturing@classsync.edu` |
| empty | `''` |

**`pages/LoginPage.jsx`:**
- The first field becomes `type="text"`, `autoComplete="username"`, labelled **"Email or username"**, with the placeholder `e.g. aturing or aturing@classsync.edu`. Keep `required`.
- Submit with `login(toLoginEmail(email), password)`.
- Keep the demo buttons as they are. Under the demo accounts, add: *"Tip: you can type just the username, e.g. admin."*

### Fix A in the UI: hide actions for classes that have started

**`utils/dates.js`:** add `hasStarted(scheduleDate, startTime, now = new Date())`. It returns true when the class start, in local time, is not after `now`.

Add at least 3 tests to `utils/dates.test.js`:
- yesterday → true;
- tomorrow → false;
- today at a time 1 minute ago → true.

**`pages/professor/MyWeekPage.jsx`, class details modal:**
- Show **Reschedule** and **Cancel class** only for SCHEDULED classes that have **not** started.
- For a SCHEDULED class that has started, show this grey note instead: *"This class has already started, so it can't be cancelled or rescheduled."*

**`pages/shared/OccupancyPage.jsx`, admin modal:** the same rule and note for the **Cancel class** button.

The backend enforces these rules anyway; the UI only avoids offering buttons that would fail.

**Checks:** `npm run lint`, `npm test` and `npm run build` green. `npm ls --depth=0` unchanged.

**Commit:** `fix(FIX1-P2): username login, hide actions for started classes`

---

## 5. Phase 3 — Docs, then Phase 4 — Walkthrough and report

### Phase 3 — Docs

Use the real test counts from command output.

| File | Update |
|---|---|
| `README.md` | Add a short **"Business rules"** list: past classes cannot be booked, cancelled or rescheduled; rooms and complexes with upcoming classes cannot be deactivated; you can log in with a username or an email. Update the test counts |
| `PROJECT_PROGRESS_REPORT.md` | Add a section **"Fixes from user testing"** describing the 3 issues, their causes and fixes, as in section 1. Update the test counts everywhere |
| `docs/DEMO_GUIDE.md` | **Campus:** try to deactivate **LHC-1** → blocked, with the upcoming-classes message; add a new room `SEC-104` and deactivate it → allowed. **My Week:** clicking a past class shows the "already started" note. **Login:** typing `admin` works |
| `frontend/README.md` | Add the login tip |

**Commit:** `docs(FIX1-P3): business rules and fixes from user testing`

### Phase 4 — Walkthrough (fresh demo data)

**1. Start fresh.** Run `./run.sh --fresh-demo` in the background and paste the `Demo data loaded:` line. Its counts must be unchanged: 298 classes, 289 scheduled, 6 cancelled, 3 rescheduled.

**2. Check the seeder change kept the history.** As admin, call `GET /api/analytics/utilization` for the last 3 full weeks (W0 = this week's Monday; range W0−3 weeks Monday … W0−1 day). The summary must still be: `bookedHours` 129.5, `scheduledClasses` 104, `cancelledClasses` 4.

**3. API checks with curl** (paste the raw output):

| Step | Who | Request | Expected |
|---|---|---|---|
| a | Turing | `GET /api/schedule-occurrences?professorId=2&startDate=<W0−7 days>&endDate=<W0−3 days>&status=SCHEDULED`; take the first id → `POST /api/classes/{id}/cancel` | 400 `"Cannot cancel a class that has already started"` |
| b | Turing | The same id → `POST /api/classes/{id}/reschedule` to a future free slot | 400 `"Cannot reschedule a class that has already started"` |
| c | admin | `PATCH /api/rooms/<LHC-1 id>/status` `{"active":false}` | 409 with the upcoming-classes message |
| d | admin | Create room `SEC-104` in SEC (CLASSROOM, 40), then deactivate it | 200 |

**4. Screenshots** in `docs/screenshots/`:

| File | What it shows |
|---|---|
| `fix-01-login-username.png` | The login page with `admin` typed in "Email or username" |
| `fix-02-logged-in.png` | The page after signing in with `admin` / `password123` |
| `fix-03-deactivate-blocked.png` | Campus → Rooms → Lecture Hall Complex, after trying to deactivate LHC-1: the red alert |
| `fix-04-past-class-locked.png` | Turing → My Week → previous week → a class's modal, showing the note and no action buttons |

**5. Leave a pristine dataset.** Run `./stop.sh`, then `./run.sh --fresh-demo`, wait for `Demo data loaded:`, then `./stop.sh`.

**6. Finish.** Complete the report, commit `docs(FIX1-P4): walkthrough evidence and report`, push, and print the entire report.

---

## 6. Files allowed to change

| Area | Files |
|---|---|
| Backend | `service/ClassScheduleService.java`, `service/RoomService.java`, `service/ComplexService.java`, `repository/ScheduleOccurrenceRepository.java` (two queries), `demo/DemoDataSeeder.java` (historical cancellations only) |
| Backend tests | `ClassScheduleIntegrationTests.java` (new tests; date changes only if rule 4 applies), new `DeactivationGuardIntegrationTests.java` |
| Frontend | `pages/LoginPage.jsx`, `pages/professor/MyWeekPage.jsx`, `pages/shared/OccupancyPage.jsx`, `utils/dates.js`, `utils/dates.test.js`, new `utils/login.js`, new `utils/login.test.js` |
| Docs | `README.md`, `PROJECT_PROGRESS_REPORT.md`, `docs/DEMO_GUIDE.md`, `frontend/README.md`, `docs/prompts/…`, `docs/reports/…`, `docs/superpowers/plans/…`, `docs/screenshots/fix-*.png` |

**Nothing else.**

---

## 7. Final checks (all must pass)

```bash
mvn clean test
cd frontend && npm run lint && npm test && npm run build && npm ls --depth=0 && cd ..
git diff --stat BASE_COMMIT..HEAD -- pom.xml frontend/package.json src/main/resources   # must be empty
```

---

## 8. REPORT TEMPLATE (mandatory; raw output only; no source code)

~~~markdown
# PROMPT FIX1 — Execution Report

## A. Run metadata
- Branch / BASE_COMMIT / HEAD after final push / pushed yes-no (last lines of `git push`)

## B. Commits
(`git log --oneline BASE_COMMIT..HEAD`)

## C. Files changed
(`git diff --stat BASE_COMMIT..HEAD`)

## D. Task status
| Task | Status | Notes |
|---|---|---|
| Fix A backend (started classes locked) | | |
| Fix A seeder (historical cancellations) | | |
| Fix B deactivation guard | | |
| Fix C username login | | |
| Fix A UI (actions hidden) | | |
| Docs | | |
| Walkthrough | | |

## E. Deviations (including any existing test whose date had to change, and why)

## F. Backend tests
(`grep -h "Tests run" target/surefire-reports/*.txt` + total + BUILD line)

## G. Frontend checks
(`npm ls --depth=0`, `npm run lint`, `npm test` summary, `npm run build` last lines)

## H. Evidence
- H1. The `Demo data loaded:` line
- H2. The analytics summary for the last 3 weeks (must show 129.5 / 104 / 4)
- H3. Curl outputs for steps a–d
- H4. Screenshots: | File | PASS/FAIL | Notes |
- H5. Section 7 final checks output

## I. Open issues and questions for the reviewer
~~~
