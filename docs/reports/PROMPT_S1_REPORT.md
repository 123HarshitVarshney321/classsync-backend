# PROMPT S1 — Execution Report

## A. Run metadata
- Branch: feature/demo-data-s1
- BASE_COMMIT (`git rev-parse HEAD` from Phase 0): 40215c103480c4927fa64bf7387b74f02064af7f
- HEAD after final push (`git rev-parse HEAD`): 87471ae464e85c1fdbb096a616fe5b2538bfa635
- Pushed: yes (to origin/feature/demo-data-s1)

## B. Commits
(`git log --oneline BASE_COMMIT..HEAD`)
```
87471ae docs(S1-P4): walkthrough screenshots and report
3aa58a5 docs(S1-P3): demo data docs
7e8ae35 feat(S1-P2): fresh-demo mode, stale-jar rebuild, safer stop
e621d4a feat(S1-P1): demo data seeder
cdedeb6 chore(S1-P0): prompt, plan and report skeleton
```

## C. Files changed
(`git diff --stat BASE_COMMIT..HEAD`)
```
 PROJECT_PROGRESS_REPORT.md                         |   1 +
 README.md                                          |  45 +++
 docs/DEMO_GUIDE.md                                 | 119 ++++++
 docs/prompts/PROMPT_S1_DEMO_DATA.md                | 415 +++++++++++++++++++++
 docs/reports/PROMPT_S1_REPORT.md                   |  90 +++++
 docs/screenshots/s1-01-timetables.png              | Bin 0 -> 51687 bytes
 docs/screenshots/s1-02-occupancy.png               | Bin 0 -> 78952 bytes
 docs/screenshots/s1-03-my-week-lovelace.png        | Bin 0 -> 70498 bytes
 docs/screenshots/s1-04-campus-inactive.png         | Bin 0 -> 62896 bytes
 docs/screenshots/s1-05-generate-conflict.png       | Bin 0 -> 75326 bytes
 docs/superpowers/plans/2026-11-04-promptS1-demo-data.md | 111 ++++++
 run.sh                                             |  58 ++-
 src/main/java/com/classsync/demo/DemoData.java     | 132 +++++++
 src/main/java/com/classsync/demo/DemoDataRunner.java |  21 ++
 src/main/java/com/classsync/demo/DemoDataSeeder.java | 349 +++++++++++++++++
 src/test/java/com/classsync/demo/DemoDataSeederIntegrationTests.java | 288 ++++++++++++++
 stop.sh                                            |   6 +-
 17 files changed, 1619 insertions(+), 16 deletions(-)
```

## D. Task status
| Task | Status (DONE / PARTIAL / NOT STARTED / DEVIATED) | Notes |
|---|---|---|
| P0 setup | DONE | Branch created, prompt saved, plan and skeleton written |
| P1 seeder + tests | DONE | DemoData, DemoDataSeeder, DemoDataRunner + 6 integration tests (223/223 pass) |
| P2 scripts | DONE | run.sh fresh-demo mode & stale jar rebuild, stop.sh safe vite removal |
| P3 docs | DONE | README demo section, DEMO_GUIDE.md, progress report update (1 line) |
| P4 walkthrough + report | DONE | fresh-demo seeding, screenshots, pristine state, final report |

## E. Deviations
For each: what the prompt said, what you did instead, and why.
None.

