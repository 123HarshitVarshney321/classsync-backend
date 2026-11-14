package com.classsync.service;

import com.classsync.dto.analytics.HeatmapCell;
import com.classsync.dto.analytics.HeatmapRow;
import com.classsync.dto.analytics.RoomUtilization;
import com.classsync.dto.analytics.UtilizationResponse;
import com.classsync.dto.analytics.UtilizationSummary;
import com.classsync.entity.Room;
import com.classsync.entity.ScheduleEventType;
import com.classsync.entity.ScheduleOccurrence;
import com.classsync.entity.ScheduleStatus;
import com.classsync.exception.BadRequestException;
import com.classsync.repository.ComplexRepository;
import com.classsync.repository.RoomRepository;
import com.classsync.repository.ScheduleOccurrenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final RoomRepository roomRepository;
    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final ComplexRepository complexRepository;

    public AnalyticsService(
            RoomRepository roomRepository,
            ScheduleOccurrenceRepository scheduleOccurrenceRepository,
            ComplexRepository complexRepository) {
        this.roomRepository = roomRepository;
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.complexRepository = complexRepository;
    }

    public UtilizationResponse getUtilization(LocalDate startDate, LocalDate endDate, Integer complexId) {
        // 1. Validate the request
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("endDate must not be before startDate");
        }
        if (startDate.plusYears(1).isBefore(endDate)) {
            throw new BadRequestException("Analytics window cannot exceed 12 months");
        }
        if (complexId != null) {
            complexRepository.findByIdAndActiveTrue(complexId)
                    .orElseThrow(() -> new BadRequestException("Requested complex not found or inactive: " + complexId));
        }

        // 2. Load the data
        List<Room> rooms = roomRepository.findActiveRoomsInScope(complexId);
        Set<Integer> scopeRoomIds = rooms.stream().map(Room::getId).collect(Collectors.toSet());

        List<ScheduleOccurrence> allOccurrences = scheduleOccurrenceRepository.findWithFilters(
                startDate, endDate, null, null, complexId, null);

        Set<DayOfWeek> workingDaysSet = Set.copyOf(UtilizationCalculator.WORKING_DAYS);
        List<ScheduleOccurrence> workingDayOccurrences = allOccurrences.stream()
                .filter(o -> o.getRoom() != null && scopeRoomIds.contains(o.getRoom().getId()))
                .filter(o -> workingDaysSet.contains(o.getScheduleDate().getDayOfWeek()))
                .toList();

        // 3. Count the classes (working days only)
        int scheduledClasses = 0;
        int extraClasses = 0;
        int cancelledClasses = 0;
        int rescheduledClasses = 0;

        for (ScheduleOccurrence o : workingDayOccurrences) {
            if (o.getStatus() == ScheduleStatus.SCHEDULED) {
                scheduledClasses++;
                if (o.getEventType() == ScheduleEventType.EXTRA) {
                    extraClasses++;
                }
            } else if (o.getStatus() == ScheduleStatus.CANCELLED) {
                cancelledClasses++;
            } else if (o.getStatus() == ScheduleStatus.RESCHEDULED) {
                rescheduledClasses++;
            }
        }

        // 4. Working days & hours calculations
        int workingDayCount = UtilizationCalculator.workingDayCount(startDate, endDate);
        int roomCount = rooms.size();
        double roomAvailableHours = UtilizationCalculator.round1(workingDayCount * 12.0);
        double totalAvailableHours = UtilizationCalculator.round1(workingDayCount * 12.0 * roomCount);
        int roomAvailableMinutes = workingDayCount * 12 * 60;
        int totalAvailableMinutes = roomAvailableMinutes * roomCount;

        Map<Integer, List<ScheduleOccurrence>> roomScheduledMap = workingDayOccurrences.stream()
                .filter(o -> o.getStatus() == ScheduleStatus.SCHEDULED)
                .collect(Collectors.groupingBy(o -> o.getRoom().getId()));

        int totalBookedMinutes = 0;
        Map<Integer, Integer> roomMinutesMap = new HashMap<>();
        Map<Integer, Integer> roomClassCountMap = new HashMap<>();

        for (Room r : rooms) {
            List<ScheduleOccurrence> scheduledList = roomScheduledMap.getOrDefault(r.getId(), List.of());
            int rMinutes = 0;
            for (ScheduleOccurrence occ : scheduledList) {
                rMinutes += UtilizationCalculator.minutesInsideTeachingDay(
                        occ.getScheduleDate(), occ.getStartTime(), occ.getEndTime()
                );
            }
            roomMinutesMap.put(r.getId(), rMinutes);
            roomClassCountMap.put(r.getId(), scheduledList.size());
            totalBookedMinutes += rMinutes;
        }

        double totalBookedHours = UtilizationCalculator.hours(totalBookedMinutes);
        double overallUtilizationPercent = UtilizationCalculator.percent(totalBookedMinutes, totalAvailableMinutes);
        double unroundedOverall = totalAvailableMinutes > 0 ? ((double) totalBookedMinutes / totalAvailableMinutes) * 100.0 : 0.0;
        double underusedThresholdPercent = unroundedOverall > 0.0 ? UtilizationCalculator.round1(unroundedOverall / 2.0) : 0.0;

        List<RoomUtilization> roomUtilizations = new ArrayList<>();
        for (Room r : rooms) {
            int rMinutes = roomMinutesMap.get(r.getId());
            int rCount = roomClassCountMap.get(r.getId());
            double rBookedHours = UtilizationCalculator.hours(rMinutes);
            double rUtilPercent = UtilizationCalculator.percent(rMinutes, roomAvailableMinutes);
            double unroundedRoom = roomAvailableMinutes > 0 ? ((double) rMinutes / roomAvailableMinutes) * 100.0 : 0.0;
            boolean underused = unroundedOverall > 0.0 && (unroundedRoom < (unroundedOverall / 2.0));

            roomUtilizations.add(new RoomUtilization(
                    r.getId(),
                    r.getRoomNumber(),
                    r.getComplex().getName(),
                    r.getRoomType(),
                    r.getCapacity(),
                    rCount,
                    rBookedHours,
                    roomAvailableHours,
                    rUtilPercent,
                    underused
            ));
        }

        roomUtilizations.sort(
                Comparator.comparingDouble(RoomUtilization::utilizationPercent).reversed()
                        .thenComparing(RoomUtilization::roomNumber)
        );

        // 5. Heatmap
        List<ScheduleOccurrence> allScheduledOccurrences = workingDayOccurrences.stream()
                .filter(o -> o.getStatus() == ScheduleStatus.SCHEDULED)
                .toList();

        List<HeatmapRow> heatmap = new ArrayList<>();
        for (DayOfWeek day : UtilizationCalculator.WORKING_DAYS) {
            int weekdayCount = UtilizationCalculator.countWeekday(day, startDate, endDate);
            int denominator = weekdayCount * roomCount * 60;

            List<ScheduleOccurrence> dayScheduled = allScheduledOccurrences.stream()
                    .filter(o -> o.getScheduleDate().getDayOfWeek() == day)
                    .toList();

            List<HeatmapCell> cells = new ArrayList<>();
            for (int h = 8; h <= 19; h++) {
                LocalTime slotStart = LocalTime.of(h, 0);
                LocalTime slotEnd = LocalTime.of(h + 1, 0);
                int cellMinutes = 0;
                for (ScheduleOccurrence o : dayScheduled) {
                    cellMinutes += UtilizationCalculator.overlapMinutes(o.getStartTime(), o.getEndTime(), slotStart, slotEnd);
                }
                double cellPercent = UtilizationCalculator.percent(cellMinutes, denominator);
                cells.add(new HeatmapCell(h, cellPercent));
            }
            heatmap.add(new HeatmapRow(day, cells));
        }

        // 6. Summary
        UtilizationSummary summary = new UtilizationSummary(
                roomCount,
                workingDayCount,
                totalAvailableHours,
                totalBookedHours,
                overallUtilizationPercent,
                scheduledClasses,
                extraClasses,
                cancelledClasses,
                rescheduledClasses
        );

        return new UtilizationResponse(
                startDate,
                endDate,
                complexId,
                UtilizationCalculator.DAY_START,
                UtilizationCalculator.DAY_END,
                UtilizationCalculator.WORKING_DAYS,
                underusedThresholdPercent,
                summary,
                roomUtilizations,
                heatmap
        );
    }
}
