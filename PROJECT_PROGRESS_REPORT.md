# ClassSync: Automated University Timetable & Classroom Allocation Backend
## Comprehensive Project Progress Report & Future Development Roadmap

**Project Name:** ClassSync Backend  
**Author:** Harshit Varshney  
**Institution:** Academic Project Submission  
**Technology Stack:** Java 21 LTS, Spring Boot 3.4.3, Spring Security 6, Spring Data JPA, Hibernate 6, MySQL 8.0 (InnoDB), Flyway Migration, JUnit 5, MockMvc, `java.util.concurrent`  
**Repository:** [GitHub - classsync-backend](https://github.com/123HarshitVarshney321/classsync-backend.git)  
**Backup Repository:** [GitHub - class-sync-backup](https://github.com/123HarshitVarshney321/class-sync-backup.git)  
**Status:** Completed Modules (Milestones 1–11 + Integrity & Hardening Pass 11H), 216 Automated Tests Passing (100% Success Rate)

---

## Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Scope Changes from the Original Abstract](#2-scope-changes-from-the-original-abstract)
3. [System Architecture & Technology Stack](#3-system-architecture--technology-stack)
4. [Database Architecture & Evolutionary Schema (Flyway V1–V6)](#4-database-architecture--evolutionary-schema-flyway-v1v6)
5. [Detailed Breakdown of Completed Work (Milestones 1–11H)](#5-detailed-breakdown-of-completed-work-milestones-111h)
   - [Phase 1: Database Foundation & Seed Data (Prompts 1 & 2)](#phase-1-database-foundation--seed-data-prompts-1--2)
   - [Phase 2: Authentication & Role-Based Security (Prompts 3 & 4)](#phase-2-authentication--role-based-security-prompts-3--4)
   - [Phase 3: Campus Infrastructure Management (Prompt 5)](#phase-3-campus-infrastructure-management-prompt-5)
   - [Phase 4: Timetable Versioning & Conflict Detection (Prompt 6)](#phase-4-timetable-versioning--conflict-detection-prompt-6)
   - [Phase 5: Calendar Occurrence Generation Engine (Prompt 7)](#phase-5-calendar-occurrence-generation-engine-prompt-7)
   - [Phase 6: Advisory Room Availability Search Engine (Prompt 8)](#phase-6-advisory-room-availability-search-engine-prompt-8)
   - [Phase 7: Transactional Extra-Class Booking & Concurrency Protection (Prompt 9)](#phase-7-transactional-extra-class-booking--concurrency-protection-prompt-9)
   - [Phase 8: Cancellation & In-Place Rescheduling Workflows (Prompt 10)](#phase-8-cancellation--in-place-rescheduling-workflows-prompt-10)
   - [Phase 9: Explainable Room Recommendation & Ranking Engine (Prompt 11)](#phase-9-explainable-room-recommendation--ranking-engine-prompt-11)
   - [Phase 10: Integrity & Hardening Pass (Prompt 11H)](#phase-10-integrity--hardening-pass-prompt-11h)
6. [Key Mathematical & Algorithmic Innovations](#6-key-mathematical--algorithmic-innovations)
   - [6.1 Half-Open Interval Collision Formula](#61-half-open-interval-collision-formula)
   - [6.2 High-Performance Calendar Occurrence Projection](#62-high-performance-calendar-occurrence-projection)
   - [6.3 Database-Level Concurrency via SQL NULL Semantics](#63-database-level-concurrency-via-sql-null-semantics)
   - [6.4 Zero N+1 Query Optimization with JPA Fetch Joins](#64-zero-n1-query-optimization-with-jpa-fetch-joins)
   - [6.5 Global Total Lock Hierarchy (V -> O -> U -> R)](#65-global-total-lock-hierarchy-v---o---u---r)
   - [6.6 Non-Destructive Rescheduling & Gap-Filling Projection](#66-non-destructive-rescheduling--gap-filling-projection)
   - [6.7 Explainable 5-Factor Scoring Model with Soft Preferences](#67-explainable-5-factor-scoring-model-with-soft-preferences)
7. [API Specification & Security Matrix](#7-api-specification--security-matrix)
8. [Testing Strategy & Quality Assurance](#8-testing-strategy--quality-assurance)
9. [Remaining Work & Future Roadmap (Phases 12–14)](#9-remaining-work--future-roadmap-phases-1214)
10. [Conclusion](#10-conclusion)

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Higher education institutions face significant operational bottlenecks when managing physical classroom space and academic schedules:
1. **Physical Resource Scarcity**: Classrooms, lecture halls, and laboratories have fixed capacities, equipment constraints (projectors, smart boards, computers), and geographic distributions across campus complexes.
2. **Scheduling Conflicts**: Manual timetable creation leads to collisions—such as booking two classes simultaneously in the same room or assigning a professor to teach in two disparate buildings at the same time.
3. **Drafting vs. Publishing Friction**: Academic administrators iterate on curriculum schedules weeks before a semester commences. Changes made during planning must not disrupt active sessions, yet once published, the master schedule must be protected against accidental deletion.
4. **The "Blueprint vs. Occurrence" Gap**: Standard timetable applications conflate weekly recurring templates with actual calendar dates. If a professor cancels a class on Tuesday, November 10th, traditional systems risk breaking all future Tuesdays across the semester.
5. **Race Conditions in Booking**: When multiple professors attempt to reserve the same open room concurrently, naive systems produce duplicate bookings or silent state corruption.
6. **Inefficient Load Allocation & "Black-Box" Decisions**: In large campuses, popular rooms get overburdened while identical nearby rooms remain empty. Furthermore, automatic room assigners often rely on opaque heuristics that faculty cannot inspect or trust.

### 1.2 The ClassSync Solution
**ClassSync** resolves these issues through a strictly decoupled, 4-tier enterprise backend:
- **Decoupled Architecture**: Separates recurring weekly schedule blueprints (`TimetableEntry`) from dated calendar events (`ScheduleOccurrence`).
- **Mathematical Conflict Prevention**: Enforces half-open interval overlap algorithms $[S, E)$ directly at the database and application levels.
- **Idempotent Calendar Projection**: Allows administrators to project recurring weekly blueprints onto calendar windows with granular conflict detection (`ROOM_BUSY`, `PROFESSOR_BUSY`, `ROOM_INACTIVE`), skipping collisions rather than aborting.
- **Advisory Availability Search**: High-efficiency search evaluating room types, capacities, multi-facility requirements, and professor schedule conflicts in real time.
- **Pessimistic Concurrency Protection**: Eliminates race conditions in room booking using MySQL InnoDB row-level locking (`PESSIMISTIC_WRITE`) and transaction boundaries.
- **Global Lock Ordering ($V \rightarrow O \rightarrow U \rightarrow R$)**: Enforces a strict total lock order across timetable activation, occurrence generation, extra-class booking, cancellation, and rescheduling.
- **Explainable Recommendation Engine**: A transparent, 5-factor mathematical scoring model (0–100) with deterministic templates that balances campus utilization, treats preferences softly, and rewards logistical continuity.
- **Frontend-Readiness & Clean Security**: Session-fixation protection, exact-origin CORS allowlists, secure session cookies, profile inspection (`/api/auth/me`), POST-only logout, administrative user management, and soft-deleted entity visibility.

---

## 2. Scope Changes from the Original Abstract

The following concrete scope adjustments were made during development relative to the initial academic abstract:
1. **PostgreSQL → MySQL 8**: Database engine changed from PostgreSQL to MySQL 8 (InnoDB dialect) for deployment and operational alignment.
2. **Campus Complexes vs. Departments**: Departments are not modeled as database entities; rooms and classrooms are organized directly under campus complexes.
3. **Two-Role RBAC**: The Coordinator role is merged into `ADMIN` (operating with two roles: `ROLE_ADMIN` and `ROLE_PROFESSOR`).
4. **Unified Occurrence Schema**: The separate Bookings, Cancellations, and Rescheduling Records tables are unified into the single normalized `schedule_occurrences` table utilizing status flags (`SCHEDULED`, `CANCELLED`, `RESCHEDULED`, `SUPERSEDED`) and self-referential `rescheduled_from_id`.

---

## 3. System Architecture & Technology Stack

The project adheres strictly to **Domain-Driven Design (DDD)**, **KISS**, **SOLID**, and **YAGNI** principles:

```text
                              Client Layer (Web / Mobile)
                                          │
                                          ▼  HTTP / JSON + Cookie
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 1: Security & Filter Chain (Spring Security 6)                         │
│  - Session-based authentication via HttpOnly JSESSIONID (SameSite=Lax)       │
│  - Exact-origin CORS allowlist (rejects unknown origins with 403)            │
│  - Session-fixation protection via request.changeSessionId()                 │
│  - Role-Based Access Control (RBAC): ADMIN vs. PROFESSOR                     │
│  - RestAuthenticationEntryPoint (401) & RestAccessDeniedHandler (403)        │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 2: Web / Controller Layer (Spring MVC)                                 │
│  - REST Controllers exposing clean, versioned JSON endpoints                 │
│  - Jakarta Bean Validation (@Valid, @NotNull, @Size, @Min, @Max)             │
│  - GlobalExceptionHandler mapping domain & lock exceptions (RFC-7807, 409)   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 3: Service / Business Logic Layer (Spring Service & Transactions)      │
│  - Declarative @Transactional boundaries (Read-Write & Read-Only)            │
│  - Half-open interval conflict engine [S, E) with self-exclusion             │
│  - State machine governance (DRAFT -> ACTIVE -> ARCHIVED)                    │
│  - Pessimistic write locking coordination (V -> O -> U -> R total ordering)  │
│  - Non-destructive rescheduling & bulk timetable supersession                │
│  - Explainable scoring & deterministic tie-breaking                          │
│  - Injected java.time.Clock abstraction for deterministic time handling      │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 4: Data Access & Persistence Layer (Spring Data JPA + Hibernate 6)     │
│  - Normalized schema across 10 tables evolved via Flyway V1–V6               │
│  - Fetch joins eliminating N+1 queries                                       │
│  - Defensive PessimisticLockingFailureException handling                     │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
                     MySQL 8.0 Database (InnoDB Engine)
```

---

## 4. Database Architecture & Evolutionary Schema (Flyway V1–V6)

The schema comprises 10 core tables:
1. `users`: System users with session-based authentication and role flags (`ADMIN`, `PROFESSOR`).
2. `complexes`: Physical campus zones and buildings housing classrooms.
3. `rooms`: Classrooms, lecture halls, and laboratories with capacity constraints and `UNIQUE(complex_id, room_number)`.
4. `facilities`: Equipment and amenities (e.g., Projector, Smart Board, AC, Audio System). Supports soft-activation.
5. `room_facilities`: Many-to-many join table mapping rooms to active facilities.
6. `timetable_versions`: Version-controlled official timetable definitions with lifecycle states (`DRAFT` $\rightarrow$ `ACTIVE` $\rightarrow$ `ARCHIVED`).
7. `timetable_entries`: Recurring weekly class slots with day of week checks (`1-7`) and half-open time checks (`start_time < end_time`).
8. `schedule_occurrences`: Date-specific calendar occurrences with `status ENUM('SCHEDULED', 'CANCELLED', 'RESCHEDULED', 'SUPERSEDED')` and self-referential `rescheduled_from_id` (foreign key with `ON DELETE SET NULL`). The active calendar view filters on `status = 'SCHEDULED'`.
9. `notifications`: User notification queue for schedule change events.
10. `audit_logs`: Audit trail with JSON snapshots (`old_value`, `new_value`) for administrative accountability.

### Flyway Migrations
- `V1__create_initial_schema.sql`: Initial 10-table relational schema with primary keys, foreign keys, and indexes.
- `V2__seed_development_data.sql`: Seed data for development: 1 Admin, 2 Professors, 2 Complexes, 5 Rooms, 5 Facilities.
- `V3__add_active_to_facilities.sql`: Adds `active BOOLEAN DEFAULT TRUE NOT NULL` to facilities for soft-deactivation.
- `V4__add_unique_entry_date_to_schedule_occurrences.sql`: Enforces `UNIQUE KEY uk_schedule_occurrences_entry_date (timetable_entry_id, schedule_date)` for idempotent calendar generation.
- `V5__fix_seed_user_password_hashes.sql`: Standardizes development seed passwords to valid BCrypt hashes for `password123`.
- `V6__non_destructive_reschedule_and_supersession.sql`: Adds `RESCHEDULED` and `SUPERSEDED` to `schedule_occurrences.status`, and adds `rescheduled_from_id` foreign key with `ON DELETE SET NULL`.

---

## 5. Detailed Breakdown of Completed Work (Milestones 1–11H)

### Phase 1: Database Foundation & Seed Data (Prompts 1 & 2)
- Relational schema creation and Flyway migration setup.
- Initial seed data for testing infrastructure and user accounts.

### Phase 2: Authentication & Role-Based Security (Prompts 3 & 4)
- Spring Security 6 session-based login and password hashing using BCrypt.
- Role-Based Access Control (`ROLE_ADMIN`, `ROLE_PROFESSOR`).

### Phase 3: Campus Infrastructure Management (Prompt 5)
- Full CRUD workflows for Complexes, Rooms, and Facilities.
- Soft-deactivation cascading (deactivating a complex or room makes it unavailable for booking).

### Phase 4: Timetable Versioning & Conflict Detection (Prompt 6)
- Timetable lifecycle state machine (`DRAFT` $\rightarrow$ `ACTIVE` $\rightarrow$ `ARCHIVED`).
- Half-open interval conflict detection $[S, E)$ for recurring weekly slots.

### Phase 5: Calendar Occurrence Generation Engine (Prompt 7)
- Calendar occurrence projection across semester windows.
- Decoupling of recurring blueprints from dated calendar events.

### Phase 6: Advisory Room Availability Search Engine (Prompt 8)
- Real-time room availability querying with strict constraint filtering.
- Personal professor conflict detection returning empty available room lists.

### Phase 7: Transactional Extra-Class Booking & Concurrency Protection (Prompt 9)
- Concurrency-protected extra-class reservations using `PESSIMISTIC_WRITE` locks on User and Room.
- Prevention of double-booking under high concurrency.

### Phase 8: Cancellation & In-Place Rescheduling Workflows (Prompt 10)
- Soft cancellation workflow setting status to `CANCELLED`.
- Self-excluding half-open conflict checks for class movement.

### Phase 9: Explainable Room Recommendation & Ranking Engine (Prompt 11)
- 5-factor mathematical scoring model (Capacity, Location, Utilization, Preferences, Continuity).
- Deterministic 4-tier sorting and transparent human-readable reason strings.

### Phase 10: Integrity & Hardening Pass (Prompt 11H)
- **F1 (Seed Passwords)**: Migration `V5` standardized all seed user password hashes to match `password123`.
- **F2 (Test Database Isolation)**: Isolated test suite execution strictly to `classsync_test` via `application.properties`, preventing any mutation of developer databases.
- **F3 (Robust Generation Conflict Reporting)**: Occurrence generation refactored to lock $V \rightarrow U \rightarrow R$, execute single-query conflict detection, and report collisions (`ROOM_BUSY`, `PROFESSOR_BUSY`, `ROOM_INACTIVE`) without aborting generation.
- **F4 (Timetable Supersession & Effective Date)**: Added `effectiveFrom` parameter to version activation, bulk-superseding future official occurrences of the old version with status `SUPERSEDED`.
- **F5 (Non-Destructive Rescheduling)**: Migration `V6` added `RESCHEDULED` status and `rescheduled_from_id`. Rescheduling preserves the original occurrence and inserts a linked replacement row.
- **F6 (Soft Recommendation Preferences & 100-Point Scale)**: Complex, room type, and facilities converted to soft preferences in `/api/rooms/recommendations` (while `/api/rooms/available` remains strictly hard-filtered). Default LocationFit set to 1.0 when unspecified, allowing continuity candidates to reach 100.0. Directional continuity reasons implemented.
- **F7 (Concurrency Hardening & Method Security)**: Added global lock failure mapping (`PessimisticLockingFailureException` $\rightarrow$ `409 Conflict`) and enabled `@EnableMethodSecurity`.
- **F8 (Frontend-Readiness API)**: Added exact-origin CORS allowlist, session fixation protection (`request.changeSessionId()`), secure cookie flags, `/api/auth/me`, POST-only logout, admin-only `GET /api/users` (no password fields), and `includeInactive` administrative query parameters.
- **F9 (Documentation Truthfulness)**: Completely audited and corrected documentation to eliminate unverified performance claims and align all documentation with real code.

---

## 6. Key Mathematical & Algorithmic Innovations

### 6.1 Half-Open Interval Collision Formula
Classes operate on half-open intervals $[S, E)$. A class ending at `10:00` vacates the room at `10:00:00`, allowing the subsequent class to commence immediately at `10:00:00`.
Two intervals $[S_1, E_1)$ and $[S_2, E_2)$ collide if and only if:
$$\mathbf{S_1 < E_2 \quad \land \quad E_1 > S_2}$$

| Scenario | Existing Class | Requested Class | $S_1 < E_2$? | $E_1 > S_2$? | Conflict Result |
|---|---|---|---|---|---|
| **Interior Overlap** | `09:00 - 11:00` | `09:30 - 10:30` | `09:00 < 10:30` (True) | `11:00 > 09:30` (True) | **CONFLICT (409)** |
| **Partial Overlap** | `09:00 - 10:30` | `10:00 - 11:30` | `09:00 < 11:30` (True) | `10:30 > 10:00` (True) | **CONFLICT (409)** |
| **Back-to-Back (Adjacent)** | `09:00 - 10:00` | `10:00 - 11:00` | `09:00 < 11:00` (True) | `10:00 > 10:00` (**False**) | **NO CONFLICT (Allowed)** |
| **Completely Before** | `08:00 - 09:00` | `10:00 - 11:00` | `08:00 < 11:00` (True) | `09:00 > 10:00` (**False**) | **NO CONFLICT (Allowed)** |

---

### 6.2 High-Performance Calendar Occurrence Projection
Occurrence projection executes a constant number of read and lock queries, independent of the projection window size:
1. `SELECT ... FOR UPDATE` locking the target version;
2. `SELECT ... FOR UPDATE` locking all professors in ascending ID order;
3. `SELECT ... FOR UPDATE` locking all rooms in ascending ID order;
4. `SELECT` loading active timetable entries;
5. Single `SELECT` fetching all scheduled occurrences across target rooms and professors within the date window.

New occurrences are then inserted with one `INSERT` per row (as `GenerationType.IDENTITY` disables Hibernate JDBC batch inserts).

---

### 6.3 Database-Level Concurrency via SQL NULL Semantics
Flyway migration `V4` enforces `UNIQUE(timetable_entry_id, schedule_date)`. Under SQL standards:
- Official timetable occurrences have non-null `timetable_entry_id`, preventing duplicate calendar projections.
- Extra-class bookings and reschedule replacements have `timetable_entry_id = NULL`. Under MySQL InnoDB, **NULL values are treated as distinct in unique indexes**, permitting multiple ad-hoc classes on the same date without constraint violations.

---

### 6.4 Zero N+1 Query Optimization with JPA Fetch Joins
To prevent Hibernate from executing secondary `SELECT` statements for every related complex, room, and facility, custom JPQL queries utilize `JOIN FETCH` and `LEFT JOIN FETCH`:
```sql
SELECT DISTINCT r FROM Room r
JOIN FETCH r.complex c
LEFT JOIN FETCH r.facilities f
WHERE r.active = true AND c.active = true
```

---

### 6.5 Global Total Lock Hierarchy ($V \rightarrow O \rightarrow U \rightarrow R$)
All concurrent operations acquire pessimistic write locks in a strict global sequence with ascending primary key IDs within each table:

$$\mathbf{TimetableVersion \ (V)} \quad \longrightarrow \quad \mathbf{ScheduleOccurrence \ (O)} \quad \longrightarrow \quad \mathbf{User \ (U)} \quad \longrightarrow \quad \mathbf{Room \ (R)}$$

| Operation | Locks Acquired (in strict order) |
|---|---|
| **Activation** | Version $V$ (target, then current active if any) |
| **Generation** | Version $V$ (target) $\rightarrow$ Users $U$ (ascending professor IDs) $\rightarrow$ Rooms $R$ (ascending room IDs) |
| **Booking** | User $U$ (requesting professor) $\rightarrow$ Room $R$ (target room) |
| **Cancellation** | Occurrence $O$ (target occurrence) $\rightarrow$ User $U$ (professor) $\rightarrow$ Room $R$ (room) |
| **Rescheduling** | Occurrence $O$ (target occurrence) $\rightarrow$ User $U$ (professor) $\rightarrow$ Room(s) $R$ (ascending ID order) |

Because lock queries select single tables and strictly follow this total ordering, circular wait conditions cannot arise across transactions. MySQL InnoDB deadlock detection combined with `PessimisticLockingFailureException` mapping to `409 Conflict` serves as a defensive safety net.

---

### 6.6 Non-Destructive Rescheduling & Gap-Filling Projection
When an occurrence is rescheduled:
- The original row is marked `status = RESCHEDULED` and retained with its original date, time, and room intact.
- A new replacement row is inserted with `status = SCHEDULED`, `timetableEntry = null`, and `rescheduledFrom` pointing to the original row.
- Rescheduling or cancelling a non-SCHEDULED row returns `409 Conflict`.
- When an extra booking or rescheduled class that caused a `ROOM_BUSY` conflict during generation is subsequently cancelled, re-running generation idempotently fills the missing occurrence without duplicate rows or errors.

---

### 6.7 Explainable 5-Factor Scoring Model with Soft Preferences
The recommendation engine separates hard constraints (availability, capacity, active status) from soft preferences:
$$\text{Score} = 30 \times \text{CapacityFit} + 25 \times \text{LocationFit} + 20 \times \text{UtilizationBalance} + 15 \times \text{PreferenceFit} + 10 \times \text{Continuity}$$

- **LocationFit**: When complex is unspecified, defaults to 1.0 (neutral preference satisfied, no reason added).
- **UtilizationBalance**: 30-day rolling occurrence count calculated via a single grouped SQL query.
- **Continuity**: Directional continuity distinguishes preceding vs. following classes.
- **Deterministic 4-Tier Sorting**: `Score DESC` $\rightarrow$ `Capacity ASC` $\rightarrow$ `RoomNumber ASC` $\rightarrow$ `Room ID ASC`.

---

## 7. API Specification & Security Matrix

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user and initiate session |
| `GET` | `/api/auth/me` | Authenticated | Fetch authenticated user profile |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate session, delete cookie (`204 No Content`) |
| `GET` | `/api/health` | Public | System health check |
| `GET` | `/api/users` | `ADMIN` only | List users with optional `role` and `status` filters |
| `GET` | `/api/complexes` | `PROFESSOR`, `ADMIN` | List complexes (supports `includeInactive=true` for admin) |
| `POST` | `/api/complexes` | `ADMIN` only | Create complex building |
| `PUT` | `/api/complexes/{id}` | `ADMIN` only | Update complex name or code |
| `PATCH`| `/api/complexes/{id}/status` | `ADMIN` only | Activate or deactivate complex |
| `GET` | `/api/complexes/{id}/rooms` | `PROFESSOR`, `ADMIN` | List rooms in complex (supports `includeInactive=true` for admin) |
| `POST` | `/api/complexes/{id}/rooms` | `ADMIN` only | Create classroom in complex |
| `GET` | `/api/rooms/{id}` | `PROFESSOR`, `ADMIN` | Get room details (supports `includeInactive=true` for admin) |
| `PUT` | `/api/rooms/{id}` | `ADMIN` only | Update room details |
| `PATCH`| `/api/rooms/{id}/status` | `ADMIN` only | Activate or deactivate room |
| `GET` | `/api/facilities` | `PROFESSOR`, `ADMIN` | List facilities (supports `includeInactive=true` for admin) |
| `POST` | `/api/facilities` | `ADMIN` only | Create facility |
| `PUT` | `/api/facilities/{id}` | `ADMIN` only | Update facility |
| `PATCH`| `/api/facilities/{id}/status` | `ADMIN` only | Activate or deactivate facility |
| `GET` | `/api/timetables/versions` | `PROFESSOR`, `ADMIN` | List timetable versions |
| `POST` | `/api/timetables/versions` | `ADMIN` only | Create draft timetable version |
| `PATCH`| `/api/timetables/versions/{id}/activate` | `ADMIN` only | Publish timetable version with optional `effectiveFrom` |
| `PATCH`| `/api/timetables/versions/{id}/archive` | `ADMIN` only | Archive timetable version |
| `POST` | `/api/timetables/versions/{id}/entries` | `ADMIN` only | Add recurring class to timetable |
| `PUT` | `/api/timetables/entries/{id}` | `ADMIN` only | Update recurring class |
| `DELETE`| `/api/timetables/entries/{id}` | `ADMIN` only | Delete recurring class (`204 No Content`) |
| `POST` | `/api/schedule-occurrences/generate` | `ADMIN` only | Project timetable to calendar dates with conflict detection |
| `GET` | `/api/schedule-occurrences` | `PROFESSOR`, `ADMIN` | List calendar classes with filters |
| `GET` | `/api/schedule-occurrences/{id}` | `PROFESSOR`, `ADMIN` | Get single class occurrence details |
| `GET` | `/api/rooms/available` | `PROFESSOR`, `ADMIN` | Advisory search for free rooms (strict hard filters) |
| `POST` | `/api/bookings` | `ROLE_PROFESSOR` | Transactionally book an extra class |
| `POST` | `/api/classes/{id}/cancel` | `PROFESSOR`, `ADMIN` | Cancel class (professor: own only; admin: any) |
| `POST` | `/api/classes/{id}/reschedule` | `PROFESSOR`, `ADMIN` | Non-destructive reschedule with replacement link |
| `GET` | `/api/rooms/recommendations` | `PROFESSOR`, `ADMIN` | 5-factor explainable room ranking with soft preferences |

---

## 8. Testing Strategy & Quality Assurance

ClassSync is validated by **216 automated integration tests** across 14 test classes with a **100% pass rate**:

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

### Coverage Highlights
- **Test Database Isolation**: Every test class executes against `classsync_test` (enforced by `TestDatabaseIsolationTest`). The active developer database `classsync` is never touched during tests.
- **Fixed System Clock**: Injected `java.time.Clock` set to `2026-10-01` in `application.properties` prevents hard-coded test dates from expiring into the past.
- **Pessimistic Concurrency Verification**: Concurrent booking and generation tests using `CyclicBarrier` and multi-threaded iterations assert zero overlapping `SCHEDULED` rows and clean serialization.
- **Non-Destructive Rescheduling Tests**: Verification that rescheduled classes preserve original rows, create linked replacements, and prevent illegal transitions on non-SCHEDULED rows.
- **Explainability & Soft Constraint Tests**: Verification that missing complexes/types/facilities are scored rather than eliminated in recommendations, and that continuity allows scores to reach 100.0.

---

## 9. Remaining Work & Future Roadmap (Phases 12–14)

With the core scheduling, booking, cancellation, rescheduling, recommendation, and hardening passes complete, the remaining milestones focus on secondary operational enhancements:

```text
                       CURRENT SYSTEM (Completed — Prompts 1–11H)
   [ Campus Infrastructure + Master Timetable + Occurrences + Availability + Booking + Rescheduling + Recommendations + Hardening ]
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

## 10. Conclusion

The **ClassSync Backend** is a complete, thoroughly tested university classroom allocation platform. All core functional workflows—from relational schema design, session authentication, physical infrastructure management, versioned timetable generation, calendar projection with conflict reporting, advisory availability search, concurrency-protected booking, non-destructive cancellation and rescheduling, to explainable recommendations and frontend-readiness endpoints—are fully operational and validated by **216 automated tests** (100% pass rate).

---
*Report updated on October 31, 2026. Branch `hardening/prompt-11h`.*
