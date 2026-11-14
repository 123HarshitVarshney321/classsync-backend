package com.classsync.dto.analytics;

public record UtilizationSummary(
        int roomCount,
        int workingDayCount,
        double availableHours,
        double bookedHours,
        double utilizationPercent,
        int scheduledClasses,
        int extraClasses,
        int cancelledClasses,
        int rescheduledClasses
) {}
