package com.courseflow.enrollments.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Enrollment entity representing a user's enrollment in a course.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "enrollments")
@CompoundIndex(name = "course_user_idx", def = "{'courseId': 1, 'userId': 1}", unique = true)
public class Enrollment {
    
    @Id
    private String id;
    
    private String courseId;
    
    @Indexed
    private String userId;
    
    /**
     * Role of the user in this specific course.
     */
    @Builder.Default
    private CourseRole courseRole = CourseRole.STUDENT;
    
    /**
     * Status of the enrollment.
     */
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;
    
    @CreatedDate
    private Instant createdAt;
    
    /**
     * Course roles for enrollment.
     */
    public enum CourseRole {
        STUDENT,
        TA,
        INSTRUCTOR
    }
    
    /**
     * Enrollment status.
     */
    public enum EnrollmentStatus {
        ACTIVE,
        DROPPED
    }
}

