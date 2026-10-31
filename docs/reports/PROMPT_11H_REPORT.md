# PROMPT 11H — Execution Report

## A. Run metadata
- Branch: hardening/prompt-11h
- BASE_COMMIT (main at start): 45e14cfb464c7d2e94e594d3db4013f9d2dc2442
- HEAD commit (after final push): NOT STARTED
- Pushed to origin: NOT STARTED
- java -version / mvn -v / mysql --version (first line of each):
  - openjdk version "26.0.1" 2026-04-21
  - Apache Maven 3.9.16 (2bdd9fddda4b155ebf8000e807eb73fd829a51d5)
  - mysql  Ver 26.7.0 for macos26.6 on arm64 (Homebrew)
- Agent / model (if known): Antigravity / Gemini

## B. Commits
- `5a03337` `test(11H-P0): isolate tests in classsync_test + baseline`

## C. Files changed
(Updated per phase commit)

## D. Task status
| Task | Status (DONE / PARTIAL / NOT STARTED / DEVIATED) | Evidence (files, test names) | Notes |
|---|---|---|---|
| T0.1 | DONE | `git status`, `git checkout -b hardening/prompt-11h` | Branch created, BASE_COMMIT recorded (45e14cf) |
| T0.2 | DONE | `docs/superpowers/plans/2026-10-31-prompt11h-hardening.md`, `docs/reports/PROMPT_11H_REPORT.md` | Plan & report skeleton initialized |
| T0.3 | DONE | `src/test/resources/application.properties`, `TestDatabaseIsolationTest.java` | Isolated test DB to `classsync_test` |
| T0.4 | DONE | `mvn clean test` on fresh `classsync_test` | Baseline run executed; 3 failures in `SecurityAuthenticationTests` confirming F1 |
| T1.1 | DONE | `V5__fix_seed_user_password_hashes.sql`, `SecurityAuthenticationTests#seedUserPasswordHashesMatchDefaultPassword` | Real seed password hashes ($2a$10$2Kxy42QLaYIOEwClmXhHJOc4QnaWvrruUJTTh8KNXvsH5GMMq24YS) |
| T1.2 | DONE | `TimeConfig.java`, `application.yml` | Clock bean with app.timezone and fixed-date support |
| T1.3 | DONE | `GlobalExceptionHandler.java`, `GlobalExceptionHandlerTest#pessimisticLockingFailureMapsTo409` | Maps PessimisticLockingFailureException to 409 Conflict |
| T1.4 | DONE | `SecurityConfig.java` | Added @EnableMethodSecurity |
| T2.1 | NOT STARTED | `V6__non_destructive_reschedule_and_supersession.sql` | V6 migration |
| T2.2 | NOT STARTED | `ScheduleStatus.java`, `ScheduleOccurrence.java`, DTOs | Model and DTO updates |
| T2.3 | NOT STARTED | `ClassScheduleService.java` | Non-destructive rescheduling contract |
| T2.4 | NOT STARTED | `BookingService.java` | Past-date guard for bookings |
| T2.5 | NOT STARTED | `ScheduleOccurrenceService.java`, `GenerateOccurrencesResponse.java` | Generator locks, conflict detection, report |
| T2.6 | NOT STARTED | `TimetableVersionService.java`, `TimetableActivationResponse.java` | Version activation locking & supersession |
| T2.7 | NOT STARTED | Integration tests N1-N18 | Phase 2 tests |
| T3.1 | NOT STARTED | `RecommendationService.java` | Hard vs soft constraints |
| T3.2 | NOT STARTED | `RecommendationService.java` | Scoring and reasons |
| T3.3 | NOT STARTED | `RecommendationIntegrationTests.java` | Tests N19-N22 |
| T4.1 | NOT STARTED | `SecurityConfig.java`, `application.yml` | CORS configuration & tests |
| T4.2 | NOT STARTED | `application.yml`, `AuthController.java` | Cookie flags & session fixation |
| T4.3 | NOT STARTED | `AuthController.java`, `SecurityConfig.java` | `/me` and logout |
| T4.4 | NOT STARTED | `UserController.java`, `UserService.java`, DTOs | `GET /api/users` admin-only |
| T4.5 | NOT STARTED | Infrastructure controllers | `includeInactive` parameter |
| T5 (docs) | NOT STARTED | `README.md`, `PROJECT_PROGRESS_REPORT.md` | Align docs with code |
| T6.1 | NOT STARTED | `mvn clean test` on fresh DB | Fresh DB verification |
| T6.2 | NOT STARTED | `classsync_upgrade_check` | Upgrade path check |
| T6.3 | NOT STARTED | curl commands on port 8081 | Runtime smoke test |
| T6.4 | NOT STARTED | `git push -u origin hardening/prompt-11h` | Push and final report |

## E. Deviations
None.

