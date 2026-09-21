package com.classsync.repository;

import com.classsync.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {
    Optional<Room> findByComplexIdAndRoomNumber(Integer complexId, String roomNumber);
}
