# PROMPT 11H — Execution Report

## A. Run metadata
- Branch: `hardening/prompt-11h`
- BASE_COMMIT (main at start): `45e14cf`
- HEAD commit (after final push): `c733707f436f9eafe737b6c7c4e5e7834220fa63`
- Pushed to origin: yes (`To https://github.com/123HarshitVarshney321/classsync-backend.git` `d3519f2...c733707  hardening/prompt-11h -> hardening/prompt-11h`)
- java -version: `openjdk version "26.0.1" 2026-04-21`
- mvn -v: `Apache Maven 3.9.16 (2bdd9fddda4b155ebf8000e807eb73fd829a51d5)`
- mysql --version: `mysql  Ver 26.7.0 for macos26.6 on arm64 (Homebrew)`
- Agent / model: Antigravity / Gemini 2.5 Pro (Google DeepMind Advanced Agentic Coding)

## B. Commits
```text
c733707 docs(11H-P6): final execution report and verification
9962660 docs(11H-P5): align README and progress report with code
74b1848 feat(11H-P4): frontend-readiness API
7ad9c6d fix(11H-P3): recommendation soft preferences and explainability
3e3b7f9 fix(11H-P2): live-model integrity (reschedule, generation, activation)
a370ff2 fix(11H-P1): seed hashes, clock, lock-failure mapping, method security
5a03337 test(11H-P0): isolate tests in classsync_test + baseline
```

## C. Files changed
```text
 PROJECT_PROGRESS_REPORT.md                         | 444 +++++------
 README.md                                          | 261 ++++---
 docs/prompts/PROMPT_11H_HARDENING.md               | 832 +++++++++++++++++++++
 docs/reports/PROMPT_11H_REPORT.md                  | 380 ++++++++++
 .../plans/2026-10-31-prompt11h-hardening.md        | 117 +++
 src/main/java/com/classsync/config/TimeConfig.java |  23 +
 .../com/classsync/controller/AuthController.java   |  27 +
 .../classsync/controller/ComplexController.java    |  18 +-
 .../classsync/controller/FacilityController.java   |  18 +-
 .../com/classsync/controller/RoomController.java   |  26 +-
 .../controller/TimetableVersionController.java     |   9 +-
 .../com/classsync/controller/UserController.java   |  34 +
 .../com/classsync/dto/booking/BookingResponse.java |   3 +-
 .../occurrence/GenerateOccurrencesResponse.java    |   5 +-
 .../dto/occurrence/GenerationConflict.java         |  22 +
 .../dto/occurrence/GenerationConflictType.java     |   7 +
 .../dto/occurrence/ScheduleOccurrenceResponse.java |   3 +-
 .../dto/timetable/TimetableActivationResponse.java |  20 +
 .../classsync/dto/user/UserSummaryResponse.java    |  14 +
 .../com/classsync/entity/ScheduleOccurrence.java   |  12 +
 .../java/com/classsync/entity/ScheduleStatus.java  |  22 +-
 .../exception/GlobalExceptionHandler.java          |   9 +
 .../com/classsync/repository/RoomRepository.java   |   6 +
 .../repository/ScheduleOccurrenceRepository.java   |  41 +
 .../repository/TimetableVersionRepository.java     |  11 +
 .../com/classsync/repository/UserRepository.java   |  25 +-
 .../com/classsync/security/SecurityConfig.java     |  41 +
 .../java/com/classsync/service/BookingService.java |  14 +-
 .../classsync/service/ClassScheduleService.java    |  98 ++-
 .../java/com/classsync/service/ComplexService.java |   8 +-
 .../com/classsync/service/FacilityService.java     |   8 +-
 .../classsync/service/RecommendationService.java   |  63 +-
 .../java/com/classsync/service/RoomService.java    |  39 +-
 .../service/ScheduleOccurrenceService.java         | 178 ++++-
 .../classsync/service/TimetableVersionService.java |  64 +-
 .../java/com/classsync/service/UserService.java    |  34 +
 src/main/resources/application.yml                 |  12 +
 .../V5__fix_seed_user_password_hashes.sql          |   7 +
 ...non_destructive_reschedule_and_supersession.sql |  13 +
 .../com/classsync/TestDatabaseIsolationTest.java   |  28 +
 .../GenerationConcurrencyIntegrationTests.java     | 151 ++++
 .../controller/BookingIntegrationTests.java        |  21 +
 .../controller/ClassScheduleIntegrationTests.java  | 232 +++++-
 .../controller/DomainIntegrationTests.java         |  91 +++
 .../controller/RecommendationIntegrationTests.java | 215 +++++-
 .../ScheduleOccurrenceIntegrationTests.java        | 227 ++++++
 .../controller/TimetableIntegrationTests.java      | 143 +++-
 .../exception/GlobalExceptionHandlerTest.java      |  28 +
 .../security/SecurityAuthenticationTests.java      | 150 ++++
 src/test/resources/application.properties          |   6 +
 50 files changed, 3759 insertions(+), 501 deletions(-)
```

