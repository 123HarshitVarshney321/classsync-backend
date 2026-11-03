# PROMPT S1 — Fresh, Rich Demo Data for ClassSync (kept simple)

> **How to run this prompt (for the human):** give this file to the agent with the short instruction message from Claude.

---

## 0. Role and ground rules

You are adding a **realistic demo dataset** to the ClassSync repository, so the team can test and demo the app with plenty of data, and reset it to a fresh state with one command.

**This is a college project. Simplicity is the top priority.** The team must be able to explain every line.

### Ground rules

1. **The demo data is NOT a Flyway migration.**
   - Migrations run on every database, including the test database. Extra rooms and professors would break the existing tests.
   - Instead, data is loaded by Java code that runs **only** with the Spring profile `demo`, and only into the database `classsync_demo`.
2. **Load everything through the existing services**, so every class passes the same conflict checks as in the real app:
   - complexes, rooms, facilities, timetable versions and entries;
   - generation, bookings, cancellations and reschedules.
   - The only exception is professors: there is no user-creation service, so save them with `UserRepository` and the `PasswordEncoder` bean.
3. **No new packages, no migrations, no changes to existing services, controllers, entities or the frontend.**
   - Only the files listed in section 6 may change.
   - Use existing repository methods (`findAll`, `findByEmail`, `findWithFilters`, …). If a new repository method is truly unavoidable, list it as a deviation.
4. **Work on branch `feature/demo-data-s1`.**
   - Commit after each phase and push.
   - Never merge into `main`.
   - Do not weaken, delete or `@Disabled` any test.
5. **Report honestly.**
   - Paste raw command output.
   - No source code in the report.
   - Never invent hashes, counts or results.
6. **If you are blocked, stop and ask the user.** Examples: MySQL credentials, permissions.
7. **Do not modify this prompt file.** Save it unchanged as `docs/prompts/PROMPT_S1_DEMO_DATA.md`.

---

## 1. Dates are relative to the day you seed

- Let **W0** = the Monday of the current week, using the injected `Clock`: `LocalDate.now(clock).with(DayOfWeek.MONDAY)`.
- "Week **+1** Thu" means the Thursday of `W0.plusWeeks(1)`; "week **−2** Tue" means the Tuesday of `W0.minusWeeks(2)`, and so on.
- Because of this, the data always looks fresh:
  - there are past weeks for analytics;
  - there are future weeks for booking.
- The backend forbids bookings and reschedules in the past, so those happen only in weeks +1 and +2. **Cancellations have no date rule**, so some are in past weeks.

---

## 2. The dataset (use exactly this — it has been checked for conflicts)

The V2 seed data stays as it is. Add the following on top of it.

### 2.1 Facility (new)
- Video Conferencing

### 2.2 Complexes (new)

| Code | Name |
|---|---|
| LHC | Lecture Hall Complex |
| MB | Main Building |

### 2.3 Rooms (new — the 5 seed rooms stay unchanged)

| Room | Complex | Type | Capacity | Facilities |
|---|---|---|---|---|
| SEC-102 | SEC | CLASSROOM | 60 | Projector, Air Conditioning |
| SEC-103 | SEC | CLASSROOM | 60 | Projector, Smart Board |
| SEC-202 | SEC | LAB | 40 | Projector, Air Conditioning, Computers |
| SEC-203 | SEC | LAB | 40 | Projector, Computers |
| HSS-102 | HSS | CLASSROOM | 50 | Projector |
| HSS-202 | HSS | SEMINAR_HALL | 80 | Projector, Air Conditioning, Audio System, Video Conferencing |
| LHC-1 | LHC | LECTURE_HALL | 250 | Projector, Smart Board, Air Conditioning, Audio System |
| LHC-2 | LHC | LECTURE_HALL | 180 | Projector, Air Conditioning, Audio System |
| LHC-3 | LHC | LECTURE_HALL | 150 | Projector, Audio System |
| MB-101 | MB | CLASSROOM | 70 | Projector, Smart Board, Air Conditioning |
| MB-102 | MB | CLASSROOM | 70 | Projector |
| MB-201 | MB | SEMINAR_HALL | 40 | Projector, Air Conditioning, Video Conferencing |
| MB-G05 | MB | CLASSROOM | 50 | Projector — **deactivated at the very end** ("under renovation") |

