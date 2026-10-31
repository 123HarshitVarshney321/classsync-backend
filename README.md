# ClassSync Backend

ClassSync is an automated university classroom scheduling, allocation, and recommendation backend built with Java 21, Spring Boot 3.4.3, MySQL 8 (InnoDB), Hibernate 6, and Flyway migrations.

It provides end-to-end management for university infrastructure, versioned master timetable drafting, idempotent calendar occurrence generation with conflict reporting, real-time advisory room availability search, concurrency-protected extra-class booking, non-destructive class cancellation and rescheduling, and an explainable 5-factor room recommendation engine.

---

## Prerequisites

- **Java**: 21 LTS (`java -version`)
- **Maven**: 3.9+ (`mvn -version`)
- **MySQL**: 8.0+ (`mysql --version`)

---

## Architecture & Design Principles

The backend follows a clean, 4-tier architecture:

```text
Controller  -->  Service  -->  Repository  -->  MySQL 8 (InnoDB)
```

- **Clean & Minimal (KISS, SOLID, DRY, YAGNI)**: No premature distributed abstractions, no unnecessary microservices, no speculative database tables.
- **Strict Decoupling**: Recurring weekly master blueprints (`TimetableEntry`) are cleanly decoupled from dated calendar events (`ScheduleOccurrence`).
- **Database Migrations (Flyway V1–V6)**: Automated, reproducible database evolution across 10 normalized tables.
- **Concurrency & Deadlock Prevention**: MySQL InnoDB pessimistic write locking (`SELECT ... FOR UPDATE`) adhering to a strict global total lock ordering ($V \rightarrow O \rightarrow U \rightarrow R$: `TimetableVersion` $\rightarrow$ `ScheduleOccurrence` $\rightarrow$ `User` $\rightarrow$ `Room`) under `@Transactional(isolation = Isolation.READ_COMMITTED)`. InnoDB deadlock detection and `PessimisticLockingFailureException` mapping to `409 Conflict` act as a defensive safety net.
- **Explainable Recommendation**: Deterministic, transparent mathematical scoring (0–100) with fixed reason templates and soft preference handling—zero black-box ML.
- **Historical Preservation & Non-Destructive Operations**: Cancelled occurrences are preserved as `CANCELLED`. Rescheduled occurrences preserve the original occurrence as `RESCHEDULED` and link a new replacement occurrence via `rescheduled_from_id`. No historical schedule data is physically deleted.
- **Time & Clock Decoupling**: System clock abstraction (`java.time.Clock`) injected everywhere; test executions lock the clock to `2026-10-01` to ensure immutable determinism.

---

## Database Schema (10 Core Tables)

1. `users`: Professors and Administrators with session-based authentication and role enforcement (`ROLE_ADMIN`, `ROLE_PROFESSOR`).
2. `complexes`: Academic complexes and campus zones housing classrooms.
3. `rooms`: Classrooms, lecture halls, and laboratories with capacity constraints and `UNIQUE(complex_id, room_number)`.
4. `facilities`: Equipment and amenities (e.g., Projector, Smart Board, AC, Audio System). Supports soft-activation.
5. `room_facilities`: Many-to-many join table mapping rooms to active facilities.
6. `timetable_versions`: Version-controlled official timetable definitions with lifecycle states (`DRAFT` $\rightarrow$ `ACTIVE` $\rightarrow$ `ARCHIVED`).
7. `timetable_entries`: Recurring weekly class slots with day of week checks (`1-7`) and half-open time checks (`start_time < end_time`).
8. `schedule_occurrences`: Date-specific calendar occurrences with `status ENUM('SCHEDULED', 'CANCELLED', 'RESCHEDULED', 'SUPERSEDED')` and self-referential `rescheduled_from_id` (foreign key with `ON DELETE SET NULL`). The live calendar view queries `status = 'SCHEDULED'`.
9. `notifications`: User notification queue for booking, cancellation, and reschedule events.
10. `audit_logs`: Audit trail with JSON snapshots (`old_value`, `new_value`) for administrative accountability.

