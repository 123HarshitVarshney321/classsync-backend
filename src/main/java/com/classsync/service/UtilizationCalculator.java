package com.classsync.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

public final class UtilizationCalculator {

    public static final LocalTime DAY_START = LocalTime.of(8, 0);
    public static final LocalTime DAY_END = LocalTime.of(20, 0);
    public static final List<DayOfWeek> WORKING_DAYS = List.of(
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY
    );
    private static final Set<DayOfWeek> WORKING_DAYS_SET = Set.copyOf(WORKING_DAYS);

    private UtilizationCalculator() {
    }

    public static int workingDayCount(LocalDate start, LocalDate end) {
        if (start == null || end == null || end.isBefore(start)) {
            return 0;
        }
        int count = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            if (WORKING_DAYS_SET.contains(d.getDayOfWeek())) {
                count++;
            }
        }
        return count;
    }

    public static int countWeekday(DayOfWeek day, LocalDate start, LocalDate end) {
        if (day == null || start == null || end == null || end.isBefore(start)) {
            return 0;
        }
        int count = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            if (d.getDayOfWeek() == day) {
                count++;
            }
        }
        return count;
    }

    public static int overlapMinutes(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd) {
        if (aStart == null || aEnd == null || bStart == null || bEnd == null) {
            return 0;
        }
        if (!aEnd.isAfter(aStart) || !bEnd.isAfter(bStart)) {
            return 0;
        }
        LocalTime maxStart = aStart.isAfter(bStart) ? aStart : bStart;
        LocalTime minEnd = aEnd.isBefore(bEnd) ? aEnd : bEnd;
        if (minEnd.isAfter(maxStart)) {
            return (int) ChronoUnit.MINUTES.between(maxStart, minEnd);
        }
        return 0;
    }

    public static int minutesInsideTeachingDay(LocalDate date, LocalTime start, LocalTime end) {
        if (date == null || !WORKING_DAYS_SET.contains(date.getDayOfWeek())) {
            return 0;
        }
        return overlapMinutes(start, end, DAY_START, DAY_END);
    }

    public static double percent(double part, double whole) {
        if (whole <= 0.0 || part <= 0.0) {
            return 0.0;
        }
        return round1((part / whole) * 100.0);
    }

    public static double hours(int minutes) {
        if (minutes <= 0) {
            return 0.0;
        }
        return round1(minutes / 60.0);
    }

    public static double round1(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