## D. Task status
| Task | Status | Evidence (files, test names) | Notes |
|---|---|---|---|
| T0.1 | DONE | `src/test/resources/application.properties` | Points `spring.datasource.url` to `classsync_test` with `createDatabaseIfNotExist=true` |
| T0.2 | DONE | `TestDatabaseIsolationTest.java` | Asserts JDBC catalog equals `classsync_test` |
| T0.3 | DONE | `mvn clean test` output in §F1 | Executed baseline on fresh `classsync_test`; captured 3 seed login failures (F1 evidence) |
| T0.4 | DONE | Commit `5a03337` | Pushed branch `hardening/prompt-11h` to origin |
| T1.1 | DONE | `V5__fix_seed_user_password_hashes.sql`, `SecurityAuthenticationTests#seedUserPasswordHashesMatchDefaultPassword` | Fixed seed BCrypt hashes to match `password123`; 3 baseline tests now pass + test 12 added |
| T1.2 | DONE | `TimeConfig.java`, `application.yml` | Clock bean with `app.timezone` and `app.clock.fixed-date` support |
| T1.3 | DONE | `GlobalExceptionHandler.java`, `GlobalExceptionHandlerTest#pessimisticLockingFailureMapsTo409` | Maps `PessimisticLockingFailureException` to 409 Conflict |
| T1.4 | DONE | `SecurityConfig.java` | Added `@EnableMethodSecurity` |
| T2.1 | DONE | `V6__non_destructive_reschedule_and_supersession.sql` | V6 migration: `RESCHEDULED`, `SUPERSEDED` statuses and `rescheduled_from_id` FK (`ON DELETE SET NULL`) |
| T2.2 | DONE | `ScheduleStatus.java`, `ScheduleOccurrence.java`, `ScheduleOccurrenceResponse.java`, `BookingResponse.java` | Model and DTOs updated with `rescheduledFrom` / `rescheduledFromId` |
| T2.3 | DONE | `ClassScheduleService.java` | Non-destructive reschedule: original marked `RESCHEDULED`, replacement linked, lock order O $\rightarrow$ U $\rightarrow$ R |
| T2.4 | DONE | `BookingService.java` | Past-date guard for bookings via injected `Clock` |
| T2.5 | DONE | `ScheduleOccurrenceService.java`, `GenerateOccurrencesResponse.java`, `GenerationConflict.java` | Generator locks V $\rightarrow$ U $\rightarrow$ R, single-query conflict detection, detailed conflict report |
| T2.6 | DONE | `TimetableVersionService.java`, `TimetableActivationResponse.java` | Version activation locking, superseding future official rows, `effectiveFrom` parameter |
| T2.7 | DONE | `ClassScheduleIntegrationTests`, `BookingIntegrationTests`, `ScheduleOccurrenceIntegrationTests`, `TimetableIntegrationTests`, `GenerationConcurrencyIntegrationTests` | All tests passing including N1–N18 |
| T3.1 | DONE | `RecommendationService.java` | Hard vs soft constraints: candidates fetched without soft filters |
| T3.2 | DONE | `RecommendationService.java`, `ScheduleOccurrenceRepository.java` | Exact reason strings, directional continuity, 1.0 default location fit |
| T3.3 | DONE | `RecommendationIntegrationTests.java` | Rewritten contract tests 7, 8, 15 and added N19–N22 |
| T4.1 | DONE | `SecurityConfig.java`, `application.yml`, `SecurityAuthenticationTests` | CORS configuration, exact origins allowlist, preflight tests 200/403 |
| T4.2 | DONE | `application.yml`, `AuthController.java`, `SecurityAuthenticationTests` | Session cookie flags (HttpOnly, SameSite=Lax) & session fixation protection (`request.changeSessionId()`) |
| T4.3 | DONE | `AuthController.java`, `SecurityConfig.java`, `SecurityAuthenticationTests` | `/api/auth/me` returns `LoginResponse`, POST-only `/api/auth/logout` returns 204 |
| T4.4 | DONE | `UserController.java`, `UserService.java`, `UserRepository.java`, `UserSummaryResponse.java` | Admin-only `GET /api/users` with role/status filters, no passwords |
| T4.5 | DONE | `ComplexController.java`, `RoomController.java`, `FacilityController.java`, `DomainIntegrationTests` | Admin-only `includeInactive` parameter, 403 for professors |
| T5 (docs) | DONE | `README.md`, `PROJECT_PROGRESS_REPORT.md` | Aligned docs with code; eliminated all unverified claims and banned phrases |
| T6.1 | DONE | Fresh DB run | `DROP DATABASE classsync_test; mvn clean test` $\rightarrow$ 216 tests run, 0 failures, 0 errors, 0 skipped |
| T6.2 | DONE | `classsync_upgrade_check` | Copied dev DB `classsync` (v4), ran packaged JAR with Flyway; V5 and V6 applied successfully to v6 |
| T6.3 | DONE | Runtime smoke test on port 8081 | All 7 curl commands executed and verified with headers |
| T6.4 | DONE | Final push and report | Pushed `hardening/prompt-11h` to origin |

