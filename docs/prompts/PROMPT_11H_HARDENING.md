# PROMPT 11H — ClassSync Integrity & Hardening Pass

> **How to run (for the human):** save this file in the repo as `docs/prompts/PROMPT_11H_HARDENING.md`, then tell the agent:
> *"Read docs/prompts/PROMPT_11H_HARDENING.md and execute it exactly, phase by phase."*
> Pasting the whole file into the agent also works.

---

## 0. Your role and the ground rules

You are working in the existing **ClassSync backend** repository: Java 21, Spring Boot 3.4.3, Spring Security 6, Spring Data JPA / Hibernate 6, MySQL 8 (InnoDB), Flyway, JUnit 5 + MockMvc. Milestones 1–11 are complete and documented in `README.md` and `PROJECT_PROGRESS_REPORT.md`.

**Before changing anything**, read: both markdown files above, every class under `src/main/java/com/classsync`, the four Flyway migrations, and every test class.

This prompt is a **hardening pass**. It fixes integrity bugs found by an external code review and prepares the API for the React frontend.

It is **not** Milestone 12, 13 or 14. Do **not** add any of the following:
- Redis
- notifications
- audit logging
- analytics
- any frontend code

### Ground rules (non-negotiable)

1. **Never edit V1–V4 migrations.** Every schema change goes into a new Flyway migration (V5, V6). Editing an applied migration breaks Flyway checksum validation on every existing database.
2. **Keep the existing architecture and style.**
   - Controller → Service → Repository.
   - Java records for DTOs.
   - The existing exception classes.
   - The existing `GlobalExceptionHandler` JSON shape (`status`, `error`, `message`).
   - No new dependencies: no Lombok, Testcontainers, Redis, etc.
3. **Do not delete, `@Disabled`, or weaken tests to make the build pass.**
   - The only existing tests whose expectations you may change are the ones marked **CONTRACT CHANGE** in this prompt.
   - If any other existing test fails, the bug is in your change. Fix the code, not the test.
4. **Work on a branch.** Commit at the end of every phase and push the branch. **Never merge into `main`.**
5. **Back every claim in your report with raw command output or verbatim code.**
   - Never write "all tests pass" without pasting Maven's summary.
   - If something fails, report it honestly.
6. **If you are blocked, stop and ask the user.** Examples: MySQL credentials, uncommitted local changes, a command needing approval. Do not guess passwords or silently skip steps.
7. **If you run out of time or context**, stop at a phase boundary with a green build. Then:
   - update the report (remaining tasks marked NOT STARTED),
   - commit and push,
   - print the report.
8. **Do not modify this prompt file.**

---

## 1. Why: the review findings

