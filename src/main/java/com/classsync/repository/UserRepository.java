package com.classsync.repository;

import com.classsync.entity.User;
import com.classsync.entity.UserRole;
import com.classsync.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeCode(String employeeCode);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithLock(@Param("id") Integer id);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id IN :ids ORDER BY u.id ASC")
    List<User> lockAllByIdInOrder(@Param("ids") Collection<Integer> ids);

    @Query("""
        SELECT u FROM User u
        WHERE (:role IS NULL OR u.role = :role)
          AND (:status IS NULL OR u.status = :status)
        ORDER BY u.name ASC, u.id ASC
    """)
    List<User> findByRoleAndStatus(
            @Param("role") UserRole role,
            @Param("status") UserStatus status
    );
}