## E. Deviations
- Tests 10 and 11 in `ClassScheduleIntegrationTests` originally asserted `jsonPath("$.id", is(occ.getId()))`. Under the non-destructive rescheduling contract (F5), rescheduling creates and returns a linked replacement row (with its own newly generated ID) while keeping the original row intact with status `RESCHEDULED`. These two assertions were updated to `jsonPath("$.id").isNumber()` and `jsonPath("$.rescheduledFromId", is(occ.getId()))`, matching the exact semantics of non-destructive rescheduling.

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

- F2. Final (Phase 6, fresh DB):
```text
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.011 s -- in com.classsync.ClassSyncApplicationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.004 s -- in com.classsync.TestDatabaseIsolationTest
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.265 s -- in com.classsync.concurrency.GenerationConcurrencyIntegrationTests
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.192 s -- in com.classsync.controller.AvailabilityIntegrationTests
Tests run: 26, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.231 s -- in com.classsync.controller.BookingIntegrationTests
Tests run: 37, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.553 s -- in com.classsync.controller.ClassScheduleIntegrationTests
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.166 s -- in com.classsync.controller.DomainIntegrationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.180 s -- in com.classsync.controller.HealthControllerTest
Tests run: 36, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.416 s -- in com.classsync.controller.RecommendationIntegrationTests
Tests run: 27, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.441 s -- in com.classsync.controller.ScheduleOccurrenceIntegrationTests
Tests run: 23, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.604 s -- in com.classsync.controller.TimetableIntegrationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.001 s -- in com.classsync.exception.GlobalExceptionHandlerTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.926 s -- in com.classsync.repository.RepositoryIntegrationTests
Tests run: 21, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.381 s -- in com.classsync.security.SecurityAuthenticationTests

Total Tests Run: 216, Failures: 0, Errors: 0, Skipped: 0
Build Status: BUILD SUCCESS
```

- F3. Changed existing tests:
  | Class | Old name | New name | Old expectation | New expectation | Contract change |
  |---|---|---|---|---|---|
  | `ClassScheduleIntegrationTests` | 24. Rescheduling preserves occurrence ID | 24. Rescheduling creates a linked replacement and keeps the original row | Returned id == original id | Returned id != original id, rescheduledFromId == original id, original is RESCHEDULED | F5 non-destructive rescheduling |
  | `ClassScheduleIntegrationTests` | 27. Rescheduling preserves timetableEntry relationship | 27. Original keeps its timetable entry; replacement has none | Modified occurrence preserves entry | Original keeps entry with RESCHEDULED; replacement has null entry and rescheduledFrom = original | F5 non-destructive rescheduling |
  | `ClassScheduleIntegrationTests` | 29. Rescheduling updates date/time/room correctly | 29. Rescheduling updates date/time/room correctly | Original row modified to new slot | Replacement row has new slot; original row keeps old slot and status RESCHEDULED | F5 non-destructive rescheduling |
  | `ClassScheduleIntegrationTests` | 30. Concurrent rescheduling of the same occurrence does not cause lost updates | 30. Concurrent rescheduling of the same occurrence does not cause lost updates | Both succeed sequentially mutating same row | Exactly 1 success (new replacement created) and 1 conflict (DuplicateResourceException); original is RESCHEDULED | F5 non-destructive rescheduling |
  | `ClassScheduleIntegrationTests` | 10. Professor reschedules own occurrence -> 200 | 10. Professor reschedules own occurrence -> 200 | Returned id == original id | Returned id isNumber(), rescheduledFromId == original id | F5 non-destructive rescheduling |
  | `ClassScheduleIntegrationTests` | 11. Admin reschedules another professor's occurrence -> 200 | 11. Admin reschedules another professor's occurrence -> 200 | Returned id == original id | Returned id isNumber(), rescheduledFromId == original id | F5 non-destructive rescheduling |
  | `RecommendationIntegrationTests` | 7. Room type filtering as hard constraint | 7. Room type is a soft preference | Hard filter on roomType (non-LAB excluded) | Soft preference: LAB ranks first, non-LAB present with diff reason and lower score | F6 soft preference engine |
  | `RecommendationIntegrationTests` | 8. Required facilities use AND semantics | 8. Facilities are a soft preference | Hard filter (SEC-101 excluded) | Soft preference: SEC-301 full match, SEC-101 partial match (1 of 3) present with lower score | F6 soft preference engine |
  | `RecommendationIntegrationTests` | 15. Requested complex receives appropriate location score | 15. Other complexes are included but rank below the requested complex | Only complex 1 rooms returned | Complex 2 rooms included with different complex reason and rank below complex 1 | F6 soft preference engine |

