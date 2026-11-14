# PROMPT FIX1 — Execution Report

## A. Run metadata
- Branch: fix/testing-feedback
- BASE_COMMIT: 1a60c9bc6e997c0b5d0c540ec2198df2f1bd6aa9
- HEAD after final push: (recorded after final commit and push)
- Pushed: yes

## B. Commits
(`git log --oneline BASE_COMMIT..HEAD`)
```text
[final-commit] docs(FIX1-P4): walkthrough evidence and report
9fd607b docs(FIX1-P3): business rules and fixes from user testing
37895a2 fix(FIX1-P2): username login, hide actions for started classes
2de8851 fix(FIX1-P1): lock started classes; block deactivating rooms with upcoming classes
7107d74 chore(FIX1-P0): prompt, plan and report skeleton
```

## C. Files changed
(`git diff --stat BASE_COMMIT..HEAD`)
```text
 PROJECT_PROGRESS_REPORT.md                         |  59 ++++-
 README.md                                          |  20 +-
 docs/DEMO_GUIDE.md                                 |  15 +-
 docs/prompts/PROMPT_FIX1_TESTING_FEEDBACK.md       | 283 +++++++++++++++++++++
 docs/reports/PROMPT_FIX1_REPORT.md                 | 265 ++++++++++++++++++++
 .../plans/2026-11-14-fix1-testing-feedback.md      |  63 +++++
 docs/screenshots/fix-01-login-username.png         | Bin 0 -> 42127 bytes
 docs/screenshots/fix-02-logged-in.png              | Bin 0 -> 50403 bytes
 docs/screenshots/fix-03-deactivate-blocked.png     | Bin 0 -> 72540 bytes
 docs/screenshots/fix-04-past-class-locked.png      | Bin 0 -> 78996 bytes
 frontend/README.md                                 |  12 +-
 frontend/src/pages/LoginPage.jsx                   |  13 +-
 frontend/src/pages/professor/MyWeekPage.jsx        |  42 +--
 frontend/src/pages/shared/OccupancyPage.jsx        |  29 ++-
 frontend/src/utils/dates.js                        |   9 +
 frontend/src/utils/dates.test.js                   |  21 ++
 frontend/src/utils/login.js                        |   9 +
 frontend/src/utils/login.test.js                   |  23 ++
 .../java/com/classsync/demo/DemoDataSeeder.java    |   9 +-
 .../repository/ScheduleOccurrenceRepository.java   |  26 ++
 .../classsync/service/ClassScheduleService.java    |   8 +
 .../java/com/classsync/service/ComplexService.java |  27 +-
 .../java/com/classsync/service/RoomService.java    |  27 +-
 .../controller/ClassScheduleIntegrationTests.java  |  59 +++++
 .../DeactivationGuardIntegrationTests.java         | 165 ++++++++++++
 25 files changed, 946 insertions(+), 58 deletions(-)
```

## D. Task status
| Task | Status | Notes |
|---|---|---|
| Fix A backend (started classes locked) | PASS | ClassScheduleService guards cancel and reschedule with 400 Bad Request |
| Fix A seeder (historical cancellations) | PASS | C1–C4 saved directly via repository; C5–C6 call cancelOccurrence; all seeder tests pass |
| Fix B deactivation guard | PASS | Upcoming class check in RoomService and ComplexService throws 409 Conflict with descriptive message |
| Fix C username login | PASS | LoginPage input type="text", autocomplete="username", toLoginEmail appends @classsync.edu when @ omitted |
| Fix A UI (actions hidden) | PASS | MyWeekPage and OccupancyPage hide Cancel/Reschedule buttons for started classes and show grey note |
| Docs | PASS | README.md, PROJECT_PROGRESS_REPORT.md, docs/DEMO_GUIDE.md, frontend/README.md updated |
| Walkthrough | PASS | Fresh demo seeded, analytics verified, API curl checks a–d verified, 4 screenshots captured |

## E. Deviations (including any existing test whose date had to change, and why)
None. No existing tests had to change dates; all 240 previous tests passed unchanged, and 9 new backend tests plus 8 new frontend unit tests were added.

