package com.classsync.repository;

import com.classsync.entity.TimetableVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TimetableVersionRepository extends JpaRepository<TimetableVersion, Integer> {
}
