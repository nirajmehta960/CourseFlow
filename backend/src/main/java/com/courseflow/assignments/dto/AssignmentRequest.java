package com.courseflow.assignments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Request DTO for creating and updating assignments.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRequest {
    
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;
    
    private String description;
    
    private Instant dueDate;
    
    @NotNull(message = "Points is required")
    @PositiveOrZero(message = "Points must be non-negative")
    private Double points;
    
    private Boolean published;
}