### Flyway Migrations
- `V1__create_initial_schema.sql`: Creates all 10 core tables, check constraints, foreign keys, and performance indexes.
- `V2__seed_development_data.sql`: Seeds development data: 1 Admin, 2 Professors, 2 Complexes (`SEC`, `HSS`), 5 Rooms, 5 Facilities, and mappings.
- `V3__add_active_to_facilities.sql`: Adds `active BOOLEAN DEFAULT TRUE NOT NULL` to `facilities` enabling soft deactivation.
- `V4__add_unique_entry_date_to_schedule_occurrences.sql`: Enforces `UNIQUE KEY uk_schedule_occurrences_entry_date (timetable_entry_id, schedule_date)` for idempotent projection.
- `V5__fix_seed_user_password_hashes.sql`: Standardizes seed user BCrypt password hashes to match `password123`.
- `V6__non_destructive_reschedule_and_supersession.sql`: Adds `RESCHEDULED` and `SUPERSEDED` to `schedule_occurrences.status`, and adds `rescheduled_from_id` FK pointing to `schedule_occurrences(id)` with `ON DELETE SET NULL`.

---

## Configuration

Configuration is managed via `src/main/resources/application.yml` and environment variables:

| Environment Variable | Description | Default Value |
|---|---|---|
| `PORT` | HTTP server port | `8080` |
| `DB_URL` | MySQL JDBC URL | `jdbc:mysql://localhost:3306/classsync?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DB_USERNAME` | MySQL database user | `root` |
| `DB_PASSWORD` | MySQL password | (empty) |
| `APP_TIMEZONE` | Application timezone | `Asia/Kolkata` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `http://localhost:5173,http://localhost:3000` |
| `SESSION_COOKIE_SECURE`| Cookie Secure flag (HTTPS) | `false` |

---

## How to Run the Backend

```bash
# 1. Start MySQL service if not running:
brew services start mysql

# 2. Run the application (Flyway migrations run automatically on startup):
mvn spring-boot:run

# 3. Or package and run the executable JAR:
mvn clean package
java -jar target/classsync-backend-0.0.1-SNAPSHOT.jar
```

Verify application health:
```bash
curl http://localhost:8080/api/health
```

---

## API Specification

### 1. Authentication & Session Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Application health status |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials, initiate session with session fixation protection |
| `GET` | `/api/auth/me` | Authenticated | Fetch authenticated user profile (`id`, `name`, `email`, `role`) |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate session, delete `JSESSIONID` cookie (`204 No Content`) |
| `GET` | `/api/users` | `ROLE_ADMIN` | List and filter users by `role` and `status` (never exposes passwords) |

**Security Design & Rationale:**
- **CSRF Token Decision**: Kept disabled by architectural design. The application utilizes `HttpOnly` and `SameSite=Lax` session cookies (which modern browsers do not attach to cross-site state-changing POST/PUT/PATCH/DELETE requests), strict exact-origin CORS allowlists, JSON-only request bodies, and strictly state-neutral GET endpoints.
- **Session Fixation**: Upon successful authentication, `request.changeSessionId()` is invoked to issue a new session identifier before saving the security context.
- **CORS Allowlist**: Configured with explicit frontend origins (default `http://localhost:5173,http://localhost:3000`), rejecting unauthorized origins with `403 Forbidden`.

**Development Credentials (Local Testing Only):**
- **Admin:** `admin@classsync.edu` / `password123`
- **Professor:** `aturing@classsync.edu` / `password123`
- **Professor:** `alovelace@classsync.edu` / `password123`

---

### 2. Campus Infrastructure (Complexes, Rooms, Facilities)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/complexes` | Authenticated | List complexes (supports optional `includeInactive=true` for `ROLE_ADMIN`) |
| `GET` | `/api/complexes/{id}` | Authenticated | Get active complex by ID |
| `POST` | `/api/complexes` | `ROLE_ADMIN` | Create a new academic complex |
| `PUT` | `/api/complexes/{id}` | `ROLE_ADMIN` | Update complex name or code |
| `PATCH`| `/api/complexes/{id}/status` | `ROLE_ADMIN` | Activate or deactivate complex |
| `GET` | `/api/complexes/{complexId}/rooms` | Authenticated | List rooms for complex (supports optional `includeInactive=true` for `ROLE_ADMIN`) |
| `POST` | `/api/complexes/{complexId}/rooms` | `ROLE_ADMIN` | Create classroom inside a complex |
| `GET` | `/api/rooms/{id}` | Authenticated | Get room details (supports optional `includeInactive=true` for `ROLE_ADMIN`) |
| `PUT` | `/api/rooms/{id}` | `ROLE_ADMIN` | Update room number, room type, capacity, facilities |
| `PATCH`| `/api/rooms/{id}/status` | `ROLE_ADMIN` | Activate or deactivate room |
| `GET` | `/api/facilities` | Authenticated | List facilities (supports optional `includeInactive=true` for `ROLE_ADMIN`) |
| `POST` | `/api/facilities` | `ROLE_ADMIN` | Create a new facility |
| `PUT` | `/api/facilities/{id}` | `ROLE_ADMIN` | Update facility name |
| `PATCH`| `/api/facilities/{id}/status` | `ROLE_ADMIN` | Activate or deactivate facility |

