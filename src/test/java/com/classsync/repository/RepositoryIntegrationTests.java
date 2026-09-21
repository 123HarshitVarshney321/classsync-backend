package com.classsync.repository;

import com.classsync.entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class RepositoryIntegrationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ComplexRepository complexRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private FacilityRepository facilityRepository;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Test
    void shouldFindSeedUsers() {
        Optional<User> adminOpt = userRepository.findByEmail("admin@classsync.edu");
        assertTrue(adminOpt.isPresent(), "Admin user should exist from seed data");
        assertEquals("System Administrator", adminOpt.get().getName());
        assertEquals(UserRole.ADMIN, adminOpt.get().getRole());
        assertEquals("EMP-ADM-001", adminOpt.get().getEmployeeCode());

        Optional<User> profOpt = userRepository.findByEmployeeCode("EMP-PRF-001");
        assertTrue(profOpt.isPresent(), "Professor Turing should exist from seed data");
        assertEquals("Dr. Alan Turing", profOpt.get().getName());
        assertEquals(UserRole.PROFESSOR, profOpt.get().getRole());
    }

    @Test
    void shouldFindSeedComplexAndRooms() {
        Optional<Complex> secOpt = complexRepository.findByCode("SEC");
        assertTrue(secOpt.isPresent(), "SEC complex should exist from seed data");
        assertEquals("Science & Engineering Complex", secOpt.get().getName());

        Optional<Room> roomOpt = roomRepository.findByComplexIdAndRoomNumber(secOpt.get().getId(), "SEC-101");
        assertTrue(roomOpt.isPresent(), "SEC-101 room should exist");
        Room room = roomOpt.get();
        assertEquals(RoomType.CLASSROOM, room.getRoomType());
        assertEquals(40, room.getCapacity());
        assertFalse(room.getFacilities().isEmpty(), "Room facilities should be loaded");
        assertEquals(2, room.getFacilities().size());
    }

    @Test
    void shouldCreateAndRetrieveScheduleOccurrence() {
        User prof = userRepository.findByEmail("aturing@classsync.edu").orElseThrow();
        User admin = userRepository.findByEmail("admin@classsync.edu").orElseThrow();
        Complex sec = complexRepository.findByCode("SEC").orElseThrow();
        Room room = roomRepository.findByComplexIdAndRoomNumber(sec.getId(), "SEC-101").orElseThrow();

        ScheduleOccurrence occurrence = new ScheduleOccurrence(
                null, // timetableEntry is nullable for EXTRA occurrences
                prof,
                room,
                LocalDate.now(),
                LocalTime.of(10, 0),
                LocalTime.of(11, 30),
                ScheduleEventType.EXTRA,
                ScheduleStatus.SCHEDULED,
                "CS101",
                "Intro to Computing",
                admin
        );

        ScheduleOccurrence saved = scheduleOccurrenceRepository.save(occurrence);
        assertNotNull(saved.getId(), "Generated ID should not be null");

        Optional<ScheduleOccurrence> fetched = scheduleOccurrenceRepository.findById(saved.getId());
        assertTrue(fetched.isPresent());
        assertEquals("CS101", fetched.get().getCourseCode());
        assertEquals(ScheduleEventType.EXTRA, fetched.get().getEventType());
        assertNull(fetched.get().getTimetableEntry(), "EXTRA occurrence has null timetable entry");
    }
}
