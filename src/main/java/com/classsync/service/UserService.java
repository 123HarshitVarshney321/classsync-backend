package com.classsync.service;

import com.classsync.dto.user.UserSummaryResponse;
import com.classsync.entity.UserRole;
import com.classsync.entity.UserStatus;
import com.classsync.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserSummaryResponse> getUsers(UserRole role, UserStatus status) {
        return userRepository.findByRoleAndStatus(role, status).stream()
                .map(user -> new UserSummaryResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getEmployeeCode(),
                        user.getRole(),
                        user.getStatus()
                ))
                .toList();
    }
}
