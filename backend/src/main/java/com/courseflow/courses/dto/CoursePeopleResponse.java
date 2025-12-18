package com.courseflow.courses.dto;

import com.courseflow.enrollments.model.Enrollment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for course people endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoursePeopleResponse {
    
    private List<PersonInfo> people;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonInfo {
        private String userId;
        private String name;
        private String email;
        private Enrollment.CourseRole courseRole;
        private Enrollment.EnrollmentStatus status;
    }
}

