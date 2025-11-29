package com.courseflow.grades.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for overriding a grade.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeOverrideRequest {
    
    @NotNull(message = "Course ID is required")
    private String courseId;
    
    @NotNull(message = "Student ID is required")
    private String studentId;
    
    @NotNull(message = "Item ID is required")
    private String itemId;
    
    @NotNull(message = "Item type is required")
    private String itemType; // "ASSIGNMENT" or "QUIZ"
    
    /**
     * Override score (null to remove override).
     */
    private Double overrideScore;
}
