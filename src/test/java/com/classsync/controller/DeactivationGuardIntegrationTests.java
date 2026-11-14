package com.classsync.controller;

import com.classsync.entity.*;
import com.classsync.repository.ComplexRepository;
import com.classsync.repository.RoomRepository;
import com.classsync.repository.ScheduleOccurrenceRepository;
import com.classsync.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DeactivationGuardIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ComplexRepository complexRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Complex createComplex(String name, String code) {
        return complexRepository.save(new Complex(name, code, true));
    }

    private Room createRoom(Complex complex, String roomNumber) {
        return roomRepository.save(new Room(complex, roomNumber, RoomType.CLASSROOM, 40, true));
    }

    private ScheduleOccurrence createOccurrence(Room room, User prof, LocalDate date, LocalTime start, LocalTime end, ScheduleStatus status) {
        ScheduleOccurrence occ = new ScheduleOccurrence(
                null,
                prof,
                room,
                date,
                start,
                end,
                ScheduleEventType.EXTRA,
                status,
                "CS101",
                "Intro to CS",
                prof
        );
        return scheduleOccurrenceRepository.save(occ);
    }

    @Test
    @DisplayName("1. Room with one upcoming class (2026-11-10) -> deactivation returns 409")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void roomWithUpcomingClassCannotBeDeactivated() throws Exception {
        Complex complex = createComplex("Guard Complex 1", "GC1");
        Room room = createRoom(complex, "G-101");
        User prof = userRepository.findByEmail("aturing@classsync.edu").orElseThrow();

        createOccurrence(room, prof, LocalDate.of(2026, 11, 10), LocalTime.of(10, 0), LocalTime.of(11, 0), ScheduleStatus.SCHEDULED);

        String payload = objectMapper.writeValueAsString(Map.of("active", false));
        mockMvc.perform(patch("/api/rooms/" + room.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("1 upcoming")))
                .andExpect(jsonPath("$.message", containsString("2026-11-10")));
    }

    @Test
    @DisplayName("2. The same room after that class is set to CANCELLED -> deactivation returns 200")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void roomAfterClassCancelledCanBeDeactivated() throws Exception {
        Complex complex = createComplex("Guard Complex 2", "GC2");
        Room room = createRoom(complex, "G-102");
        User prof = userRepository.findByEmail("aturing@classsync.edu").orElseThrow();

        ScheduleOccurrence occ = createOccurrence(room, prof, LocalDate.of(2026, 11, 10), LocalTime.of(10, 0), LocalTime.of(11, 0), ScheduleStatus.SCHEDULED);
        occ.setStatus(ScheduleStatus.CANCELLED);
        scheduleOccurrenceRepository.save(occ);

        String payload = objectMapper.writeValueAsString(Map.of("active", false));
        mockMvc.perform(patch("/api/rooms/" + room.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(false)));
    }

    @Test
    @DisplayName("3. Room with only a past class (2026-09-30) -> deactivation returns 200")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void roomWithOnlyPastClassCanBeDeactivated() throws Exception {
        Complex complex = createComplex("Guard Complex 3", "GC3");
        Room room = createRoom(complex, "G-103");
        User prof = userRepository.findByEmail("aturing@classsync.edu").orElseThrow();

        createOccurrence(room, prof, LocalDate.of(2026, 9, 30), LocalTime.of(10, 0), LocalTime.of(11, 0), ScheduleStatus.SCHEDULED);

        String payload = objectMapper.writeValueAsString(Map.of("active", false));
        mockMvc.perform(patch("/api/rooms/" + room.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(false)));
    }

    @Test
    @DisplayName("4. Complex whose room has an upcoming class -> deactivation returns 409")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void complexWithUpcomingClassCannotBeDeactivated() throws Exception {
        Complex complex = createComplex("Guard Complex 4", "GC4");
        Room room = createRoom(complex, "G-104");
        User prof = userRepository.findByEmail("aturing@classsync.edu").orElseThrow();

        createOccurrence(room, prof, LocalDate.of(2026, 11, 10), LocalTime.of(10, 0), LocalTime.of(11, 0), ScheduleStatus.SCHEDULED);

        String payload = objectMapper.writeValueAsString(Map.of("active", false));
        mockMvc.perform(patch("/api/complexes/" + complex.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("1 upcoming")))
                .andExpect(jsonPath("$.message", containsString("2026-11-10")));
    }

    @Test
    @DisplayName("5. Reactivating an inactive room returns 200")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void reactivatingInactiveRoomReturns200() throws Exception {
        Complex complex = createComplex("Guard Complex 5", "GC5");
        Room room = roomRepository.save(new Room(complex, "G-105", RoomType.CLASSROOM, 40, false));

        String payload = objectMapper.writeValueAsString(Map.of("active", true));
        mockMvc.perform(patch("/api/rooms/" + room.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(true)));
    }
}
