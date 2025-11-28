package com.courseflow.courses.dto;

import com.courseflow.enrollments.model.Enrollment;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for enrolling a user by email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollByEmailRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    private Enrollment.CourseRole role;
}
