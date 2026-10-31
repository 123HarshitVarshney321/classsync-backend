# Prompt 11H: ClassSync Integrity & Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the ClassSync integrity and hardening pass (Prompt 11H) addressing review findings F1 through F9 across 7 disciplined phases. Protect database integrity, enforce non-destructive rescheduling, add generator conflict detection and version supersession, fix recommendation soft constraints, enable frontend integration (CORS, `/me`, logout, user listing, `includeInactive`, past-date guards), align documentation with true technical metrics, and verify everything against fresh databases.

**Architecture:** Java 21, Spring Boot 3.4.3, Spring Security 6, Spring Data JPA / Hibernate 6, MySQL 8 (InnoDB), Flyway (V1-V6), JUnit 5 + MockMvc.
Strict adherence to Controller -> Service -> Repository layering, Java records for DTOs, global lock order (V -> O -> U -> R), RFC-7807 error shapes, and zero breaking of V1-V4 migrations.

---

## Phases & Tasks

### Phase 0: Setup, Isolation, Baseline
- [ ] **T0.1 Environment & Branch:**
  - Branch: `hardening/prompt-11h`
  - Record `BASE_COMMIT` (45e14cfb464c7d2e94e594d3db4013f9d2dc2442)
  - Verify Java 21+, Maven 3.9+, MySQL 8+
- [ ] **T0.2 Plan & Report Skeleton:**
  - Write `docs/superpowers/plans/2026-10-31-prompt11h-hardening.md`
  - Initialize `docs/reports/PROMPT_11H_REPORT.md`
- [ ] **T0.3 Test Database Isolation (F2):**
  - Create `src/test/resources/application.properties` with `spring.datasource.url` pointing to `classsync_test`
  - Set `app.clock.fixed-date=2026-10-01`
  - Create `TestDatabaseIsolationTest.java` asserting catalog is `classsync_test`
- [ ] **T0.4 Baseline Run on Fresh DB:**
  - Drop `classsync_test`
  - Run `mvn clean test`
  - Record failing login tests as proof of F1 in report §F1
  - Commit: `test(11H-P0): isolate tests in classsync_test + baseline`

### Phase 1: Quick Correctness Fixes
- [ ] **T1.1 Real Seed Password Hashes (F1):**
  - Generate valid BCrypt hash for `password123`
  - Create `V5__fix_seed_user_password_hashes.sql`
  - Add test to `SecurityAuthenticationTests` asserting seed hashes match `password123`
- [ ] **T1.2 Clock Bean:**
  - Create `TimeConfig.java` injecting `Clock` (support `fixed-date` for tests and system timezone for prod)
  - Add `app.timezone` in `application.yml`
- [ ] **T1.3 Map Lock Failures to 409 (F7):**
  - Add handler for `PessimisticLockingFailureException` in `GlobalExceptionHandler` returning 409
  - Add unit test for lock failure mapping
- [ ] **T1.4 Method Security (F7):**
  - Add `@EnableMethodSecurity` to `SecurityConfig`
- [ ] Commit: `fix(11H-P1): seed hashes, clock, lock-failure mapping, method security`

### Phase 2: Live-Model Integrity
- [ ] **T2.1 V6 Migration:**
  - Create `V6__non_destructive_reschedule_and_supersession.sql`
  - Add statuses `RESCHEDULED`, `SUPERSEDED`
  - Add `rescheduled_from_id` FK column to `schedule_occurrences`
- [ ] **T2.2 Model & DTO Updates:**
  - Update `ScheduleStatus`, `ScheduleOccurrence`
  - Update `ScheduleOccurrenceResponse` and `BookingResponse` with `rescheduledFromId`
- [ ] **T2.3 Non-Destructive Rescheduling (F5 - CONTRACT CHANGE):**
  - Update `ClassScheduleService.rescheduleOccurrence`
  - Original becomes `RESCHEDULED`; replacement inserted with `rescheduledFrom = original` and `timetableEntry = null`
  - Require `startTime < endTime`, reject past targets, lock O -> U -> R
- [ ] **T2.4 Past-Date Guard for Bookings (F8):**
  - Update `BookingService.createExtraClass` to reject past dates
- [ ] **T2.5 Generator Locks, Conflict Detection & Report (F3):**
  - Update `ScheduleOccurrenceService.generateOccurrences`
  - Lock V -> U -> R in ascending ID order
  - Detect conflicts (`ROOM_BUSY`, `PROFESSOR_BUSY`, `ROOM_INACTIVE`)
  - Extend response with `conflictCount` and `List<GenerationConflict> conflicts`
- [ ] **T2.6 Version Activation: Locking & Supersession (F4):**
  - Update `TimetableVersionService.activateVersion` with `effectiveFrom`
  - Bulk supersede future official occurrences of old version (`status = SUPERSEDED`)
  - Return `TimetableActivationResponse`
- [ ] **T2.7 Phase 2 Tests:**
  - Update contract-changed reschedule tests (24, 27, 29, 30)
  - Author tests N1 through N18
- [ ] Commit: `fix(11H-P2): live-model integrity (reschedule, generation, activation)`

### Phase 3: Recommendation Engine (F6)
- [ ] **T3.1 Hard vs Soft Constraints (CONTRACT CHANGE):**
  - In `RecommendationService`, call `getAvailableRoomEntities` without filtering complex, roomType, facilities
  - Score them as soft preferences
- [ ] **T3.2 Scoring & Reasons:**
  - Update `LocationFit` (1.0 default if unspecified)
  - Update exact reason strings for location, room type, facilities, continuity (preceding vs following)
- [ ] **T3.3 Phase 3 Tests:**
  - Update tests 7, 8, 15
  - Add tests N19 through N22
- [ ] Commit: `fix(11H-P3): recommendation soft preferences and explainability`

### Phase 4: Frontend-Readiness API (F8)
- [ ] **T4.1 CORS:**
  - Add `app.cors.allowed-origins` property
  - Define `CorsConfigurationSource` inside `SecurityConfig`
  - Add CORS preflight tests
- [ ] **T4.2 Cookie & Session Fixation:**
  - Add `SameSite=Lax`, `HttpOnly=true` in `application.yml`
  - Call `httpRequest.changeSessionId()` in `AuthController.login`
- [ ] **T4.3 `/me` and Logout:**
  - Implement `GET /api/auth/me`
  - Configure Spring Security logout at `POST /api/auth/logout` (204 No Content)
  - Add tests
- [ ] **T4.4 `GET /api/users` (Admin Only):**
  - Create `UserController`, `UserService`, `UserSummaryResponse`
  - Support `role` and `status` query filters
  - Add tests
- [ ] **T4.5 Admin Inactive Visibility:**
  - Add `includeInactive` parameter to complexes, rooms, facilities
  - Add tests
- [ ] Commit: `feat(11H-P4): frontend-readiness API`

### Phase 5: Documentation Truthfulness (F9)
- [ ] Align `README.md` and `PROJECT_PROGRESS_REPORT.md` with real code
- [ ] Verify banned phrases grep returns nothing
- [ ] Commit: `docs(11H-P5): align README and progress report with code`

### Phase 6: Final Verification & Push
- [ ] **T6.1 Fresh DB full test run (`mvn clean test`)**
- [ ] **T6.2 Upgrade check on copy (`classsync_upgrade_check`)**
- [ ] **T6.3 Runtime smoke test with curl**
- [ ] **T6.4 Finish report, commit, push branch `hardening/prompt-11h`**
