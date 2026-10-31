package com.classsync.service;

import com.classsync.dto.booking.BookingProfessorSummary;
import com.classsync.dto.booking.BookingResponse;
import com.classsync.dto.booking.BookingRoomSummary;
import com.classsync.dto.occurrence.RescheduleRequest;
import com.classsync.entity.*;
import com.classsync.exception.BadRequestException;
import com.classsync.exception.DuplicateResourceException;
import com.classsync.exception.ResourceNotFoundException;
import com.classsync.repository.RoomRepository;
import com.classsync.repository.ScheduleOccurrenceRepository;
import com.classsync.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class ClassScheduleService {

    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final Clock clock;

    public ClassScheduleService(ScheduleOccurrenceRepository scheduleOccurrenceRepository,
                                UserRepository userRepository,
                                RoomRepository roomRepository,
                                Clock clock) {
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.clock = clock;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse cancelOccurrence(Integer occurrenceId, String authenticatedUserEmail) {
        // 1. Lock the occurrence being cancelled to serialize concurrent cancellations/modifications
        ScheduleOccurrence occurrence = scheduleOccurrenceRepository.findByIdWithLock(occurrenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule occurrence not found with id: " + occurrenceId));

        // 2. Cancellation eligibility: only SCHEDULED occurrences can be cancelled
        if (occurrence.getStatus() != ScheduleStatus.SCHEDULED) {
            if (occurrence.getStatus() == ScheduleStatus.CANCELLED) {
                throw new DuplicateResourceException("Occurrence is already cancelled");
            }
            throw new DuplicateResourceException("Only SCHEDULED occurrences can be cancelled (current status: " + occurrence.getStatus() + ")");
        }

        // 3. Authorization check
        User caller = userRepository.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found with email: " + authenticatedUserEmail));

        if (caller.getRole() == UserRole.PROFESSOR && !occurrence.getProfessor().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Professors can only cancel their own classes");
        }

        // 4. Update status to CANCELLED without modifying other fields
        occurrence.setStatus(ScheduleStatus.CANCELLED);
        ScheduleOccurrence saved = scheduleOccurrenceRepository.save(occurrence);

        return toResponse(saved);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse rescheduleOccurrence(Integer occurrenceId, RescheduleRequest request, String authenticatedUserEmail) {
        // 1. Require startTime < endTime; otherwise 400
        if (request.startTime() == null || request.endTime() == null || !request.startTime().isBefore(request.endTime())) {
            throw new BadRequestException("Start time must be strictly before end time");
        }

        // 2. Reject past targets
        if (LocalDateTime.of(request.date(), request.startTime()).isBefore(LocalDateTime.now(clock))) {
            throw new BadRequestException("Cannot reschedule a class into the past");
        }

        User caller = userRepository.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found with email: " + authenticatedUserEmail));

        // 3. Lock the original (O). Return 404 if it does not exist.
        ScheduleOccurrence original = scheduleOccurrenceRepository.findByIdWithLock(occurrenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule occurrence not found with id: " + occurrenceId));

        // 4. If the original's status != SCHEDULED, return 409
        if (original.getStatus() != ScheduleStatus.SCHEDULED) {
            if (original.getStatus() == ScheduleStatus.CANCELLED) {
                throw new DuplicateResourceException("Cancelled occurrences cannot be rescheduled");
            }
            throw new DuplicateResourceException("Only SCHEDULED occurrences can be rescheduled (current status: " + original.getStatus() + ")");
        }

        // 5. Run the authorization check (existing 403 behavior)
        if (caller.getRole() == UserRole.PROFESSOR && !original.getProfessor().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Professors can only reschedule their own classes");
        }

        // 6. If date, start, end and room all equal the original's, return 400
        if (request.date().equals(original.getScheduleDate())
                && request.startTime().equals(original.getStartTime())
                && request.endTime().equals(original.getEndTime())
                && request.roomId().equals(original.getRoom().getId())) {
            throw new BadRequestException("Reschedule target is identical to the current slot");
        }

        // 7. Lock the assigned professor (U), then the target room (R). Validate that the room and its complex are active.
        User assignedProfessor = userRepository.findByIdWithLock(original.getProfessor().getId())
                .orElseThrow(() -> new IllegalStateException("Assigned professor not found for locking: " + original.getProfessor().getId()));

        Room targetRoom = roomRepository.findByIdWithLock(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.roomId()));

        if (!targetRoom.getActive()) {
            throw new ResourceNotFoundException("Room is inactive with id: " + request.roomId());
        }
        if (!targetRoom.getComplex().getActive()) {
            throw new ResourceNotFoundException("Room belongs to an inactive complex");
        }

        // 8. Run conflict checks excluding the original occurrence
        boolean hasRoomConflict = scheduleOccurrenceRepository.existsRoomConflictExcludingId(
                targetRoom.getId(),
                request.date(),
                request.startTime(),
                request.endTime(),
                occurrenceId
        );
        if (hasRoomConflict) {
            throw new DuplicateResourceException("Room is already scheduled for the requested time.");
        }

        boolean hasProfessorConflict = scheduleOccurrenceRepository.existsProfessorConflictExcludingId(
                assignedProfessor.getId(),
                request.date(),
                request.startTime(),
                request.endTime(),
                occurrenceId
        );
        if (hasProfessorConflict) {
            throw new DuplicateResourceException("Professor already has a scheduled class during the requested time.");
        }

        // 9. Set the original's status = RESCHEDULED. Nothing else on the original changes.
        original.setStatus(ScheduleStatus.RESCHEDULED);
        scheduleOccurrenceRepository.save(original);

        // 10. Insert the replacement row:
        // Why timetableEntry = null on the replacement:
        // - (timetable_entry_id, schedule_date) is the generator's idempotency key.
        // - The original keeps the key, so the generator never re-creates the moved class.
        // - The replacement never collides with uk_schedule_occurrences_entry_date.
        // - Lineage is preserved through rescheduled_from_id.
        ScheduleOccurrence replacement = new ScheduleOccurrence(
                null, // timetableEntry = null
                assignedProfessor,
                targetRoom,
                request.date(),
                request.startTime(),
                request.endTime(),
                original.getEventType(),
                ScheduleStatus.SCHEDULED,
                original.getCourseCode(),
                original.getCourseName(),
                caller // createdBy = authenticated caller
        );
        replacement.setRescheduledFrom(original);

        ScheduleOccurrence savedReplacement = scheduleOccurrenceRepository.save(replacement);

        // 11. Return 200 with the replacement as a BookingResponse
        return toResponse(savedReplacement);
    }

    private BookingResponse toResponse(ScheduleOccurrence occurrence) {
        BookingProfessorSummary profSummary = new BookingProfessorSummary(
                occurrence.getProfessor().getId(),
                occurrence.getProfessor().getName(),
                occurrence.getProfessor().getEmail()
        );

        BookingRoomSummary roomSummary = new BookingRoomSummary(
                occurrence.getRoom().getId(),
                occurrence.getRoom().getRoomNumber()
        );

        Integer rescheduledFromId = occurrence.getRescheduledFrom() != null ? occurrence.getRescheduledFrom().getId() : null;

        return new BookingResponse(
                occurrence.getId(),
                occurrence.getEventType(),
                occurrence.getStatus(),
                occurrence.getScheduleDate(),
                occurrence.getStartTime(),
                occurrence.getEndTime(),
                occurrence.getCourseCode(),
                occurrence.getCourseName(),
                profSummary,
                roomSummary,
                rescheduledFromId
        );
    }
}
