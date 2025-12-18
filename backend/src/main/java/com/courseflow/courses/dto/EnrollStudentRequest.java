package com.courseflow.courses.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for enrolling a student in a course.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollStudentRequest {
    
    @NotBlank(message = "User ID is required")
    private String userId;
}