| ID | Finding |
|---|---|
| F1 | The BCrypt hash seeded in `V2__seed_development_data.sql` does not verify against `password123`. On any **fresh** database, the seed users cannot log in and the login tests fail. Local databases where login works must have had their rows changed by hand. |
| F2 | Tests use the same `classsync` database as the app; there is no test configuration. `BookingIntegrationTests` and `ClassScheduleIntegrationTests` call `scheduleOccurrenceRepository.deleteAll()` after every test. This wipes every occurrence in the developer's database. |
| F3 | `generateOccurrences` only de-duplicates on `(timetable_entry_id, schedule_date)`. It never checks whether the room or the professor is already taken. It can therefore create overlapping SCHEDULED occurrences, for example over an EXTRA booking made on a not-yet-generated date, or over an older timetable version's occurrences. |
| F4 | Activating a new timetable version only flips statuses. The old version's future occurrences stay SCHEDULED, so generating the new version over the same dates double-books rooms. The project abstract promised "versioning without losing valid bookings" and "conflicts reported to the administrator". |
| F5 | Rescheduling edits the occurrence row in place. The generator's idempotency key is `(timetable_entry_id, schedule_date)`, so after a reschedule, regeneration does one of three wrong things: (a) re-creates the moved class on its original date (a ghost class); (b) skips a real week, if a class was moved onto that week's key; (c) fails with a unique-constraint error. In-place edits also destroy the record of where the class originally was. |
| F6 | `RecommendationService` takes its candidates from `AvailabilityService`, which already hard-filters by complex, room type and all requested facilities. So LocationFit and PreferenceFit are identical for every candidate. Consequences: the "5-factor" model behaves like 3 factors plus a constant; the maximum score without a complex is 87.5; the "different complex" and "partially matches" branches are dead code. Separately, the continuity reason always says "preceding", even for a following class. |
| F7 | Lock failures (`PessimisticLockingFailureException`, deadlock victims, lock timeouts) are unmapped, so they surface as HTTP 500. `@PreAuthorize` on `RecommendationController` has no effect because `@EnableMethodSecurity` is missing. |
| F8 | Frontend blockers: (a) no CORS configuration; (b) no `GET /api/auth/me`; (c) no JSON logout (Spring's default `/logout` redirects); (d) no way to list professors, which the admin's timetable-entry form needs; (e) admins cannot list inactive complexes, rooms or facilities to reactivate them; (f) bookings and reschedules accept past dates. |
| F9 | The docs overclaim. (a) "Total database roundtrips: 2 … under 50ms" is wrong: inserts are one statement per row, because `GenerationType.IDENTITY` disables Hibernate batch inserts. (b) "Deadlocks are mathematically impossible" is wrong: the generator was outside the lock order. (c) "Millisecond-level" and "production-grade" are unsupported. (d) The test table names a non-existent `AuthIntegrationTests` class. |

---

## 2. Phase overview

| Phase | Tasks | Commit message |
|---|---|---|
| 0 | Branch, plan file, report skeleton, test-database isolation, baseline run | `test(11H-P0): isolate tests in classsync_test + baseline` |
| 1 | V5 seed-hash fix, Clock bean, lock-failure 409, method security | `fix(11H-P1): seed hashes, clock, lock-failure mapping, method security` |
| 2 | V6, non-destructive reschedule, generator conflict detection and locking, version supersession, past-date guards | `fix(11H-P2): live-model integrity (reschedule, generation, activation)` |
| 3 | Recommendation hard/soft constraint fix | `fix(11H-P3): recommendation soft preferences and explainability` |
| 4 | CORS, session cookie, `/me`, logout, users list, `includeInactive` | `feat(11H-P4): frontend-readiness API` |
| 5 | Documentation truthfulness | `docs(11H-P5): align README and progress report with code` |
| 6 | Fresh-database full run, upgrade-path check, runtime smoke test, final report, push | `docs(11H-P6): final verification report` |

At the end of **every** phase:
1. Run `mvn clean test`. It must be green. The only exception is Phase 0 (see T0.4).
2. Update `docs/reports/PROMPT_11H_REPORT.md`.
3. Commit, including the report.
4. `git push`.

Always run the full suite before committing, not individual tests.

---

## 3. Phase 0: Setup, isolation, baseline

### T0.1 Branch and environment

```bash
git status                      # if there are uncommitted changes: STOP and ask the user
git checkout main && git pull
git checkout -b hardening/prompt-11h
git rev-parse HEAD              # record this as BASE_COMMIT
java -version; mvn -v; mysql --version
```

For MySQL, use the same credentials the app uses: `DB_USERNAME` (default `root`) and `DB_PASSWORD` (default empty). Add `-p` to `mysql` commands if the user has a password. If access is denied, ask the user.

### T0.2 Plan file and report skeleton

1. Write your implementation plan to `docs/superpowers/plans/<today's date>-prompt11h-hardening.md`, in the same style as the existing prompt 9 and prompt 10 plans.
2. Create `docs/reports/PROMPT_11H_REPORT.md` from the template in section 10, with every task marked NOT STARTED.
3. Update the report at the end of every phase.

### T0.3 Isolate the test database (fixes F2)

**Step 1.** Create `src/test/resources/application.properties`:

```properties
# Test-only overrides. Spring Boot loads this file TOGETHER with src/main/resources/application.yml;
# at the same location .properties wins over .yml, so only the keys below change.
# Tests can never touch the developer database, even if DB_URL is set in the environment.
spring.datasource.url=${TEST_DB_URL:jdbc:mysql://localhost:3306/classsync_test?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}
# Fixed "today" for tests (consumed by T1.2), so hard-coded 2026 test dates never become "past".
app.clock.fixed-date=2026-10-01
```

**Step 2.** Add `src/test/java/com/classsync/TestDatabaseIsolationTest.java` (`@SpringBootTest`). It asserts that `dataSource.getConnection().getCatalog()` equals `classsync_test`.

**Fallback.** If Spring Boot does not merge the two configuration files as described, do this instead and record it as a deviation:
- use `src/test/resources/application-test.yml`,
- add `@ActiveProfiles("test")` to every `@SpringBootTest` class.

The isolation test must pass either way.

### T0.4 Baseline on a fresh test database (do NOT fix anything in this step)

```bash
mysql -u root -e "DROP DATABASE IF EXISTS classsync_test;"   # recreated automatically on first connect
mvn clean test
grep -h "Tests run" target/surefire-reports/*.txt
```

**Expected:** the `SecurityAuthenticationTests` tests that log in with `password123` against seed users fail. This is finding F1.

Record every failing test and its first error line in report §F1. This is evidence, not something to hide.

Phase 0 is the only phase allowed to end with failing tests, and only with failures caused by F1. The new isolation test must pass. Commit and push.

---

## 4. Phase 1: Quick correctness fixes

### T1.1 V5: real seed password hashes (fixes F1)

**Step 1.** Generate a real hash with the project's own encoder. For example, write a temporary JUnit test that prints `new BCryptPasswordEncoder().encode("password123")`, then delete that temporary test.

**Step 2.** Create `src/main/resources/db/migration/V5__fix_seed_user_password_hashes.sql`:

```sql
-- V2 shipped a placeholder BCrypt string that does not verify against 'password123'.
-- Replace it for the three development seed accounts, only where the placeholder is still present
-- (databases whose hashes were already fixed by hand are left untouched).
UPDATE users
SET password_hash = '<REAL_HASH_OF_password123>'
WHERE email IN ('admin@classsync.edu', 'aturing@classsync.edu', 'alovelace@classsync.edu')
  AND password_hash = '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVjA7RMRp5e8VbZp0m5eLgLgQ16M3O';
```

**Step 3.** Add a test to `SecurityAuthenticationTests`: for all three seed users, the stored hash satisfies `passwordEncoder.matches("password123", hash)`.

**Acceptance:** on a fresh `classsync_test`, every `SecurityAuthenticationTests` test passes.

### T1.2 Clock bean (needed by Phases 2 and 4)

Create `src/main/java/com/classsync/config/TimeConfig.java`:

```java
@Configuration
public class TimeConfig {
    @Bean
    public Clock clock(@Value("${app.timezone:Asia/Kolkata}") String timezone,
                       @Value("${app.clock.fixed-date:}") String fixedDate) {
        ZoneId zone = ZoneId.of(timezone);
        if (fixedDate != null && !fixedDate.isBlank()) {
            return Clock.fixed(LocalDate.parse(fixedDate).atTime(9, 0).atZone(zone).toInstant(), zone);
        }
        return Clock.system(zone);
    }
}
```

Add this to `application.yml`:

```yaml
app:
  timezone: ${APP_TIMEZONE:Asia/Kolkata}
```

**Rule:** production code must never call `LocalDate.now()` or `LocalDateTime.now()` without the injected `Clock`.

### T1.3 Map lock failures to 409 (fixes F7)

1. In `GlobalExceptionHandler`, add a handler for `org.springframework.dao.PessimisticLockingFailureException`. This covers `CannotAcquireLockException`, deadlock victims and lock timeouts.
2. It returns 409 with the message `"The requested resource is locked by a concurrent operation. Please retry."`
3. Add a plain unit test (no Spring context). It calls the handler with `new CannotAcquireLockException("x")` and asserts the 409 status and the message.

### T1.4 Method security (fixes F7)

Add `@EnableMethodSecurity` to `SecurityConfig`. Keep all URL rules as they are.

---

## 5. Phase 2: Live-model integrity (F3, F4, F5, and the past-date part of F8)

### Global lock order (applies to everything in this phase)

1. All explicit row locks follow one order: **V** `timetable_versions` → **O** `schedule_occurrences` → **U** `users` → **R** `rooms`.
2. When locking several rows of one table, lock them in ascending id order.
3. **Lock queries must select a single entity, with no `JOIN FETCH`.** In MySQL, `SELECT … JOIN … FOR UPDATE` locks rows in every joined table, which would break the order.

| Operation | Locks, in order |
|---|---|
| Activate version | V (target), V (current ACTIVE) → O (bulk update) |
| Generate occurrences | V → U (all professors of the version, ascending) → R (all rooms, ascending) |
| Book extra class | U → R (unchanged) |
| Reschedule | O → U → R (unchanged order) |
| Cancel | O (unchanged) |

All of these service methods use `@Transactional(isolation = Isolation.READ_COMMITTED)`. That way, the conflict queries that run after the locks see freshly committed rows.

### T2.1 V6 migration

Create `src/main/resources/db/migration/V6__non_destructive_reschedule_and_supersession.sql`:

```sql
-- Defensive: V1 declared status nullable; normalize before tightening.
UPDATE schedule_occurrences SET status = 'SCHEDULED' WHERE status IS NULL;

ALTER TABLE schedule_occurrences
  MODIFY COLUMN status ENUM('SCHEDULED','CANCELLED','RESCHEDULED','SUPERSEDED') NOT NULL DEFAULT 'SCHEDULED';

-- Lineage for non-destructive rescheduling. The application never deletes occurrences;
-- ON DELETE SET NULL only matters for maintenance/test cleanup of self-referencing rows.
ALTER TABLE schedule_occurrences ADD COLUMN rescheduled_from_id INT NULL AFTER timetable_entry_id;
CREATE INDEX idx_schedule_occurrences_rescheduled_from ON schedule_occurrences (rescheduled_from_id);
ALTER TABLE schedule_occurrences
  ADD CONSTRAINT fk_schedule_occurrences_rescheduled_from
  FOREIGN KEY (rescheduled_from_id) REFERENCES schedule_occurrences (id) ON DELETE SET NULL;
```

Status meanings (put these in Javadoc):

| Status | Meaning |
|---|---|
| `SCHEDULED` | The class takes place. This is the **only** status that blocks rooms and professors. |
| `CANCELLED` | Cancelled by a professor or admin. |
| `RESCHEDULED` | This slot was vacated. A replacement row points back to it via `rescheduled_from_id`. |
| `SUPERSEDED` | An official occurrence of a timetable version that a newer version replaced from `effectiveFrom` onward. |

### T2.2 Model and DTO updates

1. `ScheduleStatus`: add `RESCHEDULED` and `SUPERSEDED`, with Javadoc.
2. `ScheduleOccurrence`: add `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "rescheduled_from_id") private ScheduleOccurrence rescheduledFrom;` plus a getter and setter.
3. `ScheduleOccurrenceResponse` and `BookingResponse`:
   - append `Integer rescheduledFromId` as the **last** component;
   - map it everywhere these records are built (`null` when absent).

### T2.3 Non-destructive rescheduling (fixes F5) — CONTRACT CHANGE

The endpoint and authorization are unchanged: `POST /api/classes/{id}/reschedule`. PROFESSOR may reschedule only their own classes; ADMIN may reschedule any.

**New semantics: the original row is never moved.** Implement `ClassScheduleService.rescheduleOccurrence` as one READ_COMMITTED transaction:

1. Require `startTime < endTime`; otherwise 400 (keep the existing message).
2. Reject past targets. If `LocalDateTime.of(date, startTime)` is before `LocalDateTime.now(clock)`, return 400 `"Cannot reschedule a class into the past"`.
3. Lock the original (O). Return 404 if it does not exist.
4. If the original's status ≠ SCHEDULED, return 409:
   - for CANCELLED, keep the existing message `"Cancelled occurrences cannot be rescheduled"`;
   - for any other status, use `"Only SCHEDULED occurrences can be rescheduled (current status: <STATUS>)"`.
5. Run the authorization check (existing 403 behavior).
6. If date, start, end and room all equal the original's, return 400 `"Reschedule target is identical to the current slot"`.
7. Lock the assigned professor (U), then the target room (R). Validate that the room and its complex are active (existing 404s).
8. Run the conflict checks with the existing `…ExcludingId(…, originalId)` queries (existing 409 messages).
9. Set the original's `status = RESCHEDULED`. Nothing else on the original changes.
10. Insert the replacement row:
    - `timetableEntry = null`
    - `rescheduledFrom = original`
    - professor, eventType, courseCode and courseName: same as the original
    - room, date, start and end: the target values
    - `status = SCHEDULED`
    - `createdBy` = the authenticated caller
11. Return 200 with the **replacement** as a `BookingResponse`: its new id, and `rescheduledFromId` = the original's id.

**Why `timetableEntry = null` on the replacement** (put this explanation in a code comment):
- `(timetable_entry_id, schedule_date)` is the generator's idempotency key.
- The original keeps the key, so the generator never re-creates the moved class.
- The replacement never collides with `uk_schedule_occurrences_entry_date`.
- Lineage is preserved through `rescheduled_from_id`.

**Cancel (`cancelOccurrence`).** If status ≠ SCHEDULED, return 409:
- for CANCELLED, keep `"Occurrence is already cancelled"`;
- otherwise, use `"Only SCHEDULED occurrences can be cancelled (current status: <STATUS>)"`.

### T2.4 Past-date guard for bookings (F8)

In `BookingService.createExtraClass`, after the time-order check: if `LocalDateTime.of(date, startTime)` is before `LocalDateTime.now(clock)`, return 400 `"Cannot book a class in the past"`.

### T2.5 Generator: locks, conflict detection, conflict report (fixes F3)

Implement `ScheduleOccurrenceService.generateOccurrences` with `@Transactional(isolation = Isolation.READ_COMMITTED)`, in this order:

**1. Validate the request** as today (dates, 12-month window).

**2. Lock the version row** with a new `TimetableVersionRepository.findByIdForUpdate` (`@Lock(PESSIMISTIC_WRITE)`, no join fetch).
- Return 404 if it does not exist.
- **Check `status == ACTIVE` on the locked row** (400 as today).

**3. Load the entries** with the existing fetch query. If there are none, return early (unchanged).

**4. Lock professors, then rooms.** Lock all distinct professors of the entries, then all distinct rooms, each with one query, in ascending id order:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT u FROM User u WHERE u.id IN :ids ORDER BY u.id ASC")
List<User> lockAllByIdInOrder(@Param("ids") Collection<Integer> ids);   // UserRepository; same pattern in RoomRepository
```

**5. Load the existing `(entry, date)` keys** with the existing query. All statuses count, so CANCELLED, RESCHEDULED and SUPERSEDED rows are never re-created.

**6. Load potential conflicts with ONE query.** Fetch every SCHEDULED occurrence in `[startDate, endDate]` whose room is among the entries' rooms, or whose professor is among the entries' professors:

```java
@Query("""
    SELECT o FROM ScheduleOccurrence o
    WHERE o.status = com.classsync.entity.ScheduleStatus.SCHEDULED
      AND o.scheduleDate BETWEEN :startDate AND :endDate
      AND (o.room.id IN :roomIds OR o.professor.id IN :professorIds)
""")
List<ScheduleOccurrence> findScheduledInWindowForRoomsOrProfessors(
        @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate,
        @Param("roomIds") Collection<Integer> roomIds, @Param("professorIds") Collection<Integer> professorIds);
```

Index the results in memory by `roomId|date` and by `professorId|date`.

**7. Decide each candidate.** For each `(entry, date)` in the window whose weekday matches, apply the first rule that fits:

| Situation | Result |
|---|---|
| The key already exists | `skippedExistingCount++` (unchanged behavior) |
| The room is inactive, or its complex is inactive | Conflict `ROOM_INACTIVE`; not created |
| Half-open overlap with a SCHEDULED occurrence in the same room | Conflict `ROOM_BUSY`; not created |
| Otherwise, overlap with a SCHEDULED occurrence of the same professor | Conflict `PROFESSOR_BUSY`; not created |
| None of the above | Create it, and add it to both in-memory indexes |

**8. Extend the response.** Append `int conflictCount` and `List<GenerationConflict> conflicts` to `GenerateOccurrencesResponse`. Leave the existing fields unchanged. Sort conflicts by date, then startTime, then timetableEntryId.

New types:

```java
public enum GenerationConflictType { ROOM_BUSY, PROFESSOR_BUSY, ROOM_INACTIVE }

public record GenerationConflict(
        LocalDate date, Integer timetableEntryId, String courseCode,
        LocalTime startTime, LocalTime endTime,
        Integer roomId, String roomNumber, Integer professorId, String professorName,
        GenerationConflictType type,
        Integer conflictingOccurrenceId,          // null for ROOM_INACTIVE
        ScheduleEventType conflictingEventType,   // null for ROOM_INACTIVE
        String conflictingCourseCode) {}          // null for ROOM_INACTIVE
```

**Behavior notes:**
- Conflicting entries are simply not created.
- Once the admin resolves a conflict (for example, the EXTRA booking is cancelled), re-running generation fills the gap. This is idempotent gap-filling.
- The number of read/lock queries must stay independent of the window size.
- Inserts remain one statement per row, because of `IDENTITY`.

### T2.6 Version activation: locking and supersession (fixes F4)

`PATCH /api/timetables/versions/{id}/activate` gets an optional query parameter `effectiveFrom` (ISO date). It defaults to today, via `Clock`. If `effectiveFrom` is before today, return 400 `"effectiveFrom cannot be in the past"`.

Implement `TimetableVersionService.activateVersion` with READ_COMMITTED:

**1. Lock the target version** with `findByIdForUpdate` (no join fetch). Return 404 if it does not exist. It must be DRAFT (existing 400).

**2. Find the current ACTIVE version** of the same academicYear and semester, using a **locking** query (`@Lock(PESSIMISTIC_WRITE)`, no join fetch).

**3. If a current ACTIVE version exists:** set it to ARCHIVED, then bulk-supersede its future official occurrences:

```java
@Modifying(flushAutomatically = true)   // do NOT add clearAutomatically: the version entities are still used for the response
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

What this does and does not touch:
- **Affected:** only OFFICIAL rows generated from the old version.
- **Never affected:** EXTRA bookings and reschedule replacements (`timetable_entry_id IS NULL`). These are treated as temporary bookings, and the next generation run reports any conflicts with them.

**4. Set the target version to ACTIVE.**

**5. Return a `TimetableActivationResponse`** containing:
- all fields of `TimetableVersionResponse`, with the same names and order;
- `Integer archivedVersionId` (nullable);
- `LocalDate effectiveFrom`;
- `int supersededOccurrenceCount`.

### T2.7 Tests for Phase 2

**Rule for `@Transactional` test classes:** after calling endpoints that perform bulk updates, call `entityManager.flush(); entityManager.clear();` before asserting through repositories.

**Rule for dates:** use dates on or after **2026-10-01** (the fixed test clock) for anything that must not count as "past".

**CONTRACT CHANGES.** These are the only existing tests you may rewrite in this phase, all in `ClassScheduleIntegrationTests`:

| Test | New name and expectation |
|---|---|
| 24 "Rescheduling preserves occurrence ID" | "24. Rescheduling creates a linked replacement and keeps the original row". The response id ≠ the original id. `rescheduledFromId` = the original id. The original is RESCHEDULED and keeps its original date, time and room. |
| 27 "Rescheduling preserves timetableEntry relationship" | "27. Original keeps its timetable entry; replacement has none". The original still references the entry and is RESCHEDULED. The replacement's `timetableEntry` is null and its `rescheduledFrom` = the original. Fix the cleanup ordering, or rely on ON DELETE SET NULL. |
| 29 "Rescheduling updates date/time/room correctly" | Assert the new values on the replacement (looked up by the response id), and the old values on the original. |
| 30 "Concurrent rescheduling of the same occurrence does not cause lost updates" | Exactly 1 success and 1 failure with `DuplicateResourceException`. Exactly one replacement row exists, with `rescheduledFrom` = the original. The original is RESCHEDULED. |

**New tests (minimum):**

| ID | Class | What it proves |
|---|---|---|
| N1 | ClassSchedule | Cancelling a RESCHEDULED original → 409 |
| N2 | ClassSchedule | Rescheduling a RESCHEDULED original → 409 |
| N3 | ClassSchedule | Rescheduling the replacement again creates a second replacement linked to the first; the first becomes RESCHEDULED |
| N4 | ClassSchedule | Identical target slot → 400 |
| N5 | ClassSchedule | Target before the fixed clock → 400 |
| N6 | Booking | Booking before the fixed clock → 400 |
| N7 | ScheduleOccurrence | **Ghost-class regression.** Generate a week for a Monday entry, reschedule that Monday's class to Wednesday, then regenerate the same window. Expect `createdCount` 0, `conflictCount` 0, and exactly one row for (entry, Monday), which is RESCHEDULED. |
| N8 | ScheduleOccurrence | Move a Monday class to the next Monday at a different time **before** next week is generated. Generating next week still creates next Monday's official class, with no error. |
| N9 | ScheduleOccurrence | The same move **after** next week is generated → 200. Previously this hit a unique-constraint failure. |
| N10 | ScheduleOccurrence | An EXTRA booking exists on a not-yet-generated date, in the entry's room and time. Generation skips that occurrence and reports `ROOM_BUSY`, with the EXTRA's id and type `EXTRA`. Afterwards, no two SCHEDULED rows overlap in that room. |
| N11 | ScheduleOccurrence | The professor is busy elsewhere at that time → `PROFESSOR_BUSY` |
| N12 | ScheduleOccurrence | After cancelling the EXTRA from N10, regenerating creates the missing official occurrence (`createdCount` 1, `conflictCount` 0) |
| N13 | ScheduleOccurrence | Inactive room → `ROOM_INACTIVE`, and the occurrence is not created |
| N14 | ScheduleOccurrence or Timetable | V1 is generated for 2 weeks, plus an EXTRA in week 2. Activate V2 with `effectiveFrom` = start of week 2. Expect: V1's week-2 rows SUPERSEDED; week-1 rows unchanged; the EXTRA unchanged; `supersededOccurrenceCount` correct; `archivedVersionId` = V1. |
| N15 | ScheduleOccurrence or Timetable | After N14, generating V2 over week 2 (same room and time as V1) creates its rows with no conflicts |
| N16 | Timetable | `effectiveFrom` before today → 400 |
| N17 | Timetable | Activation without `effectiveFrom` → the response's `effectiveFrom` is 2026-10-01 |
| N18 | New **non-transactional** class `GenerationConcurrencyIntegrationTests` | Start generation and an overlapping booking for the same room and slot together (CyclicBarrier), using a different professor for the booking. Repeat 10 times, cleaning up between iterations. There are never two overlapping SCHEDULED rows; the loser either gets a 409 or appears as a `ROOM_BUSY` conflict. Clean up occurrences, entries and versions in `finally`. |

---

## 6. Phase 3: Recommendation engine (fixes F6)

### T3.1 Hard vs soft constraints — CONTRACT CHANGE for `/api/rooms/recommendations` only

| Kind | Constraints |
|---|---|
| **Hard (filter)** | Room active; complex active; capacity ≥ requested (when given); room free in the slot; requesting professor free (a professor conflict still returns an empty list) |
| **Soft (scored, never filtered)** | `complexId` (LocationFit); `roomType` and `facilities` (PreferenceFit); utilization; continuity |

Implementation:
1. Obtain candidates with `availabilityService.getAvailableRoomEntities(null, date, startTime, endTime, capacity, null, null, userEmail)`.
2. Still validate facility ids with `parseAndValidateFacilityIds` (400, unchanged).
3. If `complexId` is given but is not an existing active complex, return 400 `"Requested complex not found or inactive: <id>"`.

`/api/rooms/available` stays strictly hard-filtered. **All 19 `AvailabilityIntegrationTests` must pass unchanged.**

### T3.2 Scoring and reasons

**LocationFit:**
- complex given → 1.0 for the same complex, 0.0 for a different one;
- not given → **1.0** (no preference is satisfied by default, like PreferenceFit), and no location reason is added.

**Exact reason strings:**

| Factor | Reasons |
|---|---|
| Location | `"Room is in the requested complex"` / `"Room is in a different complex than requested"` |
| Room type | `"Room matches requested room type"` / `"Room type differs from requested room type"` |
| Facilities | `"Room matches requested facilities"` / `"Room partially matches requested facilities (X of Y)"` / `"Room has none of the requested facilities"` |
| Continuity | `"Professor has a preceding class in this room"` (a class ending exactly at startTime) / `"Professor has a following class in this room"` (a class starting exactly at endTime) |

**Continuity implementation:**
- Replace `findAdjacentRoomIdsForProfessor` with a query that also returns the direction (for example, room id + start + end).
- Derive the direction in Java.
- Continuity = 1.0 if either direction applies.

Capacity and utilization reasons, the formula, the weights and the 4-tier sorting stay unchanged.

### T3.3 Tests

**CONTRACT CHANGES** in `RecommendationIntegrationTests`:

| Test | New name and expectation |
|---|---|
| 7 "Room type filtering as hard constraint" | "7. Room type is a soft preference". With `roomType=LAB`, the LAB room ranks first with the match reason. Non-LAB rooms are present, with `"Room type differs from requested room type"` and lower scores. |
| 8 "Required facilities use AND semantics" | "8. Facilities are a soft preference". With `facilities=1,2,5`, SEC-301 has `"Room matches requested facilities"`. SEC-101 is present, with `"Room partially matches requested facilities (1 of 3)"` and a lower score than SEC-301. |
| 15 "Requested complex receives appropriate location score" | "15. Other complexes are included but rank below the requested complex". With `complexId=1`, complex-2 rooms are present with the different-complex reason, and every complex-2 score is lower than every complex-1 score. |

**New tests:**

| ID | What it proves |
|---|---|
| N19 | Unknown or inactive `complexId` → 400 |
| N20 | Request `capacity=120`, so only SEC-301 qualifies, with no other preferences. If the requesting professor has a class ending exactly at startTime in SEC-301, the score is exactly **100.0**. The same request by an admin (no continuity) scores exactly **90.0**. |
| N21 | The following-class continuity reason appears for a class starting exactly at endTime |
| N22 | A room with none of the requested facilities is listed with `"Room has none of the requested facilities"` |

---

## 7. Phase 4: Frontend-readiness API (fixes F8)

### T4.1 CORS

1. Add to `application.yml`: `app.cors.allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:3000}`.
2. Define a `CorsConfigurationSource` bean **inside `SecurityConfig`**, so the `@WebMvcTest` slice in `HealthControllerTest` keeps working. Configure it as follows:
   - exact origins from the property (never `*`), read with a default in `@Value` so slices without the property still start;
   - methods GET, POST, PUT, PATCH, DELETE, OPTIONS;
   - headers Content-Type, Accept, X-Requested-With;
   - `allowCredentials(true)`;
   - `maxAge(3600)`;
   - registered for `/api/**`.
3. Enable it with `http.cors(Customizer.withDefaults())`.

**Tests:**
- A preflight `OPTIONS /api/rooms/available` with `Origin: http://localhost:5173` and `Access-Control-Request-Method: GET` → 200, with `Access-Control-Allow-Origin: http://localhost:5173` and `Access-Control-Allow-Credentials: true`.
- The same preflight with `Origin: http://evil.example` → 403.

### T4.2 Session cookie, session fixation, CSRF decision

**Session cookie.** Add to `application.yml`:

```yaml
server:
  servlet:
    session:
      cookie:
        http-only: true
        same-site: lax
        secure: ${SESSION_COOKIE_SECURE:false}   # set true behind HTTPS
```

**CSRF.** Keep CSRF tokens disabled; do not change this. Document the rationale in Phase 5:
- the session cookie is HttpOnly and `SameSite=Lax`, so browsers don't attach it to cross-site POST/PUT/PATCH/DELETE requests;
- CORS uses an exact-origin allowlist;
- request bodies are JSON;
- no GET endpoint changes state.

**Session fixation.** In `AuthController.login`, before saving the security context: if `httpRequest.getSession(false) != null`, call `httpRequest.changeSessionId()`.

### T4.3 `GET /api/auth/me` and `POST /api/auth/logout`

**`GET /api/auth/me`:**
- authenticated → 200 `LoginResponse(id, name, email, role)` for the current user;
- unauthenticated → the existing 401 JSON.

**Logout**, configured in Spring Security:
- logout URL `/api/auth/logout`, **POST only**;
- invalidate the session;
- clear authentication;
- delete `JSESSIONID`;
- success handler `HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)`.

**Tests:**
- Log in, then call `/me` with that session → 200 with the correct email and role.
- Log out with that session → 204, and the `MockHttpSession` is invalidated.
- `/me` without a session → 401.

### T4.4 `GET /api/users` (admin only)

1. Optional query parameters: `role` (`UserRole`) and `status` (`UserStatus`). An invalid enum value returns 400 through the existing handler.
2. Security: add `.requestMatchers(HttpMethod.GET, "/api/users/**").hasRole("ADMIN")` before `anyRequest()`.
3. Layering: `UserController` → `UserService` → `UserRepository`. Filter with the nullable-parameter JPQL pattern used elsewhere. Sort by name, then id.
4. DTO: `UserSummaryResponse(Integer id, String name, String email, String employeeCode, UserRole role, UserStatus status)`. Never include any password field.

**Tests:**
- Admin with `role=PROFESSOR` → exactly the two seed professors.
- The response body contains no `password`, `passwordHash` or `password_hash`.
- Professor → 403.
- Unauthenticated → 401.

### T4.5 Admin visibility of inactive entities

Add an optional `includeInactive` parameter (default false) to these endpoints:
- `GET /api/complexes`
- `GET /api/complexes/{complexId}/rooms`
- `GET /api/rooms/{id}`
- `GET /api/facilities`

Rules:
- `includeInactive=true` requires ADMIN. Otherwise, throw `AccessDeniedException`, which the existing handler turns into 403.
- Default behavior is unchanged for everyone, so all existing `DomainIntegrationTests` must pass unchanged.

What the flag returns:

| Endpoint | With `includeInactive=true` |
|---|---|
| `GET /api/complexes` | All complexes |
| `GET /api/complexes/{complexId}/rooms` | All rooms of that complex, even if the complex itself is inactive (404 only if the complex doesn't exist) |
| `GET /api/rooms/{id}` | The room, even if it is inactive or in an inactive complex |
| `GET /api/facilities` | All facilities |

**Tests:**
- Deactivate a complex, a room and a facility. The admin sees each of them with `includeInactive=true` (showing `active=false`), and does not see them without the flag.
- A professor using the flag → 403.

---

## 8. Phase 5: Documentation truthfulness (fixes F9)

Update `README.md` and `PROJECT_PROGRESS_REPORT.md` so that every statement matches the code after this prompt.

**Corrections:**

1. **Round-trips claim.** Replace "Total database roundtrips: 2 … under 50ms" (README "Key Mathematical & Algorithmic Innovations" §2; report §5.2) with the accurate description:
   - a constant number of read/lock queries, independent of the window size (state the real count and list the queries);
   - plus one INSERT per new occurrence, because `GenerationType.IDENTITY` disables Hibernate JDBC batch inserts.

   Remove "under 50ms" unless you measured it in Phase 6. If you did, give the number and the conditions.
2. **Deadlock claim.** Replace "deadlocks are mathematically impossible" (README §3; report Phase 8 and §5.5) with this precise claim:
   - all explicit row locks follow one global order, V → O → U → R, with ascending ids within a table;
   - lock queries select single tables;
   - therefore circular waits cannot arise among activation, generation, booking, cancellation and rescheduling;
   - InnoDB deadlock detection plus the 409 mapping remain as a safety net.

   Include the per-operation lock table from Phase 2.
3. **Unsupported wording.** Remove "Millisecond-level" (report §1.2) and "production-grade" (report §9). Use neutral wording instead.
4. **Test tables.** Use the real class names and counts from `target/surefire-reports` after the final run. There must be no "AuthIntegrationTests".

**New and updated sections:**

5. **Rescheduling:** the non-destructive semantics, the RESCHEDULED status, `rescheduledFromId`, the 400/409 rules, and a sample response.
6. **Generation:** conflict detection, the conflict types, the response fields, a sample response with one conflict, and gap-filling re-runs.
7. **Activation:** `effectiveFrom`, SUPERSEDED, what is and is not superseded, and the response fields.
8. **Recommendations:** hard vs soft constraints, LocationFit neutral = 1.0, and the new reason strings. Note that `/api/rooms/available` stays strict.
9. **Security:** the CSRF decision and its rationale (T4.2), the cookie flags, session-fixation protection, the CORS property, `/me` and logout.
10. **API tables:** add `/api/auth/me`, `/api/auth/logout`, `/api/users`, `includeInactive` and `effectiveFrom`.
11. **Testing:** tests run against `classsync_test` (auto-created; override with `TEST_DB_URL`); the fixed test clock is 2026-10-01, and explain why; the dev database is never touched.
12. **Schema:** V5 and V6, the status values and their meanings, and `rescheduled_from_id`. Note that the live calendar view is `status=SCHEDULED`.

**Progress report additions:**

13. Add a section **"Phase 10: Integrity & Hardening Pass (Prompt 11H)"** summarizing F1–F9 and their fixes.
14. Add a section **"Scope changes from the original abstract"** stating only these facts, without inventing other reasons:
    - PostgreSQL → MySQL 8;
    - Departments are not modeled; rooms are organized by complex;
    - the Coordinator role is merged into ADMIN (two-role RBAC);
    - the separate Bookings, Cancellations and Rescheduling Records tables are unified into `schedule_occurrences` (status + `rescheduled_from_id`).
15. Update the report's status line and date. Leave roadmap phases 12–14 unchanged.

**Acceptance:** this command returns nothing:

```bash
grep -n -i "mathematically impossible\|under 50ms\|millisecond-level\|production-grade\|AuthIntegrationTests" README.md PROJECT_PROGRESS_REPORT.md
```

---

## 9. Phase 6: Final verification

### T6.1 Fresh-database full run

```bash
mysql -u root -e "DROP DATABASE IF EXISTS classsync_test;"
mvn clean test
grep -h "Tests run" target/surefire-reports/*.txt
grep -rn "@Disabled" src/test || echo "no @Disabled"
```

The result must be BUILD SUCCESS, with 0 failures, 0 errors and 0 skipped.

### T6.2 Upgrade-path check on a COPY of the dev database

**Never touch `classsync` itself.** Work on a copy:

```bash
mysql -u root -e "DROP DATABASE IF EXISTS classsync_upgrade_check; CREATE DATABASE classsync_upgrade_check CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysqldump -u root --single-transaction classsync | mysql -u root classsync_upgrade_check
mvn -q -DskipTests package
DB_URL="jdbc:mysql://localhost:3306/classsync_upgrade_check?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" PORT=8081 \
  nohup java -jar target/classsync-backend-0.0.1-SNAPSHOT.jar > /tmp/classsync-11h.log 2>&1 &
# wait until  curl -s http://localhost:8081/api/health  responds (max ~60 s)
grep -i "flyway\|migrat" /tmp/classsync-11h.log
mysql -u root classsync_upgrade_check -e "SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
```

If the dev database `classsync` doesn't exist, say so and run this step against a fresh empty database instead.

### T6.3 Runtime smoke test (paste the raw output, headers included)

```bash
curl -s -i -c /tmp/cj.txt -H 'Content-Type: application/json' \
  -d '{"email":"admin@classsync.edu","password":"password123"}' http://localhost:8081/api/auth/login
curl -s -i -b /tmp/cj.txt http://localhost:8081/api/auth/me
curl -s -i -X OPTIONS -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: GET' http://localhost:8081/api/rooms/available
curl -s -i -X OPTIONS -H 'Origin: http://evil.example' -H 'Access-Control-Request-Method: GET' http://localhost:8081/api/rooms/available
curl -s -b /tmp/cj.txt 'http://localhost:8081/api/users?role=PROFESSOR'
curl -s -i -b /tmp/cj.txt -X POST http://localhost:8081/api/auth/logout
curl -s -i -b /tmp/cj.txt http://localhost:8081/api/auth/me
```

**Expected results, in order:**
1. Login → 200, with `Set-Cookie: JSESSIONID=…; HttpOnly; SameSite=Lax`.
2. `/me` → 200.
3. Allowed preflight → 200 with CORS headers.
4. Disallowed preflight → 403.
5. Users list → no password fields.
6. Logout → 204.
7. Final `/me` → 401.

If login fails here but passes in the tests, the dev database's admin hash was changed by hand to a different password. Report it. Do **not** modify any database to make it pass.

**Clean up afterwards:** stop the app (`kill` the java process), then run `DROP DATABASE classsync_upgrade_check;`.

### T6.4 Push and report

```bash
git push -u origin hardening/prompt-11h
```

1. Finish `docs/reports/PROMPT_11H_REPORT.md`.
2. Commit and push again.
3. Print the **entire report** as your final message.

---

## 10. REPORT TEMPLATE (mandatory — fill in every section)

~~~markdown
# PROMPT 11H — Execution Report

## A. Run metadata
- Branch:
- BASE_COMMIT (main at start):
- HEAD commit (after final push):
- Pushed to origin: yes/no (paste the last lines of `git push`)
- java -version / mvn -v / mysql --version (first line of each):
- Agent / model (if known):

## B. Commits
(paste `git log --oneline BASE_COMMIT..HEAD`)

## C. Files changed
(paste `git diff --stat BASE_COMMIT..HEAD`)

## D. Task status
| Task | Status (DONE / PARTIAL / NOT STARTED / DEVIATED) | Evidence (files, test names) | Notes |
|---|---|---|---|
| T0.1 | | | |
| T0.2 | | | |
| T0.3 | | | |
| T0.4 | | | |
| T1.1 | | | |
| T1.2 | | | |
| T1.3 | | | |
| T1.4 | | | |
| T2.1 | | | |
| T2.2 | | | |
| T2.3 | | | |
| T2.4 | | | |
| T2.5 | | | |
| T2.6 | | | |
| T2.7 | | | |
| T3.1 | | | |
| T3.2 | | | |
| T3.3 | | | |
| T4.1 | | | |
| T4.2 | | | |
| T4.3 | | | |
| T4.4 | | | |
| T4.5 | | | |
| T5 (docs) | | | |
| T6.1 | | | |
| T6.2 | | | |
| T6.3 | | | |
| T6.4 | | | |

## E. Deviations
For each deviation: what the prompt said, what you did instead, and why.

## F. Tests
- F1. Baseline (Phase 0, fresh DB, before fixes): the raw `grep -h "Tests run"` output, plus every failing test with its first error line.
- F2. Final (Phase 6, fresh DB): the raw `grep -h "Tests run"` output, the Maven "Tests run: … Failures: …" summary line, and the BUILD SUCCESS line.
- F3. Changed existing tests:
  | Class | Old name | New name | Old expectation | New expectation | Contract change |
  |---|---|---|---|---|---|
- F4. New tests:
  | ID (N1…N22, T4.x, T1.x) | Class | Method name | What it proves (finding) |
  |---|---|---|---|
- F5. `grep -rn "@Disabled" src/test` output, and the @Test count at BASE_COMMIT vs HEAD:
  `git grep -hE "^\s*@Test\s*$" BASE_COMMIT -- src/test | wc -l`  vs  `grep -rhE "^\s*@Test\s*$" src/test | wc -l`

## G. Verbatim code (copy exactly; do not paraphrase)
- G1. V5 and V6 migrations (full files)
- G2. `ClassScheduleService.rescheduleOccurrence` and `cancelOccurrence` (full methods)
- G3. `ScheduleOccurrenceService.generateOccurrences` (full), plus every new repository query it uses
- G4. `TimetableVersionService.activateVersion` (full), plus the supersede query
- G5. `RecommendationService`: candidate retrieval, plus the location, preference and continuity blocks
- G6. `SecurityConfig` (full file)
- G7. The new `GlobalExceptionHandler` handler, `TimeConfig`, and `src/test/resources/application.properties`
- G8. Output of `grep -rn "LocalDate.now()\|LocalDateTime.now()" src/main` (must be empty)

## H. Runtime evidence
- H1. The Flyway log lines from T6.2, plus the `flyway_schema_history` output
- H2. The raw output of every T6.3 curl command
- H3. The ordered list of queries `generateOccurrences` issues (from reading the code), and the total read/lock query count

## I. Acceptance checklist
| ID | Criterion | PASS/FAIL | Evidence |
|---|---|---|---|
| A1 | Fresh DB: seed users log in with password123 | | |
| A2 | Tests never touch the dev DB (isolation test passes) | | |
| A3 | Generator never creates an occurrence overlapping a SCHEDULED one (room or professor) | | |
| A4 | Generation conflicts are reported with type and conflicting occurrence id | | |
| A5 | Reschedule never moves the original; original is RESCHEDULED; replacement is linked | | |
| A6 | Regeneration after reschedule: no ghost class, no unique-constraint error | | |
| A7 | Activation supersedes only the old version's SCHEDULED official rows on/after effectiveFrom; the new version then generates cleanly | | |
| A8 | Cancel/reschedule of a non-SCHEDULED occurrence → 409 | | |
| A9 | Past-date booking/reschedule → 400 | | |
| A10 | Recommendations: complex/type/facilities are soft; other complexes rank lower; partial/none facility reasons | | |
| A11 | Recommendation score of 100.0 is reachable; following-class reason works | | |
| A12 | `/api/rooms/available` unchanged (19/19 Availability tests unchanged and passing) | | |
| A13 | Lock failures → 409 | | |
| A14 | `@EnableMethodSecurity` present | | |
| A15 | CORS allowed/denied (tests + curl) | | |
| A16 | Session cookie is HttpOnly + SameSite=Lax (curl header) | | |
| A17 | `/me` and logout work (tests + curl) | | |
| A18 | `/api/users` is admin-only and has no password fields | | |
| A19 | `includeInactive` is admin-only and works | | |
| A20 | Docs grep for banned phrases returns nothing; test table matches surefire | | |
| A21 | V1–V4 unchanged (`git diff --stat BASE_COMMIT -- src/main/resources/db/migration/V1__* V2__* V3__* V4__*` is empty) | | |
| A22 | No @Disabled; only the listed contract-change tests were rewritten | | |

## J. Open issues and questions for the reviewer
~~~
