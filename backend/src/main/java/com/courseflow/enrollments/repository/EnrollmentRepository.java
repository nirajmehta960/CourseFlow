package com.courseflow.enrollments.repository;

import com.courseflow.enrollments.model.Enrollment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Enrollment entity operations.
 */
@Repository
public interface EnrollmentRepository extends MongoRepository<Enrollment, String> {
    
    /**
     * Find all enrollments for a specific user.
     * 
     * @param userId The user ID
     * @return List of enrollments for the user
     */
    List<Enrollment> findByUserId(String userId);
    
    /**
     * Find all enrollments for a specific course.
     * 
     * @param courseId The course ID
     * @return List of enrollments for the course
     */
    List<Enrollment> findByCourseId(String courseId);
    
    /**
     * Find a specific enrollment by course and user.
     * 
     * @param courseId The course ID
     * @param userId The user ID
     * @return Optional enrollment if found
     */
    Optional<Enrollment> findByCourseIdAndUserId(String courseId, String userId);
    
    /**
     * Check if an enrollment exists for a course and user.
     * 
     * @param courseId The course ID
     * @param userId The user ID
     * @return true if enrollment exists, false otherwise
     */
    boolean existsByCourseIdAndUserId(String courseId, String userId);
    
    /**
     * Find all active enrollments for a specific user.
     * 
     * @param userId The user ID
     * @param status The enrollment status
     * @return List of active enrollments for the user
     */
    List<Enrollment> findByUserIdAndStatus(String userId, Enrollment.EnrollmentStatus status);
    
    /**
     * Find all enrollments for a course with a specific role.
     * 
     * @param courseId The course ID
     * @param courseRole The course role
     * @return List of enrollments with the specified role
     */
    List<Enrollment> findByCourseIdAndCourseRole(String courseId, Enrollment.CourseRole courseRole);
}

