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
    
    @NotNull(message = "Score is required")
    @PositiveOrZero(message = "Score must be non-negative")
    private Double score;
    
    private String feedback;
}


