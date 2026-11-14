# ClassSync: Smart Classroom & Lecture Hall Scheduling System — Project Report
## Comprehensive Project Progress Report & Future Development Roadmap

**Project Name:** ClassSync  
**Author:** Harshit Varshney  
**Institution:** Academic Project Submission  
**Technology Stack:** Java 21 LTS, Spring Boot 3.4.3, Spring Security 6, Spring Data JPA, Hibernate 6, MySQL 8.0 (InnoDB), Flyway Migration, JUnit 5, MockMvc, React 19, Vite 8, React Router 8, Tailwind CSS 4, Vitest  
**Repository:** [GitHub - classsync-backend](https://github.com/123HarshitVarshney321/classsync-backend.git)  
**Status:** Completed Full-Stack System (Milestones 1–11 + Hardening 11H + React Frontend F1 + Demo Data S1 + Analytics O7 + Fixes FIX1), 249 backend tests & 39 frontend unit tests passing (100% Success Rate), November 14, 2026

---

## Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Scope Changes from the Original Abstract](#2-scope-changes-from-the-original-abstract)
3. [System Architecture & Technology Stack](#3-system-architecture--technology-stack)
4. [Frontend Architecture (React)](#4-frontend-architecture-react)
5. [Demo Data System](#5-demo-data-system)
6. [Utilization Analytics Engine (O7)](#6-utilization-analytics-engine-o7)
7. [System Objectives Matrix (O1–O7)](#7-system-objectives-matrix-o1o7)
8. [Database Architecture & Evolutionary Schema (Flyway V1–V6)](#8-database-architecture--evolutionary-schema-flyway-v1v6)
9. [Detailed Breakdown of Completed Work (Milestones 1–11H)](#9-detailed-breakdown-of-completed-work-milestones-111h)
10. [Key Mathematical & Algorithmic Innovations](#10-key-mathematical--algorithmic-innovations)
11. [API Specification & Security Matrix](#11-api-specification--security-matrix)
12. [Testing Strategy & Quality Assurance](#12-testing-strategy--quality-assurance)
13. [Fixes from User Testing (FIX1)](#13-fixes-from-user-testing-fix1)
14. [Future Work](#14-future-work)
15. [Conclusion](#15-conclusion)

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Higher education institutions face significant operational bottlenecks when managing physical classroom space and academic schedules:
1. **Physical Resource Scarcity**: Classrooms, lecture halls, and laboratories have fixed capacities, equipment constraints (projectors, smart boards, computers), and geographic distributions across campus complexes.
2. **Scheduling Conflicts**: Manual timetable creation leads to collisions—such as booking two classes simultaneously in the same room or assigning a professor to teach in two disparate buildings at the same time.
3. **Drafting vs. Publishing Friction**: Academic administrators iterate on curriculum schedules weeks before a semester commences. Changes made during planning must not disrupt active sessions, yet once published, the master schedule must be protected against accidental deletion.
4. **The "Blueprint vs. Occurrence" Gap**: Standard timetable applications conflate weekly recurring templates with actual calendar dates. If a professor cancels a class on a single date, traditional systems risk breaking all recurring occurrences across the semester.
5. **Race Conditions in Booking**: When multiple professors attempt to reserve the same open room concurrently, uncoordinated systems produce duplicate bookings or state corruption.
6. **Inefficient Load Allocation & Decisions**: In large campuses, popular rooms get overburdened while identical nearby rooms remain empty. Furthermore, automatic room assigners often rely on opaque heuristics that faculty cannot inspect or trust.

### 1.2 The ClassSync Solution
**ClassSync** resolves these issues through a strictly decoupled, full-stack enterprise architecture:
- **Decoupled Architecture**: Separates recurring weekly schedule blueprints (`TimetableEntry`) from dated calendar events (`ScheduleOccurrence`).
- **Mathematical Conflict Prevention**: Enforces half-open interval overlap algorithms $[S, E)$ directly at the database and application levels.
- **Idempotent Calendar Projection**: Allows administrators to project recurring weekly blueprints onto calendar windows with granular conflict detection (`ROOM_BUSY`, `PROFESSOR_BUSY`, `ROOM_INACTIVE`), skipping collisions rather than aborting.
- **Advisory Availability Search**: High-efficiency search evaluating room types, capacities, multi-facility requirements, and professor schedule conflicts in real time.
- **Pessimistic Concurrency Protection**: Eliminates race conditions in room booking using MySQL InnoDB row-level locking (`PESSIMISTIC_WRITE`) and transaction boundaries.
- **Global Lock Ordering ($V \rightarrow O \rightarrow U \rightarrow R$)**: Enforces a strict total lock order across timetable activation, occurrence generation, extra-class booking, cancellation, and rescheduling.
- **Explainable Recommendation Engine**: A transparent, 5-factor mathematical scoring model (0–100) with deterministic sorting that balances campus utilization, treats preferences softly, and rewards logistical continuity.
- **Clean Security & Frontend-Readiness**: Session-fixation protection, exact-origin CORS allowlists, secure session cookies, profile inspection (`/api/auth/me`), POST-only logout, administrative user management, and soft-deleted entity visibility.
- **Utilization Analytics (O7)**: Comprehensive campus utilization reporting, relative underused space detection, and peak-hours heatmap visualization.
- **Full-Featured React Frontend**: Role-tailored UI for Professors and Administrators, custom interactive daily occupancy and weekly calendar grids, and live indicators.

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
                               Client Layer (React 19 SPA)
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
│  - GlobalExceptionHandler mapping domain errors to standard HTTP codes        │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 3: Service & Domain Logic Layer (Spring Framework)                     │
│  - Transactional boundaries (@Transactional with READ_COMMITTED)             │
│  - Mathematical Interval Algorithms & Collision Engines                      │
│  - Explainable 5-Factor Scoring Model & Recommendation Engine                │
│  - Calendar Occurrence Projection Engine with Selective Failure Recovery     │
│  - Campus Utilization & Peak-Hour Heatmap Calculator                         │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 4: Data Persistence & Database Layer (JPA / Hibernate / MySQL)         │
│  - Spring Data JPA Repositories with custom JPQL fetch joins                 │
│  - InnoDB Row-Level Locking (PESSIMISTIC_WRITE)                              │
│  - Flyway Database Migrations (V1–V6 evolutionary schema)                    │
│  - Partial Unique Indexing with SQL NULL semantics                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Architecture (React)

The frontend is built as a single-page application (SPA) in `frontend/`:
- **Stack**: React 19, Vite 8, React Router 8, Tailwind CSS 4, date-fns, vanilla JavaScript.
- **Proxy Configuration**: Vite dev server proxies `/api` directly to `http://localhost:8080`, allowing native cookie flow without cross-origin complexity in development.
- **Key Design Choices**:
  - **Session Cookie Only**: Pure `credentials: 'include'` fetch client without storing auth tokens in `localStorage`.
  - **No Heavy State Libraries**: State is managed cleanly using React built-ins (`useState`, `useEffect`, `useContext`).
  - **No External Chart Libraries**: All visualizations (occupancy grid, weekly schedule, utilization bars, and peak hours heatmap) are rendered using semantic HTML tables and Tailwind CSS grids.
  - **Two Custom Grids**:
    - `WeekCalendar`: Hourly time-grid supporting official classes, extra bookings, rescheduled links, and live red "now" line.
    - `OccupancyGrid`: Daily room-timeline layout grouped by complex with 1-click administrative cancellation.
- **File Modularity**: Every frontend file is maintained under ~250 lines for high clarity and maintainability.

### Screens by Role
| Screen | Route | Role | Description |
|---|---|---|---|
| **Login** | `/login` | Public | Role-card fast login and custom credential form with session restore |
| **My Week** | `/my-week` | Professor | Personal weekly schedule with date navigation, filters, "now" indicator, cancellation, and rescheduling |
| **Find a Room** | `/find-room` | Professor | Advisory availability search and explainable 5-factor recommendations with 1-click booking modal |
| **Occupancy** | `/occupancy` | Professor, Admin | Daily room occupancy timeline across complexes. Admins can click any class to view details and cancel it |
| **Timetables** | `/admin/timetables` | Admin | Version lifecycle management (draft creation, activation with effective date, archiving) |
| **Version Detail** | `/admin/timetables/:id` | Admin | Timetable entries table with add/edit/delete modals and automatic day-of-week validation |
| **Generate** | `/admin/generate` | Admin | Calendar occurrence projection form with summary cards and conflict inspection table |
| **Campus** | `/admin/campus` | Admin | Tabbed management of campus complexes, rooms, and physical facilities |
| **Analytics** | `/admin/analytics` | Admin | Overall utilization stats, definition callouts, room breakdown with underused badges, and peak hours heatmap |

---

## 5. Demo Data System

To support comprehensive manual evaluation and live demonstrations without manual database population, ClassSync includes an automated demo seeder:
- **Activation Command**: `./run.sh --fresh-demo`
- **Seeded Dataset**:
  - **4 Complexes**: Lecture Hall Complex (LHC), Main Building (MB), Science & Engineering Complex (SEC), Humanities & Social Sciences (HSS).
  - **18 Rooms**: 17 active rooms across classroom, lab, lecture hall, and seminar hall types; 1 inactive room (`MB-G05`).
  - **10 Professors**: Populated with authentic academic course assignments.
  - **2 Timetable Versions**: `v1` (ACTIVE, 36 weekly entries) and `v2` (DRAFT, 37 weekly entries).
  - **298 Dated Occurrences**: Projected across an 8-week dynamic window ($W-3$ to $W+4$), containing 289 scheduled classes (including 7 extra bookings), 6 cancellations, and 3 reschedulings.
- **Why Not a Migration**: Demo data is loaded in Java via `@Profile("demo")` using the application's actual transactional services. This guarantees that test and production schemas stay pristine and that all business validations and audit linkages run during seeding.

---

## 6. Utilization Analytics Engine (O7)

Objective O7 provides administrators with transparent visibility into physical room efficiency:
- **Scope**: Monday through Friday, 08:00 to 20:00 (12-hour teaching day). Weekend classes are ignored.
- **Room Scope**: Active rooms situated in active complexes. Filtering by complex isolates that complex's rooms.
- **Per-Room Utilization**:
  $$\text{Available Hours} = \text{Working Days in Range} \times 12$$
  $$\text{Booked Hours} = \frac{\sum \text{Scheduled Class Minutes within 08:00–20:00}}{60}$$
  $$\text{Utilization \%} = \frac{\text{Booked Hours}}{\text{Available Hours}} \times 100$$
- **Relative Underused Space Detection**: A room is marked **Underused** when its utilization is strictly below half of the overall campus utilization:
  $$\text{Underused Threshold} = \frac{\text{Overall Utilization}}{2}$$
  This relative metric prevents false alarms on lightly scheduled campuses while highlighting genuinely underperforming rooms.
- **Peak Hours Heatmap**: 5 weekdays $\times$ 12 hourly buckets (08:00–19:00). Each cell calculates the percentage of rooms occupied during that hour. Cell colors scale relative to the busiest cell in the selected window.

---

## 7. System Objectives Matrix (O1–O7)

| Objective (from the abstract) | Status | Backend | Frontend |
|---|---|---|---|
| **O1** To develop a centralized system for managing classroom and lecture-hall availability | DONE | `ComplexService`, `RoomService`, `FacilityService`; all classes live in one table (`schedule_occurrences`) | Campus (`/admin/campus`), Occupancy (`/occupancy`) |
| **O2** To integrate the official timetable with temporary bookings and changes | DONE | `TimetableVersionService`, `TimetableEntryService`, `ScheduleOccurrenceService.generateOccurrences()`; extra classes, cancellations and reschedules are stored next to the generated official classes | Timetables (`/admin/timetables`), Generate (`/admin/generate`) |
| **O3** To support extra-class scheduling, cancellation, and rescheduling | DONE | `BookingService.createExtraClass()`, `ClassScheduleService.cancelOccurrence()`, `ClassScheduleService.rescheduleOccurrence()` | Find a Room (`/find-room`), My Week (`/my-week`), Occupancy (admin cancel) |
| **O4** To detect and prevent overlapping classroom bookings | DONE | Half-open overlap checks in `TimetableEntryService`, `BookingService`, `ClassScheduleService` and the generator's conflict detection; pessimistic row locks in one global order (V → O → U → R) | 409 conflict messages (Find a Room), conflict report (Generate) |
| **O5** To recommend suitable rooms based on capacity, facilities, and location | DONE | `RecommendationService.recommendRooms()` (5-factor score with reasons) | Find a Room (`/find-room`) |
| **O6** To provide a visual weekly timetable and classroom availability view | DONE | `ScheduleOccurrenceService` occurrence queries | My Week (weekly calendar), Occupancy (rooms × hours grid) |
| **O7** To provide basic classroom utilization analytics for administrators | DONE | `AnalyticsService.getUtilization()`, `UtilizationCalculator` | Analytics (`/admin/analytics`) |

---

## 8. Database Architecture & Evolutionary Schema (Flyway V1–V6)

The relational schema is managed through version-controlled Flyway migrations:
- **V1 (Core Infrastructure)**: `users`, `complexes`, `rooms`, `facilities`, `room_facilities` junction table.
- **V2 (Timetable Blueprints)**: `timetable_versions` and `timetable_entries` with time-range checks.
- **V3 (Calendar Occurrences)**: `schedule_occurrences` table with partial unique index `idx_occ_room_date_time` using SQL NULL semantics for conflict prevention.
- **V4 (Audit & Notifications)**: `audit_logs` and `notifications` tables (reserved for future event streaming).
- **V5 (Seed Passwords)**: Standardized seed credentials using BCrypt password hashes.
- **V6 (Non-Destructive Rescheduling)**: Added `RESCHEDULED` status enum and self-referential `rescheduled_from_id` foreign key.

---

## 9. Detailed Breakdown of Completed Work (Milestones 1–11H)

### Phase 1: Database Foundation & Seed Data (Prompts 1 & 2)
- Relational schema modeling and initial data seeding for university campus entities.

### Phase 2: Authentication & Role-Based Security (Prompts 3 & 4)
- Spring Security 6 session-based authentication with BCrypt hashing and custom REST entry points.

### Phase 3: Campus Infrastructure Management (Prompt 5)
- Full lifecycle management of complexes, rooms, and facilities with soft deactivation.

### Phase 4: Timetable Versioning & Conflict Detection (Prompt 6)
- Immutable version draft-publish workflows with overlap collision prevention.

### Phase 5: Calendar Occurrence Generation Engine (Prompt 7)
- Multi-week projection engine with granular collision classification (`ROOM_BUSY`, `PROFESSOR_BUSY`, `ROOM_INACTIVE`).

### Phase 6: Advisory Room Availability Search Engine (Prompt 8)
- High-efficiency query isolating conflict-free rooms matching capacity, type, and equipment.

### Phase 7: Transactional Extra-Class Booking & Concurrency Protection (Prompt 9)
- Row-level `PESSIMISTIC_WRITE` locks on User and Room to serialize concurrent booking attempts.

### Phase 8: Cancellation & Rescheduling Workflows (Prompt 10; made non-destructive in 11H)
- Non-destructive cancellation (`CANCELLED`) and rescheduling workflow (`RESCHEDULED` pointing to replacement row via `rescheduled_from_id`), preserving complete audit trails.

### Phase 9: Explainable Room Recommendation & Ranking Engine (Prompt 11)
- 5-factor mathematical scoring model (Capacity, Location, Utilization, Preferences, Continuity) on a 0–100 scale with deterministic sorting.

### Phase 10: Integrity & Hardening Pass (Prompt 11H)
- Fixed test database isolation, timetable supersession with effective dates, exact-origin CORS allowlist, and method security.

---

## 10. Key Mathematical & Algorithmic Innovations

### 10.1 Half-Open Interval Collision Formula
Classes operate on half-open intervals $[S, E)$. A class ending at `10:00` vacates the room at `10:00:00`, allowing the subsequent class to commence immediately at `10:00:00`. Two intervals $[S_1, E_1)$ and $[S_2, E_2)$ collide if and only if:
$$\mathbf{S_1 < E_2 \quad \land \quad E_1 > S_2}$$

### 10.2 Database-Level Concurrency via SQL NULL Semantics
To prevent duplicate active occurrences under extreme concurrency, MySQL's unique index behavior with `NULL` is leveraged:
- Columns: `(room_id, schedule_date, start_time, active_status)`
- Active occurrences set `active_status = 'SCHEDULED'`, enforcing strict uniqueness.
- Cancelled and rescheduled rows set `active_status = NULL`. Since SQL treats `NULL != NULL`, cancelled records never conflict with re-bookings.

### 10.3 Avoiding N+1 queries with fetch joins
All multi-entity graph traversals utilize explicit JPQL `JOIN FETCH` queries, ensuring single-query retrieval for complex views like the occupancy grid and analytics reports.

### 10.4 Global Total Lock Hierarchy ($V \rightarrow O \rightarrow U \rightarrow R$)
To eliminate deadlocks during concurrent multi-row operations, transactions acquire locks in a globally consistent order:
1. Version lock ($V$)
2. Occurrence lock ($O$)
3. User / Professor lock ($U$)
4. Room lock ($R$)

---

## 11. API Specification & Security Matrix

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user, return role & session cookie |
| `GET` | `/api/auth/me` | Authenticated | Inspect current authenticated session |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate session and clear session cookie |
| `GET` | `/api/complexes` | `PROFESSOR`, `ADMIN` | List campus complexes |
| `GET` | `/api/complexes/{id}/rooms` | `PROFESSOR`, `ADMIN` | List rooms in complex |
| `GET` | `/api/rooms/{id}` | `PROFESSOR`, `ADMIN` | Get detailed room specifications |
| `GET` | `/api/rooms/available` | `PROFESSOR`, `ADMIN` | Advisory search for free rooms |
| `GET` | `/api/rooms/recommendations` | `PROFESSOR`, `ADMIN` | 5-factor explainable room ranking |
| `POST` | `/api/bookings` | `PROFESSOR` | Transactionally book an extra class |
| `POST` | `/api/classes/{id}/cancel` | `PROFESSOR`, `ADMIN` | Cancel class (professor: own only; admin: any) |
| `POST` | `/api/classes/{id}/reschedule` | `PROFESSOR`, `ADMIN` | Non-destructive reschedule with replacement link |
| `GET` | `/api/timetables/versions` | `PROFESSOR`, `ADMIN` | List timetable versions |
| `POST` | `/api/timetables/versions` | `ADMIN` only | Create draft timetable version |
| `PATCH`| `/api/timetables/versions/{id}/activate` | `ADMIN` only | Publish timetable version with `effectiveFrom` |
| `PATCH`| `/api/timetables/versions/{id}/archive` | `ADMIN` only | Archive timetable version |
| `GET` | `/api/schedule-occurrences` | `PROFESSOR`, `ADMIN` | List calendar classes with filters |
| `POST` | `/api/schedule-occurrences/generate` | `ADMIN` only | Project timetable to calendar dates with conflict detection |
| `GET` | `/api/analytics/utilization` | `ADMIN` only | Campus utilization statistics, room table & peak-hours heatmap |

---

## 12. Testing Strategy & Quality Assurance

ClassSync is validated by **249 backend tests** and **39 unit tests** in the frontend with a **100% pass rate**:

### Backend Test Results (Maven Surefire):
```text
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.ClassSyncApplicationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.TestDatabaseIsolationTest
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.concurrency.GenerationConcurrencyIntegrationTests
Tests run: 7, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.AnalyticsIntegrationTests
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.AvailabilityIntegrationTests
Tests run: 26, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.BookingIntegrationTests
Tests run: 41, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.ClassScheduleIntegrationTests
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.DeactivationGuardIntegrationTests
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.DomainIntegrationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.HealthControllerTest
Tests run: 36, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.RecommendationIntegrationTests
Tests run: 27, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.ScheduleOccurrenceIntegrationTests
Tests run: 23, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.controller.TimetableIntegrationTests
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.demo.DemoDataSeederIntegrationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.exception.GlobalExceptionHandlerTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.repository.RepositoryIntegrationTests
Tests run: 22, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.security.SecurityAuthenticationTests
Tests run: 10, Failures: 0, Errors: 0, Skipped: 0 -- in com.classsync.service.UtilizationCalculatorTest
-------------------------------------------------------------------------------------------------------
Total Backend Tests Run: 249, Failures: 0, Errors: 0, Skipped: 0 (BUILD SUCCESS)
```

### Frontend Test Results (Vitest):
```text
✓ src/api/client.test.js (8 tests)
✓ src/utils/heatmap.test.js (6 tests)
✓ src/utils/dates.test.js (21 tests)
✓ src/utils/login.test.js (4 tests)
-------------------------------------------------------------------------------------------------------
Total Frontend Tests Run: 39, Failures: 0, Skipped: 0 (4 test files passed)
```

---

## 13. Fixes from User Testing (FIX1)

During user acceptance and end-to-end testing, three operational issues were identified and resolved on branch `fix/testing-feedback`:

### 13.1 Fix A: Locking Started Classes Against Cancellation and Rescheduling
- **Issue**: Classes scheduled in the past or classes that had already commenced could still be cancelled or rescheduled via the API and UI.
- **Cause**: Existing validation only checked whether the *target* date/time for rescheduling was in the future; no start-time check existed for the *original* class being cancelled or rescheduled.
- **Resolution**:
  - **Backend (`ClassScheduleService`)**: Injected the application `Clock` and enforced a strict temporal check: `LocalDateTime.of(scheduleDate, startTime).isAfter(now)`. If the class has started (`!isAfter(now)`), operations throw `BadRequestException` (HTTP 400) with messages:
    - `"Cannot cancel a class that has already started"`
    - `"Cannot reschedule a class that has already started"`
  - **Demo Seeding (`DemoDataSeeder`)**: Historical past cancellations (C1–C4) are preserved directly via `scheduleOccurrenceRepository.save()` with the comment `// Historical record: the app no longer allows cancelling classes that have started.` while future cancellations (C5–C6) continue using `classScheduleService.cancelOccurrence()`.
  - **Frontend (`MyWeekPage.jsx`, `OccupancyPage.jsx`)**: The modal dialog inspects whether a class has started via `hasStarted(scheduleDate, startTime, now)`. For started classes, the Cancel and Reschedule buttons are replaced with a clear grey informational note: *"This class has already started, so it can't be cancelled or rescheduled."*

### 13.2 Fix B: Blocking Deactivation of Rooms and Complexes with Upcoming Classes
- **Issue**: Deactivating an active room or campus complex orphaned future classes that were already scheduled, removing them from booking search and campus occupancy views without explicit notice.
- **Cause**: `RoomService.updateRoomStatus()` and `ComplexService.updateComplexStatus()` modified the `active` flag without querying future commitments. Auto-cancelling was explicitly rejected as it would silently erase faculty bookings without audit trails or easy restoration.
- **Resolution**:
  - **Repository (`ScheduleOccurrenceRepository`)**: Added optimized JPQL queries `findUpcomingInRoom(roomId, today, nowTime)` and `findUpcomingInComplex(complexId, today, nowTime)` querying `status = 'SCHEDULED'` and `(scheduleDate > :today OR (scheduleDate = :today AND startTime > :nowTime))`.
  - **Service Guards (`RoomService`, `ComplexService`)**: When setting `active = false`, services check for upcoming occurrences. If any exist, they throw `DuplicateResourceException` (HTTP 409 Conflict) with actionable diagnostic messages:
    - Room: `"Cannot deactivate room <roomNumber>: it has <n> upcoming scheduled class(es), the next on <yyyy-MM-dd>. Cancel or reschedule them, or move this room's classes in a new timetable version, first."`
    - Complex: `"Cannot deactivate complex <name>: its rooms have <n> upcoming scheduled class(es), the next on <yyyy-MM-dd>. Cancel or reschedule them, or move these classes in a new timetable version, first."`

### 13.3 Fix C: Streamlined Login Supporting Username or Institutional Email
- **Issue**: Users attempting to log in with short usernames (e.g., `admin`, `aturing`) encountered browser HTML5 validation errors because the form input was strictly `type="email"`.
- **Cause**: The login input strictly enforced browser email format checking, preventing natural username-based entry.
- **Resolution**:
  - **Frontend (`LoginPage.jsx`, `utils/login.js`)**: Updated the login input to `type="text"`, `autoComplete="username"`, with placeholder `"admin or admin@classsync.edu"`.
  - **Email Normalization (`toLoginEmail`)**: Added utility function `toLoginEmail(input)`: if the entered identifier does not contain `@`, it automatically appends `@classsync.edu`. Validated by unit tests in `login.test.js`.

---

## 14. Future Work

With all primary objectives (O1–O7) and full-stack interfaces delivered, the following secondary areas remain available for future exploration:
1. **Redis Caching**: Caching frequently read static reference data (Complexes, Rooms, Facilities) with eviction on administrative updates (not required at current campus scale).
2. **Notification & Audit Event Streaming**: Consuming the reserved `notifications` and `audit_logs` schema tables with real-time WebSocket or email dispatch for schedule cancellations and room modifications.
3. **Cloud Hosting & Containerized Deployment**: Containerizing services via multi-stage Docker builds and deploying to managed cloud infrastructure.
4. **User Management Screen**: Dedicated administrative UI for creating, updating, and deactivating professor and administrator user accounts.

---

## 15. Conclusion

**ClassSync** is an end-to-end, fully verified academic scheduling and room allocation platform. All seven core objectives—physical campus infrastructure management (O1), timetable blueprint versioning (O2), calendar occurrence projection (O3), advisory availability search and transactional booking (O4), non-destructive cancellation and rescheduling (O5), explainable 5-factor recommendations (O6), and utilization analytics (O7)—are operational across the Spring Boot backend and React frontend. The application is validated by **249 backend tests** and **39 frontend unit tests** with a 100% pass rate.

---
*Report updated on November 14, 2026. Branch `fix/testing-feedback`.*
