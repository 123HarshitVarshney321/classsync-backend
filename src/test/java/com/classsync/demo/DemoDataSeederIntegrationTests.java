package com.classsync.demo;

import com.classsync.dto.occurrence.GenerateOccurrencesRequest;
import com.classsync.dto.occurrence.GenerateOccurrencesResponse;
import com.classsync.dto.occurrence.GenerationConflict;
import com.classsync.dto.occurrence.GenerationConflictType;
import com.classsync.entity.*;
import com.classsync.repository.*;
import com.classsync.service.ScheduleOccurrenceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class DemoDataSeederIntegrationTests {

    @Autowired
    private DemoDataSeeder demoDataSeeder;

    @Autowired
    private ComplexRepository complexRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private FacilityRepository facilityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TimetableVersionRepository timetableVersionRepository;

    @Autowired
    private TimetableEntryRepository timetableEntryRepository;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Autowired
    private ScheduleOccurrenceService scheduleOccurrenceService;

    // Test clock fixed at 2026-10-01, W0 = Monday 2026-09-28
    private static final LocalDate WINDOW_START = LocalDate.of(2026, 9, 7);
    private static final LocalDate WINDOW_END_PLUS_5 = LocalDate.of(2026, 11, 8);

    @Test
    @DisplayName("1. Totals: assert all counts match section 2.8")
    void totalsMatchExpected() {
        DemoDataSeeder.SeedResult result = demoDataSeeder.seed();
        assertFalse(result.skipped());

        // Complexes: 4, all active
        List<Complex> complexes = complexRepository.findAll();
        assertEquals(4, complexes.size());
        assertTrue(complexes.stream().allMatch(Complex::getActive), "All complexes must be active");

        // Rooms: 18 total, 17 active, MB-G05 inactive
        List<Room> rooms = roomRepository.findAll();
        assertEquals(18, rooms.size());
        long activeRooms = rooms.stream().filter(Room::getActive).count();
        assertEquals(17, activeRooms);
        Room mbG05 = rooms.stream().filter(r -> "MB-G05".equalsIgnoreCase(r.getRoomNumber())).findFirst().orElseThrow();
        assertFalse(mbG05.getActive(), "MB-G05 must be inactive");

        // Facilities: 6
        assertEquals(6, facilityRepository.count());

        // Professors: 10
        long profCount = userRepository.findAll().stream().filter(u -> u.getRole() == UserRole.PROFESSOR).count();
        assertEquals(10, profCount);

        // Timetable versions for 2026-27 / 1: 2 versions
        List<TimetableVersion> versions = timetableVersionRepository.findByAcademicYearAndSemesterOrderByVersionNumberDesc("2026-27", "1");
        assertEquals(2, versions.size());
        TimetableVersion v2 = versions.stream().filter(v -> v.getVersionNumber() == 2).findFirst().orElseThrow();
        TimetableVersion v1 = versions.stream().filter(v -> v.getVersionNumber() == 1).findFirst().orElseThrow();
        assertEquals(TimetableVersionStatus.ACTIVE, v1.getStatus());
        assertEquals(TimetableVersionStatus.DRAFT, v2.getStatus());

        List<TimetableEntry> v1Entries = timetableEntryRepository.findByTimetableVersionIdWithDetails(v1.getId());
        List<TimetableEntry> v2Entries = timetableEntryRepository.findByTimetableVersionIdWithDetails(v2.getId());
        assertEquals(36, v1Entries.size());
        assertEquals(37, v2Entries.size());

        // Classes created by seeder: 298 rows in total
        List<ScheduleOccurrence> allOccurrences = scheduleOccurrenceRepository.findWithFilters(
                WINDOW_START, WINDOW_END_PLUS_5, null, null, null, null
        );
        assertEquals(298, allOccurrences.size());

        long scheduled = allOccurrences.stream().filter(o -> o.getStatus() == ScheduleStatus.SCHEDULED).count();
        long officialScheduled = allOccurrences.stream().filter(o -> o.getStatus() == ScheduleStatus.SCHEDULED && o.getEventType() == ScheduleEventType.OFFICIAL).count();
        long extraScheduled = allOccurrences.stream().filter(o -> o.getStatus() == ScheduleStatus.SCHEDULED && o.getEventType() == ScheduleEventType.EXTRA).count();
        long cancelled = allOccurrences.stream().filter(o -> o.getStatus() == ScheduleStatus.CANCELLED).count();
        long rescheduled = allOccurrences.stream().filter(o -> o.getStatus() == ScheduleStatus.RESCHEDULED).count();

        assertEquals(289, scheduled);
        assertEquals(282, officialScheduled);
        assertEquals(7, extraScheduled);
        assertEquals(6, cancelled);
        assertEquals(3, rescheduled);

        // Exactly 3 rows have rescheduledFrom set
        long rescheduledFromCount = allOccurrences.stream().filter(o -> o.getRescheduledFrom() != null).count();
        assertEquals(3, rescheduledFromCount);
    }

    @Test
    @DisplayName("2. Integrity: check pairwise that no two SCHEDULED classes overlap on same room/professor/date")
    void scheduleIntegrityNoOverlaps() {
        demoDataSeeder.seed();

        List<ScheduleOccurrence> scheduledClasses = scheduleOccurrenceRepository.findWithFilters(
                WINDOW_START, WINDOW_END_PLUS_5, null, null, null, ScheduleStatus.SCHEDULED
        );

        Map<LocalDate, List<ScheduleOccurrence>> byDate = scheduledClasses.stream()
                .collect(Collectors.groupingBy(ScheduleOccurrence::getScheduleDate));

        for (Map.Entry<LocalDate, List<ScheduleOccurrence>> entry : byDate.entrySet()) {
            List<ScheduleOccurrence> list = entry.getValue();
            int n = list.size();
            for (int i = 0; i < n; i++) {
                ScheduleOccurrence a = list.get(i);
                for (int j = i + 1; j < n; j++) {
                    ScheduleOccurrence b = list.get(j);

                    // Check room conflict
                    if (a.getRoom().getId().equals(b.getRoom().getId())) {
                        boolean overlaps = a.getStartTime().isBefore(b.getEndTime()) && b.getStartTime().isBefore(a.getEndTime());
                        assertFalse(overlaps, String.format(
                                "Room conflict on %s in room %s between %s (%s-%s) and %s (%s-%s)",
                                entry.getKey(), a.getRoom().getRoomNumber(),
                                a.getCourseCode(), a.getStartTime(), a.getEndTime(),
                                b.getCourseCode(), b.getStartTime(), b.getEndTime()
                        ));
                    }

                    // Check professor conflict
                    if (a.getProfessor().getId().equals(b.getProfessor().getId())) {
                        boolean overlaps = a.getStartTime().isBefore(b.getEndTime()) && b.getStartTime().isBefore(a.getEndTime());
                        assertFalse(overlaps, String.format(
                                "Professor conflict on %s for prof %s between %s (%s-%s) and %s (%s-%s)",
                                entry.getKey(), a.getProfessor().getEmail(),
                                a.getCourseCode(), a.getStartTime(), a.getEndTime(),
                                b.getCourseCode(), b.getStartTime(), b.getEndTime()
                        ));
                    }
                }
            }
        }
    }

    @Test
    @DisplayName("3. Changes applied: verify C1-C6 cancelled, R1-R3 rescheduled, E1-E7 extra classes")
    void changesAppliedSuccessfully() {
        demoDataSeeder.seed();

        LocalDate w0 = LocalDate.of(2026, 9, 28);
        Map<String, User> userByEmail = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getEmail, u -> u));

        // C1 - C6 are CANCELLED
        for (DemoData.CancellationDef c : DemoData.CANCELLATIONS) {
            LocalDate date = w0.plusWeeks(c.weekOffset()).with(c.dayOfWeek());
            User prof = userByEmail.get(c.profUsername() + "@classsync.edu");
            List<ScheduleOccurrence> matches = scheduleOccurrenceRepository.findWithFilters(
                    date, date, prof.getId(), null, null, null
            ).stream().filter(o -> o.getCourseCode().equalsIgnoreCase(c.courseCode()) && o.getStartTime().equals(c.startTime())).toList();

            assertEquals(1, matches.size(), "Expected single match for cancellation " + c.id());
            assertEquals(ScheduleStatus.CANCELLED, matches.getFirst().getStatus(), "Occurrence must be CANCELLED for " + c.id());
        }

        // R1 - R3 originals are RESCHEDULED, each has replacement with rescheduledFrom set
        for (DemoData.RescheduleDef r : DemoData.RESCHEDULES) {
            LocalDate origDate = w0.plusWeeks(r.origWeekOffset()).with(r.origDay());
            User prof = userByEmail.get(r.profUsername() + "@classsync.edu");
            List<ScheduleOccurrence> origMatches = scheduleOccurrenceRepository.findWithFilters(
                    origDate, origDate, prof.getId(), null, null, null
            ).stream().filter(o -> o.getCourseCode().equalsIgnoreCase(r.origCourse()) && o.getStartTime().equals(r.origStart())).toList();

            assertEquals(1, origMatches.size(), "Expected single match for reschedule original " + r.id());
            ScheduleOccurrence orig = origMatches.getFirst();
            assertEquals(ScheduleStatus.RESCHEDULED, orig.getStatus(), "Original must be RESCHEDULED for " + r.id());

            LocalDate targetDate = w0.plusWeeks(r.targetWeekOffset()).with(r.targetDay());
            List<ScheduleOccurrence> replacementMatches = scheduleOccurrenceRepository.findWithFilters(
                    targetDate, targetDate, prof.getId(), null, null, ScheduleStatus.SCHEDULED
            ).stream().filter(o -> o.getRescheduledFrom() != null && o.getRescheduledFrom().getId().equals(orig.getId())).toList();

            assertEquals(1, replacementMatches.size(), "Expected exactly 1 replacement for " + r.id());
            ScheduleOccurrence replacement = replacementMatches.getFirst();
            assertEquals(r.targetStart(), replacement.getStartTime());
            assertEquals(r.targetEnd(), replacement.getEndTime());
            assertEquals(r.targetRoomNumber(), replacement.getRoom().getRoomNumber());
        }

        // E1 - E7 exist as SCHEDULED EXTRA classes
        for (DemoData.ExtraBookingDef e : DemoData.EXTRA_BOOKINGS) {
            LocalDate date = w0.plusWeeks(e.weekOffset()).with(e.day());
            User prof = userByEmail.get(e.profUsername() + "@classsync.edu");
            List<ScheduleOccurrence> matches = scheduleOccurrenceRepository.findWithFilters(
                    date, date, prof.getId(), null, null, ScheduleStatus.SCHEDULED
            ).stream().filter(o -> o.getEventType() == ScheduleEventType.EXTRA &&
                    o.getCourseCode().equalsIgnoreCase(e.courseCode()) &&
                    o.getRoom().getRoomNumber().equalsIgnoreCase(e.roomNumber()) &&
                    o.getStartTime().equals(e.startTime())).toList();

            assertEquals(1, matches.size(), "Expected single scheduled extra class for " + e.id());
        }
    }

    @Test
    @DisplayName("4. Idempotent: second call to seed() is skipped and totals remain unchanged")
    void seedIsIdempotent() {
        DemoDataSeeder.SeedResult first = demoDataSeeder.seed();
        assertFalse(first.skipped());

        long complexCount = complexRepository.count();
        long roomCount = roomRepository.count();
        long userCount = userRepository.count();
        long occurrenceCount = scheduleOccurrenceRepository.count();

        DemoDataSeeder.SeedResult second = demoDataSeeder.seed();
        assertTrue(second.skipped());

        assertEquals(complexCount, complexRepository.count());
        assertEquals(roomCount, roomRepository.count());
        assertEquals(userCount, userRepository.count());
        assertEquals(occurrenceCount, scheduleOccurrenceRepository.count());
    }

    @Test
    @DisplayName("5. Future conflict demo: week +5 generation reports 35 created and 1 ROOM_BUSY conflict")
    void futureConflictDemo() {
        demoDataSeeder.seed();

        TimetableVersion v1 = timetableVersionRepository.findByAcademicYearAndSemesterOrderByVersionNumberDesc("2026-27", "1")
                .stream().filter(v -> v.getVersionNumber() == 1).findFirst().orElseThrow();

        // Week +5: 2026-11-02 to 2026-11-08
        GenerateOccurrencesResponse res = scheduleOccurrenceService.generateOccurrences(
                new GenerateOccurrencesRequest(v1.getId(), LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 8)),
                "admin@classsync.edu"
        );

        assertEquals(35, res.createdCount());
        assertEquals(1, res.conflictCount());
        assertEquals(1, res.conflicts().size());

        GenerationConflict conflict = res.conflicts().getFirst();
        assertEquals(GenerationConflictType.ROOM_BUSY, conflict.type());
        assertEquals("MA101", conflict.courseCode());
        assertEquals("PH101", conflict.conflictingCourseCode());
        assertEquals(ScheduleEventType.EXTRA, conflict.conflictingEventType());
    }

    @Test
    @DisplayName("6. Inactive room: MB-G05 is inactive and has no classes")
    void inactiveRoomUnderRenovation() {
        demoDataSeeder.seed();

        Room mbG05 = roomRepository.findAll().stream()
                .filter(r -> "MB-G05".equalsIgnoreCase(r.getRoomNumber()))
                .findFirst()
                .orElseThrow();

        assertFalse(mbG05.getActive(), "MB-G05 must be inactive");

        List<ScheduleOccurrence> occurrences = scheduleOccurrenceRepository.findWithFilters(
                WINDOW_START, WINDOW_END_PLUS_5, null, mbG05.getId(), null, null
        );
        assertTrue(occurrences.isEmpty(), "MB-G05 must have 0 classes scheduled");
    }
}
