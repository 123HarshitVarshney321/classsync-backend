package com.classsync.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Temporary verification controller to test role-based authorization rules.
 */
@RestController
@RequestMapping("/api/test")
public class SecurityTestController {

    @GetMapping("/authenticated")
    public ResponseEntity<?> authenticated(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Authenticated access granted",
                "username", authentication.getName()
        ));
    }

    @GetMapping("/professor")
    public ResponseEntity<?> professor(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Professor access granted",
                "username", authentication.getName()
        ));
    }

    @GetMapping("/admin")
    public ResponseEntity<?> admin(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Admin access granted",
                "username", authentication.getName()
        ));
    }
}
