package com.classsync.controller;

import com.classsync.dto.common.StatusUpdateRequest;
import com.classsync.dto.room.AvailableRoomResponse;
import com.classsync.dto.room.CreateRoomRequest;
import com.classsync.dto.room.RoomDetailResponse;
import com.classsync.dto.room.RoomSummaryResponse;
import com.classsync.dto.room.UpdateRoomRequest;
import com.classsync.entity.RoomType;
import com.classsync.service.AvailabilityService;
import com.classsync.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api")
public class RoomController {

    private final RoomService roomService;
    private final AvailabilityService availabilityService;

    public RoomController(RoomService roomService, AvailabilityService availabilityService) {
        this.roomService = roomService;
        this.availabilityService = availabilityService;
    }

    @GetMapping("/rooms/available")
    public ResponseEntity<List<AvailableRoomResponse>> getAvailableRooms(
            @RequestParam(required = false) Integer complexId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) RoomType roomType,
            @RequestParam(required = false) String facilities,
            Principal principal) {
        List<AvailableRoomResponse> response = availabilityService.getAvailableRooms(
                complexId, date, startTime, endTime, capacity, roomType, facilities, principal.getName()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/complexes/{complexId}/rooms")
    public ResponseEntity<List<RoomSummaryResponse>> getRoomsForComplex(
            @PathVariable Integer complexId,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        checkAdminIfIncludeInactive(includeInactive);
        return ResponseEntity.ok(roomService.getRoomsForComplex(complexId, includeInactive));
    }

    @PostMapping("/complexes/{complexId}/rooms")
    public ResponseEntity<RoomDetailResponse> createRoom(@PathVariable Integer complexId,
                                                         @Valid @RequestBody CreateRoomRequest request) {
        RoomDetailResponse response = roomService.createRoom(complexId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<RoomDetailResponse> getRoomById(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        checkAdminIfIncludeInactive(includeInactive);
        return ResponseEntity.ok(roomService.getRoomById(id, includeInactive));
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<RoomDetailResponse> updateRoom(@PathVariable Integer id,
                                                         @Valid @RequestBody UpdateRoomRequest request) {
        return ResponseEntity.ok(roomService.updateRoom(id, request));
    }

    @PatchMapping("/rooms/{id}/status")
    public ResponseEntity<RoomSummaryResponse> updateRoomStatus(@PathVariable Integer id,
                                                                @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(roomService.updateRoomStatus(id, request));
    }

    private void checkAdminIfIncludeInactive(boolean includeInactive) {
        if (includeInactive) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getAuthorities().stream().noneMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
                throw new AccessDeniedException("Admin role required to view inactive entities");
            }
        }
    }
}
