package com.courseflow.enrollments.service;

import com.courseflow.common.error.ApiException;
import com.courseflow.courses.repository.CourseRepository;
import com.courseflow.enrollments.model.Enrollment;
import com.courseflow.enrollments.repository.EnrollmentRepository;
import com.courseflow.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for handling enrollment operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentService {
    
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    
    /**
     * Enroll a user in a course.
     * 
     * @param courseId The course ID
     * @param userId The user ID
     * @param courseRole The role for this enrollment
     * @return Created enrollment
     */
    public Enrollment enrollUser(String courseId, String userId, Enrollment.CourseRole courseRole) {
        // Validate inputs
        if (courseId == null || courseId.isBlank()) {
            throw new ApiException("INVALID_COURSE_ID", "Course ID is required", 400);
        }
        if (userId == null || userId.isBlank()) {
            throw new ApiException("INVALID_USER_ID", "User ID is required", 400);
        }
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }
        
        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new ApiException("USER_NOT_FOUND", "User not found", 404);
        }
        
        // Check if enrollment already exists
        if (enrollmentRepository.existsByCourseIdAndUserId(courseId, userId)) {
            throw new ApiException("ENROLLMENT_ALREADY_EXISTS", 
                    "User is already enrolled in this course", 409);
        }
        
        try {
            Enrollment enrollment = Enrollment.builder()
                    .courseId(courseId)
                    .userId(userId)
                    .courseRole(courseRole != null ? courseRole : Enrollment.CourseRole.STUDENT)
                    .status(Enrollment.EnrollmentStatus.ACTIVE)
                    .build();
            
            enrollment = enrollmentRepository.save(enrollment);
            log.info("User {} enrolled in course {} with role {}", userId, courseId, courseRole);
            
            return enrollment;
        } catch (DuplicateKeyException e) {
            throw new ApiException("ENROLLMENT_ALREADY_EXISTS", 
                    "User is already enrolled in this course", 409);
        }
    }
    
    /**
     * Get all enrollments for a user.
     * 
     * @param userId The user ID
     * @return List of enrollments for the user
     */
    public List<Enrollment> getUserEnrollments(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ApiException("INVALID_USER_ID", "User ID is required", 400);
        }
        return enrollmentRepository.findByUserIdAndStatus(
                userId, 
                Enrollment.EnrollmentStatus.ACTIVE
        );
    }
    
    /**
     * Check if a user is enrolled in a course (active enrollment).
     * 
     * @param courseId The course ID
     * @param userId The user ID
     * @return true if user is enrolled, false otherwise
     */
    public boolean checkEnrollment(String courseId, String userId) {
        return enrollmentRepository.findByCourseIdAndUserId(courseId, userId)
                .map(enrollment -> enrollment.getStatus() == Enrollment.EnrollmentStatus.ACTIVE)
                .orElse(false);
    }
    
    /**
     * Verify that a user is enrolled in a course. Throws exception if not enrolled.
     * 
     * @param courseId The course ID
     * @param userId The user ID
     * @throws ApiException if user is not enrolled
     */
    public void verifyEnrollment(String courseId, String userId) {
        if (!checkEnrollment(courseId, userId)) {
            throw new ApiException("NOT_ENROLLED", 
                    "User is not enrolled in this course", 403);
        }
    }
    
    /**
     * Check if a user has instructor or TA role in a course.
     * 
     * @param courseId The course ID
     * @param userId The user ID
     * @return true if user is instructor or TA, false otherwise
     */
    public boolean checkInstructorRole(String courseId, String userId) {
        return enrollmentRepository.findByCourseIdAndUserId(courseId, userId)
                .map(enrollment -> {
                    Enrollment.CourseRole role = enrollment.getCourseRole();
                    return enrollment.getStatus() == Enrollment.EnrollmentStatus.ACTIVE &&
                           (role == Enrollment.CourseRole.INSTRUCTOR || role == Enrollment.CourseRole.TA);
                })
                .orElse(false);
    }
    
    /**
     * Verify that a user has instructor or TA role in a course. Throws exception if not.
     * 
     * @param courseId The course ID
     * @param userId The user ID
     * @throws ApiException if user is not an instructor or TA
     */
    public void verifyInstructorRole(String courseId, String userId) {
        if (!checkInstructorRole(courseId, userId)) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "User does not have instructor or TA role in this course", 403);
        }
    }
    
    /**
     * Get all enrollments for a course.
     * 
     * @param courseId The course ID
     * @return List of enrollments for the course
     */
    public List<Enrollment> getCourseEnrollments(String courseId) {
        return enrollmentRepository.findByCourseId(courseId);
    }
    
    /**
     * Get all enrollments for a course with a specific role.
     * 
     * @param courseId The course ID
     * @param courseRole The course role
     * @return List of enrollments with the specified role
     */
    public List<Enrollment> getCourseEnrollmentsByRole(String courseId, Enrollment.CourseRole courseRole) {
        return enrollmentRepository.findByCourseIdAndCourseRole(courseId, courseRole);
    }
}