*Note: Passing `includeInactive=true` without `ROLE_ADMIN` returns `403 Forbidden`.*

---

### 3. Timetable Versioning & Master Schedule Entries

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/timetables/versions` | Authenticated | List timetable versions with optional semester/year filters |
| `POST` | `/api/timetables/versions` | `ROLE_ADMIN` | Create a new `DRAFT` timetable version |
| `PATCH`| `/api/timetables/versions/{id}/activate` | `ROLE_ADMIN` | Publish timetable with optional `effectiveFrom` date; bulk-supersedes future official rows |
| `PATCH`| `/api/timetables/versions/{id}/archive` | `ROLE_ADMIN` | Archive timetable version (read-only) |
| `POST` | `/api/timetables/versions/{id}/entries` | `ROLE_ADMIN` | Add recurring class entry (validates room & prof half-open collision) |
| `PUT` | `/api/timetables/entries/{id}` | `ROLE_ADMIN` | Update recurring class slot with self-exclusion collision check |
| `DELETE`| `/api/timetables/entries/{id}` | `ROLE_ADMIN` | Remove recurring class from draft timetable (`204 No Content`) |

**Version Activation Semantics:**
- Accepts optional `effectiveFrom` query parameter (defaults to today; past dates return `400 Bad Request`).
- Acquires write locks on target version and currently active version.
- Sets currently active version to `ARCHIVED`, and bulk-supersedes its official future rows (`status = SCHEDULED` and `scheduleDate >= effectiveFrom`) by updating their status to `SUPERSEDED`.
- Past classes, extra-class bookings, and reschedule replacements (`timetable_entry_id IS NULL`) are unaffected.
- Sets target version to `ACTIVE` and returns `TimetableActivationResponse` containing `archivedVersionId`, `effectiveFrom`, and `supersededOccurrenceCount`.

---

### 4. Calendar Occurrence Projection Engine

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/schedule-occurrences/generate` | `ROLE_ADMIN` | Project active timetable onto calendar dates with conflict detection |
| `GET` | `/api/schedule-occurrences` | Authenticated | Query calendar occurrences with date range, professor, room, status filters |
| `GET` | `/api/schedule-occurrences/{id}` | Authenticated | Get single dated occurrence details |

**Generation Semantics & Conflict Detection:**
- Generator locks $V \rightarrow U \rightarrow R$ in ascending ID order.
- Reads scheduled occurrences in the window via a single query and skips conflicting slots rather than failing.
- Conflict types: `ROOM_BUSY`, `PROFESSOR_BUSY`, `ROOM_INACTIVE`.
- Returns `createdCount`, `conflictCount`, and `conflicts` list with detailed conflict descriptors.
- Supports idempotent gap-filling: cancelling an ad-hoc extra class and re-running generation projects the missing official class cleanly.

**Sample Generation Response with Conflict:**
```json
{
  "createdCount": 4,
  "conflictCount": 1,
  "conflicts": [
    {
      "date": "2026-10-12",
      "dayOfWeek": "MONDAY",
      "startTime": "09:00:00",
      "endTime": "10:00:00",
      "roomId": 1,
      "professorId": 2,
      "conflictType": "ROOM_BUSY",
      "conflictingOccurrenceId": 105,
      "conflictingEventType": "EXTRA"
    }
  ]
}
```

---

### 5. Advisory Room Availability Search Engine

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/rooms/available` | Authenticated | Search strictly available rooms satisfying all hard constraints |

**Query Parameters:**
- `date` (`LocalDate`, required)
- `startTime` (`LocalTime`, required)
- `endTime` (`LocalTime`, required)
- `capacity` (`Integer`, optional minimum capacity)
- `complexId` (`Integer`, optional hard filter)
- `roomType` (`RoomType`, optional hard filter)
- `facilities` (`String`, optional comma-separated IDs, strict AND match)

*Note: All constraints in `/api/rooms/available` remain strictly filtered. If the requesting professor has a personal schedule conflict, it returns an empty list (`[]`).*

---

### 6. Transactional Extra-Class Booking (Concurrency Protected)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | `ROLE_PROFESSOR` | Reserve room for extra class with pessimistic write locking |

**Sample Request:**
```json
POST /api/bookings
Content-Type: application/json

