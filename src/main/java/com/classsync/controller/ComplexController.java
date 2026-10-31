package com.classsync.controller;

import com.classsync.dto.common.StatusUpdateRequest;
import com.classsync.dto.complex.ComplexRequest;
import com.classsync.dto.complex.ComplexResponse;
import com.classsync.service.ComplexService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complexes")
public class ComplexController {

    private final ComplexService complexService;

    public ComplexController(ComplexService complexService) {
        this.complexService = complexService;
    }

    @GetMapping
    public ResponseEntity<List<ComplexResponse>> getComplexes(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        checkAdminIfIncludeInactive(includeInactive);
        return ResponseEntity.ok(complexService.getComplexes(includeInactive));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplexResponse> getActiveComplexById(@PathVariable Integer id) {
        return ResponseEntity.ok(complexService.getActiveComplexById(id));
    }

    @PostMapping
    public ResponseEntity<ComplexResponse> createComplex(@Valid @RequestBody ComplexRequest request) {
        ComplexResponse response = complexService.createComplex(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComplexResponse> updateComplex(@PathVariable Integer id,
                                                         @Valid @RequestBody ComplexRequest request) {
        return ResponseEntity.ok(complexService.updateComplex(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplexResponse> updateComplexStatus(@PathVariable Integer id,
                                                               @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(complexService.updateComplexStatus(id, request));
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
