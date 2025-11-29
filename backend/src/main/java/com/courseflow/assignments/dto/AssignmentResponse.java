package com.courseflow.assignments.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response DTO for assignment data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {
    
    private String id;
    private String courseId;
    private String title;
    /**
     * Rich text description as HTML.
     */
    private String description;
    private Double points;
    private Instant dueAt;
    private Instant availableFrom;
    private Instant availableUntil;
    private Boolean published;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}


