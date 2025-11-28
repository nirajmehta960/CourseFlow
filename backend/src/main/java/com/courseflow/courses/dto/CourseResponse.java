package com.courseflow.courses.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for course endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    
    private String id;
    private String title;
    private String code;
    private String term;
    private String section;
    private String description;
    private String coverImageUrl;
    private CourseStatus status;
    private String createdBy;
    private List<String> instructorIds;
    private Boolean published; // Deprecated: use status instead
    private Instant createdAt;
    private Instant updatedAt;
    
    /**
     * Course status enum
     */
    public enum CourseStatus {
        DRAFT,
        PUBLISHED
    }
}

