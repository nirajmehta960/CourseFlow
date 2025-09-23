package com.courseflow.common.error;

import lombok.Getter;

/**
 * Custom exception for API errors.
 * Used to throw application-specific exceptions that will be handled by GlobalExceptionHandler.
 */
@Getter
public class ApiException extends RuntimeException {
    
    private final String code;
    private final int statusCode;
    
    public ApiException(String code, String message) {
        super(message);
        this.code = code;
        this.statusCode = 400; // Default to Bad Request
    }
    
    public ApiException(String code, String message, int statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
    
    public ApiException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.statusCode = 400;
    }
}

