package com.classsync.dto.analytics;

import java.time.DayOfWeek;
import java.util.List;

public record HeatmapRow(DayOfWeek day, List<HeatmapCell> cells) {}