- F4. New tests:
  | ID | Class | Method name | What it proves (finding) |
  |---|---|---|---|
  | T1.1 | `SecurityAuthenticationTests` | `seedUserPasswordHashesMatchDefaultPassword` | Seed user hashes in V5 match 'password123' (F1) |
  | T1.3 | `GlobalExceptionHandlerTest` | `pessimisticLockingFailureMapsTo409` | PessimisticLockingFailureException maps to 409 Conflict (F7) |
  | N1 | `ClassScheduleIntegrationTests` | `cancellingRescheduledOriginalReturns409` | Cancelling a RESCHEDULED original -> 409 (F5) |
  | N2 | `ClassScheduleIntegrationTests` | `reschedulingRescheduledOriginalReturns409` | Rescheduling a RESCHEDULED original -> 409 (F5) |
  | N3 | `ClassScheduleIntegrationTests` | `reschedulingReplacementCreatesSecondReplacement` | Multi-hop reschedule links replacements and updates status (F5) |
  | N4 | `ClassScheduleIntegrationTests` | `identicalTargetSlotReturns400` | Identical target slot returns 400 Bad Request (F5) |
  | N5 | `ClassScheduleIntegrationTests` | `targetBeforeFixedClockReturns400` | Reschedule target before fixed clock -> 400 (F8) |
  | N6 | `BookingIntegrationTests` | `bookingBeforeFixedClockReturns400` | Booking date before fixed clock -> 400 (F8) |
  | N7 | `ScheduleOccurrenceIntegrationTests` | `ghostClassRegressionRescheduleAndRegenerate` | Rescheduling vacates slot; regeneration never recreates moved class (F5) |
  | N8 | `ScheduleOccurrenceIntegrationTests` | `rescheduleBeforeNextWeekGenerationSucceeds` | Rescheduling across week boundary before next week generation produces no error (F5) |
  | N9 | `ScheduleOccurrenceIntegrationTests` | `rescheduleToAlreadyGeneratedDateSucceeds` | Rescheduling to already generated date succeeds with 200 (no UK violation) (F5) |
  | N10 | `ScheduleOccurrenceIntegrationTests` | `extraBookingTriggersRoomBusyConflictOnGeneration` | Extra booking causes generator to skip and report ROOM_BUSY conflict (F3) |
  | N11 | `ScheduleOccurrenceIntegrationTests` | `professorBusyTriggersProfessorBusyConflict` | Professor booked elsewhere causes generator to report PROFESSOR_BUSY conflict (F3) |
  | N12 | `ScheduleOccurrenceIntegrationTests` | `cancellingExtraAllowsGapFilling` | Cancelling conflicting EXTRA allows idempotent gap-filling on regeneration (F3) |
  | N13 | `ScheduleOccurrenceIntegrationTests` | `inactiveRoomReportsRoomInactiveConflict` | Inactive room reports ROOM_INACTIVE conflict, occurrence not created (F3) |
  | N14 | `TimetableIntegrationTests` | `activationBulkSupersedesFutureOccurrences` | Activation bulk-supersedes future official rows while keeping past and EXTRA rows intact (F4) |
  | N15 | `TimetableIntegrationTests` | `generatingNewVersionAfterSupersessionHasNoConflicts` | Generating new version after supersession has no conflicts (F4) |
  | N16 | `TimetableIntegrationTests` | `activationWithPastEffectiveFromReturns400` | Activation with effectiveFrom before today returns 400 (F4) |
  | N17 | `TimetableIntegrationTests` | `activationWithoutEffectiveFromDefaultsToFixedClock` | Activation without effectiveFrom defaults to today (fixed clock) (F4) |
  | N18 | `GenerationConcurrencyIntegrationTests` | `concurrentGenerationAndBookingNeverProduceOverlappingScheduledRows` | Concurrent generation and booking serialize with no overlapping SCHEDULED rows (F3/F7) |
  | N19 | `RecommendationIntegrationTests` | `unknownOrInactiveComplexIdReturns400` | Unknown or inactive complexId returns 400 Bad Request (F6) |
  | N20 | `RecommendationIntegrationTests` | `perfectMatchContinuityReaches100` | Perfect match with preceding continuity scores exactly 100.0, admin scores 90.0 (F6) |
  | N21 | `RecommendationIntegrationTests` | `followingClassContinuityReasonAppears` | Following-class continuity reason appears for class starting at endTime (F6) |
  | N22 | `RecommendationIntegrationTests` | `roomWithNoneOfRequestedFacilitiesHasExplicitReason` | Room with none of requested facilities receives explicit none reason (F6) |
  | T4.1a | `SecurityAuthenticationTests` | `preflightFromAllowedOriginSucceeds` | Preflight OPTIONS from allowed origin returns 200 with CORS headers (F8) |
  | T4.1b | `SecurityAuthenticationTests` | `preflightFromUnauthorizedOriginReturns403` | Preflight OPTIONS from unauthorized origin returns 403 Forbidden (F8) |
  | T4.2 | `SecurityAuthenticationTests` | `sessionFixationProtectionChangesSessionId` | Session ID changes upon successful login (F8) |
  | T4.3a | `SecurityAuthenticationTests` | `authenticatedUserCanFetchProfileViaMe` | GET /api/auth/me returns authenticated user profile (F8) |
  | T4.3b | `SecurityAuthenticationTests` | `logoutInvalidatesSessionAndReturns204` | POST /api/auth/logout invalidates session and returns 204 No Content (F8) |
  | T4.3c | `SecurityAuthenticationTests` | `unauthenticatedRequestToMeReturns401` | Unauthenticated GET /api/auth/me returns 401 Unauthorized (F8) |
  | T4.4a | `SecurityAuthenticationTests` | `adminCanFilterUsersByRoleWithoutPasswordFields` | Admin can filter users by role; response contains no password fields (F8) |
  | T4.4b | `SecurityAuthenticationTests` | `professorCannotListUsers` | Professor receives 403 Forbidden on GET /api/users (F8) |
  | T4.4c | `SecurityAuthenticationTests` | `unauthenticatedUserCannotListUsers` | Unauthenticated request to GET /api/users returns 401 Unauthorized (F8) |
  | T4.5a | `DomainIntegrationTests` | `adminCanViewInactiveEntitiesWithFlag` | Admin sees inactive complex, room, and facility with includeInactive=true (F8) |
  | T4.5b | `DomainIntegrationTests` | `professorCannotUseIncludeInactiveFlag` | Professor receives 403 Forbidden when using includeInactive=true (F8) |

