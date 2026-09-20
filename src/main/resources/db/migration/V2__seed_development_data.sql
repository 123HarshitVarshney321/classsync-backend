-- =====================================================================
-- ClassSync Development Seed Data
-- Version: V2
-- Description: Minimal realistic dataset for development environments
-- Note: Passwords use a dev BCrypt hash for 'password123'
-- ($2a$10$7EqJtq98hPqEX7fNZaFWoOhiVjA7RMRp5e8VbZp0m5eLgLgQ16M3O)
-- =====================================================================

-- Users: 1 Admin, 2 Professors
INSERT INTO users (name, email, password_hash, role, employee_code, status) VALUES
('System Administrator', 'admin@classsync.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVjA7RMRp5e8VbZp0m5eLgLgQ16M3O', 'ADMIN', 'EMP-ADM-001', 'ACTIVE'),
('Dr. Alan Turing', 'aturing@classsync.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVjA7RMRp5e8VbZp0m5eLgLgQ16M3O', 'PROFESSOR', 'EMP-PRF-001', 'ACTIVE'),
('Dr. Ada Lovelace', 'alovelace@classsync.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVjA7RMRp5e8VbZp0m5eLgLgQ16M3O', 'PROFESSOR', 'EMP-PRF-002', 'ACTIVE');

-- Complexes: 2
INSERT INTO complexes (name, code, active) VALUES
('Science & Engineering Complex', 'SEC', TRUE),
('Humanities & Social Sciences Hall', 'HSS', TRUE);

-- Rooms: 5 across the 2 complexes
-- SEC rooms (complex_id = 1)
INSERT INTO rooms (complex_id, room_number, room_type, capacity, active) VALUES
(1, 'SEC-101', 'CLASSROOM', 40, TRUE),
(1, 'SEC-201', 'LAB', 30, TRUE),
(1, 'SEC-301', 'LECTURE_HALL', 120, TRUE);

-- HSS rooms (complex_id = 2)
INSERT INTO rooms (complex_id, room_number, room_type, capacity, active) VALUES
(2, 'HSS-101', 'CLASSROOM', 45, TRUE),
(2, 'HSS-201', 'SEMINAR_HALL', 60, TRUE);

-- Facilities: 5
INSERT INTO facilities (name) VALUES
('Projector'),
('Smart Board'),
('Air Conditioning'),
('Computers'),
('Audio System');

-- Room Facilities Mapping
-- SEC-101 (id=1): Projector (1), Air Conditioning (3)
INSERT INTO room_facilities (room_id, facility_id) VALUES
(1, 1),
(1, 3);

-- SEC-201 (id=2): Projector (1), Air Conditioning (3), Computers (4)
INSERT INTO room_facilities (room_id, facility_id) VALUES
(2, 1),
(2, 3),
(2, 4);

-- SEC-301 (id=3): Projector (1), Smart Board (2), Air Conditioning (3), Audio System (5)
INSERT INTO room_facilities (room_id, facility_id) VALUES
(3, 1),
(3, 2),
(3, 3),
(3, 5);

-- HSS-101 (id=4): Projector (1), Air Conditioning (3)
INSERT INTO room_facilities (room_id, facility_id) VALUES
(4, 1),
(4, 3);

-- HSS-201 (id=5): Smart Board (2), Air Conditioning (3), Audio System (5)
INSERT INTO room_facilities (room_id, facility_id) VALUES
(5, 2),
(5, 3),
(5, 5);
