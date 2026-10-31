package com.classsync.controller;

import com.classsync.entity.*;
import com.classsync.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RecommendationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ComplexRepository complexRepository;

    @Autowired
    private FacilityRepository facilityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private final LocalDate testDate = LocalDate.of(2026, 12, 10);

    private ScheduleOccurrence createOccurrence(Room room, User professor, LocalDate date, LocalTime start, LocalTime end, ScheduleStatus status) {
        return new ScheduleOccurrence(
                null,
                professor,
                room,
                date,
                start,
                end,
                ScheduleEventType.EXTRA,
                status,
                "CS101",
                "Intro CS",
                professor
        );
    }

    // ==========================================
    // Basic (Tests 1 - 5)
    // ==========================================

    @Test
    @DisplayName("1. Recommendation endpoint requires authentication")
    void recommendationEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("2. Professor can request recommendations")
    @WithMockUser(username = "aturing@classsync.edu", roles = {"PROFESSOR"})
    void professorCanRequestRecommendations() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(not(empty()))))
                .andExpect(jsonPath("$[0].room.id").isNumber())
                .andExpect(jsonPath("$[0].score").isNumber())
                .andExpect(jsonPath("$[0].reasons", is(not(empty()))));
    }

    @Test
    @DisplayName("3. Admin can request recommendations")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void adminCanRequestRecommendations() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(not(empty()))));
    }

    @Test
    @DisplayName("4. Returns only available rooms")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void returnsOnlyAvailableRooms() throws Exception {
        Room room1 = roomRepository.findById(1).orElseThrow();
        User professor = userRepository.findById(2).orElseThrow();

        // Occupy room 1 with a SCHEDULED occurrence
        ScheduleOccurrence occ = createOccurrence(room1, professor, testDate, LocalTime.of(10, 0), LocalTime.of(11, 0), ScheduleStatus.SCHEDULED);
        scheduleOccurrenceRepository.save(occ);

        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].room.id", not(hasItem(1))))
                .andExpect(jsonPath("$", is(not(empty()))));
    }

    @Test
    @DisplayName("5. Unavailable room never appears in recommendations")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void unavailableRoomNeverAppears() throws Exception {
        Room room2 = roomRepository.findById(2).orElseThrow();
        User professor = userRepository.findById(2).orElseThrow();

        ScheduleOccurrence occ = createOccurrence(room2, professor, testDate, LocalTime.of(14, 0), LocalTime.of(15, 0), ScheduleStatus.SCHEDULED);
        scheduleOccurrenceRepository.save(occ);

        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "14:00")
                        .param("endTime", "15:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].room.id", not(hasItem(2))));
    }

    // ==========================================
    // Hard constraints (Tests 6 - 13)
    // ==========================================

    @Test
    @DisplayName("6. Capacity filtering as hard constraint")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void capacityFiltering() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("capacity", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(not(empty()))))
                .andExpect(jsonPath("$[*].room.capacity", everyItem(greaterThanOrEqualTo(50))));
    }

    @Test
    @DisplayName("7. Room type is a soft preference")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void roomTypeIsSoftPreference() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("roomType", "LAB"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(not(empty()))))
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        assertEquals("LAB", root.get(0).get("room").get("roomType").asText());
        List<String> firstReasons = new ArrayList<>();
        root.get(0).get("reasons").forEach(r -> firstReasons.add(r.asText()));
        assertTrue(firstReasons.contains("Room matches requested room type"));

        boolean foundNonLab = false;
        double labScore = root.get(0).get("score").asDouble();
        for (int i = 1; i < root.size(); i++) {
            JsonNode item = root.get(i);
            if (!"LAB".equals(item.get("room").get("roomType").asText())) {
                foundNonLab = true;
                assertTrue(item.get("score").asDouble() <= labScore);
                List<String> reasons = new ArrayList<>();
                item.get("reasons").forEach(r -> reasons.add(r.asText()));
                assertTrue(reasons.contains("Room type differs from requested room type"));
            }
        }
        assertTrue(foundNonLab, "Non-LAB rooms should be present in recommendations");
    }

    @Test
    @DisplayName("8. Facilities are a soft preference")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void facilitiesAreSoftPreference() throws Exception {
        // SEC-301 has facilities 1, 2, 3, 5
        // Request 1, 2, 5
        MvcResult res = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("facilities", "1,2,5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(not(empty()))))
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());

        JsonNode sec301Node = null;
        JsonNode sec101Node = null;
        for (JsonNode item : root) {
            String roomNum = item.get("room").get("roomNumber").asText();
            if ("SEC-301".equals(roomNum)) sec301Node = item;
            if ("SEC-101".equals(roomNum)) sec101Node = item;
        }

        assertNotNull(sec301Node, "SEC-301 must be present");
        assertNotNull(sec101Node, "SEC-101 must be present");

        List<String> sec301Reasons = new ArrayList<>();
        sec301Node.get("reasons").forEach(r -> sec301Reasons.add(r.asText()));
        assertTrue(sec301Reasons.contains("Room matches requested facilities"));

        List<String> sec101Reasons = new ArrayList<>();
        sec101Node.get("reasons").forEach(r -> sec101Reasons.add(r.asText()));
        assertTrue(sec101Reasons.contains("Room partially matches requested facilities (1 of 3)"));
        assertTrue(sec101Node.get("score").asDouble() < sec301Node.get("score").asDouble());
    }

    @Test
    @DisplayName("9. Inactive room excluded")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void inactiveRoomExcluded() throws Exception {
        Complex complex = complexRepository.findById(1).orElseThrow();
        Room inactiveRoom = new Room(complex, "INACT-999", RoomType.CLASSROOM, 40, false);
        inactiveRoom = roomRepository.save(inactiveRoom);

        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].room.roomNumber", not(hasItem("INACT-999"))));
    }

    @Test
    @DisplayName("10. Inactive complex excluded")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void inactiveComplexExcluded() throws Exception {
        Complex inactiveComplex = new Complex("Inactive Complex", "INACT", false);
        inactiveComplex = complexRepository.save(inactiveComplex);
        Room roomInInactive = new Room(inactiveComplex, "IN-101", RoomType.CLASSROOM, 40, true);
        roomRepository.save(roomInInactive);

        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].room.roomNumber", not(hasItem("IN-101"))));
    }

    @Test
    @DisplayName("11. Scheduled room conflict excluded")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void scheduledRoomConflictExcluded() throws Exception {
        Room room3 = roomRepository.findById(3).orElseThrow();
        User professor = userRepository.findById(2).orElseThrow();

        ScheduleOccurrence occ = createOccurrence(room3, professor, testDate, LocalTime.of(14, 0), LocalTime.of(15, 0), ScheduleStatus.SCHEDULED);
        scheduleOccurrenceRepository.save(occ);

        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "14:00")
                        .param("endTime", "15:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].room.id", not(hasItem(3))));
    }

    @Test
    @DisplayName("12. Cancelled room occurrence does not block recommendation")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void cancelledRoomOccurrenceDoesNotBlockRecommendation() throws Exception {
        Room room3 = roomRepository.findById(3).orElseThrow();
        User professor = userRepository.findById(2).orElseThrow();

        ScheduleOccurrence occ = createOccurrence(room3, professor, testDate, LocalTime.of(14, 0), LocalTime.of(15, 0), ScheduleStatus.CANCELLED);
        scheduleOccurrenceRepository.save(occ);

        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "14:00")
                        .param("endTime", "15:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].room.id", hasItem(3)));
    }

    @Test
    @DisplayName("13. Professor conflict follows existing availability behavior")
    @WithMockUser(username = "aturing@classsync.edu", roles = {"PROFESSOR"})
    void professorConflictFollowsExistingAvailabilityBehavior() throws Exception {
        User turing = userRepository.findByEmail("aturing@classsync.edu").orElseThrow();
        Room room1 = roomRepository.findById(1).orElseThrow();

        ScheduleOccurrence occ = createOccurrence(room1, turing, testDate, LocalTime.of(10, 0), LocalTime.of(11, 0), ScheduleStatus.SCHEDULED);
        scheduleOccurrenceRepository.save(occ);

        // Turing has personal conflict at 10:00-11:00 -> returns empty list []
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ==========================================
    // Ranking (Tests 14 - 20)
    // ==========================================

    @Test
    @DisplayName("14. Exact-capacity room ranks above unnecessarily large room")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void exactCapacityRoomRanksAboveUnnecessarilyLargeRoom() throws Exception {
        Complex complex = complexRepository.findById(1).orElseThrow();

        Room roomExact = new Room(complex, "TEST-CAP-50", RoomType.CLASSROOM, 50, true);
        Room roomLarge = new Room(complex, "TEST-CAP-200", RoomType.CLASSROOM, 200, true);
        roomRepository.saveAll(List.of(roomExact, roomLarge));

        MvcResult result = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "08:00")
                        .param("endTime", "09:00")
                        .param("capacity", "50")
                        .param("complexId", complex.getId().toString()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(root.size() >= 2);

        int rankExact = -1;
        int rankLarge = -1;
        for (int i = 0; i < root.size(); i++) {
            String roomNum = root.get(i).get("room").get("roomNumber").asText();
            if ("TEST-CAP-50".equals(roomNum)) rankExact = i;
            if ("TEST-CAP-200".equals(roomNum)) rankLarge = i;
        }

        assertTrue(rankExact != -1 && rankLarge != -1);
        assertTrue(rankExact < rankLarge, "Exact capacity room must rank before unnecessarily large room");
    }

    @Test
    @DisplayName("15. Other complexes are included but rank below the requested complex")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void requestedComplexReceivesAppropriateLocationScore() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "08:00")
                        .param("endTime", "09:00")
                        .param("complexId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(not(empty()))))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        boolean hasComplex2 = false;
        double minComplex1Score = Double.MAX_VALUE;
        double maxComplex2Score = -1.0;

        for (JsonNode item : root) {
            int compId = item.get("room").get("complexId").asInt();
            double score = item.get("score").asDouble();
            List<String> reasons = new ArrayList<>();
            item.get("reasons").forEach(r -> reasons.add(r.asText()));

            if (compId == 1) {
                assertTrue(reasons.contains("Room is in the requested complex"));
                if (score < minComplex1Score) minComplex1Score = score;
            } else if (compId == 2) {
                hasComplex2 = true;
                assertTrue(reasons.contains("Room is in a different complex than requested"));
                if (score > maxComplex2Score) maxComplex2Score = score;
            }
        }

        assertTrue(hasComplex2, "Complex-2 rooms must be included");
        assertTrue(minComplex1Score > maxComplex2Score, "Every complex-1 room must score higher than every complex-2 room");
    }

    @Test
    @DisplayName("16. Lower-utilization room receives better utilization score")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void lowerUtilizationRoomReceivesBetterUtilizationScore() throws Exception {
        Complex complex = complexRepository.findById(1).orElseThrow();
        User professor = userRepository.findById(2).orElseThrow();

        Room roomBusy = new Room(complex, "UTIL-BUSY", RoomType.CLASSROOM, 50, true);
        Room roomFree = new Room(complex, "UTIL-FREE", RoomType.CLASSROOM, 50, true);
        roomRepository.saveAll(List.of(roomBusy, roomFree));

        // Insert 5 scheduled occurrences in last 30 days for roomBusy
        for (int i = 1; i <= 5; i++) {
            ScheduleOccurrence occ = createOccurrence(roomBusy, professor, testDate.minusDays(i), LocalTime.of(9, 0), LocalTime.of(10, 0), ScheduleStatus.SCHEDULED);
            scheduleOccurrenceRepository.save(occ);
        }

        MvcResult result = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "07:00")
                        .param("endTime", "08:00")
                        .param("capacity", "50")
                        .param("complexId", complex.getId().toString()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        double scoreFree = -1;
        double scoreBusy = -1;
        for (JsonNode item : root) {
            String roomNum = item.get("room").get("roomNumber").asText();
            if ("UTIL-FREE".equals(roomNum)) scoreFree = item.get("score").asDouble();
            if ("UTIL-BUSY".equals(roomNum)) scoreBusy = item.get("score").asDouble();
        }

        assertTrue(scoreFree > scoreBusy, "Room with 0 utilization must have higher score than room with 5 occurrences");
    }

    @Test
    @DisplayName("17. Facility preference contributes to score")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void facilityPreferenceContributesToScore() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("facilities", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(not(empty()))))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        boolean hasFacilityReason = false;
        for (JsonNode reason : root.get(0).get("reasons")) {
            if (reason.asText().contains("requested facilities")) {
                hasFacilityReason = true;
                break;
            }
        }
        assertTrue(hasFacilityReason);
    }

    @Test
    @DisplayName("18. Continuity preference contributes to score")
    @WithMockUser(username = "aturing@classsync.edu", roles = {"PROFESSOR"})
    void continuityPreferenceContributesToScore() throws Exception {
        User turing = userRepository.findByEmail("aturing@classsync.edu").orElseThrow();
        Room room3 = roomRepository.findById(3).orElseThrow();

        // Alan Turing has class in Room 3 ending at 14:00 (13:00 - 14:00)
        ScheduleOccurrence priorClass = createOccurrence(room3, turing, testDate, LocalTime.of(13, 0), LocalTime.of(14, 0), ScheduleStatus.SCHEDULED);
        scheduleOccurrenceRepository.save(priorClass);

        // Turing asks for 14:00 - 15:00
        MvcResult result = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "14:00")
                        .param("endTime", "15:00"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        boolean foundContinuityReason = false;
        for (JsonNode item : root) {
            if (item.get("room").get("id").asInt() == 3) {
                for (JsonNode reason : item.get("reasons")) {
                    if (reason.asText().contains("preceding class")) {
                        foundContinuityReason = true;
                        break;
                    }
                }
            }
        }
        assertTrue(foundContinuityReason, "Room 3 must receive continuity reason for Turing's preceding class");
    }

    @Test
    @DisplayName("19. No optional preference still produces valid scores")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void noOptionalPreferenceStillProducesValidScores() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(not(empty()))))
                .andExpect(jsonPath("$[*].score", everyItem(greaterThanOrEqualTo(0.0))))
                .andExpect(jsonPath("$[*].score", everyItem(lessThanOrEqualTo(100.0))))
                .andExpect(jsonPath("$[*].reasons", everyItem(not(empty()))));
    }

    @Test
    @DisplayName("20. Final score is between 0 and 100")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void finalScoreIsBetween0And100() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("capacity", "30"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        for (JsonNode item : root) {
            double score = item.get("score").asDouble();
            assertTrue(score >= 0.0 && score <= 100.0, "Score " + score + " must be between 0 and 100");
        }
    }

    // ==========================================
    // Explainability (Tests 21 - 23)
    // ==========================================

    @Test
    @DisplayName("21. Every recommendation contains reasons")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void everyRecommendationContainsReasons() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        for (JsonNode item : root) {
            JsonNode reasons = item.get("reasons");
            assertNotNull(reasons);
            assertTrue(reasons.isArray());
            assertTrue(reasons.size() > 0, "Reasons array must not be empty");
        }
    }

    @Test
    @DisplayName("22. Reasons correspond to actual score components")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void reasonsCorrespondToActualScoreComponents() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("capacity", "60")
                        .param("complexId", "1")
                        .param("roomType", "LECTURE_HALL"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(root.size() > 0);
        JsonNode first = root.get(0);
        String reasonsStr = first.get("reasons").toString();

        assertTrue(reasonsStr.contains("Capacity closely matches requested capacity") || reasonsStr.contains("Room capacity"));
        assertTrue(reasonsStr.contains("Room is in the requested complex"));
        assertTrue(reasonsStr.contains("Room matches requested room type"));
    }

    @Test
    @DisplayName("23. No random or non-deterministic reasons")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void noRandomNonDeterministicReasons() throws Exception {
        MvcResult res1 = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andReturn();

        MvcResult res2 = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andReturn();

        assertEquals(res1.getResponse().getContentAsString(), res2.getResponse().getContentAsString(),
                "Two identical requests must return 100% identical JSON");
    }

    // ==========================================
    // Ordering (Tests 24 - 26)
    // ==========================================

    @Test
    @DisplayName("24. Equal scores use deterministic capacity ordering")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void equalScoresUseDeterministicCapacityOrdering() throws Exception {
        Complex complex = complexRepository.findById(1).orElseThrow();

        Room r1 = new Room(complex, "ORDER-C1", RoomType.CLASSROOM, 40, true);
        Room r2 = new Room(complex, "ORDER-C2", RoomType.CLASSROOM, 60, true);
        roomRepository.saveAll(List.of(r1, r2));

        // When capacity is not requested, both have capacityFit = 1.0, locationFit = 1.0 (if complexId passed), util = 1.0
        MvcResult res = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "06:00")
                        .param("endTime", "07:00")
                        .param("complexId", complex.getId().toString()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        int rankR1 = -1, rankR2 = -1;
        for (int i = 0; i < root.size(); i++) {
            String num = root.get(i).get("room").get("roomNumber").asText();
            if ("ORDER-C1".equals(num)) rankR1 = i;
            if ("ORDER-C2".equals(num)) rankR2 = i;
        }

        assertTrue(rankR1 != -1 && rankR2 != -1);
        assertTrue(rankR1 < rankR2, "Smaller capacity (40) must rank before larger capacity (60)");
    }

    @Test
    @DisplayName("25. Room number breaks remaining ties")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void roomNumberBreaksRemainingTies() throws Exception {
        Complex complex = complexRepository.findById(1).orElseThrow();

        Room rA = new Room(complex, "AAA-100", RoomType.CLASSROOM, 50, true);
        Room rZ = new Room(complex, "ZZZ-100", RoomType.CLASSROOM, 50, true);
        roomRepository.saveAll(List.of(rA, rZ));

        MvcResult res = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "05:00")
                        .param("endTime", "06:00")
                        .param("complexId", complex.getId().toString()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        int rankA = -1, rankZ = -1;
        for (int i = 0; i < root.size(); i++) {
            String num = root.get(i).get("room").get("roomNumber").asText();
            if ("AAA-100".equals(num)) rankA = i;
            if ("ZZZ-100".equals(num)) rankZ = i;
        }

        assertTrue(rankA != -1 && rankZ != -1);
        assertTrue(rankA < rankZ, "AAA-100 must rank before ZZZ-100");
    }

    @Test
    @DisplayName("26. Room ID breaks final ties")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void roomIdBreaksFinalTies() throws Exception {
        Complex complex1 = complexRepository.findById(1).orElseThrow();
        Complex complex2 = complexRepository.findById(2).orElseThrow();

        // Same room number, same capacity, but in different complexes
        Room r1 = new Room(complex1, "COMMON-101", RoomType.CLASSROOM, 50, true);
        Room r2 = new Room(complex2, "COMMON-101", RoomType.CLASSROOM, 50, true);
        roomRepository.saveAll(List.of(r1, r2));

        MvcResult res = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "04:00")
                        .param("endTime", "05:00"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        int rank1 = -1, rank2 = -1;
        for (int i = 0; i < root.size(); i++) {
            int id = root.get(i).get("room").get("id").asInt();
            if (id == r1.getId()) rank1 = i;
            if (id == r2.getId()) rank2 = i;
        }

        assertTrue(rank1 != -1 && rank2 != -1);
        if (r1.getId() < r2.getId()) {
            assertTrue(rank1 < rank2);
        } else {
            assertTrue(rank2 < rank1);
        }
    }

    // ==========================================
    // Edge cases (Tests 27 - 32)
    // ==========================================

    @Test
    @DisplayName("27. No eligible rooms returns empty list")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void noEligibleRoomsReturnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("capacity", "999999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("28. Invalid time range returns 400")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void invalidTimeRangeReturns400() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "15:00")
                        .param("endTime", "14:00"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("29. Invalid capacity returns 400")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void invalidCapacityReturns400() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("capacity", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("30. Invalid facility ID returns 400")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void invalidFacilityIdReturns400() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("facilities", "999999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("31. Duplicate facility IDs handled deterministically")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void duplicateFacilityIdsHandledDeterministically() throws Exception {
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("facilities", "1,1,1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(not(empty()))));
    }

    @Test
    @DisplayName("32. Cancelled occurrences are ignored for utilization")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void cancelledOccurrencesAreIgnoredForUtilization() throws Exception {
        Complex complex = complexRepository.findById(1).orElseThrow();
        User professor = userRepository.findById(2).orElseThrow();

        Room roomWithCancelled = new Room(complex, "UTIL-CANC", RoomType.CLASSROOM, 50, true);
        roomRepository.save(roomWithCancelled);

        // Add 10 CANCELLED occurrences in last 30 days
        for (int i = 1; i <= 10; i++) {
            ScheduleOccurrence occ = createOccurrence(roomWithCancelled, professor, testDate.minusDays(i), LocalTime.of(9, 0), LocalTime.of(10, 0), ScheduleStatus.CANCELLED);
            scheduleOccurrenceRepository.save(occ);
        }

        // It should still have 0 scheduled utilization and get high utilization score
        MvcResult res = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "03:00")
                        .param("endTime", "04:00")
                        .param("complexId", complex.getId().toString()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        for (JsonNode item : root) {
            if ("UTIL-CANC".equals(item.get("room").get("roomNumber").asText())) {
                boolean hasLowUtil = false;
                for (JsonNode reason : item.get("reasons")) {
                    if (reason.asText().contains("low scheduled utilization")) {
                        hasLowUtil = true;
                        break;
                    }
                }
                assertTrue(hasLowUtil, "Cancelled occurrences must not count towards utilization");
            }
        }
    }

    // =========================================================================
    // Prompt 11H Tests (N19–N22)
    // =========================================================================

    @Test
    @DisplayName("N19. Unknown or inactive complexId returns 400 Bad Request")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void unknownOrInactiveComplexIdReturns400() throws Exception {
        // Unknown complex 99999
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("complexId", "99999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Requested complex not found or inactive: 99999")));

        // Inactive complex
        Complex inact = complexRepository.save(new Complex("Inactive Comp", "INACTX", false));
        mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("complexId", inact.getId().toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Requested complex not found or inactive: " + inact.getId())));
    }

    @Test
    @DisplayName("N20. Perfect match with continuity achieves 100.0 score, while admin request scores 90.0")
    void perfectMatchContinuityReaches100() throws Exception {
        Room sec301 = roomRepository.findByComplexIdAndRoomNumber(1, "SEC-301").orElseThrow();
        User turing = userRepository.findByEmail("aturing@classsync.edu").orElseThrow();

        // Turing has a preceding class in SEC-301: 09:00 - 10:00
        scheduleOccurrenceRepository.save(
                createOccurrence(sec301, turing, testDate, LocalTime.of(9, 0), LocalTime.of(10, 0), ScheduleStatus.SCHEDULED)
        );

        // 1. Professor Turing requests 10:00 - 11:00 with capacity=120
        MvcResult profRes = mockMvc.perform(get("/api/rooms/recommendations")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("aturing@classsync.edu").roles("PROFESSOR"))
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("capacity", "120"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode profRoot = objectMapper.readTree(profRes.getResponse().getContentAsString());
        assertEquals(1, profRoot.size());
        assertEquals("SEC-301", profRoot.get(0).get("room").get("roomNumber").asText());
        assertEquals(100.0, profRoot.get(0).get("score").asDouble(), 0.001);

        // 2. Admin requests the same slot with capacity=120 (no continuity)
        MvcResult adminRes = mockMvc.perform(get("/api/rooms/recommendations")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@classsync.edu").roles("ADMIN"))
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("capacity", "120"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode adminRoot = objectMapper.readTree(adminRes.getResponse().getContentAsString());
        assertEquals(1, adminRoot.size());
        assertEquals("SEC-301", adminRoot.get(0).get("room").get("roomNumber").asText());
        assertEquals(90.0, adminRoot.get(0).get("score").asDouble(), 0.001);
    }

    @Test
    @DisplayName("N21. Following-class continuity reason appears for a class starting exactly at endTime")
    void followingClassContinuityReasonAppears() throws Exception {
        Room sec301 = roomRepository.findByComplexIdAndRoomNumber(1, "SEC-301").orElseThrow();
        User turing = userRepository.findByEmail("aturing@classsync.edu").orElseThrow();

        // Turing has a following class in SEC-301: 11:00 - 12:00
        scheduleOccurrenceRepository.save(
                createOccurrence(sec301, turing, testDate, LocalTime.of(11, 0), LocalTime.of(12, 0), ScheduleStatus.SCHEDULED)
        );

        // Turing requests 10:00 - 11:00
        MvcResult res = mockMvc.perform(get("/api/rooms/recommendations")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("aturing@classsync.edu").roles("PROFESSOR"))
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("capacity", "120"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        List<String> reasons = new ArrayList<>();
        root.get(0).get("reasons").forEach(r -> reasons.add(r.asText()));
        assertTrue(reasons.contains("Professor has a following class in this room"));
        assertEquals(100.0, root.get(0).get("score").asDouble(), 0.001);
    }

    @Test
    @DisplayName("N22. Room with none of requested facilities is listed with 'Room has none of the requested facilities'")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void roomWithNoneOfRequestedFacilitiesHasExplicitReason() throws Exception {
        // Request facility 5 (Audio System). SEC-101 has only facility 1 (Projector)
        MvcResult res = mockMvc.perform(get("/api/rooms/recommendations")
                        .param("date", testDate.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "11:00")
                        .param("facilities", "5"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        JsonNode sec101Node = null;
        for (JsonNode item : root) {
            if ("SEC-101".equals(item.get("room").get("roomNumber").asText())) {
                sec101Node = item;
                break;
            }
        }
        assertNotNull(sec101Node);
        List<String> reasons = new ArrayList<>();
        sec101Node.get("reasons").forEach(r -> reasons.add(r.asText()));
        assertTrue(reasons.contains("Room has none of the requested facilities"));
    }
}