- F5. `@Disabled` grep output and @Test counts at BASE_COMMIT vs HEAD:
  `grep -rn "@Disabled" src/test || echo "no @Disabled"` $\rightarrow$ `no @Disabled`
  `@Test` count at BASE_COMMIT: **180**
  `@Test` count at HEAD: **216**

## G. Verbatim code (copy exactly; do not paraphrase)

### 1. Injected Clock Configuration (`TimeConfig.java`)
```java
package com.classsync.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

@Configuration
public class TimeConfig {

    @Bean
    public Clock clock(
            @Value("${app.timezone:Asia/Kolkata}") String timezone,
            @Value("${app.clock.fixed-date:}") String fixedDate) {
        ZoneId zoneId = ZoneId.of(timezone);
        if (fixedDate != null && !fixedDate.isBlank()) {
            LocalDate localDate = LocalDate.parse(fixedDate.trim());
            return Clock.fixed(localDate.atStartOfDay(zoneId).toInstant(), zoneId);
        }
        return Clock.system(zoneId);
    }
}
```

### 2. Lock Failure Mapping (`GlobalExceptionHandler.java`)
```java
    @ExceptionHandler(org.springframework.dao.PessimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handlePessimisticLockingFailure(
            org.springframework.dao.PessimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "status", 409,
                        "error", "Conflict",
                        "message", "Resource is currently locked by another transaction, please retry"
                ));
    }
```

### 3. Non-Destructive Reschedule Implementation (`ClassScheduleService.java`)
```java
        // Non-destructive update: mark original as RESCHEDULED
        original.setStatus(ScheduleStatus.RESCHEDULED);
        scheduleOccurrenceRepository.save(original);

        // Insert replacement row
        ScheduleOccurrence replacement = new ScheduleOccurrence(
                null, // timetableEntry is null for reschedule replacement
                targetRoom,
                original.getProfessor(),
                original.getCourseCode(),
                original.getCourseName(),
                original.getEventType(),
                targetDate,
                targetStartTime,
                targetEndTime,
                ScheduleStatus.SCHEDULED,
                user
        );
        replacement.setRescheduledFrom(original);
        ScheduleOccurrence savedReplacement = scheduleOccurrenceRepository.save(replacement);

        return toOccurrenceResponse(savedReplacement);
```

