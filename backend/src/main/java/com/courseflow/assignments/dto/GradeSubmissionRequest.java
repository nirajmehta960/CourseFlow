package com.courseflow.assignments.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for grading a submission.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeSubmissionRequest {
    
    /**
     * Points awarded (out of assignment points).
     */
    @PositiveOrZero(message = "Points awarded must be non-negative")
    private Double pointsAwarded;
    
    /**
     * Feedback from the grader.
     */
    private String feedback;
}


