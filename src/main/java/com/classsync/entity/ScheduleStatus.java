package com.classsync.entity;

/**
 * Status of a schedule occurrence.
 */
public enum ScheduleStatus {
    /**
     * The class takes place. This is the only status that blocks rooms and professors.
     */
    SCHEDULED,

    /**
     * Cancelled by a professor or admin.
     */
    CANCELLED,

    /**
     * This slot was vacated. A replacement row points back to it via rescheduled_from_id.
     */
    RESCHEDULED,

    /**
     * An official occurrence of a timetable version that a newer version replaced from effectiveFrom onward.
     */
    SUPERSEDED
}
