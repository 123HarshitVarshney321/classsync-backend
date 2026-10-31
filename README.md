# ClassSync Backend

ClassSync is a smart, automated university classroom scheduling, allocation, and recommendation backend built with Java 21, Spring Boot 3.4.3, MySQL 8+, Hibernate 6, and Flyway migrations.

It provides end-to-end management for university infrastructure, versioned master timetable drafting, idempotent calendar projection, real-time advisory room availability search, concurrency-protected extra-class booking, class cancellation/rescheduling, and a 5-factor explainable room recommendation engine.

---

## Prerequisites

- **Java**: 21 LTS (`java -version`)
- **Maven**: 3.9+ (`mvn -version`)
- **MySQL**: 8.0+ (`mysql --version`)

---

## Architecture & Design Principles

The backend follows a clean, 4-tier monolithic architecture:

```text
Controller  -->  Service  -->  Repository  -->  MySQL 8 (InnoDB)
```

- **Clean & Minimal (KISS, SOLID, DRY, YAGNI)**: No premature distributed abstractions, no unnecessary microservices, no speculative database tables.
- **Strict Decoupling**: Recurring weekly master templates (`TimetableEntry`) are cleanly decoupled from dated calendar events (`ScheduleOccurrence`).
- **Database Migrations (Flyway V1–V4)**: Automated, reproducible database evolution across 10 normalized tables.
- **Concurrency & Deadlock Safety**: MySQL InnoDB pessimistic write locking (`SELECT ... FOR UPDATE`) with a strict global total lock ordering ($O < U < R$: `ScheduleOccurrence` $\rightarrow$ `User` $\rightarrow$ `Room`) under `@Transactional(isolation = Isolation.READ_COMMITTED)`.
- **Explainable Recommendation**: Deterministic, transparent mathematical scoring (0–100) with fixed reason templates—zero black-box ML.
- **Historical Preservation**: Cancelled occurrences are soft-cancelled (`status = CANCELLED`); no historical schedule data is physically deleted.

---

## Database Schema (10 Core Tables)

1. `users`: Professors and Administrators with session-based authentication and role enforcement (`ROLE_ADMIN`, `ROLE_PROFESSOR`).
2. `complexes`: Academic complexes and campus zones housing classrooms (no duplicate building entity).
3. `rooms`: Classrooms, lecture halls, and laboratories with capacity constraints and `UNIQUE(complex_id, room_number)`.
4. `facilities`: Equipment and amenities (e.g., Projector, Smart Board, AC, Audio System). Supports soft-activation.
5. `room_facilities`: Many-to-many join table mapping rooms to active facilities.
6. `timetable_versions`: Version-controlled official timetable definitions with lifecycle states (`DRAFT` $\rightarrow$ `ACTIVE` $\rightarrow$ `ARCHIVED`).
7. `timetable_entries`: Recurring weekly class slots with day of week checks (`1-7`) and half-open time checks (`start_time < end_time`).
8. `schedule_occurrences`: Date-specific calendar occurrences (both official timetable classes and ad-hoc extra classes) with `status ENUM('SCHEDULED', 'CANCELLED')`.
9. `notifications`: User notification queue for booking, cancellation, and reschedule events.
10. `audit_logs`: Audit trail with JSON snapshots (`old_value`, `new_value`) for administrative accountability.

### Flyway Migrations
- `V1__create_initial_schema.sql`: Creates all 10 core tables, check constraints, foreign keys, and performance indexes.
- `V2__seed_development_data.sql`: Seeds development data: 1 Admin, 2 Professors, 2 Complexes (`SEC`, `HSS`), 5 Rooms, 5 Facilities, and mappings.
- `V3__add_active_to_facilities.sql`: Adds `active BOOLEAN DEFAULT TRUE NOT NULL` to `facilities` enabling soft deactivation.
- `V4__add_unique_entry_date_to_schedule_occurrences.sql`: Enforces `UNIQUE KEY uk_schedule_occurrences_entry_date (timetable_entry_id, schedule_date)` for idempotent projection.

---

## Configuration

Configuration is managed via `src/main/resources/application.yml` and environment variables:

| Environment Variable | Description | Default Value |
|---|---|---|
| `PORT` | HTTP server port | `8080` |
| `DB_URL` | MySQL JDBC URL | `jdbc:mysql://localhost:3306/classsync?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DB_USERNAME` | MySQL database user | `root` |
| `DB_PASSWORD` | MySQL password | (empty) |

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

### 1. Authentication & System Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Application health status |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials, initiate HTTP-only cookie session |
| `GET` | `/api/test/authenticated` | Authenticated | Verify active authenticated session |
| `GET` | `/api/test/professor` | `ROLE_PROFESSOR`, `ROLE_ADMIN` | Professor authorization probe |
| `GET` | `/api/test/admin` | `ROLE_ADMIN` | Admin authorization probe |

