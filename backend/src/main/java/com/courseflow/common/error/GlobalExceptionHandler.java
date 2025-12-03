package com.courseflow.common.error;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.mongodb.MongoException;
import com.mongodb.MongoSecurityException;
import org.springframework.dao.DataAccessException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler for all controllers.
 * Standardizes error responses across the application.
 * Returns errors in format: { timestamp, path, code, message, details[] }
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        /**
         * Get the request path from HttpServletRequest
         */
        private String getRequestPath(HttpServletRequest request) {
                if (request != null) {
                        return request.getRequestURI();
                }
                return "/unknown";
        }

        /**
         * Build standardized error response
         */
        private ErrorResponse buildErrorResponse(String path, String code, String message, List<String> details) {
                return ErrorResponse.builder()
                                .timestamp(Instant.now())
                                .path(path)
                                .code(code)
                                .message(message)
                                .details(details != null ? details : new ArrayList<>())
                                .build();
        }

        /**
         * Handle custom ApiException
         */
        @ExceptionHandler(ApiException.class)
        public ResponseEntity<ErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
                log.error("ApiException: {}", ex.getMessage(), ex);
                ErrorResponse errorResponse = buildErrorResponse(
                                getRequestPath(request),
                                ex.getCode(),
                                ex.getMessage(),
                                null);
                return ResponseEntity
                                .status(ex.getStatusCode())
                                .body(errorResponse);
        }

        /**
         * Handle validation errors
         */
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidationException(
                        MethodArgumentNotValidException ex, HttpServletRequest request) {
                log.error("Validation error: {}", ex.getMessage());

                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach(error -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        errors.put(fieldName, errorMessage);
                });

                List<String> details = errors.entrySet().stream()
                                .map(entry -> entry.getKey() + ": " + entry.getValue())
                                .collect(Collectors.toList());

                ErrorResponse errorResponse = buildErrorResponse(
                                getRequestPath(request),
                                "VALIDATION_ERROR",
                                "Validation failed",
                                details);

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(errorResponse);
        }

        /**
         * Handle method argument type mismatch
         */
        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(
                        MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
                log.error("Type mismatch error: {}", ex.getMessage());
                String message = String.format("Invalid value '%s' for parameter '%s'",
                                ex.getValue(), ex.getName());
                ErrorResponse errorResponse = buildErrorResponse(
                                getRequestPath(request),
                                "INVALID_PARAMETER",
                                message,
                                null);
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(errorResponse);
        }

        /**
         * Handle 404 Not Found
         */
        @ExceptionHandler(NoHandlerFoundException.class)
        public ResponseEntity<ErrorResponse> handleNoHandlerFoundException(
                        NoHandlerFoundException ex, HttpServletRequest request) {
                log.error("Not found: {}", ex.getRequestURL());
                ErrorResponse errorResponse = buildErrorResponse(
                                getRequestPath(request),
                                "NOT_FOUND",
                                "Resource not found",
                                null);
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(errorResponse);
        }

        /**
         * Handle authentication errors
         */
        @ExceptionHandler({ AuthenticationException.class, BadCredentialsException.class })
        public ResponseEntity<ErrorResponse> handleAuthenticationException(
                        AuthenticationException ex, HttpServletRequest request) {
                log.error("Authentication error: {}", ex.getMessage());
                ErrorResponse errorResponse = buildErrorResponse(
                                getRequestPath(request),
                                "UNAUTHORIZED",
                                "Authentication failed",
                                null);
                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(errorResponse);
        }

        /**
         * Handle access denied errors
         */
        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleAccessDeniedException(
                        AccessDeniedException ex, HttpServletRequest request) {
                log.error("Access denied: {}", ex.getMessage());
                ErrorResponse errorResponse = buildErrorResponse(
                                getRequestPath(request),
                                "FORBIDDEN",
                                "Access denied",
                                null);
                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(errorResponse);
        }

        /**
         * Handle resource not found (IllegalArgumentException with specific message
         * pattern)
         */
        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
                        IllegalArgumentException ex, HttpServletRequest request) {
                log.error("Illegal argument: {}", ex.getMessage());

                // Check if it's a "not found" scenario
                if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("not found")) {
                        ErrorResponse errorResponse = buildErrorResponse(
                                        getRequestPath(request),
                                        "RESOURCE_NOT_FOUND",
                                        ex.getMessage(),
                                        null);
                        return ResponseEntity
                                        .status(HttpStatus.NOT_FOUND)
                                        .body(errorResponse);
                }

                ErrorResponse errorResponse = buildErrorResponse(
                                getRequestPath(request),
                                "INVALID_ARGUMENT",
                                ex.getMessage() != null ? ex.getMessage() : "Invalid argument",
                                null);
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(errorResponse);
        }

        /**
         * Handle MongoDB connection and authentication errors
         */
        @ExceptionHandler({ MongoSecurityException.class, MongoException.class, DataAccessException.class })
        public ResponseEntity<ErrorResponse> handleMongoException(
                        Exception ex, HttpServletRequest request) {
                log.error("MongoDB error: {}", ex.getMessage(), ex);
                ErrorResponse errorResponse = buildErrorResponse(
                                getRequestPath(request),
                                "DATABASE_ERROR",
                                "Database connection error",
                                null);
                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(errorResponse);
        }

        /**
         * Handle all other exceptions
         */
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGenericException(
                        Exception ex, HttpServletRequest request) {
                log.error("Unexpected error: {}", ex.getMessage(), ex);

                // Check if it's a MongoDB-related error that wasn't caught above
                String errorMessage = ex.getMessage();
                if (errorMessage != null && errorMessage.contains("MongoCredential")) {
                        return handleMongoException(ex, request);
                }

                ErrorResponse errorResponse = buildErrorResponse(
                                getRequestPath(request),
                                "INTERNAL_ERROR",
                                "An unexpected error occurred. Please try again.",
                                null);
                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(errorResponse);
        }
}
