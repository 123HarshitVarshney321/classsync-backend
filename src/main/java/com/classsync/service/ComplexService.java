package com.classsync.service;

import com.classsync.dto.common.StatusUpdateRequest;
import com.classsync.dto.complex.ComplexRequest;
import com.classsync.dto.complex.ComplexResponse;
import com.classsync.entity.Complex;
import com.classsync.entity.ScheduleOccurrence;
import com.classsync.exception.DuplicateResourceException;
import com.classsync.exception.ResourceNotFoundException;
import com.classsync.repository.ComplexRepository;
import com.classsync.repository.ScheduleOccurrenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class ComplexService {

    private final ComplexRepository complexRepository;
    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final Clock clock;

    public ComplexService(ComplexRepository complexRepository,
                          ScheduleOccurrenceRepository scheduleOccurrenceRepository,
                          Clock clock) {
        this.complexRepository = complexRepository;
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<ComplexResponse> getActiveComplexes() {
        return getComplexes(false);
    }

    @Transactional(readOnly = true)
    public List<ComplexResponse> getComplexes(boolean includeInactive) {
        List<Complex> list = includeInactive ? complexRepository.findAll() : complexRepository.findByActiveTrue();
        return list.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ComplexResponse getActiveComplexById(Integer id) {
        Complex complex = complexRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complex not found or inactive with id: " + id));
        return toResponse(complex);
    }

    @Transactional
    public ComplexResponse createComplex(ComplexRequest request) {
        String name = request.name().trim();
        String code = request.code().trim();

        if (complexRepository.existsByCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("Complex with code '" + code + "' already exists");
        }

        Complex complex = new Complex(name, code, true);
        Complex saved = complexRepository.save(complex);
        return toResponse(saved);
    }

    @Transactional
    public ComplexResponse updateComplex(Integer id, ComplexRequest request) {
        Complex complex = complexRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complex not found with id: " + id));

        String name = request.name().trim();
        String code = request.code().trim();

        if (complexRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new DuplicateResourceException("Complex with code '" + code + "' already exists");
        }

        complex.setName(name);
        complex.setCode(code);
        return toResponse(complex);
    }

    @Transactional
    public ComplexResponse updateComplexStatus(Integer id, StatusUpdateRequest request) {
        Complex complex = complexRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complex not found with id: " + id));

        if (Boolean.FALSE.equals(request.active())) {
            LocalDate today = LocalDate.now(clock);
            LocalTime nowTime = LocalTime.now(clock);
            List<ScheduleOccurrence> upcoming = scheduleOccurrenceRepository.findUpcomingInComplex(id, today, nowTime);
            if (!upcoming.isEmpty()) {
                LocalDate nextDate = upcoming.get(0).getScheduleDate();
                throw new DuplicateResourceException(
                        "Cannot deactivate complex " + complex.getName() + ": its rooms have " + upcoming.size() +
                        " upcoming scheduled class(es), the next on " + nextDate +
                        ". Cancel or reschedule them, or move these classes in a new timetable version, first."
                );
            }
        }

        complex.setActive(request.active());
        return toResponse(complex);
    }

    private ComplexResponse toResponse(Complex complex) {
        return new ComplexResponse(
                complex.getId(),
                complex.getName(),
                complex.getCode(),
                complex.getActive()
        );
    }
}
