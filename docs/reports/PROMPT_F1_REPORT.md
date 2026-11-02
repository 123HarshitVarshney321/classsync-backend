# PROMPT F1 — Execution Report

## A. Run metadata
- Branch: feature/frontend-f1
- BASE_COMMIT (paste the output of `git rev-parse HEAD` taken in Phase 0): c09eea6db9e3a0ba5698c718fedd96e4efbcf817
- HEAD after final push (paste the output of `git rev-parse HEAD`): NOT STARTED
- Pushed to origin: yes/no (paste the last lines of `git push`): NOT STARTED
- node -v / npm -v / java -version (first line) / mvn -v (first line):
  - node: v26.13.0
  - npm: 11.20.0
  - java: openjdk version "26.0.1" 2026-04-21
  - mvn: Apache Maven 3.9.16 (2bdd9fddda4b155ebf8000e807eb73fd829a51d5)
- Agent / model (if known): Antigravity / Claude 3.7 Sonnet

## B. Commits
(paste `git log --oneline BASE_COMMIT..HEAD`)

## C. Files changed
(paste `git diff --stat BASE_COMMIT..HEAD`)

## D. Task status
| Task | Status (DONE / PARTIAL / NOT STARTED / DEVIATED) | Notes |
|---|---|---|
| P0 setup | DONE | Base commit c09eea6db9e3a0ba5698c718fedd96e4efbcf817, Node v26.13.0, npm 11.20.0, Java 26.0.1, Maven 3.9.16 |
| B1 | DONE | GenerationConcurrencyIntegrationTests asserts exactly 1 scheduled row and single winner |
| B2 | DONE | ClassScheduleIntegrationTests test 30 asserts only DuplicateResourceException as expected failure |
| B3 | DONE | Removed dead activateVersion(Integer id) overload from TimetableVersionService |
| B4 | DONE | Aligned generation query list in README.md and PROJECT_PROGRESS_REPORT.md to 7 queries in code order |
| B5 | DONE | Disabled requestCache in SecurityConfig; added test 22 asserting unauthenticated /api/auth/me creates no session |
| P1 setup + login + layout | DONE | Vite scaffold, Tailwind v4, declarative routing, client, endpoints, auth & placeholders |
| P2 professor + occupancy | NOT STARTED | |
| P3 admin | NOT STARTED | |
| P4 tests + docs | NOT STARTED | |
| P5 walkthrough + report | NOT STARTED | |

## E. Deviations
For each: what the prompt said, what you did instead, and why. Include any API-contract mismatch you found in the backend code.

## F. Backend tests
(paste `grep -h "Tests run" target/surefire-reports/*.txt` after the final `mvn clean test`, plus the total line and the BUILD line)

## G. Frontend checks (raw output)
- G1. `npm ls --depth=0`
- G2. `npm run lint`
- G3. `npm test` (summary lines)
- G4. `npm run build` (last ~10 lines)

## H. Walkthrough
- H1. The raw output of `curl -s -i http://localhost:8080/api/auth/me`
- H2. Scenario results:
| ID | PASS/FAIL | Screenshot file(s) | Notes |
|---|---|---|---|
| W1 | NOT STARTED | | |
| W2 | NOT STARTED | | |
| W3 | NOT STARTED | | |
| W4 | NOT STARTED | | |
| W5 | NOT STARTED | | |
| W6 | NOT STARTED | | |
| W7 | NOT STARTED | | |
| W8 | NOT STARTED | | |
| W9 | NOT STARTED | | |
| W10 | NOT STARTED | | |
| W11 | NOT STARTED | | |
| W12 | NOT STARTED | | |
| W13 | NOT STARTED | | |

## I. Acceptance checklist
| ID | Criterion | PASS/FAIL | Evidence (paste command output) |
|---|---|---|---|
| C1 | Only the allowed npm packages | | `npm ls --depth=0` |
| C2 | JavaScript only | | `find frontend/src -name "*.ts" -o -name "*.tsx"` (must be empty) |
| C3 | No hard-coded backend URL | | `grep -rn "8080" frontend/src` (only the network-error message may match) |
| C4 | No toISOString in the frontend | | `grep -rn "toISOString" frontend/src` (must be empty) |
| C5 | Backend changes limited to B1–B5 + root README | | `git diff --stat BASE_COMMIT..HEAD -- . ':(exclude)frontend' ':(exclude)docs'` |
| C6 | Backend green; frontend lint/test/build green | | sections F and G |
| C7 | All walkthrough scenarios pass | | section H |
| C8 | Folder structure matches section 3 | | `find frontend/src -type f \| sort` |

## J. Open issues and questions for the reviewer
