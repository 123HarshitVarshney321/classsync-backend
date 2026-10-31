package com.classsync.dto.occurrence;

import java.time.LocalDate;
import java.util.List;

public record GenerateOccurrencesResponse(
        Integer timetableVersionId,
        LocalDate startDate,
        LocalDate endDate,
        int createdCount,
        int skippedExistingCount,
        int conflictCount,
        List<GenerationConflict> conflicts
) {}