## F. Tests
- F1. Baseline (Phase 0, fresh DB, before fixes):
```text
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.009 s -- in com.classsync.ClassSyncApplicationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.005 s -- in com.classsync.TestDatabaseIsolationTest
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.158 s -- in com.classsync.controller.AvailabilityIntegrationTests
Tests run: 25, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.296 s -- in com.classsync.controller.BookingIntegrationTests
Tests run: 32, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.516 s -- in com.classsync.controller.ClassScheduleIntegrationTests
Tests run: 17, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.104 s -- in com.classsync.controller.DomainIntegrationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.112 s -- in com.classsync.controller.HealthControllerTest
Tests run: 32, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.305 s -- in com.classsync.controller.RecommendationIntegrationTests
Tests run: 20, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.260 s -- in com.classsync.controller.ScheduleOccurrenceIntegrationTests
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.352 s -- in com.classsync.controller.TimetableIntegrationTests
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.538 s -- in com.classsync.repository.RepositoryIntegrationTests
Tests run: 11, Failures: 3, Errors: 0, Skipped: 0, Time elapsed: 1.446 s <<< FAILURE! -- in com.classsync.security.SecurityAuthenticationTests

Failures (F1 Evidence):
- SecurityAuthenticationTests.authenticatedEndpointWorksWithLoginSession:159 Status expected:<200> but was:<401>
- SecurityAuthenticationTests.validAdminLoginSucceeds:58 Status expected:<200> but was:<401>
- SecurityAuthenticationTests.validProfessorLoginSucceeds:78 Status expected:<200> but was:<401>
```
- F2. Final (Phase 6, fresh DB): (Pending T6.1)
- F3. Changed existing tests:
  | Class | Old name | New name | Old expectation | New expectation | Contract change |
  |---|---|---|---|---|---|
- F4. New tests:
  | ID (N1…N22, T4.x, T1.x) | Class | Method name | What it proves (finding) |
  |---|---|---|---|
  | T1.1 | `SecurityAuthenticationTests` | `seedUserPasswordHashesMatchDefaultPassword` | Seed user hashes in V5 match 'password123' (F1) |
  | T1.3 | `GlobalExceptionHandlerTest` | `pessimisticLockingFailureMapsTo409` | PessimisticLockingFailureException maps to 409 Conflict (F7) |

- F5. `grep -rn "@Disabled" src/test` output, and the @Test count at BASE_COMMIT vs HEAD:
  `git grep -hE "^\s*@Test\s*$" BASE_COMMIT -- src/test | wc -l`  vs  `grep -rhE "^\s*@Test\s*$" src/test | wc -l`

## G. Verbatim code (copy exactly; do not paraphrase)
(To be populated in later phases)

## H. Runtime evidence
(To be populated in Phase 6)

## I. Acceptance checklist
| ID | Criterion | PASS/FAIL | Evidence |
|---|---|---|---|
| A1 | Fresh DB: seed users log in with password123 | PASS | `SecurityAuthenticationTests#validAdminLoginSucceeds`, `validProfessorLoginSucceeds`, `seedUserPasswordHashesMatchDefaultPassword` all pass |
| A2 | Tests never touch the dev DB (isolation test passes) | PASS | `TestDatabaseIsolationTest` passed (catalog equals `classsync_test`) |
| A3 | Generator never creates an occurrence overlapping a SCHEDULED one (room or professor) | NOT STARTED | |
| A4 | Generation conflicts are reported with type and conflicting occurrence id | NOT STARTED | |
| A5 | Reschedule never moves the original; original is RESCHEDULED; replacement is linked | NOT STARTED | |
| A6 | Regeneration after reschedule: no ghost class, no unique-constraint error | NOT STARTED | |
| A7 | Activation supersedes only the old version's SCHEDULED official rows on/after effectiveFrom; the new version then generates cleanly | NOT STARTED | |
| A8 | Cancel/reschedule of a non-SCHEDULED occurrence → 409 | NOT STARTED | |
| A9 | Past-date booking/reschedule → 400 | NOT STARTED | |
| A10 | Recommendations: complex/type/facilities are soft; other complexes rank lower; partial/none facility reasons | NOT STARTED | |
| A11 | Recommendation score of 100.0 is reachable; following-class reason works | NOT STARTED | |
| A12 | `/api/rooms/available` unchanged (19/19 Availability tests unchanged and passing) | PASS | 19/19 AvailabilityIntegrationTests passed |
| A13 | Lock failures → 409 | PASS | `GlobalExceptionHandlerTest#pessimisticLockingFailureMapsTo409` passed |
| A14 | `@EnableMethodSecurity` present | PASS | Verified in `SecurityConfig.java` |
| A15 | CORS allowed/denied (tests + curl) | NOT STARTED | |
| A16 | Session cookie is HttpOnly + SameSite=Lax (curl header) | NOT STARTED | |
| A17 | `/me` and logout work (tests + curl) | NOT STARTED | |
| A18 | `/api/users` is admin-only and has no password fields | NOT STARTED | |
| A19 | `includeInactive` is admin-only and works | NOT STARTED | |
| A20 | Docs grep for banned phrases returns nothing; test table matches surefire | NOT STARTED | |
| A21 | V1–V4 unchanged (`git diff --stat BASE_COMMIT -- src/main/resources/db/migration/V1__* V2__* V3__* V4__*` is empty) | PASS | V1–V4 untouched |
| A22 | No @Disabled; only the listed contract-change tests were rewritten | PASS | No tests disabled |

## J. Open issues and questions for the reviewer
None currently.