{
  "roomId": 1,
  "date": "2026-11-05",
  "startTime": "14:00",
  "endTime": "15:00",
  "courseCode": "CS301",
  "courseName": "Database Systems"
}
```

**Validation & Rules:**
- Booking date before today (via injected `Clock`) returns `400 Bad Request`.
- Acquires locks in order: **User ($U$) $\rightarrow$ Room ($R$)**.
- Concurrent collisions return `409 Conflict`.

---

### 7. Class Cancellation & Non-Destructive Rescheduling

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/classes/{id}/cancel` | `ROLE_PROFESSOR`, `ROLE_ADMIN` | Cancel scheduled class occurrence; instantly unblocks room availability |
| `POST` | `/api/classes/{id}/reschedule` | `ROLE_PROFESSOR`, `ROLE_ADMIN` | Non-destructively move class to new date/time/room |

**Sample Reschedule Request:**
```json
POST /api/classes/42/reschedule
Content-Type: application/json

{
  "date": "2026-12-10",
  "startTime": "15:00",
  "endTime": "16:00",
  "roomId": 3
}
```

**Non-Destructive Rescheduling Semantics:**
- Only occurrences with `status = SCHEDULED` can be cancelled or rescheduled (otherwise returns `409 Conflict`).
- Moving to an identical slot or target date before today returns `400 Bad Request`.
- The original occurrence row is **never moved or deleted**. Its status is updated to `RESCHEDULED`, preserving its original date, time, and room for historical auditing.
- A new replacement occurrence is inserted with `status = SCHEDULED`, `timetableEntry = null`, and `rescheduledFrom` referencing the original occurrence ID.
- Lock acquisition order: **Occurrence ($O$) $\rightarrow$ User ($U$) $\rightarrow$ Room ($R$)** (locking old then new room in ascending ID order if differing).
- The response returns the replacement occurrence with `rescheduledFromId` populated.

**Sample Reschedule Response:**
```json
{
  "id": 88,
  "timetableEntryId": null,
  "courseCode": "CS101",
  "courseName": "Intro to Programming",
  "eventType": "OFFICIAL",
  "scheduleDate": "2026-12-10",
  "startTime": "15:00:00",
  "endTime": "16:00:00",
  "status": "SCHEDULED",
  "room": {
    "id": 3,
    "roomNumber": "LH-301",
    "roomType": "LECTURE_HALL",
    "capacity": 60,
    "complexId": 1,
    "complexName": "Science & Engineering Complex"
  },
  "professor": {
    "id": 2,
    "name": "Alan Turing",
    "email": "aturing@classsync.edu"
  },
  "rescheduledFromId": 42
}
```

---