### 2.4 Professors (new — password `password123`, role PROFESSOR, status ACTIVE)

| Name | Email | Employee code |
|---|---|---|
| Dr. Grace Hopper | ghopper@classsync.edu | EMP-PRF-003 |
| Dr. Edsger Dijkstra | edijkstra@classsync.edu | EMP-PRF-004 |
| Dr. John von Neumann | jvonneumann@classsync.edu | EMP-PRF-005 |
| Dr. Claude Shannon | cshannon@classsync.edu | EMP-PRF-006 |
| Dr. Srinivasa Ramanujan | sramanujan@classsync.edu | EMP-PRF-007 |
| Dr. C. V. Raman | cvraman@classsync.edu | EMP-PRF-008 |
| Dr. Homi Bhabha | hbhabha@classsync.edu | EMP-PRF-009 |
| Dr. Satyendra Nath Bose | snbose@classsync.edu | EMP-PRF-010 |

With the seed users `aturing@` and `alovelace@`, that makes 10 professors.

### 2.5 Timetable version 1: academic year `2026-27`, semester `1` (36 weekly entries)

`createdBy` = `admin@classsync.edu`. The professor column gives the part of the email before `@classsync.edu`.

| # | Course | Name | Professor | Room | Day | Time |
|---|---|---|---|---|---|---|
| 1 | CS201 | Data Structures | aturing | SEC-301 | Mon | 09:00–10:00 |
| 2 | CS201 | Data Structures | aturing | SEC-301 | Wed | 09:00–10:00 |
| 3 | CS201 | Data Structures | aturing | SEC-301 | Fri | 09:00–10:00 |
| 4 | CS351 | Data Structures Lab | aturing | SEC-202 | Tue | 14:00–17:00 |
| 5 | CS202 | Discrete Mathematics | alovelace | SEC-102 | Mon | 10:00–11:00 |
| 6 | CS202 | Discrete Mathematics | alovelace | SEC-102 | Thu | 10:00–11:00 |
| 7 | MA201 | Linear Algebra | alovelace | HSS-201 | Wed | 11:00–12:00 |
| 8 | MA201 | Linear Algebra | alovelace | HSS-201 | Fri | 10:00–11:00 |
| 9 | CS302 | Database Systems | ghopper | LHC-3 | Mon | 11:00–12:00 |
| 10 | CS302 | Database Systems | ghopper | LHC-3 | Wed | 11:00–12:00 |
| 11 | CS352 | Database Lab | ghopper | SEC-203 | Thu | 14:00–17:00 |
| 12 | CS301 | Operating Systems | edijkstra | LHC-2 | Tue | 09:00–10:00 |
| 13 | CS301 | Operating Systems | edijkstra | LHC-2 | Thu | 09:00–10:00 |
| 14 | CS402 | Compiler Design | edijkstra | SEC-301 | Tue | 11:00–12:00 |
| 15 | CS402 | Compiler Design | edijkstra | SEC-301 | Thu | 11:00–12:00 |
| 16 | CS303 | Computer Networks | jvonneumann | MB-101 | Tue | 11:00–12:00 |
| 17 | CS303 | Computer Networks | jvonneumann | MB-101 | Fri | 11:00–12:00 |
| 18 | CS353 | Networks Lab | jvonneumann | SEC-202 | Wed | 14:00–17:00 |
| 19 | CS499 | Research Seminar | jvonneumann | MB-201 | Fri | 15:00–16:30 |
| 20 | EE201 | Signals and Systems | cshannon | MB-102 | Mon | 14:00–15:00 |
| 21 | EE201 | Signals and Systems | cshannon | MB-102 | Wed | 14:00–15:00 |
| 22 | EE301 | Information Theory | cshannon | HSS-202 | Tue | 10:00–11:00 |
| 23 | EE301 | Information Theory | cshannon | HSS-202 | Thu | 10:00–11:00 |
| 24 | MA101 | Calculus | sramanujan | LHC-1 | Mon | 09:00–10:00 |
| 25 | MA101 | Calculus | sramanujan | LHC-1 | Tue | 10:00–11:00 |
| 26 | MA101 | Calculus | sramanujan | LHC-1 | Thu | 11:00–12:00 |
| 27 | MA301 | Number Theory | sramanujan | HSS-102 | Wed | 10:00–11:00 |
| 28 | PH101 | Engineering Physics | cvraman | LHC-1 | Mon | 11:00–12:00 |
| 29 | PH101 | Engineering Physics | cvraman | LHC-1 | Wed | 10:00–11:00 |
| 30 | PH151 | Physics Lab | cvraman | SEC-201 | Fri | 14:00–17:00 |
| 31 | PH201 | Quantum Mechanics | hbhabha | SEC-103 | Tue | 14:00–15:00 |
| 32 | PH201 | Quantum Mechanics | hbhabha | SEC-103 | Thu | 14:00–15:00 |
| 33 | PH301 | Nuclear Physics | hbhabha | MB-101 | Mon | 15:00–16:00 |
| 34 | PH202 | Statistical Physics | snbose | HSS-102 | Wed | 15:00–16:00 |
| 35 | PH202 | Statistical Physics | snbose | HSS-102 | Fri | 14:00–15:00 |
| 36 | PH203 | Thermodynamics | snbose | HSS-101 | Tue | 15:00–16:00 |

