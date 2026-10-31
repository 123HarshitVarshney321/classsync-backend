package com.classsync.service;

import com.classsync.dto.timetable.CreateTimetableVersionRequest;
import com.classsync.dto.timetable.TimetableActivationResponse;
import com.classsync.dto.timetable.TimetableVersionResponse;
import com.classsync.entity.TimetableVersion;
import com.classsync.entity.TimetableVersionStatus;
import com.classsync.entity.User;
import com.classsync.exception.BadRequestException;
import com.classsync.exception.ResourceNotFoundException;
import com.classsync.repository.ScheduleOccurrenceRepository;
import com.classsync.repository.TimetableVersionRepository;
import com.classsync.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class TimetableVersionService {

    private final TimetableVersionRepository timetableVersionRepository;
    private final UserRepository userRepository;
    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final Clock clock;

    public TimetableVersionService(TimetableVersionRepository timetableVersionRepository,
                                   UserRepository userRepository,
                                   ScheduleOccurrenceRepository scheduleOccurrenceRepository,
                                   Clock clock) {
        this.timetableVersionRepository = timetableVersionRepository;
        this.userRepository = userRepository;
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<TimetableVersionResponse> listVersions(String academicYear, String semester) {
        List<TimetableVersion> versions;
        if (academicYear != null && semester != null) {
            versions = timetableVersionRepository.findByAcademicYearAndSemesterOrderByVersionNumberDesc(
                    academicYear.trim(), semester.trim()
            );
        } else {
            versions = timetableVersionRepository.findAllByOrderByAcademicYearDescSemesterAscVersionNumberDesc();
        }

        return versions.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TimetableVersionResponse getVersionById(Integer id) {
        TimetableVersion version = timetableVersionRepository.findByIdWithCreator(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable version not found with id: " + id));
        return toResponse(version);
    }

    @Transactional
    public TimetableVersionResponse createVersion(CreateTimetableVersionRequest request, String creatorEmail) {
        String academicYear = request.academicYear().trim();
        String semester = request.semester().trim();

        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new IllegalStateException("Creator user not found with email: " + creatorEmail));

        int maxVersion = timetableVersionRepository.findMaxVersionNumber(academicYear, semester);
        int nextVersion = maxVersion + 1;

        TimetableVersion version = new TimetableVersion(
                academicYear,
                semester,
                nextVersion,
                TimetableVersionStatus.DRAFT,
                creator
        );

        TimetableVersion saved = timetableVersionRepository.save(version);
        return toResponse(saved);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TimetableActivationResponse activateVersion(Integer id, LocalDate effectiveFrom) {
        LocalDate today = LocalDate.now(clock);
        if (effectiveFrom == null) {
            effectiveFrom = today;
        } else if (effectiveFrom.isBefore(today)) {
            throw new BadRequestException("effectiveFrom cannot be in the past");
        }

        // 1. Lock the target version with findByIdForUpdate (no join fetch)
        TimetableVersion version = timetableVersionRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable version not found with id: " + id));

        if (version.getStatus() != TimetableVersionStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT versions can be activated. Current status: " + version.getStatus());
        }

        // 2. Find the current ACTIVE version of the same academicYear and semester using a locking query
        Optional<TimetableVersion> currentActive = timetableVersionRepository.findByAcademicYearAndSemesterAndStatusForUpdate(
                version.getAcademicYear(), version.getSemester(), TimetableVersionStatus.ACTIVE
        );

        Integer archivedVersionId = null;
        int supersededCount = 0;

        // 3. If a current ACTIVE version exists: set it to ARCHIVED, then bulk-supersede its future official occurrences
        if (currentActive.isPresent()) {
            TimetableVersion activeVer = currentActive.get();
            activeVer.setStatus(TimetableVersionStatus.ARCHIVED);
            archivedVersionId = activeVer.getId();
            supersededCount = scheduleOccurrenceRepository.supersedeFutureOccurrencesOfVersion(activeVer.getId(), effectiveFrom);
        }

        // 4. Set the target version to ACTIVE
        version.setStatus(TimetableVersionStatus.ACTIVE);

        // 5. Return TimetableActivationResponse
        return new TimetableActivationResponse(
                version.getId(),
                version.getAcademicYear(),
                version.getSemester(),
                version.getVersionNumber(),
                version.getStatus(),
                version.getCreatedBy().getId(),
                version.getCreatedBy().getName(),
                version.getCreatedAt(),
                archivedVersionId,
                effectiveFrom,
                supersededCount
        );
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TimetableActivationResponse activateVersion(Integer id) {
        return activateVersion(id, null);
    }

    @Transactional
    public TimetableVersionResponse archiveVersion(Integer id) {
        TimetableVersion version = timetableVersionRepository.findByIdWithCreator(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable version not found with id: " + id));

        if (version.getStatus() == TimetableVersionStatus.ARCHIVED) {
            throw new BadRequestException("Timetable version is already ARCHIVED");
        }

        version.setStatus(TimetableVersionStatus.ARCHIVED);
        return toResponse(version);
    }

    public TimetableVersionResponse toResponse(TimetableVersion version) {
        return new TimetableVersionResponse(
                version.getId(),
                version.getAcademicYear(),
                version.getSemester(),
                version.getVersionNumber(),
                version.getStatus(),
                version.getCreatedBy().getId(),
                version.getCreatedBy().getName(),
                version.getCreatedAt()
        );
    }
}