### 8. Explainable Room Recommendation & Ranking Engine

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/rooms/recommendations` | Authenticated | Scores and ranks eligible rooms with soft preferences and explainable reasons |

**Hard vs. Soft Constraints:**
- **Hard Filters (candidate elimination)**: Room active, complex active, room free in requested slot, requesting professor free in slot, capacity $\ge$ requested (if specified).
- **Soft Preferences (scored, never eliminated)**: Complex location, room type, requested facilities, campus utilization, schedule continuity.

**The 5-Factor Scoring Model:**
$$\text{Score} = 30 \times \text{CapacityFit} + 25 \times \text{LocationFit} + 20 \times \text{UtilizationBalance} + 15 \times \text{PreferenceFit} + 10 \times \text{Continuity}$$

1. **CapacityFit (30%)**: Prefers rooms that fit the requested capacity without massive wasted space: $\text{clamp}(\text{reqCap} / \text{roomCap}, 0.0, 1.0)$.
2. **LocationFit (25%)**: $1.0$ if matching requested complex, $0.0$ if different complex. When complex is unspecified, defaults to **1.0** (neutral preference satisfied, no reason added).
3. **UtilizationBalance (20%)**: Rolling 30-day scheduled occurrence count. The least congested room gets the highest score ($1.0$), distributing campus load via a single grouped SQL query.
4. **PreferenceFit (15%)**: Evaluates room type match and proportion of requested active facilities satisfied.
5. **Continuity (10%)**: $1.0$ if the requesting professor has an adjacent preceding or following class in the same room on the same day. Perfect scores of **100.0** are fully reachable.

**Exact Reason Strings:**
- Location: `"Room is in the requested complex"` / `"Room is in a different complex than requested"`
- Room Type: `"Room matches requested room type"` / `"Room type differs from requested room type"`
- Facilities: `"Room matches requested facilities"` / `"Room partially matches requested facilities (X of Y)"` / `"Room has none of the requested facilities"`
- Continuity: `"Professor has a preceding class in this room"` / `"Professor has a following class in this room"`

---

## Key Mathematical & Algorithmic Innovations

### 1. Half-Open Interval Collision Formula
All classes operate on half-open intervals $[S, E)$. A class ending at `10:00` allows the next class to begin at `10:00:00`.
Two intervals $[S_1, E_1)$ and $[S_2, E_2)$ collide if and only if:
$$\mathbf{S_1 < E_2 \quad \land \quad E_1 > S_2}$$

### 2. High-Performance Calendar Occurrence Projection
Calendar occurrence generation executes a constant number of read/lock queries, independent of the projection window size:
1. `SELECT ... FOR UPDATE` on the target version;
2. `SELECT ... FOR UPDATE` on all professors involved (in ascending ID order);
3. `SELECT ... FOR UPDATE` on all rooms involved (in ascending ID order);
4. `SELECT` loading active timetable entries;
5. Single `SELECT` fetching all scheduled occurrences across target rooms and professors within the date window.

New occurrences are then inserted (one `INSERT` per new row because `GenerationType.IDENTITY` disables Hibernate JDBC batch inserts).

### 3. Global Lock Hierarchy ($V \rightarrow O \rightarrow U \rightarrow R$)
All concurrent operations acquire pessimistic locks in a strict global sequence with ascending primary key IDs within each table:

$$\mathbf{TimetableVersion \ (V)} \quad \longrightarrow \quad \mathbf{ScheduleOccurrence \ (O)} \quad \longrightarrow \quad \mathbf{User \ (U)} \quad \longrightarrow \quad \mathbf{Room \ (R)}$$

| Operation | Locks Acquired (in strict order) |
|---|---|
| **Activation** | Version $V$ (target, then current active if any) |
| **Generation** | Version $V$ (target) $\rightarrow$ Users $U$ (ascending professor IDs) $\rightarrow$ Rooms $R$ (ascending room IDs) |
| **Booking** | User $U$ (requesting professor) $\rightarrow$ Room $R$ (target room) |
| **Cancellation** | Occurrence $O$ (target occurrence) $\rightarrow$ User $U$ (professor) $\rightarrow$ Room $R$ (room) |
| **Rescheduling** | Occurrence $O$ (target occurrence) $\rightarrow$ User $U$ (professor) $\rightarrow$ Room(s) $R$ (ascending ID order) |

Because lock queries select single tables and follow this uniform order, circular waits cannot arise among transactions. MySQL InnoDB deadlock detection combined with `PessimisticLockingFailureException` mapping to `409 Conflict` serves as a defensive safety net.

---

## Testing & Quality Assurance

ClassSync is validated by **216 automated integration tests** with a **100% pass rate**. Tests execute exclusively against an isolated database `classsync_test` (catalog verified at test startup, overridable via `TEST_DB_URL`). The test clock is locked to `2026-10-01` via `app.clock.fixed-date` so hardcoded test dates remain valid indefinitely. The developer database `classsync` is never touched during test execution.

```text
Results from Surefire Reports:
- ClassSyncApplicationTests                     :   1 /   1 PASS
- TestDatabaseIsolationTest                     :   1 /   1 PASS
- GenerationConcurrencyIntegrationTests         :   1 /   1 PASS
- AvailabilityIntegrationTests                 :  19 /  19 PASS
- BookingIntegrationTests                      :  26 /  26 PASS
- ClassScheduleIntegrationTests                :  37 /  37 PASS
- DomainIntegrationTests                       :  19 /  19 PASS
- HealthControllerTest                         :   1 /   1 PASS
- RecommendationIntegrationTests               :  36 /  36 PASS
- ScheduleOccurrenceIntegrationTests           :  27 /  27 PASS
- TimetableIntegrationTests                    :  23 /  23 PASS
- GlobalExceptionHandlerTest                   :   1 /   1 PASS
- RepositoryIntegrationTests                   :   3 /   3 PASS
- SecurityAuthenticationTests                  :  21 /  21 PASS
-------------------------------------------------------------------------------------------------------
Total Tests Run: 216, Failures: 0, Errors: 0, Skipped: 0
Build Status: BUILD SUCCESS
```

Run the complete test suite:
```bash
mvn clean test
```
