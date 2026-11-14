package com.classsync.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UtilizationCalculatorTest {

    @Test
    @DisplayName("workingDayCount: Monday to Sunday week has 5 working days")
    void workingDayCountMondayToSunday() {
        LocalDate start = LocalDate.of(2026, 11, 9); // Monday
        LocalDate end = LocalDate.of(2026, 11, 15);   // Sunday
        assertEquals(5, UtilizationCalculator.workingDayCount(start, end));
    }

    @Test
    @DisplayName("workingDayCount: Saturday to Sunday has 0 working days")
    void workingDayCountSaturdayToSunday() {
        LocalDate start = LocalDate.of(2026, 11, 14); // Saturday
        LocalDate end = LocalDate.of(2026, 11, 15);   // Sunday
        assertEquals(0, UtilizationCalculator.workingDayCount(start, end));
    }

    @Test
    @DisplayName("countWeekday: counts specific weekday across range")
    void countWeekdayCase() {
        LocalDate start = LocalDate.of(2026, 11, 2);  // Monday
        LocalDate end = LocalDate.of(2026, 11, 15);   // Sunday
        assertEquals(2, UtilizationCalculator.countWeekday(DayOfWeek.MONDAY, start, end));
        assertEquals(2, UtilizationCalculator.countWeekday(DayOfWeek.FRIDAY, start, end));
    }

    @Test
    @DisplayName("minutesInsideTeachingDay: standard class inside teaching day (09:00-10:30 -> 90)")
    void minutesInsideTeachingDayStandard() {
        LocalDate weekday = LocalDate.of(2026, 11, 9); // Monday
        assertEquals(90, UtilizationCalculator.minutesInsideTeachingDay(
                weekday, LocalTime.of(9, 0), LocalTime.of(10, 30)));
    }

    @Test
    @DisplayName("minutesInsideTeachingDay: clipped early class (07:00-09:00 -> 60)")
    void minutesInsideTeachingDayClippedEarly() {
        LocalDate weekday = LocalDate.of(2026, 11, 13); // Friday
        assertEquals(60, UtilizationCalculator.minutesInsideTeachingDay(
                weekday, LocalTime.of(7, 0), LocalTime.of(9, 0)));
    }

    @Test
    @DisplayName("minutesInsideTeachingDay: clipped late class (19:30-21:00 -> 30)")
    void minutesInsideTeachingDayClippedLate() {
        LocalDate weekday = LocalDate.of(2026, 11, 11); // Wednesday
        assertEquals(30, UtilizationCalculator.minutesInsideTeachingDay(
                weekday, LocalTime.of(19, 30), LocalTime.of(21, 0)));
    }

    @Test
    @DisplayName("minutesInsideTeachingDay: Saturday class returns 0")
    void minutesInsideTeachingDaySaturday() {
        LocalDate saturday = LocalDate.of(2026, 11, 14); // Saturday
        assertEquals(0, UtilizationCalculator.minutesInsideTeachingDay(
                saturday, LocalTime.of(10, 0), LocalTime.of(11, 0)));
    }

    @Test
    @DisplayName("overlapMinutes: back-to-back intervals return 0")
    void overlapMinutesBackToBack() {
        assertEquals(0, UtilizationCalculator.overlapMinutes(
                LocalTime.of(9, 0), LocalTime.of(10, 0),
                LocalTime.of(10, 0), LocalTime.of(11, 0)));
    }

    @Test
    @DisplayName("percent: percent(0, 0) is 0.0 and percent(1, 3) is 33.3")
    void percentCalculations() {
        assertEquals(0.0, UtilizationCalculator.percent(0, 0));
        assertEquals(33.3, UtilizationCalculator.percent(1, 3));
        assertEquals(50.0, UtilizationCalculator.percent(1, 2));
    }

    @Test
    @DisplayName("hours: rounds minutes to 1 decimal place")
    void hoursRounding() {
        assertEquals(0.0, UtilizationCalculator.hours(0));
        assertEquals(1.5, UtilizationCalculator.hours(90));
        assertEquals(1.3, UtilizationCalculator.hours(80));
    }
}
