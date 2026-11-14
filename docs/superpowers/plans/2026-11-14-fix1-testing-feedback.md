# Plan: FIX1 — Fixes from User Testing (Past Classes, Room Deactivation, Login)

## Phase 0: Setup
- Save prompt to `docs/prompts/PROMPT_FIX1_TESTING_FEEDBACK.md` (done)
- Create branch `fix/testing-feedback` from `main` (done, BASE_COMMIT: `1a60c9bc6e997c0b5d0c540ec2198df2f1bd6aa9`)
- Create report skeleton `docs/reports/PROMPT_FIX1_REPORT.md` (done)
- Commit: `chore(FIX1-P0): prompt, plan and report skeleton`

## Phase 1: Backend
1. **Fix A (started classes locked)**:
   - In `ClassScheduleService`:
     - Inject/use `Clock clock`.
     - In `cancelOccurrence`: check if `LocalDateTime.of(occurrence.getScheduleDate(), occurrence.getStartTime()).isAfter(LocalDateTime.now(clock))` is false. Throw `BadRequestException("Cannot cancel a class that has already started")`.
     - In `rescheduleOccurrence`: check if `LocalDateTime.of(original.getScheduleDate(), original.getStartTime()).isAfter(LocalDateTime.now(clock))` is false. Throw `BadRequestException("Cannot reschedule a class that has already started")`.
   - In `DemoDataSeeder`:
     - For cancellations C1-C4 (historical): if already started, set status `CANCELLED` directly and save to repository with comment `// Historical record: the app no longer allows cancelling classes that have started.`. For C5-C6, call `classScheduleService.cancelOccurrence(...)`.
2. **Fix B (block deactivating rooms and complexes with upcoming classes)**:
   - In `ScheduleOccurrenceRepository`:
     - Add `findUpcomingInRoom(Integer roomId, LocalDate today, LocalTime nowTime)`
     - Add `findUpcomingInComplex(Integer complexId, LocalDate today, LocalTime nowTime)`
   - In `RoomService.updateRoomStatus`:
     - Inject `Clock clock`.
     - When `request.active() == false`: query upcoming classes in room. If non-empty, throw `DuplicateResourceException("Cannot deactivate room <roomNumber>: it has <n> upcoming scheduled class(es), the next on <yyyy-MM-dd>. Cancel or reschedule them, or move this room's classes in a new timetable version, first.")`.
   - In `ComplexService.updateComplexStatus`:
     - Inject `Clock clock`.
     - When `request.active() == false`: query upcoming classes in complex. If non-empty, throw `DuplicateResourceException("Cannot deactivate complex <name>: its rooms have <n> upcoming scheduled class(es), the next on <yyyy-MM-dd>. Cancel or reschedule them, or move these classes in a new timetable version, first.")`.
3. **Backend Tests**:
   - In `ClassScheduleIntegrationTests`: add 4 tests for Fix A.
   - New `DeactivationGuardIntegrationTests`: add 5 tests for Fix B.
   - Run `mvn clean test` and verify all tests pass. Note any existing test adjustments if affected.
4. **Commit**: `fix(FIX1-P1): lock started classes; block deactivating rooms with upcoming classes`

## Phase 2: Frontend
1. **Fix C (username or email login)**:
   - Create `src/utils/login.js` with `DEFAULT_EMAIL_DOMAIN` and `toLoginEmail(input)`.
   - Create `src/utils/login.test.js` with tests.
   - Update `pages/LoginPage.jsx`: field type `text`, autocomplete `username`, placeholder, call `login(toLoginEmail(email), password)`, add tip text.
2. **Fix A in UI (hide actions for started classes)**:
   - In `utils/dates.js`: add `hasStarted(scheduleDate, startTime, now = new Date())`.
   - In `utils/dates.test.js`: add tests.
   - In `pages/professor/MyWeekPage.jsx`: hide Reschedule/Cancel buttons for started classes; show grey note.
   - In `pages/shared/OccupancyPage.jsx`: hide Cancel class button for started classes; show grey note.
3. **Frontend Tests**:
   - `npm run lint`, `npm test`, `npm run build`.
4. **Commit**: `fix(FIX1-P2): username login, hide actions for started classes`

## Phase 3: Docs
- Update `README.md` (Business rules, test counts).
- Update `PROJECT_PROGRESS_REPORT.md` (Fixes from user testing section, test counts).
- Update `docs/DEMO_GUIDE.md` (LHC-1 blocked deactivation, SEC-104 allowed deactivation, past class note, username login).
- Update `frontend/README.md` (login tip).
- Commit: `docs(FIX1-P3): business rules and fixes from user testing`

## Phase 4: Walkthrough & Report
- Seed `./run.sh --fresh-demo`, verify 298/289/6/3 demo counts.
- Verify analytics API summary for last 3 weeks (129.5 / 104 / 4).
- Execute curl checks a-d.
- Capture screenshots: `fix-01-login-username.png`, `fix-02-logged-in.png`, `fix-03-deactivate-blocked.png`, `fix-04-past-class-locked.png`.
- Leave pristine dataset (`./stop.sh`, `./run.sh --fresh-demo`, `./stop.sh`).
- Final checks (`mvn clean test`, `npm run lint`, `npm test`, `npm run build`, diff check).
- Complete `docs/reports/PROMPT_FIX1_REPORT.md`.
- Commit: `docs(FIX1-P4): walkthrough evidence and report`
- Push and output full report.