Then:
1. Activate version 1 (`effectiveFrom` = default, today).
2. Generate it for **week −3 Monday through week +4 Sunday** (8 weeks).
3. Expect `createdCount` **288** and `conflictCount` **0**. If either differs, throw an exception: the seeding must fail loudly.

### 2.6 Changes after generation (run them in this order)

All of these go through the services, acting as the class's own professor.

**Cancellations** — `ClassScheduleService.cancelOccurrence`:

| # | Week | Day | Course | Professor |
|---|---|---|---|---|
| C1 | −3 | Tue | MA101 | sramanujan |
| C2 | −2 | Tue | CS301 | edijkstra |
| C3 | −1 | Thu | PH201 | hbhabha |
| C4 | −1 | Wed | EE201 | cshannon |
| C5 | +1 | Fri | CS303 | jvonneumann |
| C6 | +2 | Wed | PH202 | snbose |

**Reschedules** — `ClassScheduleService.rescheduleOccurrence`:

| # | Original class | Moves to |
|---|---|---|
| R1 | week +1 Thu CS202 (alovelace) | week +1 Fri 15:00–16:00, SEC-102 |
| R2 | week +1 Tue CS402 (edijkstra) | week +1 Wed 16:00–17:00, SEC-301 |
| R3 | week +2 Tue PH201 (hbhabha) | week +2 Thu 15:00–16:00, SEC-103 |

**Extra classes** — `BookingService.createExtraClass`:

| # | When | Room | Professor | Course code | Course name |
|---|---|---|---|---|---|
| E1 | week +1 Thu 15:00–16:00 | SEC-101 | aturing | CS201 | Doubt-Clearing Session |
| E2 | week +1 Thu 15:00–16:00 | HSS-101 | alovelace | MA201 | Tutorial |
| E3 | week +1 Fri 16:00–17:30 | LHC-3 | ghopper | CS302 | Exam Review |
| E4 | week +1 Tue 16:00–17:00 | SEC-103 | cvraman | PH101 | Make-up Class |
| E5 | week +2 Wed 12:00–13:00 | LHC-2 | edijkstra | CS301 | Quiz |
| E6 | week +2 Mon 15:00–17:00 | SEC-203 | cshannon | EE201 | MATLAB Workshop |
| E7 | week **+5** Tue 10:00–11:00 | LHC-1 | cvraman | PH101 | Special Lecture |

E7 is a deliberate **future conflict demo**.
- Week +5 is not generated yet, so the booking succeeds.
- When an admin later generates week +5, the generator reports `ROOM_BUSY`, because MA101 (Calculus) uses LHC-1 at that time.

To find a class to cancel or reschedule, use `scheduleOccurrenceRepository.findWithFilters(date, date, professorId, null, null, ScheduleStatus.SCHEDULED)` and match it by course code and start time. **Exactly one** class must match; otherwise throw an exception.

### 2.7 Finishing touches
1. Deactivate room **MB-G05** with `RoomService.updateRoomStatus`.
2. Create timetable **version 2** (`2026-27`, `1`) as a **DRAFT**. Do not activate it.
   - Copy all 36 entries of version 1, with one change: entry 16 (CS303, Tue 11:00–12:00) uses **MB-102** instead of MB-101.
   - Add one new entry: **CS404 Cloud Computing**, ghopper, **LHC-3**, **Fri 11:00–12:00**.
   - That gives 37 entries. Admins can activate this draft during a demo to show versioning and supersession.

