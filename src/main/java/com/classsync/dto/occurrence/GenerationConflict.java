package com.classsync.dto.occurrence;

import com.classsync.entity.ScheduleEventType;

import java.time.LocalDate;
import java.time.LocalTime;

public record GenerationConflict(
        LocalDate date,
        Integer timetableEntryId,
        String courseCode,
        LocalTime startTime,
        LocalTime endTime,
        Integer roomId,
        String roomNumber,
        Integer professorId,
        String professorName,
        GenerationConflictType type,
        Integer conflictingOccurrenceId,          // null for ROOM_INACTIVE
        ScheduleEventType conflictingEventType,   // null for ROOM_INACTIVE
        String conflictingCourseCode              // null for ROOM_INACTIVE
) {}
