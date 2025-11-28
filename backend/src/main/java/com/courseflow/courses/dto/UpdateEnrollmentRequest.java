package com.courseflow.courses.dto;

import com.courseflow.enrollments.model.Enrollment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating an enrollment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEnrollmentRequest {
    
    private Enrollment.CourseRole role;
    
    private Enrollment.EnrollmentStatus status;
}
