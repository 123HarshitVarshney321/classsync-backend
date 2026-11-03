# PROMPT S1 — Execution Report

## A. Run metadata
- Branch: feature/demo-data-s1
- BASE_COMMIT (`git rev-parse HEAD` from Phase 0): 40215c103480c4927fa64bf7387b74f02064af7f
- HEAD after final push (`git rev-parse HEAD`): [PENDING]
- Pushed: yes/no (last lines of `git push`): [PENDING]

## B. Commits
(`git log --oneline BASE_COMMIT..HEAD`)
[PENDING]

## C. Files changed
(`git diff --stat BASE_COMMIT..HEAD`)
[PENDING]

## D. Task status
| Task | Status (DONE / PARTIAL / NOT STARTED / DEVIATED) | Notes |
|---|---|---|
| P0 setup | DONE | Branch created, prompt saved, plan and skeleton written |
| P1 seeder + tests | NOT STARTED | DemoData, DemoDataSeeder, DemoDataRunner + 6 integration tests |
| P2 scripts | NOT STARTED | run.sh fresh-demo mode & stale jar, stop.sh safe vite removal |
| P3 docs | NOT STARTED | README demo section, DEMO_GUIDE.md, progress report update |
| P4 walkthrough + report | NOT STARTED | fresh-demo seeding, screenshots, pristine state, final report |

## E. Deviations
For each: what the prompt said, what you did instead, and why.
None yet.

## F. Backend tests
(`grep -h "Tests run" target/surefire-reports/*.txt`, plus the total and BUILD lines)
[PENDING]

## G. Walkthrough evidence
- G1. The `Demo data loaded:` line from the first `./run.sh --fresh-demo`
[PENDING]
- G2. The same line from the final re-seed
[PENDING]
- G3. `grep -n "pkill" stop.sh`
[PENDING]
- G4. Screenshots:
| File | PASS/FAIL | Notes |
|---|---|---|
| s1-01-timetables.png | PENDING | |
| s1-02-occupancy.png | PENDING | |
| s1-03-my-week-lovelace.png | PENDING | |
| s1-04-campus-inactive.png | PENDING | |
| s1-05-generate-conflict.png | PENDING | |

## H. Acceptance checklist
| ID | Criterion | PASS/FAIL | Evidence (command output) |
|---|---|---|---|
| C1 | Only allowed files changed | PENDING | `git diff --stat BASE_COMMIT..HEAD` |
| C2 | No new dependencies, no migrations, frontend untouched | PENDING | `git diff --stat BASE_COMMIT..HEAD -- pom.xml frontend src/main/resources/db` (must be empty) |
| C3 | Existing main code untouched | PENDING | `git diff --stat BASE_COMMIT..HEAD -- src/main/java ':(exclude)src/main/java/com/classsync/demo'` (must be empty) |
| C4 | Backend tests green, including the 6 seeder tests | PENDING | section F |
| C5 | Seeded totals match section 2.8 | PENDING | G1 + test 1 |

## I. Open issues and questions for the reviewer
None.
