# ClassSync: Automated University Timetable & Classroom Allocation Backend
## Comprehensive Project Progress Report & Future Development Roadmap

**Project Name:** ClassSync Backend  
**Author:** Harshit Varshney  
**Institution:** Academic Project Submission  
**Technology Stack:** Java 21 LTS, Spring Boot 3.4.3, Spring Security 6, Spring Data JPA, Hibernate 6, MySQL 8.0 (InnoDB), Flyway Migration, JUnit 5, MockMvc, `java.util.concurrent`  
**Repository:** [GitHub - classsync-backend](https://github.com/123HarshitVarshney321/classsync-backend.git)  
**Backup Repository:** [GitHub - class-sync-backup](https://github.com/123HarshitVarshney321/class-sync-backup.git)  
**Status:** Completed Modules (Milestones 1–11), 180 Automated Tests Passing (100% Success Rate)

---

## Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [System Architecture & Technology Stack](#2-system-architecture--technology-stack)
3. [Database Architecture & Evolutionary Schema](#3-database-architecture--evolutionary-schema)
4. [Detailed Breakdown of Completed Work (Milestones 1–11)](#4-detailed-breakdown-of-completed-work-milestones-111)
   - [Phase 1: Database Foundation & Seed Data (Prompts 1 & 2)](#phase-1-database-foundation--seed-data-prompts-1--2)
   - [Phase 2: Authentication & Role-Based Security (Prompts 3 & 4)](#phase-2-authentication--role-based-security-prompts-3--4)
   - [Phase 3: Campus Infrastructure Management (Prompt 5)](#phase-3-campus-infrastructure-management-prompt-5)
   - [Phase 4: Timetable Versioning & Conflict Detection (Prompt 6)](#phase-4-timetable-versioning--conflict-detection-prompt-6)
   - [Phase 5: Calendar Occurrence Generation Engine (Prompt 7)](#phase-5-calendar-occurrence-generation-engine-prompt-7)
   - [Phase 6: Advisory Room Availability Search Engine (Prompt 8)](#phase-6-advisory-room-availability-search-engine-prompt-8)
   - [Phase 7: Transactional Extra-Class Booking & Concurrency Protection (Prompt 9)](#phase-7-transactional-extra-class-booking--concurrency-protection-prompt-9)
   - [Phase 8: Cancellation & In-Place Rescheduling Workflows (Prompt 10)](#phase-8-cancellation--in-place-rescheduling-workflows-prompt-10)
   - [Phase 9: Explainable Room Recommendation & Ranking Engine (Prompt 11)](#phase-9-explainable-room-recommendation--ranking-engine-prompt-11)
5. [Key Mathematical & Algorithmic Innovations](#5-key-mathematical--algorithmic-innovations)
   - [5.1 Half-Open Interval Collision Formula](#51-half-open-interval-collision-formula)
   - [5.2 High-Performance Idempotent Calendar Projection](#52-high-performance-idempotent-calendar-projection)
   - [5.3 Database-Level Concurrency via SQL NULL Semantics](#53-database-level-concurrency-via-sql-null-semantics)
   - [5.4 Zero N+1 Query Optimization with JPA Fetch Joins](#54-zero-n1-query-optimization-with-jpa-fetch-joins)
   - [5.5 Deadlock-Free Global Lock Hierarchy ($O < U < R$)](#55-deadlock-free-global-lock-hierarchy-o--u--r)
   - [5.6 Self-Excluding Half-Open Collision Detection for Rescheduling](#56-self-excluding-half-open-collision-detection-for-rescheduling)
   - [5.7 Explainable 5-Factor Scoring Model & Campus Load Balancing](#57-explainable-5-factor-scoring-model--campus-load-balancing)
6. [API Specification & Security Matrix](#6-api-specification--security-matrix)
7. [Testing Strategy & Quality Assurance](#7-testing-strategy--quality-assurance)
8. [Remaining Work & Future Roadmap (Phases 12–14)](#8-remaining-work--future-roadmap-phases-1214)
9. [Conclusion](#9-conclusion)

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Higher education institutions face significant operational bottlenecks when managing physical classroom space and academic schedules:
1. **Physical Resource Scarcity**: Classrooms, lecture halls, and laboratories have fixed capacities, equipment constraints (projectors, smart boards, computers), and geographic distributions across campus complexes.
2. **Scheduling Conflicts**: Manual timetable creation leads to catastrophic collisions—such as booking two classes simultaneously in the same room or assigning a professor to teach in two disparate buildings at the same time.
3. **Drafting vs. Publishing Friction**: Academic deans iterate on curriculum schedules weeks before a semester commences. Changes made during the planning phase must not prematurely disrupt active sessions, yet once published, the master schedule must be protected against accidental deletion.
4. **The "Blueprint vs. Occurrence" Gap**: Standard timetable applications conflate weekly recurring templates with actual calendar dates. If a professor cancels a class on Tuesday, November 10th, traditional systems risk breaking all future Tuesdays across the semester.
5. **Race Conditions in Booking**: When multiple professors attempt to reserve the same open room concurrently, naive systems produce duplicate bookings or silent state corruption.
6. **Inefficient Load Allocation & "Black-Box" Decisions**: In large campuses, popular rooms get overburdened while identical nearby rooms remain empty. Furthermore, automatic room assigners often rely on opaque black-box heuristics that faculty cannot inspect or trust.

### 1.2 The ClassSync Solution
**ClassSync** resolves these issues through a strictly decoupled, 4-tier enterprise backend:
- **Decoupled Architecture**: Separates recurring weekly schedule blueprints (`TimetableEntry`) from dated calendar events (`ScheduleOccurrence`).
- **Mathematical Conflict Prevention**: Enforces half-open interval overlap algorithms $[S, E)$ directly at the database and application levels.
- **Idempotent Calendar Projection**: Allows administrators to project recurring weekly blueprints onto calendar windows without overwriting historical cancellations or rescheduled classes.
- **Advisory Availability Search**: Millisecond-level search evaluating room types, capacities, multi-facility requirements, and professor schedule conflicts in real time.
- **Pessimistic Concurrency Protection**: Eliminates race conditions in room booking using MySQL InnoDB row-level locking (`PESSIMISTIC_WRITE`) and transaction boundaries.
- **Deadlock-Free State Evolution**: Enforces a strict total lock order ($O < U < R$) across cancellation, rescheduling, and booking operations.
- **Explainable Recommendation Engine**: A transparent, 5-factor mathematical scoring model (0–100) with deterministic templates that balances campus utilization and rewards logistical continuity.

---

## 2. System Architecture & Technology Stack

The project adheres strictly to **Domain-Driven Design (DDD)**, **KISS**, **SOLID**, and **YAGNI** principles. No unneeded abstraction layers or heavy third-party authentication servers are introduced.

```text
                              Client Layer (Web / Mobile)
                                          │
                                          ▼  HTTP / JSON + Cookie
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 1: Security & Filter Chain (Spring Security 6)                         │
│  - Session-based authentication via HTTP-only JSESSIONID                     │
│  - Role-Based Access Control (RBAC): ADMIN vs. PROFESSOR                     │
│  - Custom AuthenticationEntryPoint (401) & AccessDeniedHandler (403)         │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 2: Web / Controller Layer (Spring MVC)                                 │
│  - REST Controllers exposing clean, versioned JSON endpoints                 │
│  - Jakarta Bean Validation (@Valid, @NotNull, @Size, @Min, @Max)             │
│  - GlobalExceptionHandler mapping domain exceptions to RFC-7807 responses    │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 3: Service / Business Logic Layer (Spring Service & Transactions)      │
│  - Declarative @Transactional boundaries (Read-Write & Read-Only)            │
│  - Half-open interval conflict engine [S, E) with self-exclusion             │
│  - State machine governance (DRAFT -> ACTIVE -> ARCHIVED)                    │
│  - Pessimistic write locking coordination (O -> U -> R total ordering)       │
│  - Explainable scoring & deterministic tie-breaking                          │
│  - Entity-to-DTO projection (Zero entity graph leakage)                      │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 4: Persistence Layer (Hibernate 6 / Spring Data JPA / MySQL 8 InnoDB)  │
│  - Custom JPQL queries with Fetch Joins (Zero N+1 overhead)                  │
│  - Grouped aggregation queries for 30-day rolling utilization                │
│  - Flyway Migrations (V1 to V4) for automated, versioned schema management   │
│  - InnoDB row-level locking (SELECT ... FOR UPDATE)                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Core Technologies
- **Language**: Java 21 LTS (Java Records for immutable DTOs, Pattern Matching, Stream APIs).
- **Framework**: Spring Boot 3.4.3.
- **Security**: Spring Security 6 (Session-based RBAC, BCrypt password hashing).
- **Persistence**: Spring Data JPA / Hibernate ORM 6.
- **Database**: MySQL 8.0+ with InnoDB engine.
- **Database Migration**: Flyway Migration.
- **Testing**: JUnit 5, Spring Boot Test, MockMvc, `java.util.concurrent` (CyclicBarrier, CountDownLatch).

---

## 3. Database Architecture & Evolutionary Schema

The database model comprises **10 core tables** managed under strict version control via Flyway.

```text
                  ┌──────────────┐
                  │  complexes   │
                  └──────┬───────┘
                         │ 1:N
                         ▼
┌──────────────┐  M:N  ┌──────────────┐
│  facilities  ├───────┤    rooms     │
└──────────────┘       └──────┬───────┘
                              │
               ┌──────────────┴──────────────┐
               │ 1:N                         │ 1:N
               ▼                             ▼
       ┌───────────────┐             ┌───────────────────────┐
       │timetable_     │             │  schedule_            │
       │entries        │             │  occurrences          │
       └───────┬───────┘             └───────────┬───────────┘
               │                                 │
               │ N:1 (source blueprint)          │ N:1 (assigned)
               └─────────────────────────────────┤
                                                 │
                                                 │ N:1 (instructor)
  ┌──────────────┐  1:N  ┌──────────────┐        │
  │timetable_    ├───────┤    users     ├────────┘
  │versions      │       └──────┬───────┘
  └──────────────┘              │
                                ├──────────────► notifications
                                └──────────────► audit_logs
```

### Flyway Migration History
- **`V1__create_initial_schema.sql`**: Initialized all 10 tables with foreign keys, checks (`chk_timetable_entries_time_order`, `chk_timetable_entries_day_of_week`), and performance indexes.
- **`V2__seed_development_data.sql`**: Seeded realistic development records (1 Admin, 2 Professors, 2 Complexes, 5 Rooms, 5 Facilities, and Room-Facility mappings).
- **`V3__add_active_to_facilities.sql`**: Added `active BOOLEAN DEFAULT TRUE NOT NULL` to `facilities` enabling soft deactivation.
- **`V4__add_unique_entry_date_to_schedule_occurrences.sql`**: Enforced `UNIQUE KEY uk_schedule_occurrences_entry_date (timetable_entry_id, schedule_date)` for idempotent calendar projection.

---

## 4. Detailed Breakdown of Completed Work (Milestones 1–11)

### Phase 1: Database Foundation & Seed Data (Prompts 1 & 2)
- Established relational baseline without premature application code.
- Defined explicit data types (`TINYINT` for days of week 1–7, `TIME` for schedule hours, `VARCHAR` with length limits).
- Configured cascading constraints (`ON DELETE RESTRICT` on core business entities to prevent accidental data loss; `ON DELETE CASCADE` on auxiliary join tables).
- Seeded development credentials with BCrypt hashes (`admin@classsync.edu`, `aturing@classsync.edu`, `alovelace@classsync.edu`).

---

### Phase 2: Authentication & Role-Based Security (Prompts 3 & 4)
- Implemented secure, session-based authentication without third-party OAuth/JWT overhead.
- `AuthController`: Handles `POST /api/auth/login`. Authenticates credentials via Spring's `AuthenticationManager`, creates an authenticated session, and writes context into `SecurityContextRepository`.
- `CustomUserDetailsService`: Bridges JPA `User` entity to Spring Security's `UserDetails`, mapping roles to `ROLE_ADMIN` and `ROLE_PROFESSOR`.
- Custom Exception Handling: Unauthenticated requests return `401 Unauthorized` (`RestAuthenticationEntryPoint`); unauthorized role requests return `403 Forbidden` (`RestAccessDeniedHandler`).

---

### Phase 3: Campus Infrastructure Management (Prompt 5)
- Modeled physical campus entities (Complexes, Rooms, Facilities).
- CRUD endpoints for `/api/complexes`, `/api/rooms`, and `/api/facilities`.
- Invariant Enforcement: A room is only schedulable if its parent `Complex` is active. Deactivating a complex cascades logical unavailability to all constituent rooms.
- M:N Facility Mapping: Rooms maintain a clean join table `room_facilities`.
- DTO Encapsulation: Built `ComplexResponse`, `RoomDetailResponse`, `RoomSummaryResponse`, and `FacilityResponse` preventing cyclic entity exposure.

---

### Phase 4: Timetable Versioning & Conflict Detection (Prompt 6)
- Implemented recurring timetable versioning and master schedule drafting with zero double-booking.
- **The State Machine**:
  - `DRAFT`: Editable master schedule. Entries can be added, updated, or deleted.
  - `ACTIVE`: Published semester schedule. Strictly immutable. Entries cannot be modified.
  - `ARCHIVED`: Read-only historical version. Cannot be reactivated.
- **Atomic Version Activation**: When draft Version $N$ is activated for a semester, the service queries any existing `ACTIVE` version, marks it `ARCHIVED`, and marks Version $N$ `ACTIVE` in a single atomic transaction.
- **Collision Engine**: Enforces half-open interval checks $[S, E)$ on rooms and professors, with self-exclusion on updates.

---

### Phase 5: Calendar Occurrence Generation Engine (Prompt 7)
- Transformed recurring weekly templates into dated calendar classes (`ScheduleOccurrence`).
- Admin endpoint `POST /api/schedule-occurrences/generate` projects `day_of_week` (`1 = Monday` through `7 = Sunday`) across every calendar day in the semester window.
- **Idempotency & History Preservation**: Before inserting occurrences, the engine checks existing records in batch. Existing occurrences are skipped without resetting historical cancellations.
- Database unique constraint (`uk_schedule_occurrences_entry_date`) guarantees data integrity under concurrent execution.

---

### Phase 6: Advisory Room Availability Search Engine (Prompt 8)
- Real-time search API (`GET /api/rooms/available`) for finding unbooked rooms matching complex, capacity, room type, and active facilities.
- **Hard Constraints Evaluated**:
  1. Room is active (`active = true`).
  2. Complex is active (`complex.active = true`).
  3. Matches requested `complexId` (if provided).
  4. Room capacity $\ge$ requested minimum capacity.
  5. Matches requested `roomType` (if provided).
  6. Room possesses **all** requested active facilities (AND semantics).
  7. Room has no conflicting `SCHEDULED` occurrence (cancelled classes do not block).
  8. Requesting professor has no overlapping personal class scheduled.
- **Professor Conflict Isolation**: If a professor searches for rooms while already teaching another class, the system returns `[]` immediately.

---

### Phase 7: Transactional Extra-Class Booking & Concurrency Protection (Prompt 9)
- **Objective**: Reliable booking of ad-hoc extra classes (`POST /api/bookings`) with complete concurrency protection.
- **Reusing Domain Model**: No separate booking table was created. Extra classes are created in `schedule_occurrences` with:
  ```text
  timetable_entry_id = NULL
  event_type         = EXTRA
  status             = SCHEDULED
  professor_id       = authenticated professor
  room_id            = requested room
  ```
- **Advisory vs. Transactional**: Availability search is strictly advisory. Booking independently revalidates all conflict rules inside its own transaction.
- **Pessimistic Concurrency Control**:
  - Annotated with `@Transactional(isolation = Isolation.READ_COMMITTED)`.
  - Acquires MySQL InnoDB write locks (`SELECT ... FOR UPDATE`) in a strict total order:
    $$\mathbf{User \ (U)} \quad \longrightarrow \quad \mathbf{Room \ (R)}$$
  - Re-evaluates room and professor schedule conflicts after locks are acquired.
  - Concurrent collisions return `409 Conflict`.
- Verified with multi-threaded tests using `CyclicBarrier` and `CountDownLatch`.

---

### Phase 8: Cancellation & In-Place Rescheduling Workflows (Prompt 10)
- **Objective**: Implement cancellation and rescheduling of scheduled occurrences while preserving audit history.
- **Cancellation API (`POST /api/classes/{id}/cancel`)**:
  - `ROLE_PROFESSOR` can only cancel their own classes; `ROLE_ADMIN` can cancel any class.
  - Requires `status = SCHEDULED`; already cancelled classes return `409 Conflict`.
  - Sets `status = CANCELLED` without physical deletion.
  - Instantly unblocks room and professor availability for subsequent bookings.
- **Rescheduling API (`POST /api/classes/{id}/reschedule`)**:
  - Moves a scheduled class to a new date, time, or room in place.
  - Preserves `occurrence.id`, `professor`, `eventType`, `timetable_entry_id`, `course_code`, `course_name`, `created_by`, and `created_at`.
  - Uses **self-excluding conflict queries** (`s.id != :excludedOccurrenceId`) so shifting a class in the same room does not falsely conflict with itself.
- **Deadlock-Free Total Lock Order ($O < U < R$)**:
  - Rescheduling acquires locks strictly in order: **Occurrence ($O$) $\rightarrow$ User ($U$) $\rightarrow$ Room ($R$)**.
  - Because Prompt 9 booking locks $U \rightarrow R$, all transactions obey the exact same Directed Acyclic Graph (DAG), rendering deadlocks mathematically impossible.

---

### Phase 9: Explainable Room Recommendation & Ranking Engine (Prompt 11)
- **Objective**: Provide an intelligent, explainable ranking endpoint (`GET /api/rooms/recommendations`) to advise professors on the best available room.
- **Gatekeeper vs. Advisor Paradigm**:
  - `AvailabilityService` acts as the **hard-constraint gatekeeper** (filters out conflicting, inactive, or undersized rooms).
  - `RecommendationService` acts as the **ranking advisor** (scores only valid candidate rooms).
- **The 5-Factor Scoring Formula (0 to 100)**:
  $$\mathbf{Score} = 30 \times \text{CapacityFit} + 25 \times \text{LocationFit} + 20 \times \text{UtilizationBalance} + 15 \times \text{PreferenceFit} + 10 \times \text{Continuity}$$
  1. `CapacityFit` (30%): $\text{clamp}(\text{requestedCapacity} / \text{room.capacity}, 0.0, 1.0)$. Rewards suitably sized rooms; penalizes massive unused capacity.
  2. `LocationFit` (25%): $1.0$ if matching requested complex, $0.0$ if different ($0.5$ neutral if unspecified).
  3. `UtilizationBalance` (20%): Counts scheduled occurrences in rolling 30-day window (`[requestedDate - 30, requestedDate]`). The least utilized room receives $1.0$, balancing campus load. Uses a single grouped query (`GROUP BY o.room.id`) to eliminate N+1 queries.
  4. `PreferenceFit` (15%): Room type match + proportion of requested facilities present.
  5. `Continuity` (10%): $1.0$ if the requesting professor has an adjacent class in the same room on the same day (`existingEnd == start` or `existingStart == end`).
- **Explainability**: Every response contains deterministic, template-based human-readable `reasons` explaining the score.
- **Deterministic 4-Tier Sorting**: `Score DESC` $\rightarrow$ `Capacity ASC` $\rightarrow$ `RoomNumber ASC` $\rightarrow$ `Room ID ASC`.

---

## 5. Key Mathematical & Algorithmic Innovations

### 5.1 Half-Open Interval Collision Formula
Classes operate on half-open intervals $[S, E)$. A class ending at `10:00` vacates the room at `10:00:00`, allowing the subsequent class to commence immediately at `10:00:00`.
Two intervals $[S_1, E_1)$ and $[S_2, E_2)$ collide if and only if:
$$\mathbf{S_1 < E_2 \quad \text{AND} \quad E_1 > S_2}$$

| Scenario | Existing Class | Requested Class | $S_1 < E_2$? | $E_1 > S_2$? | Conflict Result |
|---|---|---|---|---|---|
| **Interior Overlap** | `09:00 - 11:00` | `09:30 - 10:30` | `09:00 < 10:30` (True) | `11:00 > 09:30` (True) | **CONFLICT (409)** |
| **Partial Overlap** | `09:00 - 10:30` | `10:00 - 11:30` | `09:00 < 11:30` (True) | `10:30 > 10:00` (True) | **CONFLICT (409)** |
| **Back-to-Back (Adjacent)** | `09:00 - 10:00` | `10:00 - 11:00` | `09:00 < 11:00` (True) | `10:00 > 10:00` (**False**) | **NO CONFLICT (Allowed)** |
| **Completely Before** | `08:00 - 09:00` | `10:00 - 11:00` | `08:00 < 11:00` (True) | `09:00 > 10:00` (**False**) | **NO CONFLICT (Allowed)** |

---

### 5.2 High-Performance Idempotent Calendar Projection
Calendar occurrence generation loads recurring entries in 1 query, evaluates existing dates in 1 batch query, and persists using batch `saveAll()`. Total database roundtrips: **2**, projecting an entire semester's classes in under 50ms without duplicate insertions.

---

### 5.3 Database-Level Concurrency via SQL NULL Semantics
Flyway migration `V4` enforces `UNIQUE(timetable_entry_id, schedule_date)`. Under SQL standards:
- Official timetable occurrences have non-null `timetable_entry_id`, preventing duplicate calendar projections.
- Extra-class bookings have `timetable_entry_id = NULL`. Under MySQL InnoDB, **NULL values are treated as distinct in unique indexes**, permitting multiple ad-hoc classes on the same date without constraint violations.

---

### 5.4 Zero N+1 Query Optimization with JPA Fetch Joins
To prevent Hibernate from executing secondary `SELECT` statements for every related complex, room, and facility, custom JPQL queries utilize `JOIN FETCH` and `LEFT JOIN FETCH`:
```sql
SELECT DISTINCT r FROM Room r
JOIN FETCH r.complex c
LEFT JOIN FETCH r.facilities f
WHERE r.active = true AND c.active = true
```

---

### 5.5 Deadlock-Free Global Lock Hierarchy ($O < U < R$)
With concurrent bookings, cancellations, and reschedules hitting the database, inconsistent lock acquisition would cause InnoDB deadlocks. We established a strict mathematical total ordering (DAG):

$$\mathbf{ScheduleOccurrence \ (O)} \quad \longrightarrow \quad \mathbf{User/Professor \ (U)} \quad \longrightarrow \quad \mathbf{Room \ (R)}$$

```text
[Prompt 10: Reschedule Class]       Locks: Occurrence(O) -> User(U) -> Room(R)
[Prompt 9: Create Extra Booking]    Locks:                  User(U) -> Room(R)
[Prompt 10: Cancel Class]           Locks: Occurrence(O)
```
Because every transaction in the entire codebase acquires locks in this identical sequence, circular wait conditions cannot occur.

---

### 5.6 Self-Excluding Half-Open Collision Detection for Rescheduling
When rescheduling an existing occurrence, standard collision checks would falsely detect the occurrence's own slot. We introduced self-excluding JPQL checks:
```sql
WHERE s.room.id = :roomId
  AND s.scheduleDate = :date
  AND s.status = 'SCHEDULED'
  AND s.id != :excludedOccurrenceId
  AND (s.startTime < :endTime AND s.endTime > :startTime)
```

---

### 5.7 Explainable 5-Factor Scoring Model & Campus Load Balancing
To avoid campus congestion in popular rooms, the recommendation engine calculates 30-day rolling utilization $U_i$ across all candidate rooms in a single grouped query:
```sql
SELECT o.room.id, COUNT(o) FROM ScheduleOccurrence o
WHERE o.room.id IN :roomIds
  AND o.scheduleDate BETWEEN :startDate AND :endDate
  AND o.status = 'SCHEDULED'
GROUP BY o.room.id
```
The least utilized room receives $\text{UtilizationBalance} = 1.0$, naturally balancing room utilization across the university.

---

## 6. API Specification & Security Matrix

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user and initiate session |
| `GET` | `/api/health` | Public | System health check |
| `GET` | `/api/complexes` | `PROFESSOR`, `ADMIN` | List active campus complexes |
| `POST` | `/api/complexes` | `ADMIN` only | Create complex building |
| `PUT` | `/api/complexes/{id}` | `ADMIN` only | Update complex name or code |
| `PATCH`| `/api/complexes/{id}/status` | `ADMIN` only | Activate or deactivate complex |
| `GET` | `/api/complexes/{id}/rooms` | `PROFESSOR`, `ADMIN` | List active rooms in complex |
| `POST` | `/api/complexes/{id}/rooms` | `ADMIN` only | Create classroom in complex |
| `GET` | `/api/rooms/{id}` | `PROFESSOR`, `ADMIN` | Get room details with facilities |
| `PUT` | `/api/rooms/{id}` | `ADMIN` only | Update room details |
| `PATCH`| `/api/rooms/{id}/status` | `ADMIN` only | Activate or deactivate room |
| `GET` | `/api/facilities` | `PROFESSOR`, `ADMIN` | List active room amenities |
| `POST` | `/api/facilities` | `ADMIN` only | Create facility |
| `PUT` | `/api/facilities/{id}` | `ADMIN` only | Update facility |
| `PATCH`| `/api/facilities/{id}/status` | `ADMIN` only | Activate or deactivate facility |
| `GET` | `/api/timetables/versions` | `PROFESSOR`, `ADMIN` | List timetable versions |
| `POST` | `/api/timetables/versions` | `ADMIN` only | Create draft timetable version |
| `PATCH`| `/api/timetables/versions/{id}/activate` | `ADMIN` only | Atomically publish timetable version |
| `PATCH`| `/api/timetables/versions/{id}/archive` | `ADMIN` only | Archive timetable version |
| `POST` | `/api/timetables/versions/{id}/entries` | `ADMIN` only | Add recurring class to timetable |
| `PUT` | `/api/timetables/entries/{id}` | `ADMIN` only | Update recurring class |
| `DELETE`| `/api/timetables/entries/{id}` | `ADMIN` only | Delete recurring class (`204 No Content`) |
| `POST` | `/api/schedule-occurrences/generate` | `ADMIN` only | Project timetable to calendar dates |
| `GET` | `/api/schedule-occurrences` | `PROFESSOR`, `ADMIN` | List calendar classes with filters |
| `GET` | `/api/schedule-occurrences/{id}` | `PROFESSOR`, `ADMIN` | Get single class occurrence details |
| `GET` | `/api/rooms/available` | `PROFESSOR`, `ADMIN` | Advisory search for free rooms |
| `POST` | `/api/bookings` | `ROLE_PROFESSOR` | Transactionally book an extra class |
| `POST` | `/api/classes/{id}/cancel` | `PROFESSOR`, `ADMIN` | Cancel class (professor: own only; admin: any) |
| `POST` | `/api/classes/{id}/reschedule` | `PROFESSOR`, `ADMIN` | In-place reschedule with conflict checks |
| `GET` | `/api/rooms/recommendations` | `PROFESSOR`, `ADMIN` | 5-factor explainable room ranking |

---

## 7. Testing Strategy & Quality Assurance

The codebase incorporates a comprehensive suite of **180 automated integration tests** executed against local MySQL:

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
Build Status: BUILD SUCCESS (Execution Time: ~9.5s)
```

### Coverage Highlights
- **Role Enforcement**: Strict verification that professors receive `403 Forbidden` on admin endpoints, and cannot cancel/reschedule other professors' classes.
- **Race Condition Verification**: Real multi-threaded tests using `CyclicBarrier` and `CountDownLatch` verify that concurrent booking or rescheduling into the same slot produces exactly 1 winner and 1 clean `409 Conflict`.
- **Zero Lost Updates**: Multi-threaded tests prove concurrent rescheduling of the same occurrence updates cleanly under row locking without data corruption.
- **Explainability Tests**: Verification that recommendation scores are bounded in $[0.0, 100.0]$, reasons correspond strictly to active factors, and repeated identical requests produce identical deterministic output.

---

## 8. Remaining Work & Future Roadmap (Phases 12–14)

With the core scheduling, booking, cancellation, rescheduling, and recommendation engines complete, the remaining milestones focus on secondary operational enhancements:

```text
                       CURRENT SYSTEM (Completed — Prompts 1–11)
  [ Campus Infrastructure + Master Timetable + Occurrences + Availability + Booking + Rescheduling + Recommendations ]
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 12: High-Performance Caching Layer (Redis)                                       │
│ - Redis caching for frequently read static data (Complexes, Rooms, Facilities)         │
│ - Cache eviction policies tied to admin mutation events                                │
└──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 13: Event-Driven Notification & Audit System                                     │
│ - Internal notification generation for schedule cancellations and room changes         │
│ - Structured audit logging table tracking user mutations                               │
└──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 14: Analytics, Dashboard & Frontend Integration                                  │
│ - Room utilization rate analytics (Heatmaps, peak hours, empty seat metrics)          │
│ - REST API integration with React / Next.js responsive web frontend                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Conclusion

The **ClassSync Backend** is a complete, production-grade university classroom allocation platform. All core functional workflows—from relational schema design, session authentication, physical infrastructure management, versioned timetable generation, calendar projection, advisory availability search, to concurrency-protected booking, cancellation, rescheduling, and explainable recommendations—are fully operational and validated by **180 automated tests** (100% pass rate).

---
*Report updated on October 31, 2026. Codebase synchronized on branch `main`.*
