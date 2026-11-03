# Prompt S1: Fresh, Rich Demo Data for ClassSync Implementation Plan

## Goal
Implement a realistic demo dataset loaded purely in Java via Spring profile `demo` into `classsync_demo` through existing service layer contracts without modifying existing entities, services, controllers, migrations, or the frontend. Provide one-click `--fresh-demo` CLI capability, comprehensive integration tests (6 tests), manual demo guide, and visual verification screenshots.

## Ground Rules & Constraints
- Only files listed in prompt section 6 may change.
- No Flyway migrations, no new dependencies in `pom.xml`.
- Work on branch `feature/demo-data-s1`. Never merge to `main`.
- Dates relative to seeded Monday ($W0$).

---

## Phase 0: Setup, Plan & Skeleton
- [x] Check clean git status on `main`
- [x] Create branch `feature/demo-data-s1`
- [x] Record `BASE_COMMIT` (`40215c103480c4927fa64bf7387b74f02064af7f`)
- [x] Save `docs/prompts/PROMPT_S1_DEMO_DATA.md` unchanged
- [x] Create report skeleton `docs/reports/PROMPT_S1_REPORT.md`
- [x] Create plan `docs/superpowers/plans/2026-11-04-promptS1-demo-data.md`
- [ ] Commit `chore(S1-P0): prompt, plan and report skeleton` and push

---

## Phase 1: Demo Data Seeder & Integration Tests
### 1.1 `com.classsync.demo.DemoData`
- Record structures:
  - `ComplexDef(String code, String name)`
  - `RoomDef(String roomNumber, String complexCode, RoomType type, int capacity, List<String> facilityNames, boolean activeAtEnd)`
  - `ProfessorDef(String name, String email, String employeeCode)`
  - `EntryDef(int number, String courseCode, String courseName, String profUsername, String roomNumber, int dayOfWeek, LocalTime startTime, LocalTime endTime)`
  - `CancellationDef(String id, int weekOffset, DayOfWeek dayOfWeek, String courseCode, String profUsername)`
  - `RescheduleDef(String id, int origWeekOffset, DayOfWeek origDay, String origCourse, String profUsername, int targetWeekOffset, DayOfWeek targetDay, LocalTime targetStart, LocalTime targetEnd, String targetRoomNumber)`
  - `ExtraBookingDef(String id, int weekOffset, DayOfWeek day, LocalTime startTime, LocalTime endTime, String roomNumber, String profUsername, String courseCode, String courseName)`
- Static constants with data tables from sections 2.1 to 2.7.

### 1.2 `com.classsync.demo.DemoDataSeeder`
- `@Service` with `@Transactional(isolation = Isolation.READ_COMMITTED)`
- Public record `SeedResult(boolean skipped, int complexes, int rooms, int professors, int versions, int occurrences, String summary)`
- Method `SeedResult seed()`:
  - Guard: If `complexRepository.findByCode("LHC")` exists -> return skipped.
  - 2.1 Facility: "Video Conferencing" via `FacilityService.createFacility`.
  - 2.2 Complexes: "LHC", "MB" via `ComplexService.createComplex`.
  - 2.3 Rooms: 13 rooms via `RoomService.createRoom`.
  - 2.4 Professors: 8 professors saved with `UserRepository` and `PasswordEncoder`.
  - 2.5 Timetable v1: 36 entries via `TimetableVersionService` & `TimetableEntryService`. Activate v1, generate window $W0 - 3$ weeks Monday to $W0 + 4$ weeks Sunday (8 weeks). Assert created = 288, conflicts = 0.
  - 2.6 Post-generation changes:
    - 6 Cancellations (C1–C6) via `ClassScheduleService.cancelOccurrence`.
    - 3 Reschedules (R1–R3) via `ClassScheduleService.rescheduleOccurrence`.
    - 7 Extra Bookings (E1–E7) via `BookingService.createExtraClass`.
  - 2.7 Finishing touches:
    - Deactivate MB-G05 via `RoomService.updateRoomStatus`.
    - Create draft Timetable v2 with 37 entries.
  - Log line starting with `Demo data loaded:`.

### 1.3 `com.classsync.demo.DemoDataRunner`
- `@Component`, `@Profile("demo")`, implements `CommandLineRunner`.
- In `run(String... args)`: invokes `seeder.seed()`.

### 1.4 `com.classsync.demo.DemoDataSeederIntegrationTests`
- `@SpringBootTest`, `@Transactional`
- Tests:
  1. `totalsMatchExpected`: All counts match 2.8.
  2. `scheduleIntegrityNoOverlaps`: Pairwise check on all SCHEDULED occurrences.
  3. `changesAppliedSuccessfully`: C1-C6 cancelled, R1-R3 rescheduled, E1-E7 extra classes.
  4. `seedIsIdempotent`: Second run skipped.
  5. `futureConflictDemo`: Week +5 generation reports 35 created, 1 conflict (MA101 vs PH101).
  6. `inactiveRoomUnderRenovation`: MB-G05 is inactive with no classes.
- Verification: `mvn clean test` must pass 223/223 tests.
- Commit: `feat(S1-P1): demo data seeder` and push.

---

## Phase 2: Scripts
### 2.1 `run.sh`
- Support `--fresh-demo` mode:
  - Drops `classsync_demo`.
  - Sets `DB_URL` with `createDatabaseIfNotExist=true`.
  - Sets `SPRING_PROFILES_ACTIVE=demo`.
  - Waits up to 120s for `Demo data loaded:` log line.
- Rebuild stale JAR when `src/` or `pom.xml` is newer than `target/...jar`.
### 2.2 `stop.sh`
- Remove `pkill -f "vite"` to prevent killing unrelated vite servers on port.
### 2.3 Verification
- Run `bash -n run.sh && bash -n stop.sh`.
- Commit: `feat(S1-P2): fresh-demo mode, stale-jar rebuild, safer stop` and push.

---

## Phase 3: Documentation
- `README.md`: Add "Demo data" section (counts, accounts, run modes, relative dates).
- `docs/DEMO_GUIDE.md`: Role-based manual test script (Admin, Professors, Analytics).
- `PROJECT_PROGRESS_REPORT.md`: Note demo dataset addition (<= 3 lines).
- Commit: `docs(S1-P3): demo data docs` and push.

---

## Phase 4: Walkthrough & Final Verification
- Run `./run.sh --fresh-demo` in background.
- Capture G1 log line.
- Capture 5 walkthrough screenshots:
  - `s1-01-timetables.png`
  - `s1-02-occupancy.png`
  - `s1-03-my-week-lovelace.png`
  - `s1-04-campus-inactive.png`
  - `s1-05-generate-conflict.png`
- Stop with `./stop.sh`.
- Re-run `./run.sh --fresh-demo` to leave pristine dataset, capture G2, run `./stop.sh`.
- Verify `grep -n "pkill" stop.sh`.
- Complete `docs/reports/PROMPT_S1_REPORT.md`.
- Commit: `docs(S1-P4): walkthrough screenshots and report` and push.
