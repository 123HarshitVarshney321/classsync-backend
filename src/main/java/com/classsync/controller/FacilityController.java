package com.classsync.controller;

import com.classsync.dto.common.StatusUpdateRequest;
import com.classsync.dto.facility.FacilityRequest;
import com.classsync.dto.facility.FacilityResponse;
import com.classsync.service.FacilityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    public ResponseEntity<List<FacilityResponse>> getFacilities(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        checkAdminIfIncludeInactive(includeInactive);
        return ResponseEntity.ok(facilityService.getFacilities(includeInactive));
    }

    @PostMapping
    public ResponseEntity<FacilityResponse> createFacility(@Valid @RequestBody FacilityRequest request) {
        FacilityResponse response = facilityService.createFacility(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacilityResponse> updateFacility(@PathVariable Integer id,
                                                           @Valid @RequestBody FacilityRequest request) {
        return ResponseEntity.ok(facilityService.updateFacility(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<FacilityResponse> updateFacilityStatus(@PathVariable Integer id,
                                                                 @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(facilityService.updateFacilityStatus(id, request));
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