## F. Backend tests
(`grep -h "Tests run" target/surefire-reports/*.txt` + total + BUILD line)
```text
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.008 s -- in com.classsync.ClassSyncApplicationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.003 s -- in com.classsync.TestDatabaseIsolationTest
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.110 s -- in com.classsync.concurrency.GenerationConcurrencyIntegrationTests
Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.078 s -- in com.classsync.controller.AnalyticsIntegrationTests
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.126 s -- in com.classsync.controller.AvailabilityIntegrationTests
Tests run: 26, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.185 s -- in com.classsync.controller.BookingIntegrationTests
Tests run: 41, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.550 s -- in com.classsync.controller.ClassScheduleIntegrationTests
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.048 s -- in com.classsync.controller.DeactivationGuardIntegrationTests
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.179 s -- in com.classsync.controller.DomainIntegrationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.175 s -- in com.classsync.controller.HealthControllerTest
Tests run: 36, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.306 s -- in com.classsync.controller.RecommendationIntegrationTests
Tests run: 27, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.354 s -- in com.classsync.controller.ScheduleOccurrenceIntegrationTests
Tests run: 23, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.413 s -- in com.classsync.controller.TimetableIntegrationTests
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 6.867 s -- in com.classsync.demo.DemoDataSeederIntegrationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.001 s -- in com.classsync.exception.GlobalExceptionHandlerTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.029 s -- in com.classsync.repository.RepositoryIntegrationTests
Tests run: 22, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.135 s -- in com.classsync.security.SecurityAuthenticationTests
Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.003 s -- in com.classsync.service.UtilizationCalculatorTest
------------------------------------------------------------------------
[INFO] Results:
[INFO] 
[INFO] Tests run: 249, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

## G. Frontend checks
(`npm ls --depth=0`, `npm run lint`, `npm test` summary, `npm run build` last lines)
```text
$ npm ls --depth=0
frontend@0.0.0 /Users/harshit/Desktop/classsync-backend/frontend
├── @eslint/js@10.0.1
├── @tailwindcss/vite@4.3.3
├── @vitejs/plugin-react@6.2.1
├── date-fns@4.4.0
├── eslint-plugin-react-hooks@7.1.1
├── eslint-plugin-react-refresh@0.5.7
├── eslint@10.14.0
├── globals@17.14.0
├── react-dom@19.3.1
├── react-router@8.5.1
├── react@19.3.1
├── tailwindcss@4.3.3
├── vite@8.3.5
└── vitest@5.1.0

$ npm run lint
> frontend@0.0.0 lint
> eslint .

$ npm test
> frontend@0.0.0 test
> vitest run

 RUN  v5.1.0 /Users/harshit/Desktop/classsync-backend/frontend

 ✓ src/utils/login.test.js (4 tests) 2ms
 ✓ src/utils/heatmap.test.js (6 tests) 3ms
 ✓ src/api/client.test.js (8 tests) 6ms
 ✓ src/utils/dates.test.js (21 tests) 6ms

 Test Files  4 passed (4)
      Tests  39 passed (39)
   Start at  20:44:15
   Duration  941ms (import 94%, transform 3%, tests 2%, worker 1%)

$ npm run build
> frontend@0.0.0 build
> vite build

vite v8.3.5 building client environment for production...
✓ 432 modules transformed.
rendering chunks (1)...computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-HOIvaffG.css   30.78 kB │ gzip:   6.51 kB
dist/assets/index-cw5ZsGvN.js   382.71 kB │ gzip: 107.48 kB

✓ built in 169ms
```

## H. Evidence
- H1. The `Demo data loaded:` line:
```text
2026-11-14T20:43:25.632+05:30  INFO 10306 --- [classsync-backend] [           main] com.classsync.demo.DemoDataSeeder        : Demo data loaded: 4 complexes, 18 rooms (17 active), 10 professors, 2 timetable versions (v1 ACTIVE 36 entries, v2 DRAFT 37 entries), 298 classes (289 scheduled incl. 7 extra, 6 cancelled, 3 rescheduled), window 2026-10-19..2026-12-13
```

- H2. The analytics summary for the last 3 weeks (must show 129.5 / 104 / 4):
```bash
curl -s -b /tmp/admin-cookie.txt "http://localhost:8080/api/analytics/utilization?startDate=2026-10-19&endDate=2026-11-08" | jq .summary
```
```json
{
  "roomCount": 17,
  "workingDayCount": 15,
  "availableHours": 3060.0,
  "bookedHours": 129.5,
  "utilizationPercent": 4.2,
  "scheduledClasses": 104,
  "extraClasses": 0,
  "cancelledClasses": 4,
  "rescheduledClasses": 0
}
```

- H3. Curl outputs for steps a–d:

Step a (Turing: Cancel a class that has already started -> 400):
```bash
curl -i -s -b /tmp/turing-cookie.txt -X POST http://localhost:8080/api/classes/74/cancel
```
```http
HTTP/1.1 400 
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
Date: Sat, 14 Nov 2026 15:06:52 GMT
Connection: close

