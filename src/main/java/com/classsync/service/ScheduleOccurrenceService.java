package com.classsync.service;

import com.classsync.dto.complex.ComplexSummaryResponse;
import com.classsync.dto.occurrence.*;
import com.classsync.dto.timetable.ProfessorSummaryResponse;
import com.classsync.entity.*;
import com.classsync.exception.BadRequestException;
import com.classsync.exception.ResourceNotFoundException;
import com.classsync.repository.RoomRepository;
import com.classsync.repository.ScheduleOccurrenceRepository;
import com.classsync.repository.TimetableEntryRepository;
import com.classsync.repository.TimetableVersionRepository;
import com.classsync.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScheduleOccurrenceService {

    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final TimetableVersionRepository timetableVersionRepository;
    private final TimetableEntryRepository timetableEntryRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    public ScheduleOccurrenceService(ScheduleOccurrenceRepository scheduleOccurrenceRepository,
                                     TimetableVersionRepository timetableVersionRepository,
                                     TimetableEntryRepository timetableEntryRepository,
                                     UserRepository userRepository,
                                     RoomRepository roomRepository) {
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.timetableVersionRepository = timetableVersionRepository;
        this.timetableEntryRepository = timetableEntryRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public GenerateOccurrencesResponse generateOccurrences(GenerateOccurrencesRequest request, String adminEmail) {
        // 1. Validate the request
        if (request.startDate().isAfter(request.endDate())) {
            throw new BadRequestException("Start date must be less than or equal to end date");
        }

        if (request.startDate().plusYears(1).isBefore(request.endDate())) {
            throw new BadRequestException("Generation window cannot exceed 12 months");
        }

        // 2. Lock the version row with findByIdForUpdate (PESSIMISTIC_WRITE, no join fetch)
        TimetableVersion version = timetableVersionRepository.findByIdForUpdate(request.timetableVersionId())
                .orElseThrow(() -> new ResourceNotFoundException("Timetable version not found with id: " + request.timetableVersionId()));

        if (version.getStatus() != TimetableVersionStatus.ACTIVE) {
            throw new BadRequestException("Occurrences can only be generated from ACTIVE timetable versions. Current status: " + version.getStatus());
        }

        // 3. Load the entries with the existing fetch query
        List<TimetableEntry> entries = timetableEntryRepository.findByTimetableVersionIdWithDetails(version.getId());
        if (entries.isEmpty()) {
            return new GenerateOccurrencesResponse(version.getId(), request.startDate(), request.endDate(), 0, 0, 0, Collections.emptyList());
        }

        User creator = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalStateException("Admin user not found with email: " + adminEmail));

        // 4. Lock professors, then rooms in ascending id order
        List<Integer> profIds = entries.stream()
                .map(e -> e.getProfessor().getId())
                .distinct()
                .sorted()
                .toList();

        List<Integer> roomIds = entries.stream()
                .map(e -> e.getRoom().getId())
                .distinct()
                .sorted()
                .toList();

        if (!profIds.isEmpty()) {
            userRepository.lockAllByIdInOrder(profIds);
        }
        if (!roomIds.isEmpty()) {
            roomRepository.lockAllByIdInOrder(roomIds);
        }

        // 5. Load existing (entry, date) keys
        List<Integer> entryIds = entries.stream().map(TimetableEntry::getId).toList();
        Set<String> existingKeys = scheduleOccurrenceRepository
                .findExistingEntryDates(entryIds, request.startDate(), request.endDate())
                .stream()
                .map(row -> row[0] + "_" + row[1])
                .collect(Collectors.toSet());

        // 6. Load potential conflicts with ONE query
        List<ScheduleOccurrence> existingScheduled = scheduleOccurrenceRepository
                .findScheduledInWindowForRoomsOrProfessors(request.startDate(), request.endDate(), roomIds, profIds);

        Map<String, List<ScheduleOccurrence>> roomOccurrences = new HashMap<>();
        Map<String, List<ScheduleOccurrence>> profOccurrences = new HashMap<>();

        for (ScheduleOccurrence occ : existingScheduled) {
            String roomKey = occ.getRoom().getId() + "_" + occ.getScheduleDate();
            roomOccurrences.computeIfAbsent(roomKey, k -> new ArrayList<>()).add(occ);

            String profKey = occ.getProfessor().getId() + "_" + occ.getScheduleDate();
            profOccurrences.computeIfAbsent(profKey, k -> new ArrayList<>()).add(occ);
        }

        Map<Byte, List<TimetableEntry>> entriesByDay = entries.stream()
                .collect(Collectors.groupingBy(TimetableEntry::getDayOfWeek));

        List<ScheduleOccurrence> toSave = new ArrayList<>();
        List<GenerationConflict> conflicts = new ArrayList<>();
        int createdCount = 0;
        int skippedCount = 0;

        for (LocalDate date = request.startDate(); !date.isAfter(request.endDate()); date = date.plusDays(1)) {
            byte dayOfWeek = (byte) date.getDayOfWeek().getValue();
            List<TimetableEntry> dayEntries = entriesByDay.getOrDefault(dayOfWeek, Collections.emptyList());

            for (TimetableEntry entry : dayEntries) {
                String key = entry.getId() + "_" + date;
                if (existingKeys.contains(key)) {
                    skippedCount++;
                    continue;
                }

                Room room = entry.getRoom();
                if (!Boolean.TRUE.equals(room.getActive()) || (room.getComplex() != null && !Boolean.TRUE.equals(room.getComplex().getActive()))) {
                    conflicts.add(new GenerationConflict(
                            date, entry.getId(), entry.getCourseCode(),
                            entry.getStartTime(), entry.getEndTime(),
                            room.getId(), room.getRoomNumber(),
                            entry.getProfessor().getId(), entry.getProfessor().getName(),
                            GenerationConflictType.ROOM_INACTIVE,
                            null, null, null
                    ));
                    continue;
                }

                // Check room overlap
                String roomKey = room.getId() + "_" + date;
                List<ScheduleOccurrence> scheduledInRoom = roomOccurrences.getOrDefault(roomKey, Collections.emptyList());
                ScheduleOccurrence roomConflict = scheduledInRoom.stream()
                        .filter(o -> o.getStatus() == ScheduleStatus.SCHEDULED && o.getStartTime().isBefore(entry.getEndTime()) && o.getEndTime().isAfter(entry.getStartTime()))
                        .findFirst()
                        .orElse(null);

                if (roomConflict != null) {
                    conflicts.add(new GenerationConflict(
                            date, entry.getId(), entry.getCourseCode(),
                            entry.getStartTime(), entry.getEndTime(),
                            room.getId(), room.getRoomNumber(),
                            entry.getProfessor().getId(), entry.getProfessor().getName(),
                            GenerationConflictType.ROOM_BUSY,
                            roomConflict.getId(),
                            roomConflict.getEventType(),
                            roomConflict.getCourseCode()
                    ));
                    continue;
                }

                // Check professor overlap
                String profKey = entry.getProfessor().getId() + "_" + date;
                List<ScheduleOccurrence> scheduledForProf = profOccurrences.getOrDefault(profKey, Collections.emptyList());
                ScheduleOccurrence profConflict = scheduledForProf.stream()
                        .filter(o -> o.getStatus() == ScheduleStatus.SCHEDULED && o.getStartTime().isBefore(entry.getEndTime()) && o.getEndTime().isAfter(entry.getStartTime()))
                        .findFirst()
                        .orElse(null);

                if (profConflict != null) {
                    conflicts.add(new GenerationConflict(
                            date, entry.getId(), entry.getCourseCode(),
                            entry.getStartTime(), entry.getEndTime(),
                            room.getId(), room.getRoomNumber(),
                            entry.getProfessor().getId(), entry.getProfessor().getName(),
                            GenerationConflictType.PROFESSOR_BUSY,
                            profConflict.getId(),
                            profConflict.getEventType(),
                            profConflict.getCourseCode()
                    ));
                    continue;
                }

                // None of the above: create it
                ScheduleOccurrence occurrence = new ScheduleOccurrence(
                        entry,
                        entry.getProfessor(),
                        room,
                        date,
                        entry.getStartTime(),
                        entry.getEndTime(),
                        ScheduleEventType.OFFICIAL,
                        ScheduleStatus.SCHEDULED,
                        entry.getCourseCode(),
                        entry.getCourseName(),
                        creator
                );

                toSave.add(occurrence);
                roomOccurrences.computeIfAbsent(roomKey, k -> new ArrayList<>()).add(occurrence);
                profOccurrences.computeIfAbsent(profKey, k -> new ArrayList<>()).add(occurrence);
                createdCount++;
            }
        }

        if (!toSave.isEmpty()) {
            scheduleOccurrenceRepository.saveAll(toSave);
        }

        conflicts.sort(Comparator.comparing(GenerationConflict::date)
                .thenComparing(GenerationConflict::startTime)
                .thenComparing(GenerationConflict::timetableEntryId));

        return new GenerateOccurrencesResponse(
                version.getId(),
                request.startDate(),
                request.endDate(),
                createdCount,
                skippedCount,
                conflicts.size(),
                conflicts
        );
    }

    @Transactional(readOnly = true)
    public List<ScheduleOccurrenceResponse> getScheduleOccurrences(LocalDate startDate,
                                                                   LocalDate endDate,
                                                                   Integer professorId,
                                                                   Integer roomId,
                                                                   Integer complexId,
                                                                   ScheduleStatus status) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Start date must be less than or equal to end date");
        }

        return scheduleOccurrenceRepository.findWithFilters(startDate, endDate, professorId, roomId, complexId, status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScheduleOccurrenceResponse getScheduleOccurrenceById(Integer id) {
        ScheduleOccurrence occurrence = scheduleOccurrenceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule occurrence not found with id: " + id));

        return toResponse(occurrence);
    }

    private ScheduleOccurrenceResponse toResponse(ScheduleOccurrence o) {
        ProfessorSummaryResponse profSummary = new ProfessorSummaryResponse(
                o.getProfessor().getId(),
                o.getProfessor().getName(),
                o.getProfessor().getEmail(),
                o.getProfessor().getEmployeeCode()
        );

        ComplexSummaryResponse complexSummary = new ComplexSummaryResponse(
                o.getRoom().getComplex().getId(),
                o.getRoom().getComplex().getName(),
                o.getRoom().getComplex().getCode()
        );

        RoomOccurrenceSummaryResponse roomSummary = new RoomOccurrenceSummaryResponse(
                o.getRoom().getId(),
                o.getRoom().getRoomNumber(),
                o.getRoom().getRoomType(),
                o.getRoom().getCapacity(),
                o.getRoom().getActive(),
                complexSummary
        );

        Integer timetableEntryId = o.getTimetableEntry() != null ? o.getTimetableEntry().getId() : null;
        Integer rescheduledFromId = o.getRescheduledFrom() != null ? o.getRescheduledFrom().getId() : null;

        return new ScheduleOccurrenceResponse(
                o.getId(),
                timetableEntryId,
                profSummary,
                roomSummary,
                o.getScheduleDate(),
                o.getStartTime(),
                o.getEndTime(),
                o.getEventType(),
                o.getStatus(),
                o.getCourseCode(),
                o.getCourseName(),
                o.getCreatedBy() != null ? o.getCreatedBy().getId() : null,
                o.getCreatedBy() != null ? o.getCreatedBy().getName() : null,
                o.getCreatedAt(),
                rescheduledFromId
        );
    }
}