### 4. Bulk Timetable Supersession Query (`ScheduleOccurrenceRepository.java`)
```java
    @org.springframework.data.jpa.repository.Modifying(flushAutomatically = true)
    @Query("""
        UPDATE ScheduleOccurrence o
        SET o.status = com.classsync.entity.ScheduleStatus.SUPERSEDED
        WHERE o.status = com.classsync.entity.ScheduleStatus.SCHEDULED
          AND o.scheduleDate >= :effectiveFrom
          AND o.timetableEntry.id IN (SELECT e.id FROM TimetableEntry e WHERE e.timetableVersion.id = :versionId)
    """)
    int supersedeFutureOccurrencesOfVersion(@Param("versionId") Integer versionId,
                                            @Param("effectiveFrom") LocalDate effectiveFrom);
```

### 5. Single-Query Generation Conflict Detection (`ScheduleOccurrenceRepository.java`)
```java
    @Query("""
        SELECT o FROM ScheduleOccurrence o
        WHERE o.status = com.classsync.entity.ScheduleStatus.SCHEDULED
          AND o.scheduleDate BETWEEN :startDate AND :endDate
          AND (o.room.id IN :roomIds OR o.professor.id IN :professorIds)
    """)
    List<ScheduleOccurrence> findScheduledInWindowForRoomsOrProfessors(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("roomIds") Collection<Integer> roomIds,
            @Param("professorIds") Collection<Integer> professorIds
    );
```

### 6. Directional Continuity Query (`ScheduleOccurrenceRepository.java`)
```java
    @Query("""
        SELECT o FROM ScheduleOccurrence o
        WHERE o.professor.id = :professorId
          AND o.scheduleDate = :date
          AND o.status = com.classsync.entity.ScheduleStatus.SCHEDULED
          AND (o.endTime = :startTime OR o.startTime = :endTime)
    """)
    List<ScheduleOccurrence> findAdjacentOccurrencesForProfessor(
            @Param("professorId") Integer professorId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
```

### 7. LocationFit Default (`RecommendationService.java`)
```java
        // 2. LocationFit (Weight: 25%)
        double locationFit;
        if (complexId == null) {
            locationFit = 1.0;
        } else if (room.getComplex().getId().equals(complexId)) {
            locationFit = 1.0;
            reasons.add("Room is in the requested complex");
        } else {
            locationFit = 0.0;
            reasons.add("Room is in a different complex than requested");
        }
```

### 8. CORS & Logout Configuration (`SecurityConfig.java`)
```java
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}") String allowedOriginsStr) {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOriginsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Accept", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    // In securityFilterChain:
    http
            .cors(Customizer.withDefaults())
            .logout(logout -> logout
                    .logoutRequestMatcher(new AntPathRequestMatcher("/api/auth/logout", "POST"))
                    .invalidateHttpSession(true)
                    .clearAuthentication(true)
                    .deleteCookies("JSESSIONID")
                    .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT))
            )
```

## H. Runtime evidence

### Flyway Migration on `classsync_upgrade_check`
```text
2026-10-31T18:57:47.472+05:30  INFO 63357 --- [classsync-backend] [           main] org.flywaydb.core.FlywayExecutor         : Database: jdbc:mysql://localhost:3306/classsync_upgrade_check?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC (MySQL 26.7)
2026-10-31T18:57:47.508+05:30  INFO 63357 --- [classsync-backend] [           main] o.f.core.internal.command.DbValidate     : Successfully validated 6 migrations (execution time 00:00.016s)
2026-10-31T18:57:47.517+05:30  INFO 63357 --- [classsync-backend] [           main] o.f.core.internal.command.DbMigrate      : Current version of schema `classsync_upgrade_check`: 4
2026-10-31T18:57:47.527+05:30  INFO 63357 --- [classsync-backend] [           main] o.f.core.internal.command.DbMigrate      : Migrating schema `classsync_upgrade_check` to version "5 - fix seed user password hashes"
2026-10-31T18:57:47.550+05:30  INFO 63357 --- [classsync-backend] [           main] o.f.core.internal.command.DbMigrate      : Migrating schema `classsync_upgrade_check` to version "6 - non destructive reschedule and supersession"
2026-10-31T18:57:47.624+05:30  INFO 63357 --- [classsync-backend] [           main] o.f.core.internal.command.DbMigrate      : Successfully applied 2 migrations to schema `classsync_upgrade_check`, now at version v6 (execution time 00:00.067s)

+----------------+---------+-----------------------------------------------+---------+
| installed_rank | version | description                                   | success |
+----------------+---------+-----------------------------------------------+---------+
|              1 | 1       | create initial schema                         |       1 |
|              2 | 2       | seed development data                         |       1 |
|              3 | 3       | add active to facilities                      |       1 |
|              4 | 4       | add unique entry date to schedule occurrences |       1 |
|              5 | 5       | fix seed user password hashes                 |       1 |
|              6 | 6       | non destructive reschedule and supersession   |       1 |
+----------------+---------+-----------------------------------------------+---------+
```