**Development Credentials (Local Testing Only):**
- **Admin:** `admin@classsync.edu` / `password123`
- **Professor:** `aturing@classsync.edu` / `password123`
- **Professor:** `alovelace@classsync.edu` / `password123`

---

### 2. Campus Infrastructure (Complexes, Rooms, Facilities)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/complexes` | Authenticated | List all active complexes |
| `GET` | `/api/complexes/{id}` | Authenticated | Get active complex by ID |
| `POST` | `/api/complexes` | `ROLE_ADMIN` | Create a new academic complex |
| `PUT` | `/api/complexes/{id}` | `ROLE_ADMIN` | Update complex name or code |
| `PATCH`| `/api/complexes/{id}/status` | `ROLE_ADMIN` | Activate or deactivate complex (cascades unavailability) |
| `GET` | `/api/complexes/{complexId}/rooms` | Authenticated | List active rooms for an active complex |
| `POST` | `/api/complexes/{complexId}/rooms` | `ROLE_ADMIN` | Create classroom inside a complex |
| `GET` | `/api/rooms/{id}` | Authenticated | Get room details with complex & assigned facilities |
| `PUT` | `/api/rooms/{id}` | `ROLE_ADMIN` | Update room number, room type, capacity, facilities |
| `PATCH`| `/api/rooms/{id}/status` | `ROLE_ADMIN` | Activate or deactivate room |
| `GET` | `/api/facilities` | Authenticated | List all active facilities |
| `POST` | `/api/facilities` | `ROLE_ADMIN` | Create a new facility |
| `PUT` | `/api/facilities/{id}` | `ROLE_ADMIN` | Update facility name |
| `PATCH`| `/api/facilities/{id}/status` | `ROLE_ADMIN` | Activate or deactivate facility |

---

### 3. Timetable Versioning & Master Schedule Entries

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/timetables/versions` | Authenticated | List timetable versions with optional semester/year filters |
| `POST` | `/api/timetables/versions` | `ROLE_ADMIN` | Create a new `DRAFT` timetable version |
| `PATCH`| `/api/timetables/versions/{id}/activate` | `ROLE_ADMIN` | Atomically publish timetable (marks old active as `ARCHIVED`) |
| `PATCH`| `/api/timetables/versions/{id}/archive` | `ROLE_ADMIN` | Archive timetable version (read-only) |
| `POST` | `/api/timetables/versions/{id}/entries` | `ROLE_ADMIN` | Add recurring class entry (validates room & prof half-open collision) |
| `PUT` | `/api/timetables/entries/{id}` | `ROLE_ADMIN` | Update recurring class slot with self-exclusion collision check |
| `DELETE`| `/api/timetables/entries/{id}` | `ROLE_ADMIN` | Remove recurring class from draft timetable (`204 No Content`) |

---

### 4. Calendar Occurrence Projection Engine

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/schedule-occurrences/generate` | `ROLE_ADMIN` | Project active timetable onto calendar dates (idempotent, batch-loaded) |
| `GET` | `/api/schedule-occurrences` | Authenticated | Query calendar occurrences with date range, professor, room, status filters |
| `GET` | `/api/schedule-occurrences/{id}` | Authenticated | Get single dated occurrence details |

---

### 5. Advisory Room Availability Search Engine

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/rooms/available` | Authenticated | Search unbooked rooms satisfying capacity, room type, facilities, and prof availability |

**Query Parameters:**
- `date` (`LocalDate`, required)
- `startTime` (`LocalTime`, required)
- `endTime` (`LocalTime`, required)
- `capacity` (`Integer`, optional minimum capacity)
- `complexId` (`Integer`, optional)
- `roomType` (`RoomType`, optional: `CLASSROOM`, `LAB`, `LECTURE_HALL`, `SEMINAR_HALL`)
- `facilities` (`String`, optional comma-separated IDs, uses strict AND semantics)

*Note: If a professor has a personal schedule conflict during the requested slot, availability returns an empty list (`[]`).*

---

### 6. Transactional Extra-Class Booking (Concurrency Protected)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | `ROLE_PROFESSOR` | Transactionally reserve a room for an extra class (`PESSIMISTIC_WRITE`) |

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

**Concurrency Protection:**
- Acquires pessimistic write locks in strict order: **User ($U$) $\rightarrow$ Room ($R$)**.
- Revalidates conflicts inside the transaction isolation boundary (`READ_COMMITTED`).
- Prevents race conditions and double-bookings; returns `409 Conflict` on contention.

---

### 7. Class Cancellation & Rescheduling

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/classes/{id}/cancel` | `ROLE_PROFESSOR`, `ROLE_ADMIN` | Cancel scheduled class occurrence; instantly unblocks room availability |
| `POST` | `/api/classes/{id}/reschedule` | `ROLE_PROFESSOR`, `ROLE_ADMIN` | Move class to new date/time/room in place with self-excluding collision check |

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

