package com.classsync.concurrency;

import com.classsync.dto.booking.CreateBookingRequest;
import com.classsync.dto.occurrence.GenerateOccurrencesRequest;
import com.classsync.dto.occurrence.GenerateOccurrencesResponse;
import com.classsync.dto.occurrence.GenerationConflictType;
import com.classsync.entity.*;
import com.classsync.exception.DuplicateResourceException;
import com.classsync.repository.*;
import com.classsync.service.BookingService;
import com.classsync.service.ScheduleOccurrenceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.PessimisticLockingFailureException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class GenerationConcurrencyIntegrationTests {

    @Autowired
    private TimetableVersionRepository timetableVersionRepository;

    @Autowired
    private TimetableEntryRepository timetableEntryRepository;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ScheduleOccurrenceService scheduleOccurrenceService;

    @Autowired
    private BookingService bookingService;

    @Test
    @DisplayName("N18. Concurrent generation and booking for the same room never produce overlapping scheduled rows")
    void concurrentGenerationAndBookingNeverProduceOverlappingScheduledRows() throws Exception {
        User admin = userRepository.findById(1).orElseThrow();
        User turing = userRepository.findById(2).orElseThrow();
        User lovelace = userRepository.findById(3).orElseThrow();
        Room room = roomRepository.findById(1).orElseThrow();

        // Repeat 10 times with cleanup between iterations
        for (int i = 0; i < 10; i++) {
            String academicYear = "2026-" + UUID.randomUUID().toString().substring(0, 5);
            TimetableVersion version = timetableVersionRepository.save(
                    new TimetableVersion(academicYear, "1", 1, TimetableVersionStatus.ACTIVE, admin)
            );

            // Monday entry for Turing in Room 1: 09:00 - 10:00
            TimetableEntry entry = timetableEntryRepository.save(
                    new TimetableEntry(version, turing, "CS101", "Intro CS", room, (byte) 1, LocalTime.of(9, 0), LocalTime.of(10, 0))
            );

            // Date: 2026-11-02 (Monday)
            LocalDate testDate = LocalDate.of(2026, 11, 2);

            GenerateOccurrencesRequest genReq = new GenerateOccurrencesRequest(version.getId(), testDate, testDate);
            CreateBookingRequest bookReq = new CreateBookingRequest(
                    room.getId(), testDate, LocalTime.of(9, 0), LocalTime.of(10, 0), "EXTRA-CS", "Ada Seminar"
            );

            ExecutorService executor = Executors.newFixedThreadPool(2);
            CyclicBarrier barrier = new CyclicBarrier(2);
            CountDownLatch latch = new CountDownLatch(2);

            AtomicReference<GenerateOccurrencesResponse> genResponse = new AtomicReference<>();
            AtomicReference<Exception> genException = new AtomicReference<>();
            AtomicBoolean bookingSucceeded = new AtomicBoolean(false);
            AtomicReference<Exception> bookingException = new AtomicReference<>();

            try {
                executor.submit(() -> {
                    try {
                        barrier.await();
                        GenerateOccurrencesResponse res = scheduleOccurrenceService.generateOccurrences(genReq, admin.getEmail());
                        genResponse.set(res);
                    } catch (Exception e) {
                        genException.set(e);
                    } finally {
                        latch.countDown();
                    }
                });

                executor.submit(() -> {
                    try {
                        barrier.await();
                        bookingService.createExtraClass(bookReq, lovelace.getEmail());
                        bookingSucceeded.set(true);
                    } catch (Exception e) {
                        bookingException.set(e);
                    } finally {
                        latch.countDown();
                    }
                });

                boolean done = latch.await(10, TimeUnit.SECONDS);
                assertTrue(done, "Iteration " + i + " timed out");

                // Invariant: There are NEVER two overlapping SCHEDULED rows in that room
                List<ScheduleOccurrence> scheduledRows = scheduleOccurrenceRepository.findWithFilters(
                        testDate, testDate, null, room.getId(), null, ScheduleStatus.SCHEDULED
                );

                assertTrue(scheduledRows.size() <= 1,
                        "Iteration " + i + " failed: found " + scheduledRows.size() + " overlapping SCHEDULED rows!");

                if (scheduledRows.size() == 1) {
                    ScheduleOccurrence occ = scheduledRows.get(0);
                    if (occ.getEventType() == ScheduleEventType.OFFICIAL) {
                        // Generation won: booking should have failed with DuplicateResourceException or PessimisticLockingFailureException
                        assertTrue(bookingException.get() instanceof DuplicateResourceException
                                        || bookingException.get() instanceof PessimisticLockingFailureException,
                                "When generation wins, booking must fail with conflict");
                    } else {
                        // Booking won: generation should report ROOM_BUSY conflict or have failed with lock failure
                        if (genResponse.get() != null) {
                            assertEquals(1, genResponse.get().conflictCount(), "Generation should report ROOM_BUSY conflict");
                            assertEquals(GenerationConflictType.ROOM_BUSY, genResponse.get().conflicts().get(0).type());
                        } else {
                            assertTrue(genException.get() instanceof PessimisticLockingFailureException);
                        }
                    }
                }
            } finally {
                executor.shutdown();
                scheduleOccurrenceRepository.deleteAll();
                timetableEntryRepository.delete(entry);
                timetableVersionRepository.delete(version);
            }
        }
    }
}