### Runtime Smoke Test (T6.3 Raw Output)

#### 1. Login with Admin Credentials
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json
{"email":"admin@classsync.edu","password":"password123"}

HTTP/1.1 200 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Set-Cookie: JSESSIONID=E3D0A9D097D17E810BEFC15A2B5F17BA; Path=/; HttpOnly; SameSite=Lax
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
Content-Type: application/json
Transfer-Encoding: chunked
Date: Sat, 31 Oct 2026 13:28:06 GMT

{"id":1,"name":"System Administrator","email":"admin@classsync.edu","role":"ADMIN"}
```

#### 2. Get Profile (`/api/auth/me`)
```http
GET /api/auth/me HTTP/1.1
Cookie: JSESSIONID=E3D0A9D097D17E810BEFC15A2B5F17BA

HTTP/1.1 200 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
Content-Type: application/json
Transfer-Encoding: chunked
Date: Sat, 31 Oct 2026 13:28:11 GMT

{"id":1,"name":"System Administrator","email":"admin@classsync.edu","role":"ADMIN"}
```

#### 3. Allowed Origin Preflight OPTIONS Request
```http
OPTIONS /api/rooms/available HTTP/1.1
Origin: http://localhost:5173
Access-Control-Request-Method: GET

HTTP/1.1 200 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
Content-Length: 0
Date: Sat, 31 Oct 2026 13:28:16 GMT
```

#### 4. Disallowed Origin Preflight OPTIONS Request
```http
OPTIONS /api/rooms/available HTTP/1.1
Origin: http://evil.example
Access-Control-Request-Method: GET

HTTP/1.1 403 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
Transfer-Encoding: chunked
Date: Sat, 31 Oct 2026 13:28:20 GMT

Invalid CORS request
```

#### 5. Admin Filter Users List (`GET /api/users?role=PROFESSOR`)
```http
GET /api/users?role=PROFESSOR HTTP/1.1
Cookie: JSESSIONID=E3D0A9D097D17E810BEFC15A2B5F17BA

[{"id":3,"name":"Dr. Ada Lovelace","email":"alovelace@classsync.edu","employeeCode":"EMP-PRF-002","role":"PROFESSOR","status":"ACTIVE"},{"id":2,"name":"Dr. Alan Turing","email":"aturing@classsync.edu","employeeCode":"EMP-PRF-001","role":"PROFESSOR","status":"ACTIVE"}]
```

#### 6. Logout (`POST /api/auth/logout`)
```http
POST /api/auth/logout HTTP/1.1
Cookie: JSESSIONID=E3D0A9D097D17E810BEFC15A2B5F17BA

HTTP/1.1 204 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Set-Cookie: JSESSIONID=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:10 GMT; Path=/; SameSite=Lax
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
Date: Sat, 31 Oct 2026 13:28:28 GMT
```

#### 7. Profile Inspection After Logout (`GET /api/auth/me`)
```http
GET /api/auth/me HTTP/1.1
Cookie: JSESSIONID=E3D0A9D097D17E810BEFC15A2B5F17BA

HTTP/1.1 401 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Set-Cookie: JSESSIONID=5C471B3620E4A280E288E75A4355D18D; Path=/; HttpOnly; SameSite=Lax
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
Content-Type: application/json
Content-Length: 105
Date: Sat, 31 Oct 2026 13:28:35 GMT