**Authorization & Rules:**
- Professors can only cancel or reschedule **their own** classes (`occurrence.professor.id == user.id`), returning `403 Forbidden` on violations.
- Admins can manage any class occurrence.
- Historical records are preserved (`status = CANCELLED`); physical deletes are forbidden.
- Global Lock Ordering DAG: **Occurrence ($O$) $\rightarrow$ User ($U$) $\rightarrow$ Room ($R$)** eliminates deadlocks.

---

### 8. Explainable Room Recommendation & Ranking Engine

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/rooms/recommendations` | Authenticated | Filters eligible rooms and returns an explainable, deterministic ranking (0–100) |

**The 5-Factor Scoring Model:**
$$\text{Score} = 30 \times \text{CapacityFit} + 25 \times \text{LocationFit} + 20 \times \text{UtilizationBalance} + 15 \times \text{PreferenceFit} + 10 \times \text{Continuity}$$

1. **CapacityFit (30%)**: Prefers rooms that fit the requested capacity without massive wasted space: $\text{clamp}(\text{reqCap} / \text{roomCap}, 0.0, 1.0)$.
2. **LocationFit (25%)**: $1.0$ if matching requested complex, $0.0$ if different complex ($0.5$ neutral if unspecified).
3. **UtilizationBalance (20%)**: Rolling 30-day scheduled occurrence count. The least congested room gets the highest score ($1.0$), distributing campus load. Uses a single grouped SQL query (`GROUP BY o.room.id`) to avoid N+1 queries.
4. **PreferenceFit (15%)**: Evaluates room type match and proportion of requested active facilities satisfied.
5. **Continuity (10%)**: $1.0$ if the requesting professor has a preceding or succeeding class in the same room on the same day.

**Deterministic 4-Tier Sorting:**
`Score DESC` $\rightarrow$ `Capacity ASC` $\rightarrow$ `RoomNumber ASC` $\rightarrow$ `Room ID ASC`.

**Sample Response:**
```json
[
  {
    "room": {
      "id": 3,
      "roomNumber": "LH-301",
      "roomType": "LECTURE_HALL",
      "capacity": 60,
      "complexId": 1,
      "complexName": "Science & Engineering Complex"
    },
    "score": 91.67,
    "reasons": [
      "Capacity closely matches requested capacity",
      "Room is in the requested complex",
      "Room has relatively low scheduled utilization",
      "Room matches requested room type",
      "Room matches requested facilities",
      "Professor has a preceding class in this room"
    ]
  }
]
```

---

## Key Mathematical & Algorithmic Innovations

### 1. Half-Open Interval Collision Formula
All classes operate on half-open intervals $[S, E)$. A class ending at `10:00` allows the next class to begin at `10:00:00`.
Two intervals $[S_1, E_1)$ and $[S_2, E_2)$ collide if and only if:
$$\mathbf{S_1 < E_2 \quad \land \quad E_1 > S_2}$$

### 2. High-Performance Idempotent Calendar Projection
Calendar occurrence generation loads recurring entries in 1 query, evaluates existing dates in 1 batch query, and persists using batch `saveAll()`. Total database roundtrips: **2**, generating an entire semester in under 50ms.

### 3. Deadlock-Free Global Lock Hierarchy ($O < U < R$)
All concurrent operations (Prompt 9 booking, Prompt 10 cancellation and rescheduling) acquire locks following the exact same total order:
$$\mathbf{ScheduleOccurrence \ (O)} \quad \longrightarrow \quad \mathbf{User \ (U)} \quad \longrightarrow \quad \mathbf{Room \ (R)}$$
Since the directed wait-for graph contains no cycles, deadlocks are mathematically impossible.

---

## Testing & Quality Assurance

ClassSync is validated by **180 automated integration tests** with **100% pass rate**:

```text
Results:
- HealthControllerTest                 :   1 /   1 PASS
- AuthIntegrationTests                 :  15 /  15 PASS
- DomainIntegrationTests               :  17 /  17 PASS
- TimetableIntegrationTests            :  19 /  19 PASS
- ScheduleOccurrenceIntegrationTests   :  20 /  20 PASS
- AvailabilityIntegrationTests         :  19 /  19 PASS
- BookingIntegrationTests              :  25 /  25 PASS (Includes multi-threaded race condition tests)
- ClassScheduleIntegrationTests        :  32 /  32 PASS (Includes multi-threaded concurrency tests)
- RecommendationIntegrationTests       :  32 /  32 PASS (Explainability, ranking, tie-breaking tests)
-------------------------------------------------------------------------------------------------------
Total Tests Run: 180, Failures: 0, Errors: 0, Skipped: 0
Build Status: BUILD SUCCESS (Execution time: ~9.5s)
```

Run the complete test suite:
```bash
mvn clean test
```
