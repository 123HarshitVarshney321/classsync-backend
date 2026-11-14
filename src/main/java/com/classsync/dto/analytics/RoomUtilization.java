package com.classsync.dto.analytics;

import com.classsync.entity.RoomType;

public record RoomUtilization(
        Integer roomId,
        String roomNumber,
        String complexName,
        RoomType roomType,
        Integer capacity,
        int classCount,
        double bookedHours,
        double availableHours,
        double utilizationPercent,
        boolean underused
) {}
