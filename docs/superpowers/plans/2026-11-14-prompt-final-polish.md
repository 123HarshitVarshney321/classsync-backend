# Implementation Plan: Prompt Final — Analytics, Polish Fixes and Documentation Refresh

**Date:** 2026-11-14  
**Branch:** `feature/final-polish`  
**BASE_COMMIT:** `be5001df84b8d304edd84a62172861ed525d99f4`

---

## 1. Objectives & Ground Rules
- Deliver O7 (utilization analytics) end-to-end (backend + frontend).
- Implement fixes:
  - FX1: Move `SecurityTestController` from `src/main` to `src/test`.
  - FX2: Check database timezone and adjust only if 5h30m drift is confirmed.
  - FX3: Escape closes `Modal` and `ConfirmDialog`.
- Implement UI additions:
  - SA1: Admin can cancel classes directly from `OccupancyGrid`.
  - SA2: Red "now" indicator line in `WeekCalendar` for current time during teaching day.
- Refresh documentation truthfully with actual surefire and vitest numbers.
- Strict ground rules:
  - No new npm or maven dependencies.
  - No database migrations or schema alterations.
  - Files under ~250 lines.
  - Strict `useEffect` primitive dependency constraints.
  - Push after each phase to `origin/feature/final-polish`.
  - Never merge into `main`.

---

## 2. Phase Breakdown

### Phase 0: Setup
- Save prompt: `docs/prompts/PROMPT_FINAL_ANALYTICS_POLISH.md` (done).
- Write implementation plan: `docs/superpowers/plans/2026-11-14-prompt-final-polish.md`.
- Create report skeleton: `docs/reports/PROMPT_FINAL_REPORT.md` with tasks NOT STARTED.
- Commit: `chore(FINAL-P0): prompt, plan and report skeleton` and push.

### Phase 1: Small Fixes
- FX1: Move `SecurityTestController.java` to `src/test/java/com/classsync/controller/` and add comment in `SecurityConfig.java`. Verify jar package check (`grep -c SecurityTestController` is 0) and tests.
- FX2: Check database timezone with MySQL query and API version creation. Determine if `serverTimezone` requires update.
- FX3: Add Escape key listeners to `Modal.jsx` and `ConfirmDialog.jsx`.
- Run checks: `mvn clean test`, `npm run lint`, `npm test`, `npm run build`.
- Commit: `fix(FINAL-P1): test-only controller, timezone check, Escape closes dialogs` and push.

### Phase 2: Analytics Backend (O7)
- 4.1: Implement `src/main/java/com/classsync/service/UtilizationCalculator.java` with static math/calendar methods.
- 4.2: Create DTO records in `src/main/java/com/classsync/dto/analytics/`:
  - `UtilizationResponse`, `UtilizationSummary`, `RoomUtilization`, `HeatmapRow`, `HeatmapCell`.
- 4.3: Add `findActiveRoomsInScope(@Param("complexId") Integer complexId)` in `RoomRepository`.
- 4.4: Implement `AnalyticsService.getUtilization(startDate, endDate, complexId)` with validation, class counting, room sorting, heatmap aggregation, and relative underused threshold calculation.
- 4.5: Implement `AnalyticsController` at `GET /api/analytics/utilization` with admin role restriction in `SecurityConfig`.
- 4.6: Add tests:
  - `UtilizationCalculatorTest` (unit tests covering all utility methods).
  - `AnalyticsIntegrationTests` (MockMvc integration tests covering exact expected numbers, edge cases, weekend ranges, validation errors, 401/403 security).
- Verify: `mvn clean test`.
- Commit: `feat(FINAL-P2): utilization analytics endpoint` and push.

### Phase 3: Frontend Analytics & Additions
- 5.1 Analytics Page:
  - Add API endpoint in `api/endpoints.js`.
  - Add route in `App.jsx` and navbar link in `Navbar.jsx`.
  - Create `utils/heatmap.js` and `utils/heatmap.test.js` (`heatColorClass`).
  - Create `components/UtilizationHeatmap.jsx`.
  - Create `pages/admin/AnalyticsPage.jsx` with date range presets, complex filter, 6 summary cards, definition callout, rooms table with underused badge and bar, and heatmap.
- 5.2 SA1 Admin Cancel from Occupancy:
  - Add `onBlockClick` in `components/OccupancyGrid.jsx`.
  - In `pages/shared/OccupancyPage.jsx`, handle admin block click to open details modal with "Cancel class" confirmation and refresh.
- 5.3 SA2 Now Line:
  - Add `timeOfDayPercent` in `utils/dates.js` and tests in `utils/dates.test.js`.
  - Add red line in `components/WeekCalendar.jsx` for today's column when within teaching day.
- Verify: `npm run lint`, `npm test`, `npm run build`, `npm ls --depth=0`.
- Commit: `feat(FINAL-P3): analytics page, admin cancel from occupancy, now line` and push.

### Phase 4: Documentation Refresh
- Update `PROJECT_PROGRESS_REPORT.md` (remove "Backend" from title, update status line, add React frontend section, demo data section, analytics section, O1-O7 table, testing section, future work).
- Update `README.md` (test counts, audit logs/notifications note, rescheduled description, analytics API, admin cancel UI).
- Update `docs/DEMO_GUIDE.md` (past 3 weeks numbers, remove renovation note, add Analytics evaluation section, admin cancel).
- Update `frontend/README.md` (new screens and capabilities).
- Commit: `docs(FINAL-P4): refresh report, README and demo guide` and push.

### Phase 5: Walkthrough, Evidence & Final Report
- Run `./run.sh --fresh-demo` and record `Demo data loaded:`.
- Test A1 end-to-end API check with curl, record full JSON and comparison table.
- Test weekend range and 403 access control.
- Capture screenshots `final-01-analytics.png` through `final-06-now-line.png`.
- Test Escape key dialog closure.
- Clean up with pristine re-seed.
- Populate `docs/reports/PROMPT_FINAL_REPORT.md`.
- Commit: `docs(FINAL-P5): walkthrough evidence and report` and push.
- Print entire report as final message.
