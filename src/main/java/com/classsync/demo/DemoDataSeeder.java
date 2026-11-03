package com.classsync.demo;

import com.classsync.dto.booking.CreateBookingRequest;
import com.classsync.dto.common.StatusUpdateRequest;
import com.classsync.dto.complex.ComplexRequest;
import com.classsync.dto.facility.FacilityRequest;
import com.classsync.dto.occurrence.GenerateOccurrencesRequest;
import com.classsync.dto.occurrence.GenerateOccurrencesResponse;
import com.classsync.dto.occurrence.RescheduleRequest;
import com.classsync.dto.room.CreateRoomRequest;
import com.classsync.dto.timetable.CreateTimetableEntryRequest;
import com.classsync.dto.timetable.CreateTimetableVersionRequest;
import com.classsync.dto.timetable.TimetableVersionResponse;
import com.classsync.entity.*;
import com.classsync.repository.*;
import com.classsync.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DemoDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final FacilityService facilityService;
    private final ComplexService complexService;
    private final RoomService roomService;
    private final TimetableVersionService timetableVersionService;
    private final TimetableEntryService timetableEntryService;
    private final ScheduleOccurrenceService scheduleOccurrenceService;
    private final ClassScheduleService classScheduleService;
    private final BookingService bookingService;

    private final ComplexRepository complexRepository;
    private final FacilityRepository facilityRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public record SeedResult(boolean skipped, int complexes, int rooms, int professors,
                             int versions, int occurrences, String summary) {}

    public DemoDataSeeder(FacilityService facilityService,
                          ComplexService complexService,
                          RoomService roomService,
                          TimetableVersionService timetableVersionService,
                          TimetableEntryService timetableEntryService,
                          ScheduleOccurrenceService scheduleOccurrenceService,
                          ClassScheduleService classScheduleService,
                          BookingService bookingService,
                          ComplexRepository complexRepository,
                          FacilityRepository facilityRepository,
                          RoomRepository roomRepository,
                          UserRepository userRepository,
                          ScheduleOccurrenceRepository scheduleOccurrenceRepository,
                          PasswordEncoder passwordEncoder,
                          Clock clock) {
        this.facilityService = facilityService;
        this.complexService = complexService;
        this.roomService = roomService;
        this.timetableVersionService = timetableVersionService;
        this.timetableEntryService = timetableEntryService;
        this.scheduleOccurrenceService = scheduleOccurrenceService;
        this.classScheduleService = classScheduleService;
        this.bookingService = bookingService;
        this.complexRepository = complexRepository;
        this.facilityRepository = facilityRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public SeedResult seed() {
        // 1. Guard: if complex with code LHC exists, skip
        if (complexRepository.findByCode("LHC").isPresent()) {
            log.info("Demo data already present (complex LHC exists) - skipping");
            return new SeedResult(true, 0, 0, 0, 0, 0, "Demo data already present (complex LHC exists) - skipping");
        }

        // 2.1 Facility
        createFacility();

        // 2.2 Complexes
        createComplexes();

        // 2.3 Rooms
        createRooms();

        // 2.4 Professors
        createProfessors();

        // 2.5 Timetable version 1 and generation
        LocalDate w0 = LocalDate.now(clock).with(DayOfWeek.MONDAY);
        LocalDate windowStart = w0.minusWeeks(3);
        LocalDate windowEnd = w0.plusWeeks(4).with(DayOfWeek.SUNDAY);

        Integer v1Id = createAndActivateTimetableVersion1(windowStart, windowEnd);

        // 2.6 Post-generation changes: cancellations, reschedules, extra bookings
        applyPostGenerationChanges(w0);

        // 2.7 Finishing touches: deactivate MB-G05, create timetable version 2 DRAFT
        createFinishingTouches(v1Id);

        // Validate expected totals
        long totalComplexes = complexRepository.count();
        long totalRooms = roomRepository.count();
        long activeRooms = roomRepository.findAll().stream().filter(Room::getActive).count();
        long totalFacilities = facilityRepository.count();
        long totalProfessors = userRepository.findAll().stream().filter(u -> u.getRole() == UserRole.PROFESSOR).count();
        List<ScheduleOccurrence> allOccurrences = scheduleOccurrenceRepository.findWithFilters(
                windowStart, w0.plusWeeks(5).with(DayOfWeek.SUNDAY), null, null, null, null
        );

        long scheduledCount = allOccurrences.stream().filter(o -> o.getStatus() == ScheduleStatus.SCHEDULED).count();
        long cancelledCount = allOccurrences.stream().filter(o -> o.getStatus() == ScheduleStatus.CANCELLED).count();
        long rescheduledCount = allOccurrences.stream().filter(o -> o.getStatus() == ScheduleStatus.RESCHEDULED).count();
        long extraCount = allOccurrences.stream().filter(o -> o.getEventType() == ScheduleEventType.EXTRA && o.getStatus() == ScheduleStatus.SCHEDULED).count();

        String summary = String.format(
                "Demo data loaded: %d complexes, %d rooms (%d active), %d professors, 2 timetable versions (v1 ACTIVE 36 entries, v2 DRAFT 37 entries), %d classes (%d scheduled incl. %d extra, %d cancelled, %d rescheduled), window %s..%s",
                totalComplexes, totalRooms, activeRooms, totalProfessors, allOccurrences.size(), scheduledCount, extraCount, cancelledCount, rescheduledCount, windowStart, windowEnd
        );

        log.info(summary);

        return new SeedResult(false, (int) totalComplexes, (int) totalRooms, (int) totalProfessors, 2, allOccurrences.size(), summary);
    }

    private void createFacility() {
        facilityService.createFacility(new FacilityRequest(DemoData.NEW_FACILITY));
    }

    private void createComplexes() {
        for (DemoData.ComplexDef def : DemoData.COMPLEXES) {
            complexService.createComplex(new ComplexRequest(def.name(), def.code()));
        }
    }

    private void createRooms() {
        Map<String, Integer> complexIdByCode = complexRepository.findAll().stream()
                .collect(Collectors.toMap(Complex::getCode, Complex::getId));
        Map<String, Integer> facilityIdByName = facilityRepository.findAll().stream()
                .collect(Collectors.toMap(Facility::getName, Facility::getId));

        for (DemoData.RoomDef r : DemoData.ROOMS) {
            Integer complexId = complexIdByCode.get(r.complexCode());
            if (complexId == null) {
                throw new IllegalStateException("Complex not found for code: " + r.complexCode());
            }

            Set<Integer> facilityIds = new HashSet<>();
            for (String facName : r.facilityNames()) {
                Integer facId = facilityIdByName.get(facName);
                if (facId == null) {
                    throw new IllegalStateException("Facility not found: " + facName);
                }
                facilityIds.add(facId);
            }

            roomService.createRoom(complexId, new CreateRoomRequest(r.roomNumber(), r.type(), r.capacity(), facilityIds));
        }
    }

    private void createProfessors() {
        String encodedPassword = passwordEncoder.encode("password123");
        for (DemoData.ProfessorDef p : DemoData.PROFESSORS) {
            User user = new User(p.name(), p.email(), encodedPassword, UserRole.PROFESSOR, p.employeeCode(), UserStatus.ACTIVE);
            userRepository.save(user);
        }
    }

    private Integer createAndActivateTimetableVersion1(LocalDate windowStart, LocalDate windowEnd) {
        TimetableVersionResponse v1 = timetableVersionService.createVersion(
                new CreateTimetableVersionRequest("2026-27", "1"), "admin@classsync.edu"
        );

        Map<String, Integer> profIdByEmail = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getEmail, User::getId));
        Map<String, Integer> roomIdByNumber = roomRepository.findAll().stream()
                .collect(Collectors.toMap(Room::getRoomNumber, Room::getId));

        for (DemoData.EntryDef e : DemoData.TIMETABLE_V1_ENTRIES) {
            String profEmail = e.profUsername() + "@classsync.edu";
            Integer profId = profIdByEmail.get(profEmail);
            if (profId == null) {
                throw new IllegalStateException("Professor not found: " + profEmail);
            }

            Integer roomId = roomIdByNumber.get(e.roomNumber());
            if (roomId == null) {
                throw new IllegalStateException("Room not found: " + e.roomNumber());
            }

            timetableEntryService.createEntry(v1.id(), new CreateTimetableEntryRequest(
                    profId, e.courseCode(), e.courseName(), roomId, (byte) e.dayOfWeek(), e.startTime(), e.endTime()
            ));
        }

        // Activate v1
        timetableVersionService.activateVersion(v1.id(), null);

        // Generate occurrences
        GenerateOccurrencesResponse genRes = scheduleOccurrenceService.generateOccurrences(
                new GenerateOccurrencesRequest(v1.id(), windowStart, windowEnd), "admin@classsync.edu"
        );

        if (genRes.createdCount() != 288 || genRes.conflictCount() != 0) {
            throw new IllegalStateException("Generation failed: created=" + genRes.createdCount() + ", conflicts=" + genRes.conflictCount());
        }

        return v1.id();
    }

    private void applyPostGenerationChanges(LocalDate w0) {
        Map<String, User> userByEmail = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getEmail, u -> u));
        Map<String, Room> roomByNumber = roomRepository.findAll().stream()
                .collect(Collectors.toMap(Room::getRoomNumber, r -> r));

        // 1. Cancellations C1 - C6
        for (DemoData.CancellationDef c : DemoData.CANCELLATIONS) {
            LocalDate date = w0.plusWeeks(c.weekOffset()).with(c.dayOfWeek());
            String profEmail = c.profUsername() + "@classsync.edu";
            User prof = userByEmail.get(profEmail);
            if (prof == null) {
                throw new IllegalStateException("Professor not found: " + profEmail);
            }

            ScheduleOccurrence occ = findOccurrence(date, prof.getId(), c.courseCode(), c.startTime());
            classScheduleService.cancelOccurrence(occ.getId(), profEmail);
        }

        // 2. Reschedules R1 - R3
        for (DemoData.RescheduleDef r : DemoData.RESCHEDULES) {
            LocalDate origDate = w0.plusWeeks(r.origWeekOffset()).with(r.origDay());
            String profEmail = r.profUsername() + "@classsync.edu";
            User prof = userByEmail.get(profEmail);
            if (prof == null) {
                throw new IllegalStateException("Professor not found: " + profEmail);
            }

            ScheduleOccurrence occ = findOccurrence(origDate, prof.getId(), r.origCourse(), r.origStart());

            LocalDate targetDate = w0.plusWeeks(r.targetWeekOffset()).with(r.targetDay());
            Room targetRoom = roomByNumber.get(r.targetRoomNumber());
            if (targetRoom == null) {
                throw new IllegalStateException("Target room not found: " + r.targetRoomNumber());
            }

            classScheduleService.rescheduleOccurrence(
                    occ.getId(),
                    new RescheduleRequest(targetDate, r.targetStart(), r.targetEnd(), targetRoom.getId()),
                    profEmail
            );
        }

        // 3. Extra classes E1 - E7
        for (DemoData.ExtraBookingDef e : DemoData.EXTRA_BOOKINGS) {
            LocalDate date = w0.plusWeeks(e.weekOffset()).with(e.day());
            String profEmail = e.profUsername() + "@classsync.edu";
            Room room = roomByNumber.get(e.roomNumber());
            if (room == null) {
                throw new IllegalStateException("Room not found: " + e.roomNumber());
            }

            bookingService.createExtraClass(
                    new CreateBookingRequest(room.getId(), date, e.startTime(), e.endTime(), e.courseCode(), e.courseName()),
                    profEmail
            );
        }
    }

    private void createFinishingTouches(Integer v1Id) {
        // Deactivate MB-G05
        Room mbG05 = roomRepository.findAll().stream()
                .filter(r -> "MB-G05".equalsIgnoreCase(r.getRoomNumber()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Room MB-G05 not found"));

        roomService.updateRoomStatus(mbG05.getId(), new StatusUpdateRequest(false));

        // Create timetable version 2 DRAFT
        TimetableVersionResponse v2 = timetableVersionService.createVersion(
                new CreateTimetableVersionRequest("2026-27", "1"), "admin@classsync.edu"
        );

        Map<String, Integer> profIdByEmail = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getEmail, User::getId));
        Map<String, Integer> roomIdByNumber = roomRepository.findAll().stream()
                .collect(Collectors.toMap(Room::getRoomNumber, Room::getId));

        for (DemoData.EntryDef e : DemoData.TIMETABLE_V1_ENTRIES) {
            String profEmail = e.profUsername() + "@classsync.edu";
            Integer profId = profIdByEmail.get(profEmail);

            // Entry 16 in v2 uses MB-102 instead of MB-101
            String roomNumber = (e.number() == 16) ? "MB-102" : e.roomNumber();
            Integer roomId = roomIdByNumber.get(roomNumber);
            if (roomId == null) {
                throw new IllegalStateException("Room not found: " + roomNumber);
            }

            timetableEntryService.createEntry(v2.id(), new CreateTimetableEntryRequest(
                    profId, e.courseCode(), e.courseName(), roomId, (byte) e.dayOfWeek(), e.startTime(), e.endTime()
            ));
        }

        // Add 37th entry: CS404 Cloud Computing, ghopper, LHC-3, Fri 11:00-12:00
        Integer ghopperId = profIdByEmail.get("ghopper@classsync.edu");
        Integer lhc3Id = roomIdByNumber.get("LHC-3");
        timetableEntryService.createEntry(v2.id(), new CreateTimetableEntryRequest(
                ghopperId, "CS404", "Cloud Computing", lhc3Id, (byte) 5, LocalTime.of(11, 0), LocalTime.of(12, 0)
        ));
    }

    private ScheduleOccurrence findOccurrence(LocalDate date, Integer professorId, String courseCode, LocalTime startTime) {
        List<ScheduleOccurrence> list = scheduleOccurrenceRepository.findWithFilters(
                date, date, professorId, null, null, ScheduleStatus.SCHEDULED
        );

        List<ScheduleOccurrence> matches = list.stream()
                .filter(o -> o.getCourseCode().equalsIgnoreCase(courseCode) && o.getStartTime().equals(startTime))
                .toList();

        if (matches.size() != 1) {
            throw new IllegalStateException("Expected exactly 1 scheduled occurrence for course " + courseCode +
                    " on " + date + " at " + startTime + " (profId: " + professorId + "), but found: " + matches.size());
        }

        return matches.getFirst();
    }
}
