package com.classsync.demo;

import com.classsync.entity.RoomType;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public final class DemoData {

    private DemoData() {}

    public static final String NEW_FACILITY = "Video Conferencing";

    public record ComplexDef(String code, String name) {}

    public static final List<ComplexDef> COMPLEXES = List.of(
            new ComplexDef("LHC", "Lecture Hall Complex"),
            new ComplexDef("MB", "Main Building")
    );

    public record RoomDef(String roomNumber, String complexCode, RoomType type, int capacity, List<String> facilityNames) {}

    public static final List<RoomDef> ROOMS = List.of(
            new RoomDef("SEC-102", "SEC", RoomType.CLASSROOM, 60, List.of("Projector", "Air Conditioning")),
            new RoomDef("SEC-103", "SEC", RoomType.CLASSROOM, 60, List.of("Projector", "Smart Board")),
            new RoomDef("SEC-202", "SEC", RoomType.LAB, 40, List.of("Projector", "Air Conditioning", "Computers")),
            new RoomDef("SEC-203", "SEC", RoomType.LAB, 40, List.of("Projector", "Computers")),
            new RoomDef("HSS-102", "HSS", RoomType.CLASSROOM, 50, List.of("Projector")),
            new RoomDef("HSS-202", "HSS", RoomType.SEMINAR_HALL, 80, List.of("Projector", "Air Conditioning", "Audio System", "Video Conferencing")),
            new RoomDef("LHC-1", "LHC", RoomType.LECTURE_HALL, 250, List.of("Projector", "Smart Board", "Air Conditioning", "Audio System")),
            new RoomDef("LHC-2", "LHC", RoomType.LECTURE_HALL, 180, List.of("Projector", "Air Conditioning", "Audio System")),
            new RoomDef("LHC-3", "LHC", RoomType.LECTURE_HALL, 150, List.of("Projector", "Audio System")),
            new RoomDef("MB-101", "MB", RoomType.CLASSROOM, 70, List.of("Projector", "Smart Board", "Air Conditioning")),
            new RoomDef("MB-102", "MB", RoomType.CLASSROOM, 70, List.of("Projector")),
            new RoomDef("MB-201", "MB", RoomType.SEMINAR_HALL, 40, List.of("Projector", "Air Conditioning", "Video Conferencing")),
            new RoomDef("MB-G05", "MB", RoomType.CLASSROOM, 50, List.of("Projector"))
    );

    public record ProfessorDef(String name, String email, String employeeCode) {}

    public static final List<ProfessorDef> PROFESSORS = List.of(
            new ProfessorDef("Dr. Grace Hopper", "ghopper@classsync.edu", "EMP-PRF-003"),
            new ProfessorDef("Dr. Edsger Dijkstra", "edijkstra@classsync.edu", "EMP-PRF-004"),
            new ProfessorDef("Dr. John von Neumann", "jvonneumann@classsync.edu", "EMP-PRF-005"),
            new ProfessorDef("Dr. Claude Shannon", "cshannon@classsync.edu", "EMP-PRF-006"),
            new ProfessorDef("Dr. Srinivasa Ramanujan", "sramanujan@classsync.edu", "EMP-PRF-007"),
            new ProfessorDef("Dr. C. V. Raman", "cvraman@classsync.edu", "EMP-PRF-008"),
            new ProfessorDef("Dr. Homi Bhabha", "hbhabha@classsync.edu", "EMP-PRF-009"),
            new ProfessorDef("Dr. Satyendra Nath Bose", "snbose@classsync.edu", "EMP-PRF-010")
    );

    public record EntryDef(int number, String courseCode, String courseName, String profUsername, String roomNumber,
                            int dayOfWeek, LocalTime startTime, LocalTime endTime) {}

    public static final List<EntryDef> TIMETABLE_V1_ENTRIES = List.of(
            new EntryDef(1, "CS201", "Data Structures", "aturing", "SEC-301", 1, LocalTime.of(9, 0), LocalTime.of(10, 0)),
            new EntryDef(2, "CS201", "Data Structures", "aturing", "SEC-301", 3, LocalTime.of(9, 0), LocalTime.of(10, 0)),
            new EntryDef(3, "CS201", "Data Structures", "aturing", "SEC-301", 5, LocalTime.of(9, 0), LocalTime.of(10, 0)),
            new EntryDef(4, "CS351", "Data Structures Lab", "aturing", "SEC-202", 2, LocalTime.of(14, 0), LocalTime.of(17, 0)),
            new EntryDef(5, "CS202", "Discrete Mathematics", "alovelace", "SEC-102", 1, LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new EntryDef(6, "CS202", "Discrete Mathematics", "alovelace", "SEC-102", 4, LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new EntryDef(7, "MA201", "Linear Algebra", "alovelace", "HSS-201", 3, LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new EntryDef(8, "MA201", "Linear Algebra", "alovelace", "HSS-201", 5, LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new EntryDef(9, "CS302", "Database Systems", "ghopper", "LHC-3", 1, LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new EntryDef(10, "CS302", "Database Systems", "ghopper", "LHC-3", 3, LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new EntryDef(11, "CS352", "Database Lab", "ghopper", "SEC-203", 4, LocalTime.of(14, 0), LocalTime.of(17, 0)),
            new EntryDef(12, "CS301", "Operating Systems", "edijkstra", "LHC-2", 2, LocalTime.of(9, 0), LocalTime.of(10, 0)),
            new EntryDef(13, "CS301", "Operating Systems", "edijkstra", "LHC-2", 4, LocalTime.of(9, 0), LocalTime.of(10, 0)),
            new EntryDef(14, "CS402", "Compiler Design", "edijkstra", "SEC-301", 2, LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new EntryDef(15, "CS402", "Compiler Design", "edijkstra", "SEC-301", 4, LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new EntryDef(16, "CS303", "Computer Networks", "jvonneumann", "MB-101", 2, LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new EntryDef(17, "CS303", "Computer Networks", "jvonneumann", "MB-101", 5, LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new EntryDef(18, "CS353", "Networks Lab", "jvonneumann", "SEC-202", 3, LocalTime.of(14, 0), LocalTime.of(17, 0)),
            new EntryDef(19, "CS499", "Research Seminar", "jvonneumann", "MB-201", 5, LocalTime.of(15, 0), LocalTime.of(16, 30)),
            new EntryDef(20, "EE201", "Signals and Systems", "cshannon", "MB-102", 1, LocalTime.of(14, 0), LocalTime.of(15, 0)),
            new EntryDef(21, "EE201", "Signals and Systems", "cshannon", "MB-102", 3, LocalTime.of(14, 0), LocalTime.of(15, 0)),
            new EntryDef(22, "EE301", "Information Theory", "cshannon", "HSS-202", 2, LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new EntryDef(23, "EE301", "Information Theory", "cshannon", "HSS-202", 4, LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new EntryDef(24, "MA101", "Calculus", "sramanujan", "LHC-1", 1, LocalTime.of(9, 0), LocalTime.of(10, 0)),
            new EntryDef(25, "MA101", "Calculus", "sramanujan", "LHC-1", 2, LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new EntryDef(26, "MA101", "Calculus", "sramanujan", "LHC-1", 4, LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new EntryDef(27, "MA301", "Number Theory", "sramanujan", "HSS-102", 3, LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new EntryDef(28, "PH101", "Engineering Physics", "cvraman", "LHC-1", 1, LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new EntryDef(29, "PH101", "Engineering Physics", "cvraman", "LHC-1", 3, LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new EntryDef(30, "PH151", "Physics Lab", "cvraman", "SEC-201", 5, LocalTime.of(14, 0), LocalTime.of(17, 0)),
            new EntryDef(31, "PH201", "Quantum Mechanics", "hbhabha", "SEC-103", 2, LocalTime.of(14, 0), LocalTime.of(15, 0)),
            new EntryDef(32, "PH201", "Quantum Mechanics", "hbhabha", "SEC-103", 4, LocalTime.of(14, 0), LocalTime.of(15, 0)),
            new EntryDef(33, "PH301", "Nuclear Physics", "hbhabha", "MB-101", 1, LocalTime.of(15, 0), LocalTime.of(16, 0)),
            new EntryDef(34, "PH202", "Statistical Physics", "snbose", "HSS-102", 3, LocalTime.of(15, 0), LocalTime.of(16, 0)),
            new EntryDef(35, "PH202", "Statistical Physics", "snbose", "HSS-102", 5, LocalTime.of(14, 0), LocalTime.of(15, 0)),
            new EntryDef(36, "PH203", "Thermodynamics", "snbose", "HSS-101", 2, LocalTime.of(15, 0), LocalTime.of(16, 0))
    );

    public record CancellationDef(String id, int weekOffset, DayOfWeek dayOfWeek, String courseCode,
                                  String profUsername, LocalTime startTime) {}

    public static final List<CancellationDef> CANCELLATIONS = List.of(
            new CancellationDef("C1", -3, DayOfWeek.TUESDAY, "MA101", "sramanujan", LocalTime.of(10, 0)),
            new CancellationDef("C2", -2, DayOfWeek.TUESDAY, "CS301", "edijkstra", LocalTime.of(9, 0)),
            new CancellationDef("C3", -1, DayOfWeek.THURSDAY, "PH201", "hbhabha", LocalTime.of(14, 0)),
            new CancellationDef("C4", -1, DayOfWeek.WEDNESDAY, "EE201", "cshannon", LocalTime.of(14, 0)),
            new CancellationDef("C5", 1, DayOfWeek.FRIDAY, "CS303", "jvonneumann", LocalTime.of(11, 0)),
            new CancellationDef("C6", 2, DayOfWeek.WEDNESDAY, "PH202", "snbose", LocalTime.of(15, 0))
    );

    public record RescheduleDef(String id, int origWeekOffset, DayOfWeek origDay, String origCourse,
                                String profUsername, LocalTime origStart, int targetWeekOffset, DayOfWeek targetDay,
                                LocalTime targetStart, LocalTime targetEnd, String targetRoomNumber) {}

    public static final List<RescheduleDef> RESCHEDULES = List.of(
            new RescheduleDef("R1", 1, DayOfWeek.THURSDAY, "CS202", "alovelace", LocalTime.of(10, 0),
                    1, DayOfWeek.FRIDAY, LocalTime.of(15, 0), LocalTime.of(16, 0), "SEC-102"),
            new RescheduleDef("R2", 1, DayOfWeek.TUESDAY, "CS402", "edijkstra", LocalTime.of(11, 0),
                    1, DayOfWeek.WEDNESDAY, LocalTime.of(16, 0), LocalTime.of(17, 0), "SEC-301"),
            new RescheduleDef("R3", 2, DayOfWeek.TUESDAY, "PH201", "hbhabha", LocalTime.of(14, 0),
                    2, DayOfWeek.THURSDAY, LocalTime.of(15, 0), LocalTime.of(16, 0), "SEC-103")
    );

    public record ExtraBookingDef(String id, int weekOffset, DayOfWeek day, LocalTime startTime, LocalTime endTime,
                                  String roomNumber, String profUsername, String courseCode, String courseName) {}

    public static final List<ExtraBookingDef> EXTRA_BOOKINGS = List.of(
            new ExtraBookingDef("E1", 1, DayOfWeek.THURSDAY, LocalTime.of(15, 0), LocalTime.of(16, 0), "SEC-101", "aturing", "CS201", "Doubt-Clearing Session"),
            new ExtraBookingDef("E2", 1, DayOfWeek.THURSDAY, LocalTime.of(15, 0), LocalTime.of(16, 0), "HSS-101", "alovelace", "MA201", "Tutorial"),
            new ExtraBookingDef("E3", 1, DayOfWeek.FRIDAY, LocalTime.of(16, 0), LocalTime.of(17, 30), "LHC-3", "ghopper", "CS302", "Exam Review"),
            new ExtraBookingDef("E4", 1, DayOfWeek.TUESDAY, LocalTime.of(16, 0), LocalTime.of(17, 0), "SEC-103", "cvraman", "PH101", "Make-up Class"),
            new ExtraBookingDef("E5", 2, DayOfWeek.WEDNESDAY, LocalTime.of(12, 0), LocalTime.of(13, 0), "LHC-2", "edijkstra", "CS301", "Quiz"),
            new ExtraBookingDef("E6", 2, DayOfWeek.MONDAY, LocalTime.of(15, 0), LocalTime.of(17, 0), "SEC-203", "cshannon", "EE201", "MATLAB Workshop"),
            new ExtraBookingDef("E7", 5, DayOfWeek.TUESDAY, LocalTime.of(10, 0), LocalTime.of(11, 0), "LHC-1", "cvraman", "PH101", "Special Lecture")
    );
}
