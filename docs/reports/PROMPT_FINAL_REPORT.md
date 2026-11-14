# PROMPT FINAL — Execution Report

## A. Run metadata
- Branch: feature/final-polish
- BASE_COMMIT (`git rev-parse HEAD` from Phase 0): be5001df84b8d304edd84a62172861ed525d99f4
- HEAD after final push (`git rev-parse HEAD`, taken AFTER the last commit):
- Pushed: yes/no (last lines of `git push`)

## B. Commits
(`git log --oneline BASE_COMMIT..HEAD`)

## C. Files changed
(`git diff --stat BASE_COMMIT..HEAD`)

## D. Task status
| Task | Status (DONE / PARTIAL / NOT STARTED / DEVIATED) | Notes |
|---|---|---|
| P0 setup | NOT STARTED | |
| FX1 test controller moved | NOT STARTED | |
| FX2 timezone (checked; fixed or not needed) | NOT STARTED | |
| FX3 Escape closes dialogs | NOT STARTED | |
| P2 analytics backend | NOT STARTED | |
| P3 analytics page | NOT STARTED | |
| SA1 admin cancel from Occupancy | NOT STARTED | |
| SA2 now line | NOT STARTED | |
| P4 docs refresh | NOT STARTED | |
| P5 walkthrough + report | NOT STARTED | |

## E. Deviations
For each: what the prompt said, what you did instead, and why.

## F. Backend tests
(`grep -h "Tests run" target/surefire-reports/*.txt`, plus the total and BUILD lines)

## G. Frontend checks
- G1. `npm ls --depth=0`
- G2. `npm run lint`
- G3. `npm test` (summary)
- G4. `npm run build` (last ~10 lines)

## H. Evidence
- H1. The `Demo data loaded:` line
- H2. FX1 jar check output
- H3. FX2 evidence (time, MySQL zones, createdAt before and after if changed)
- H4. A1 JSON (full, raw), plus the expected-vs-actual table:
| Field | Expected | Actual | PASS/FAIL |
|---|---|---|---|
- H5. The weekend check and the professor 403 output
- H6. Screenshots:
| File | PASS/FAIL | Notes |
|---|---|---|
- H7. Escape check: PASS/FAIL
- H8. Section 8 final checks output

## I. Open issues and questions for the reviewer
