package org.laioffer.planner.config;

import org.laioffer.planner.user.authentication.UserAlreadyExistException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler({UserAlreadyExistException.class, DataIntegrityViolationException.class})
    public ResponseEntity<?> conflict(Exception error) {
        return ResponseEntity.status(409).body(Map.of("message", "This email or username is already registered."));
    }
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> credentials() {
        return ResponseEntity.status(401).body(Map.of("message", "Email or password is incorrect."));
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> invalid(IllegalArgumentException error) {
        return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
    }
}