### 2.8 Expected totals (assert them in the test)

| Item | Total |
|---|---|
| Complexes | 4 (all active) |
| Rooms | 18 (17 active; MB-G05 inactive) |
| Facilities | 6 |
| Professors | 10 |
| Timetable versions for 2026-27 / 1 | 2 — v1 ACTIVE with 36 entries; v2 DRAFT with 37 entries |

**Classes created by the seeder: 298 rows in total.**

| Status | Count |
|---|---|
| SCHEDULED | 289 (282 OFFICIAL + 7 EXTRA) |
| CANCELLED | 6 |
| RESCHEDULED | 3 |

- Exactly **3** rows have `rescheduledFrom` set.
- **No two SCHEDULED classes overlap** in the same room, or for the same professor, on the same date.

---

## 3. Implementation (package `com.classsync.demo`)

### 3.1 `DemoData.java`
Holds the tables from section 2 as simple constants: Java records and `List.of(...)`. It contains no logic.

### 3.2 `DemoDataSeeder.java`
A `@Service` with one public method, `SeedResult seed()`, annotated `@Transactional(isolation = Isolation.READ_COMMITTED)`. Because it runs in a single transaction, **any failure rolls everything back**.

What it does:

1. **Guard:** if a complex with code `LHC` already exists, log `Demo data already present (complex LHC exists) - skipping` and return a skipped result.
2. Run sections 2.1 → 2.7 in order, using the services and the `Clock` bean.
3. **Fail loudly:** if generation creates anything other than 288 classes, or reports any conflict, or a lookup in 2.6 doesn't find exactly one class, throw `IllegalStateException` with a clear message.
4. **Log one summary line**, starting with exactly `Demo data loaded:`. For example: `Demo data loaded: 4 complexes, 18 rooms (17 active), 10 professors, 2 timetable versions (v1 ACTIVE 36 entries, v2 DRAFT 37 entries), 298 classes (289 scheduled incl. 7 extra, 6 cancelled, 3 rescheduled), window 2026-10-12..2026-12-06`.

Keep it readable: one small private method per step, such as `createRooms()`, `createProfessors()`, `createTimetable()`, `applyChanges()`.

### 3.3 `DemoDataRunner.java`
A `@Component` with `@Profile("demo")` that implements `CommandLineRunner` and simply calls `seed()`. It does nothing in any other profile, including tests.

---

## 4. Scripts

### 4.1 `run.sh`

**1. Add a third mode.** The script now has three modes:

| Command | What it does |
|---|---|
| `./run.sh` | Dev database `classsync`, unchanged behaviour |
| `./run.sh --demo` | Existing `classsync_demo` database, with no reseeding |
| `./run.sh --fresh-demo` | **New:** after the MySQL check, run `mysql -u root -e "DROP DATABASE IF EXISTS classsync_demo;"`, point `DB_URL` at `classsync_demo` (with `createDatabaseIfNotExist=true`), and start the backend with `SPRING_PROFILES_ACTIVE=demo` |

**2. Fix the stale JAR.** Today the JAR is only built if it is missing, so after code changes the old JAR keeps running. Rebuild it when it is missing **or** when anything in `src/` or `pom.xml` is newer:

```bash
if [ ! -f "$JAR_PATH" ] || [ -n "$(find src pom.xml -newer "$JAR_PATH" -print -quit)" ]; then
    mvn -q package -DskipTests
fi
```

**3. Wait for seeding in `--fresh-demo` mode.** The health check can report UP while the demo data is still loading. After the backend is UP, wait (at most 120 s) until `/tmp/classsync-backend.log` contains `Demo data loaded:`, then print that line. If the line never appears, print the last 40 lines of the log and exit with code 1.

### 4.2 `stop.sh`
Remove the line `pkill -f "vite"`. It kills **every** Vite dev server on the machine, including unrelated projects. Freeing ports 8080 and 5173 is enough. Keep the rest.

---

## 5. Tests — `src/test/java/com/classsync/demo/DemoDataSeederIntegrationTests.java`

Annotate the class `@SpringBootTest` and `@Transactional`; everything rolls back after each test. Autowire `DemoDataSeeder` and call `seed()` directly.