## F. Backend tests
(`grep -h "Tests run" target/surefire-reports/*.txt`, plus the total and BUILD lines)
```
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.008 s -- in com.classsync.ClassSyncApplicationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.003 s -- in com.classsync.TestDatabaseIsolationTest
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.107 s -- in com.classsync.concurrency.GenerationConcurrencyIntegrationTests
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.152 s -- in com.classsync.controller.AvailabilityIntegrationTests
Tests run: 26, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.246 s -- in com.classsync.controller.BookingIntegrationTests
Tests run: 37, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.497 s -- in com.classsync.controller.ClassScheduleIntegrationTests
Tests run: 19, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.186 s -- in com.classsync.controller.DomainIntegrationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.162 s -- in com.classsync.controller.HealthControllerTest
Tests run: 36, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.267 s -- in com.classsync.controller.RecommendationIntegrationTests
Tests run: 27, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.399 s -- in com.classsync.controller.ScheduleOccurrenceIntegrationTests
Tests run: 23, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.468 s -- in com.classsync.controller.TimetableIntegrationTests
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 6.678 s -- in com.classsync.demo.DemoDataSeederIntegrationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0 s -- in com.classsync.exception.GlobalExceptionHandlerTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.032 s -- in com.classsync.repository.RepositoryIntegrationTests
Tests run: 22, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.125 s -- in com.classsync.security.SecurityAuthenticationTests

[INFO] Results:
[INFO] 
[INFO] Tests run: 223, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

## G. Walkthrough evidence
- G1. The `Demo data loaded:` line from the first `./run.sh --fresh-demo`:
```
2026-11-04T01:27:29.966+05:30  INFO 14887 --- [classsync-backend] [           main] com.classsync.demo.DemoDataSeeder        : Demo data loaded: 4 complexes, 18 rooms (17 active), 10 professors, 2 timetable versions (v1 ACTIVE 36 entries, v2 DRAFT 37 entries), 298 classes (289 scheduled incl. 7 extra, 6 cancelled, 3 rescheduled), window 2026-10-12..2026-12-06
```
- G2. The same line from the final re-seed:
```
2026-11-04T01:32:28.974+05:30  INFO 15219 --- [classsync-backend] [           main] com.classsync.demo.DemoDataSeeder        : Demo data loaded: 4 complexes, 18 rooms (17 active), 10 professors, 2 timetable versions (v1 ACTIVE 36 entries, v2 DRAFT 37 entries), 298 classes (289 scheduled incl. 7 extra, 6 cancelled, 3 rescheduled), window 2026-10-12..2026-12-06
```
- G3. `grep -n "pkill" stop.sh`:
```
11:pkill -f "classsync-backend" 2>/dev/null || true
```
- G4. Screenshots:
| File | PASS/FAIL | Notes |
|---|---|---|
| s1-01-timetables.png | PASS | Timetables: v1 ACTIVE (36 entries), v2 DRAFT (37 entries) |
| s1-02-occupancy.png | PASS | Occupancy for Monday of week +1 (2026-11-09), all complexes |
| s1-03-my-week-lovelace.png | PASS | My Week Lovelace week +1: rescheduled CS202, moved CS202 on Friday, extra Tutorial on Thursday |
| s1-04-campus-inactive.png | PASS | Campus Rooms Main Building with Show Inactive: MB-G05 Inactive |
| s1-05-generate-conflict.png | PASS | Generate v1 week +5: 1 conflict (MA101 vs PH101 Special Lecture in LHC-1) |

## H. Acceptance checklist
| ID | Criterion | PASS/FAIL | Evidence (command output) |
|---|---|---|---|
| C1 | Only allowed files changed | PASS | Section C confirms only 17 allowed files across src/main, src/test, scripts, and docs |
| C2 | No new dependencies, no migrations, frontend untouched | PASS | `git diff --stat 40215c103480c4927fa64bf7387b74f02064af7f..HEAD -- pom.xml frontend src/main/resources/db` returns empty |
| C3 | Existing main code untouched | PASS | `git diff --stat 40215c103480c4927fa64bf7387b74f02064af7f..HEAD -- src/main/java ':(exclude)src/main/java/com/classsync/demo'` returns empty |
| C4 | Backend tests green, including the 6 seeder tests | PASS | Section F (223/223 passed, 0 failures, 0 errors, 0 skipped) |
| C5 | Seeded totals match section 2.8 | PASS | G1 / G2 summary line and DemoDataSeederIntegrationTests #1 |

## I. Open issues and questions for the reviewer
None. Everything matches the specification and ground rules.
