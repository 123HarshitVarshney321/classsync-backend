# ClassSync Demo Guide

A step-by-step walkthrough script for evaluating and presenting ClassSync using the pre-seeded demo dataset.

---

## 1. Quick Start

Start the application with fresh demo data:
```bash
./run.sh --fresh-demo
```
The browser will automatically open [http://localhost:5173](http://localhost:5173).

---

## 2. Administrator Walkthrough

Log in as **Administrator** using the Quick Login card or credentials `admin@classsync.edu` / `Admin@123`.

### A. Timetables & Version Management
1. Click **Timetables** in the top navigation bar.
2. Observe two timetable versions for **2026-27 / Semester 1**:
   * **v1** (Status: `ACTIVE`): 36 weekly master entries.
   * **v2** (Status: `DRAFT`): 37 weekly master entries (entry 16 relocated to `MB-102`, plus new `CS404 Cloud Computing` in `LHC-3`).
3. Click **Open** on **v1** to inspect the 36 master weekly entries across Monday through Friday.

### B. Calendar Occurrence Generation & Conflict Detection
1. Click **Generate** in the top navigation bar.
2. Select version **v1** (`2026-27 / Sem 1`).
3. Set the date range to **Week +5** (Monday to Sunday, 5 weeks from current week's Monday).
4. Click **Generate Calendar Occurrences**.
5. **Expected Result**:
   * The generator reports: `Created: 35 | Skipped: 0 | Conflicts: 1`.
   * Conflict details highlight: `ROOM_BUSY` on Tuesday 10:00–11:00 for **MA101 (Calculus)** in **LHC-1** conflicting with existing EXTRA class **PH101 (Special Lecture)** booked by Dr. C. V. Raman.

### C. Version Supersession Demo
1. Navigate back to **Timetables**.
2. Click **Activate** next to **v2 (DRAFT)**.
3. Select the effective date as **Next Monday** and click **Confirm Activation**.
4. **Expected Result**:
   * `v2` becomes `ACTIVE`, while `v1` transitions to `ARCHIVED`.
   * An alert confirms future occurrences of `v1` superseded from next Monday onward.
5. Click **Generate** and project `v2` for weeks +1 through +4 to reflect the updated curriculum.

### D. Campus-Wide Live Occupancy Grid
1. Click **Occupancy** in the top navigation bar.
2. Select a busy weekday (e.g. Wednesday of Week +1).
3. Observe the full matrix of classrooms, lecture halls, and laboratories grouped by complex (`SEC`, `HSS`, `LHC`, `MB`) showing occupied time blocks and professor assignments.

### E. Campus & Facilities Administration
1. Click **Campus** in the top navigation bar.
2. Select the **Rooms** tab.
3. Choose the **Main Building (MB)** complex.
4. Tick the **Show inactive** checkbox in the top right.
5. **Expected Result**:
   * Room **MB-G05** appears with an `INACTIVE` badge and note "Under Renovation".
   * Click **Activate** / **Deactivate** to toggle status dynamically with confirmation.

---

## 3. Professor Walkthrough

Log out from the Admin account and test professor roles using password `password123`.

### A. Prof. Ada Lovelace (`alovelace@classsync.edu`)
1. Log in and navigate to **My Week** for **Week +1**.
2. **Expected Schedule Highlights**:
   * **Thursday**:
     * Original **CS202** (Discrete Mathematics, 10:00–11:00) displays with status badge **Rescheduled**.
     * Extra tutorial **MA201 (Linear Algebra)** displays at **15:00–16:00** in room **HSS-101** (Status: `SCHEDULED`).
   * **Friday**:
     * The moved **CS202** class appears at **15:00–16:00** in room **SEC-102** (Status: `SCHEDULED`).

### B. Prof. John von Neumann (`jvonneumann@classsync.edu`)
1. Log in and navigate to **My Week** for **Week +1**.
2. **Expected Schedule Highlights**:
   * **Friday**:
     * **CS303 (Computer Networks, 11:00–12:00)** in room **MB-101** displays with status badge **Cancelled** (non-destructively preserved).
     * **CS499 (Research Seminar, 15:00–16:30)** remains **SCHEDULED** in room **MB-201**.

### C. Prof. Alan Turing (`aturing@classsync.edu`)
1. Log in and navigate to **My Week** for **Week +1**.
2. **Expected Schedule Highlights**:
   * **Thursday**:
     * Extra booking **CS201 (Doubt-Clearing Session, 15:00–16:00)** appears in **SEC-101** (Status: `SCHEDULED`).

### D. Advisory Room Search & Recommendation Engine
1. From any professor account, click **Find a Room**.
2. Select:
   * **Date**: Next Monday ($W_0 + 1$ Monday)
   * **Time Slot**: `09:00` to `10:00`
   * **Min Capacity**: `100`
   * **Room Type**: `LECTURE_HALL`
   * **Facilities**: Select `Projector` and `Audio System`
3. Click **Search Available Rooms**.
4. **Expected Result**:
   * Ranked list of lecture halls (e.g. `LHC-2`, `LHC-3`) with transparent fit scores and explanations:
     * Room capacity match and waste ratio calculation.
     * Equipment facility match indicators.
     * Consecutive block continuity context.
5. Click **Book Room** to reserve an available slot and immediately see it reflected in **My Week**.

---

## 4. Analytics & Utilization (Upcoming Feature)
* The past 3 weeks ($W_{-3}, W_{-2}, W_{-1}$) contain 108 scheduled historical occurrences and 4 cancellations, providing rich historical data for campus space utilization heatmaps, peak load analysis, and identification of underused spaces (e.g. `SEC-101`).

---

## 5. Teardown & Reset
To stop all services:
```bash
./stop.sh
```
To reset back to pristine demo data at any time:
```bash
./run.sh --fresh-demo
```
