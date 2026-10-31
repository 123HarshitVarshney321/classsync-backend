-- Defensive: V1 declared status nullable; normalize before tightening.
UPDATE schedule_occurrences SET status = 'SCHEDULED' WHERE status IS NULL;

ALTER TABLE schedule_occurrences
  MODIFY COLUMN status ENUM('SCHEDULED','CANCELLED','RESCHEDULED','SUPERSEDED') NOT NULL DEFAULT 'SCHEDULED';

-- Lineage for non-destructive rescheduling. The application never deletes occurrences;
-- ON DELETE SET NULL only matters for maintenance/test cleanup of self-referencing rows.
ALTER TABLE schedule_occurrences ADD COLUMN rescheduled_from_id INT NULL AFTER timetable_entry_id;
CREATE INDEX idx_schedule_occurrences_rescheduled_from ON schedule_occurrences (rescheduled_from_id);
ALTER TABLE schedule_occurrences
  ADD CONSTRAINT fk_schedule_occurrences_rescheduled_from
  FOREIGN KEY (rescheduled_from_id) REFERENCES schedule_occurrences (id) ON DELETE SET NULL;