The fixed test clock is 2026-10-01, so W0 = 2026-09-28 and the generated window is 2026-09-07 … 2026-11-01. Write these tests:

| # | Test | Expectation |
|---|---|---|
| 1 | Totals | Assert every number in 2.8. Count classes over the window plus week +5, i.e. `findWithFilters(2026-09-07, 2026-11-08, null, null, null, null)`, which must return 298 rows with the listed status and type counts |
| 2 | Integrity | Load every SCHEDULED class and check pairwise, per date, that no two overlap in the same room or for the same professor (half-open intervals) |
| 3 | Changes applied | C1–C6 are CANCELLED. R1–R3 originals are RESCHEDULED, and each has exactly one replacement at the new slot with `rescheduledFrom` set. E1–E7 exist as SCHEDULED EXTRA classes in the listed rooms |
| 4 | Idempotent | Calling `seed()` a second time is skipped, and the totals are unchanged |
| 5 | Future conflict demo | After `seed()`, generate version 1 for week +5 (2026-11-02 … 2026-11-08) through `ScheduleOccurrenceService`. Expect `createdCount` 35 and `conflictCount` 1, with the conflict being `ROOM_BUSY` for MA101 against `conflictingCourseCode` PH101 (EXTRA) |
| 6 | Inactive room | MB-G05 is inactive and has no classes |

If the test database contains rows left by other tests, restrict the assertions to the seeded data (seeded codes, emails, and the date range above).

**Checks:** `mvn clean test` must be green (the existing 217 tests plus the new ones).

---

## 6. Files allowed to change

| Kind | Files |
|---|---|
| New | `src/main/java/com/classsync/demo/DemoData.java`, `DemoDataSeeder.java`, `DemoDataRunner.java` |
| New | `src/test/java/com/classsync/demo/DemoDataSeederIntegrationTests.java` |
| Changed | `run.sh`, `stop.sh`, `README.md` (a "Demo data" section), `PROJECT_PROGRESS_REPORT.md` (at most 3 lines noting the demo dataset) |
| New docs | `docs/DEMO_GUIDE.md`, `docs/prompts/PROMPT_S1_DEMO_DATA.md`, `docs/superpowers/plans/<today>-promptS1-demo-data.md`, `docs/reports/PROMPT_S1_REPORT.md`, `docs/screenshots/s1-*.png` |

**Nothing else.** In particular: no changes to `frontend/`, `pom.xml`, migrations, entities, services, controllers or repositories.

---

## 7. Docs

### 7.1 `README.md` — "Demo data" section
- What the dataset contains: the counts from 2.8.
- The professor accounts. All passwords are `password123`.
- The three run modes and `./stop.sh`.
- That dates are relative to the day you seed.
- That tests and the dev database are never seeded.

### 7.2 `docs/DEMO_GUIDE.md` — a short manual test script by role

Each step says what to click and what you should see.

**Admin:**
- Timetables: v1 ACTIVE (36 entries), v2 DRAFT (37 entries).
- Generate v1 for week +5: 1 conflict, MA101 vs PH101 Special Lecture.
- Activate v2 effective next Monday: superseded count shown. Then generate v2 for weeks +1 to +4.
- Occupancy on a busy weekday.
- Campus: MB-G05 is inactive (with "Show inactive" ticked).

**Professors:**
- Lovelace, week +1: CS202 on Thursday shows as "Rescheduled", the moved CS202 is on Friday at 15:00, and the extra MA201 Tutorial is on Thursday at 15:00.
- von Neumann, week +1: CS303 on Friday is cancelled.
- Turing, week +1: the extra Doubt-Clearing Session on Thursday at 15:00.
- Find a Room as any professor: for example, next Monday 09:00–10:00 with capacity 100 → ranked halls with reasons.

**Analytics** (once the analytics feature exists): the past 3 weeks show utilization, and SEC-101 appears as underused.

---

## 8. Phases

