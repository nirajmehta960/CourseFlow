package com.courseflow.common.error;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Standardized error response format.
 * Format: { timestamp, path, code, message, details[] }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    
    private Instant timestamp;
    private String path;
    private String code;
    private String message;
    private List<String> details;
}
