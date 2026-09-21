-- =====================================================================
-- ClassSync Initial Schema Migration
-- Version: V1
-- Description: Core 10 tables, constraints, foreign keys, and indexes
-- =====================================================================

-- Table 1: users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PROFESSOR', 'ADMIN') NOT NULL,
    employee_code VARCHAR(50) UNIQUE,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: complexes
CREATE TABLE complexes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: rooms
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complex_id INT NOT NULL,
    room_number VARCHAR(30) NOT NULL,
    room_type ENUM('CLASSROOM', 'LAB', 'LECTURE_HALL', 'SEMINAR_HALL') DEFAULT 'CLASSROOM',
    capacity INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT uk_rooms_complex_room_number UNIQUE (complex_id, room_number),
    CONSTRAINT chk_rooms_capacity CHECK (capacity > 0),
    CONSTRAINT fk_rooms_complex FOREIGN KEY (complex_id) REFERENCES complexes (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: facilities
CREATE TABLE facilities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: room_facilities
CREATE TABLE room_facilities (
    room_id INT NOT NULL,
    facility_id INT NOT NULL,
    PRIMARY KEY (room_id, facility_id),
    CONSTRAINT fk_room_facilities_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_room_facilities_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 6: timetable_versions
CREATE TABLE timetable_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    version_number INT NOT NULL,
    status ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') DEFAULT 'DRAFT',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_timetable_versions_year_sem_ver UNIQUE (academic_year, semester, version_number),
    CONSTRAINT fk_timetable_versions_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 7: timetable_entries
CREATE TABLE timetable_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_version_id INT NOT NULL,
    professor_id INT NOT NULL,
    course_code VARCHAR(30) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    room_id INT NOT NULL,
    day_of_week TINYINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_timetable_entries_day_of_week CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_timetable_entries_time_order CHECK (start_time < end_time),
    CONSTRAINT fk_timetable_entries_version FOREIGN KEY (timetable_version_id) REFERENCES timetable_versions (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_timetable_entries_professor FOREIGN KEY (professor_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_timetable_entries_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 8: schedule_occurrences
CREATE TABLE schedule_occurrences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_entry_id INT NULL,
    professor_id INT NOT NULL,
    room_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    event_type ENUM('OFFICIAL', 'EXTRA') NOT NULL,
    status ENUM('SCHEDULED', 'CANCELLED') DEFAULT 'SCHEDULED',
    course_code VARCHAR(30),
    course_name VARCHAR(100),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_schedule_occurrences_time_order CHECK (start_time < end_time),
    CONSTRAINT fk_schedule_occurrences_entry FOREIGN KEY (timetable_entry_id) REFERENCES timetable_entries (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_schedule_occurrences_professor FOREIGN KEY (professor_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_schedule_occurrences_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_schedule_occurrences_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 9: notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('BOOKING', 'CANCELLATION', 'RESCHEDULE', 'SYSTEM') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 10: audit_logs
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Indexes
-- =====================================================================
CREATE INDEX idx_rooms_complex_id ON rooms (complex_id);
CREATE INDEX idx_schedule_occurrences_room_date ON schedule_occurrences (room_id, schedule_date);
CREATE INDEX idx_schedule_occurrences_prof_date ON schedule_occurrences (professor_id, schedule_date);
CREATE INDEX idx_schedule_occurrences_date ON schedule_occurrences (schedule_date);
CREATE INDEX idx_timetable_entries_day_of_week ON timetable_entries (day_of_week);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read);