{"message":"Full authentication is required to access this resource","error":"Unauthorized","status":401}
```

## I. Acceptance checklist
| ID | Criterion | PASS/FAIL | Evidence |
|---|---|---|---|
| A1 | Fresh DB: seed users log in with password123 | PASS | `SecurityAuthenticationTests#validAdminLoginSucceeds`, `validProfessorLoginSucceeds`, `seedUserPasswordHashesMatchDefaultPassword` all pass |
| A2 | Tests never touch the dev DB (isolation test passes) | PASS | `TestDatabaseIsolationTest` passed (catalog equals `classsync_test`) |
| A3 | Generator never creates an occurrence overlapping a SCHEDULED one (room or professor) | PASS | `ScheduleOccurrenceIntegrationTests#extraBookingTriggersRoomBusyConflictOnGeneration`, `professorBusyTriggersProfessorBusyConflict`, `GenerationConcurrencyIntegrationTests` pass |
| A4 | Generation conflicts are reported with type and conflicting occurrence id | PASS | `ScheduleOccurrenceIntegrationTests#extraBookingTriggersRoomBusyConflictOnGeneration` asserts type `ROOM_BUSY` and conflicting occurrence ID |
| A5 | Reschedule never moves the original; original is RESCHEDULED; replacement is linked | PASS | `ClassScheduleIntegrationTests#reschedulingCreatesLinkedReplacementAndKeepsOriginalRow`, `reschedulingReplacementCreatesSecondReplacement` pass |
| A6 | Regeneration after reschedule: no ghost class, no unique-constraint error | PASS | `ScheduleOccurrenceIntegrationTests#ghostClassRegressionRescheduleAndRegenerate`, `rescheduleToAlreadyGeneratedDateSucceeds` pass |
| A7 | Activation supersedes only the old version's SCHEDULED official rows on/after effectiveFrom; the new version then generates cleanly | PASS | `TimetableIntegrationTests#activationBulkSupersedesFutureOccurrences`, `generatingNewVersionAfterSupersessionHasNoConflicts` pass |
| A8 | Cancel/reschedule of a non-SCHEDULED occurrence $\rightarrow$ 409 | PASS | `ClassScheduleIntegrationTests#cancellingRescheduledOriginalReturns409`, `reschedulingRescheduledOriginalReturns409` pass |
| A9 | Past-date booking/reschedule $\rightarrow$ 400 | PASS | `BookingIntegrationTests#bookingBeforeFixedClockReturns400`, `ClassScheduleIntegrationTests#targetBeforeFixedClockReturns400`, `TimetableIntegrationTests#activationWithPastEffectiveFromReturns400` pass |
| A10 | Recommendations: complex/type/facilities are soft; other complexes rank lower; partial/none facility reasons | PASS | `RecommendationIntegrationTests#roomTypeIsSoftPreference`, `facilitiesAreSoftPreference`, `otherComplexesIncludedRankBelowRequestedComplex`, `roomWithNoneOfRequestedFacilitiesHasExplicitReason` pass |
| A11 | Recommendation score of 100.0 is reachable; following-class reason works | PASS | `RecommendationIntegrationTests#perfectMatchContinuityReaches100`, `followingClassContinuityReasonAppears` pass |
| A12 | `/api/rooms/available` unchanged (19/19 Availability tests unchanged and passing) | PASS | 19/19 `AvailabilityIntegrationTests` passed |
| A13 | Lock failures $\rightarrow$ 409 | PASS | `GlobalExceptionHandlerTest#pessimisticLockingFailureMapsTo409` passed |
| A14 | `@EnableMethodSecurity` present | PASS | Verified in `SecurityConfig.java` |
| A15 | CORS allowed/denied (tests + curl) | PASS | `SecurityAuthenticationTests#preflightFromAllowedOriginSucceeds` (200) and `preflightFromUnauthorizedOriginReturns403` (403); curl verified in §H |
| A16 | Session cookie is HttpOnly + SameSite=Lax (curl header) | PASS | Verified in curl response header: `Set-Cookie: ... HttpOnly; SameSite=Lax` |
| A17 | `/me` and logout work (tests + curl) | PASS | `SecurityAuthenticationTests` tests 16, 17, 18 pass; curl verified in §H |
| A18 | `/api/users` is admin-only and has no password fields | PASS | `SecurityAuthenticationTests#adminCanFilterUsersByRoleWithoutPasswordFields`, `professorCannotListUsers` pass; curl verified in §H |
| A19 | `includeInactive` is admin-only and works | PASS | `DomainIntegrationTests#adminCanViewInactiveEntitiesWithFlag`, `professorCannotUseIncludeInactiveFlag` pass |
| A20 | Docs grep for banned phrases returns nothing; test table matches surefire | PASS | Verified `grep -n -i "mathematically impossible\|under 50ms\|millisecond-level\|production-grade\|AuthIntegrationTests"` returns 0 matches; test table matches 216 surefire results |
| A21 | V1–V4 unchanged (`git diff --stat BASE_COMMIT -- src/main/resources/db/migration/V1__* V2__* V3__* V4__*` is empty) | PASS | `git diff --stat 45e14cf -- src/main/resources/db/migration/V1* V2* V3* V4*` returns 0 changes |
| A22 | No @Disabled; only the listed contract-change tests were rewritten | PASS | `no @Disabled` verified; only contract tests 24, 27, 29, 30 and 10, 11 in ClassSchedule and 7, 8, 15 in Recommendation were rewritten |

## J. Open issues and questions for the reviewer
None. All 9 findings (F1 through F9) across all phases are 100% resolved, verified, and backed by automated integration tests and runtime curl evidence.
