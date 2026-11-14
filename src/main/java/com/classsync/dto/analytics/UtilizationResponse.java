package com.classsync.dto.analytics;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record UtilizationResponse(
        LocalDate startDate,
        LocalDate endDate,
        Integer complexId,
        LocalTime dayStart,
        LocalTime dayEnd,
        List<DayOfWeek> workingDays,
        double underusedThresholdPercent,
        UtilizationSummary summary,
        List<RoomUtilization> rooms,
        List<HeatmapRow> heatmap
) {}