{"status":400,"message":"Cannot cancel a class that has already started","error":"Bad Request"}
```

Step b (Turing: Reschedule a class that has already started -> 400):
```bash
curl -i -s -b /tmp/turing-cookie.txt -X POST http://localhost:8080/api/classes/74/reschedule \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-11-20","startTime":"16:00","endTime":"17:00","roomId":1}'
```
```http
HTTP/1.1 400 
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
Date: Sat, 14 Nov 2026 15:06:58 GMT
Connection: close

{"status":400,"message":"Cannot reschedule a class that has already started","error":"Bad Request"}
```

Step c (Admin: Deactivate LHC-1 with upcoming classes -> 409):
```bash
curl -i -s -b /tmp/admin-cookie.txt -X PATCH http://localhost:8080/api/rooms/12/status \
  -H "Content-Type: application/json" \
  -d '{"active":false}'
```
```http
HTTP/1.1 409 
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
Date: Sat, 14 Nov 2026 15:07:11 GMT

{"status":409,"message":"Cannot deactivate room LHC-1: it has 21 upcoming scheduled class(es), the next on 2026-11-16. Cancel or reschedule them, or move this room's classes in a new timetable version, first.","error":"Conflict"}
```

Step d (Admin: Create room SEC-104 in SEC, then deactivate it -> 200):
```bash
curl -i -s -b /tmp/admin-cookie.txt -X POST http://localhost:8080/api/complexes/1/rooms \
  -H "Content-Type: application/json" \
  -d '{"roomNumber":"SEC-104","roomType":"CLASSROOM","capacity":40}'
```
```http
HTTP/1.1 201 
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
Date: Sat, 14 Nov 2026 15:07:19 GMT

{"id":19,"roomNumber":"SEC-104","roomType":"CLASSROOM","capacity":40,"active":true,"complex":{"id":1,"name":"Science & Engineering Complex","code":"SEC"},"facilities":[]}
```
```bash
curl -i -s -b /tmp/admin-cookie.txt -X PATCH http://localhost:8080/api/rooms/19/status \
  -H "Content-Type: application/json" \
  -d '{"active":false}'
```
```http
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
Date: Sat, 14 Nov 2026 15:07:24 GMT

{"id":19,"roomNumber":"SEC-104","roomType":"CLASSROOM","capacity":40,"active":false}
```

- H4. Screenshots:
| File | PASS/FAIL | Notes |
|---|---|---|
| `docs/screenshots/fix-01-login-username.png` | PASS | Login page with `admin` typed in "Email or username" |
| `docs/screenshots/fix-02-logged-in.png` | PASS | Timetable Versions page after signing in with `admin` / `password123` |
| `docs/screenshots/fix-03-deactivate-blocked.png` | PASS | Campus -> Rooms -> Lecture Hall Complex after trying to deactivate LHC-1, showing red alert: *"Cannot deactivate room LHC-1: it has 21 upcoming scheduled class(es)..."* |
| `docs/screenshots/fix-04-past-class-locked.png` | PASS | Turing -> My Week -> previous week (2–8 Nov 2026) -> CS201 class details modal showing grey note *"This class has already started, so it can't be cancelled or rescheduled."* with no action buttons |

- H5. Section 7 final checks output:
```bash
mvn clean test
# Results: Tests run: 249, Failures: 0, Errors: 0, Skipped: 0. BUILD SUCCESS.

cd frontend && npm run lint && npm test && npm run build && npm ls --depth=0 && cd ..
# eslint clean, vitest 39/39 tests passed across 4 files, vite build success (382.71 kB / 107.48 kB gzip), npm ls 14 dependencies unchanged.

git diff --stat 1a60c9bc6e997c0b5d0c540ec2198df2f1bd6aa9..HEAD -- pom.xml frontend/package.json src/main/resources
# (empty output: no forbidden files modified)
```

## I. Open issues and questions for the reviewer
None. All 3 fixes from user testing have been implemented, tested, documented, and verified end-to-end.
