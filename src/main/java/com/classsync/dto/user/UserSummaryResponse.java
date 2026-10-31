package com.classsync.dto.user;

import com.classsync.entity.UserRole;
import com.classsync.entity.UserStatus;

public record UserSummaryResponse(
        Integer id,
        String name,
        String email,
        String employeeCode,
        UserRole role,
        UserStatus status
) {
}