| Phase | Work | Checks | Commit |
|---|---|---|---|
| 0 | `git status` (STOP if dirty) → `git checkout main && git pull` → `git checkout -b feature/demo-data-s1` → record `BASE_COMMIT` (`git rev-parse HEAD`). Save the prompt; write the plan and the report skeleton (section 9) | – | `chore(S1-P0): prompt, plan and report skeleton` |
| 1 | `DemoData`, `DemoDataSeeder`, `DemoDataRunner` + tests | `mvn clean test` green | `feat(S1-P1): demo data seeder` |
| 2 | `run.sh` and `stop.sh` changes | `bash -n run.sh && bash -n stop.sh` | `feat(S1-P2): fresh-demo mode, stale-jar rebuild, safer stop` |
| 3 | README, DEMO_GUIDE, progress report | – | `docs(S1-P3): demo data docs` |
| 4 | Walkthrough + report (below) | – | `docs(S1-P4): walkthrough screenshots and report` |

### Phase 4 — Walkthrough

**1. Start the app with fresh data.** Run `./run.sh --fresh-demo` in the background, and paste the `Demo data loaded:` line it prints.

**2. Take the screenshots** with your browser tool, saved to `docs/screenshots/`:

| File | Who | What it shows |
|---|---|---|
| `s1-01-timetables.png` | admin | Timetables: v1 ACTIVE and v2 DRAFT |
| `s1-02-occupancy.png` | admin | Occupancy for the Monday of week +1, all complexes |
| `s1-03-my-week-lovelace.png` | alovelace | My Week for week +1: rescheduled CS202, moved CS202 on Friday, extra Tutorial on Thursday |
| `s1-04-campus-inactive.png` | admin | Campus → Rooms → Main Building, "Show inactive" ticked: MB-G05 Inactive |
| `s1-05-generate-conflict.png` | admin | Generate v1 for week +5: 1 conflict (MA101 vs PH101 Special Lecture) |

**3. Leave a pristine dataset.** The week +5 generation in step 2 changed the data, so run `./stop.sh`, then `./run.sh --fresh-demo` again. Once the `Demo data loaded:` line appears, run `./stop.sh`.

**4. Check `stop.sh`.** Paste the output of `grep -n "pkill" stop.sh`.

**5. Finish.** Complete the report, commit, push, and print the entire report as your final message.

---

## 9. REPORT TEMPLATE (mandatory; raw output only; no source code)

~~~markdown
# PROMPT S1 — Execution Report

## A. Run metadata
- Branch:
- BASE_COMMIT (`git rev-parse HEAD` from Phase 0):
- HEAD after final push (`git rev-parse HEAD`):
- Pushed: yes/no (last lines of `git push`)

## B. Commits
(`git log --oneline BASE_COMMIT..HEAD`)

## C. Files changed
(`git diff --stat BASE_COMMIT..HEAD`)

## D. Task status
| Task | Status (DONE / PARTIAL / NOT STARTED / DEVIATED) | Notes |
|---|---|---|
| P0 setup | | |
| P1 seeder + tests | | |
| P2 scripts | | |
| P3 docs | | |
| P4 walkthrough + report | | |

## E. Deviations
For each: what the prompt said, what you did instead, and why.

## F. Backend tests
(`grep -h "Tests run" target/surefire-reports/*.txt`, plus the total and BUILD lines)

## G. Walkthrough evidence
- G1. The `Demo data loaded:` line from the first `./run.sh --fresh-demo`
- G2. The same line from the final re-seed
- G3. `grep -n "pkill" stop.sh`
- G4. Screenshots:
| File | PASS/FAIL | Notes |
|---|---|---|
| s1-01-timetables.png | | |
| s1-02-occupancy.png | | |
| s1-03-my-week-lovelace.png | | |
| s1-04-campus-inactive.png | | |
| s1-05-generate-conflict.png | | |

## H. Acceptance checklist
| ID | Criterion | PASS/FAIL | Evidence (command output) |
|---|---|---|---|
| C1 | Only allowed files changed | | `git diff --stat BASE_COMMIT..HEAD` |
| C2 | No new dependencies, no migrations, frontend untouched | | `git diff --stat BASE_COMMIT..HEAD -- pom.xml frontend src/main/resources/db` (must be empty) |
| C3 | Existing main code untouched | | `git diff --stat BASE_COMMIT..HEAD -- src/main/java ':(exclude)src/main/java/com/classsync/demo'` (must be empty) |
| C4 | Backend tests green, including the 6 seeder tests | | section F |
| C5 | Seeded totals match section 2.8 | | G1 + test 1 |

## I. Open issues and questions for the reviewer
~~~
