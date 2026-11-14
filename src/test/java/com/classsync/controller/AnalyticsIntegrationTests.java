package com.classsync.controller;

import com.classsync.entity.Complex;
import com.classsync.entity.Room;
import com.classsync.entity.RoomType;
import com.classsync.entity.ScheduleEventType;
import com.classsync.entity.ScheduleOccurrence;
import com.classsync.entity.ScheduleStatus;
import com.classsync.entity.User;
import com.classsync.repository.ComplexRepository;
import com.classsync.repository.RoomRepository;
import com.classsync.repository.ScheduleOccurrenceRepository;
import com.classsync.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AnalyticsIntegrationTests {

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

    private Complex testComplex;
    private Room roomA;
    private Room roomB;
    private User adminUser;
    private User profUser;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.findById(1).orElseThrow();
        profUser = userRepository.findById(2).orElseThrow();

        testComplex = complexRepository.save(new Complex("ANALYTICS_TEST", "Analytics Test Complex", true));
        roomA = roomRepository.save(new Room(testComplex, "A101", RoomType.LECTURE_HALL, 50, true));
        roomB = roomRepository.save(new Room(testComplex, "B102", RoomType.LECTURE_HALL, 50, true));

        // Monday 2026-11-09: 09:00-10:00 SCHEDULED OFFICIAL
        scheduleOccurrenceRepository.save(new ScheduleOccurrence(
                null, profUser, roomA, LocalDate.of(2026, 11, 9),
                LocalTime.of(9, 0), LocalTime.of(10, 0),
                ScheduleEventType.OFFICIAL, ScheduleStatus.SCHEDULED, "CS101", "Mon Class", adminUser
        ));

        // Tuesday 2026-11-10: 14:00-15:00 RESCHEDULED
        scheduleOccurrenceRepository.save(new ScheduleOccurrence(
                null, profUser, roomA, LocalDate.of(2026, 11, 10),
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                ScheduleEventType.OFFICIAL, ScheduleStatus.RESCHEDULED, "CS101", "Tue Rescheduled", adminUser
        ));

        // Wednesday 2026-11-11: 10:00-12:00 SCHEDULED EXTRA
        scheduleOccurrenceRepository.save(new ScheduleOccurrence(
                null, profUser, roomA, LocalDate.of(2026, 11, 11),
                LocalTime.of(10, 0), LocalTime.of(12, 0),
                ScheduleEventType.EXTRA, ScheduleStatus.SCHEDULED, "CS102", "Wed Extra", adminUser
        ));

        // Thursday 2026-11-12: 09:00-10:00 CANCELLED
        scheduleOccurrenceRepository.save(new ScheduleOccurrence(
                null, profUser, roomA, LocalDate.of(2026, 11, 12),
                LocalTime.of(9, 0), LocalTime.of(10, 0),
                ScheduleEventType.OFFICIAL, ScheduleStatus.CANCELLED, "CS101", "Thu Cancelled", adminUser
        ));

        // Friday 2026-11-13: 07:00-09:00 SCHEDULED (clipped to 08:00-09:00 -> 1 hr)
        scheduleOccurrenceRepository.save(new ScheduleOccurrence(
                null, profUser, roomA, LocalDate.of(2026, 11, 13),
                LocalTime.of(7, 0), LocalTime.of(9, 0),
                ScheduleEventType.OFFICIAL, ScheduleStatus.SCHEDULED, "CS103", "Fri Early", adminUser
        ));

        // Saturday 2026-11-14: 10:00-11:00 SCHEDULED (weekend ignored)
        scheduleOccurrenceRepository.save(new ScheduleOccurrence(
                null, profUser, roomA, LocalDate.of(2026, 11, 14),
                LocalTime.of(10, 0), LocalTime.of(11, 0),
                ScheduleEventType.OFFICIAL, ScheduleStatus.SCHEDULED, "CS104", "Sat Weekend", adminUser
        ));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Admin utilization query returns exact summary, room stats, and heatmap for test complex")
    void adminUtilizationExactMatch() throws Exception {
        mockMvc.perform(get("/api/analytics/utilization")
                        .param("startDate", "2026-11-09")
                        .param("endDate", "2026-11-15")
                        .param("complexId", testComplex.getId().toString()))
                .andExpect(status().isOk())
                // Summary verification
                .andExpect(jsonPath("$.summary.roomCount", is(2)))
                .andExpect(jsonPath("$.summary.workingDayCount", is(5)))
                .andExpect(jsonPath("$.summary.availableHours", is(120.0)))
                .andExpect(jsonPath("$.summary.bookedHours", is(4.0)))
                .andExpect(jsonPath("$.summary.utilizationPercent", is(3.3)))
                .andExpect(jsonPath("$.summary.scheduledClasses", is(3)))
                .andExpect(jsonPath("$.summary.extraClasses", is(1)))
                .andExpect(jsonPath("$.summary.cancelledClasses", is(1)))
                .andExpect(jsonPath("$.summary.rescheduledClasses", is(1)))
                .andExpect(jsonPath("$.underusedThresholdPercent", is(1.7)))
                // Rooms array verification: rooms[0] is room A (A101)
                .andExpect(jsonPath("$.rooms[0].roomId", is(roomA.getId())))
                .andExpect(jsonPath("$.rooms[0].roomNumber", is("A101")))
                .andExpect(jsonPath("$.rooms[0].classCount", is(3)))
                .andExpect(jsonPath("$.rooms[0].bookedHours", is(4.0)))
                .andExpect(jsonPath("$.rooms[0].availableHours", is(60.0)))
                .andExpect(jsonPath("$.rooms[0].utilizationPercent", is(6.7)))
                .andExpect(jsonPath("$.rooms[0].underused", is(false)))
                // rooms[1] is room B (B102)
                .andExpect(jsonPath("$.rooms[1].roomId", is(roomB.getId())))
                .andExpect(jsonPath("$.rooms[1].roomNumber", is("B102")))
                .andExpect(jsonPath("$.rooms[1].classCount", is(0)))
                .andExpect(jsonPath("$.rooms[1].bookedHours", is(0.0)))
                .andExpect(jsonPath("$.rooms[1].availableHours", is(60.0)))
                .andExpect(jsonPath("$.rooms[1].utilizationPercent", is(0.0)))
                .andExpect(jsonPath("$.rooms[1].underused", is(true)))
                // Heatmap verification:
                // MONDAY: index 0, hour 9 is cells[1] -> 50.0, hour 10 is cells[2] -> 0.0
                .andExpect(jsonPath("$.heatmap[0].day", is("MONDAY")))
                .andExpect(jsonPath("$.heatmap[0].cells[1].hour", is(9)))
                .andExpect(jsonPath("$.heatmap[0].cells[1].utilizationPercent", is(50.0)))
                .andExpect(jsonPath("$.heatmap[0].cells[2].hour", is(10)))
                .andExpect(jsonPath("$.heatmap[0].cells[2].utilizationPercent", is(0.0)))
                // TUESDAY: index 1, hour 14 is cells[6] -> 0.0 (rescheduled does not count)
                .andExpect(jsonPath("$.heatmap[1].day", is("TUESDAY")))
                .andExpect(jsonPath("$.heatmap[1].cells[6].hour", is(14)))
                .andExpect(jsonPath("$.heatmap[1].cells[6].utilizationPercent", is(0.0)))
                // WEDNESDAY: index 2, hour 10 is cells[2] -> 50.0, hour 11 is cells[3] -> 50.0
                .andExpect(jsonPath("$.heatmap[2].day", is("WEDNESDAY")))
                .andExpect(jsonPath("$.heatmap[2].cells[2].hour", is(10)))
                .andExpect(jsonPath("$.heatmap[2].cells[2].utilizationPercent", is(50.0)))
                .andExpect(jsonPath("$.heatmap[2].cells[3].hour", is(11)))
                .andExpect(jsonPath("$.heatmap[2].cells[3].utilizationPercent", is(50.0)))
                // THURSDAY: index 3, hour 9 is cells[1] -> 0.0 (cancelled does not count)
                .andExpect(jsonPath("$.heatmap[3].day", is("THURSDAY")))
                .andExpect(jsonPath("$.heatmap[3].cells[1].hour", is(9)))
                .andExpect(jsonPath("$.heatmap[3].cells[1].utilizationPercent", is(0.0)))
                // FRIDAY: index 4, hour 8 is cells[0] -> 50.0
                .andExpect(jsonPath("$.heatmap[4].day", is("FRIDAY")))
                .andExpect(jsonPath("$.heatmap[4].cells[0].hour", is(8)))
                .andExpect(jsonPath("$.heatmap[4].cells[0].utilizationPercent", is(50.0)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Weekend range has 0 working days, 0.0 utilization, and no room underused")
    void weekendRangeZeroWorkingDays() throws Exception {
        mockMvc.perform(get("/api/analytics/utilization")
                        .param("startDate", "2026-11-14")
                        .param("endDate", "2026-11-15")
                        .param("complexId", testComplex.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.workingDayCount", is(0)))
                .andExpect(jsonPath("$.summary.availableHours", is(0.0)))
                .andExpect(jsonPath("$.summary.bookedHours", is(0.0)))
                .andExpect(jsonPath("$.summary.utilizationPercent", is(0.0)))
                .andExpect(jsonPath("$.underusedThresholdPercent", is(0.0)))
                .andExpect(jsonPath("$.rooms[0].underused", is(false)))
                .andExpect(jsonPath("$.rooms[1].underused", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("endDate before startDate returns 400 Bad Request")
    void endDateBeforeStartDateThrows400() throws Exception {
        mockMvc.perform(get("/api/analytics/utilization")
                        .param("startDate", "2026-11-15")
                        .param("endDate", "2026-11-09"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("endDate must not be before startDate")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Window longer than 12 months returns 400 Bad Request")
    void windowLongerThan12MonthsThrows400() throws Exception {
        mockMvc.perform(get("/api/analytics/utilization")
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2027-01-05"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Analytics window cannot exceed 12 months")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Unknown or inactive complexId returns 400 Bad Request")
    void unknownComplexThrows400() throws Exception {
        mockMvc.perform(get("/api/analytics/utilization")
                        .param("startDate", "2026-11-09")
                        .param("endDate", "2026-11-15")
                        .param("complexId", "999999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Requested complex not found or inactive: 999999")));
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    @DisplayName("Professor access returns 403 Forbidden")
    void professorAccessForbidden() throws Exception {
        mockMvc.perform(get("/api/analytics/utilization")
                        .param("startDate", "2026-11-09")
                        .param("endDate", "2026-11-15"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated access returns 401 Unauthorized")
    void unauthenticatedAccessUnauthorized() throws Exception {
        mockMvc.perform(get("/api/analytics/utilization")
                        .param("startDate", "2026-11-09")
                        .param("endDate", "2026-11-15"))
                .andExpect(status().isUnauthorized());
    }
}
