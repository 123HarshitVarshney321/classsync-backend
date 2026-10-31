package com.classsync.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("PessimisticLockingFailureException maps to 409 Conflict with retry message")
    void pessimisticLockingFailureMapsTo409() {
        CannotAcquireLockException ex = new CannotAcquireLockException("Lock wait timeout exceeded");
        ResponseEntity<Map<String, Object>> response = handler.handlePessimisticLockingFailure(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(409, response.getBody().get("status"));
        assertEquals("Conflict", response.getBody().get("error"));
        assertEquals("The requested resource is locked by a concurrent operation. Please retry.", response.getBody().get("message"));
    }
}
