package com.courseflow.courses.service;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.courses.dto.CoursePeopleResponse;
import com.courseflow.courses.dto.CourseRequest;
import com.courseflow.courses.dto.CourseResponse;
import com.courseflow.courses.model.Course;
import com.courseflow.courses.repository.CourseRepository;
import com.courseflow.enrollments.model.Enrollment;
import com.courseflow.enrollments.repository.EnrollmentRepository;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.users.model.User;
import com.courseflow.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for handling course operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {
    
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;
    private final UserRepository userRepository;
    private final AuthService authService;
    
    /**
     * Create a new course and automatically enroll the creator as instructor.
     * 
     * @param request Course creation request
     * @return Created course response
     */
    public CourseResponse createCourse(CourseRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Check if user has permission (INSTRUCTOR or ADMIN)
        if (!currentUser.hasRole(User.UserRole.INSTRUCTOR) && 
            !currentUser.hasRole(User.UserRole.ADMIN)) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can create courses", 403);
        }
        
        // Check for duplicate course (code, term, section combination)
        if (courseRepository.existsByCodeAndTermAndSection(
                request.getCode(), request.getTerm(), request.getSection())) {
            throw new ApiException("COURSE_ALREADY_EXISTS", 
                    "A course with this code, term, and section already exists", 409);
        }
        
        // Determine status - use status field if provided, otherwise use published field for backward compatibility
        Course.CourseStatus courseStatus = Course.CourseStatus.DRAFT;
        if (request.getStatus() != null) {
            courseStatus = Course.CourseStatus.valueOf(request.getStatus().name());
        } else if (request.getPublished() != null && request.getPublished()) {
            courseStatus = Course.CourseStatus.PUBLISHED;
        }
        
        // Create course
        Course course = Course.builder()
                .id(UUID.randomUUID().toString())
                .title(request.getTitle())
                .code(request.getCode())
                .term(request.getTerm())
                .section(request.getSection())
                .description(request.getDescription())
                .coverImageUrl(request.getCoverImageUrl())
                .status(courseStatus)
                .createdBy(currentUser.getId())
                .published(courseStatus == Course.CourseStatus.PUBLISHED) // Keep for backward compatibility
                .instructorIds(new ArrayList<>())
                .build();
        
        // Add creator as instructor
        course.getInstructorIds().add(currentUser.getId());
        
        course = courseRepository.save(course);
        log.info("Course created: {} by user {}", course.getId(), currentUser.getId());
        
        // Auto-enroll creator as instructor
        enrollmentService.enrollUser(
                course.getId(), 
                currentUser.getId(), 
                Enrollment.CourseRole.INSTRUCTOR
        );
        
        return mapToResponse(course);
    }
    
    /**
     * Get all published courses (for browsing by all users).
     * 
     * @return List of all published courses
     */
    public List<CourseResponse> getAllPublishedCourses() {
        List<Course> courses = courseRepository.findByPublishedTrue();
        return courses.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all courses where the current user is enrolled.
     * 
     * @return List of courses the user is enrolled in
     */
    public List<CourseResponse> getMyCourses() {
        User currentUser = authService.getCurrentUser();
        
        // Get all enrollments for the user
        List<Enrollment> enrollments = enrollmentService.getUserEnrollments(currentUser.getId());
        
        // Get course IDs from enrollments
        List<String> courseIds = enrollments.stream()
                .map(Enrollment::getCourseId)
                .collect(Collectors.toList());
        
        // Fetch courses
        List<Course> courses = courseRepository.findAllById(courseIds);
        
        return courses.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get course by ID. Verifies user is enrolled.
     * 
     * @param courseId Course ID
     * @return Course response
     */
    public CourseResponse getCourseById(String courseId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found", 404));
        
        return mapToResponse(course);
    }
    
    /**
     * Update a course. Only instructors/admins can update.
     * 
     * @param courseId Course ID
     * @param request Course update request
     * @return Updated course response
     */
    public CourseResponse updateCourse(String courseId, CourseRequest request) {
        User currentUser = authService.getCurrentUser();
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found", 404));
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can update courses", 403);
        }
        
        // Check for duplicate if code/term/section is being changed
        if (!course.getCode().equals(request.getCode()) || 
            !course.getTerm().equals(request.getTerm()) || 
            !course.getSection().equals(request.getSection())) {
            if (courseRepository.existsByCodeAndTermAndSection(
                    request.getCode(), request.getTerm(), request.getSection())) {
                throw new ApiException("COURSE_ALREADY_EXISTS", 
                        "A course with this code, term, and section already exists", 409);
            }
        }
        
        // Update course fields
        course.setTitle(request.getTitle());
        course.setCode(request.getCode());
        course.setTerm(request.getTerm());
        course.setSection(request.getSection());
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }
        if (request.getCoverImageUrl() != null) {
            course.setCoverImageUrl(request.getCoverImageUrl());
        }
        if (request.getStatus() != null) {
            course.setStatus(Course.CourseStatus.valueOf(request.getStatus().name()));
            course.setPublished(course.getStatus() == Course.CourseStatus.PUBLISHED); // Keep for backward compatibility
        } else if (request.getPublished() != null) {
            course.setPublished(request.getPublished());
            course.setStatus(request.getPublished() ? Course.CourseStatus.PUBLISHED : Course.CourseStatus.DRAFT);
        }
        
        course = courseRepository.save(course);
        log.info("Course updated: {} by user {}", courseId, currentUser.getId());
        
        return mapToResponse(course);
    }
    
    /**
     * Get all enrolled users for a course.
     * 
     * @param courseId Course ID
     * @return Course people response with user information
     */
    public CoursePeopleResponse getCoursePeople(String courseId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Get all enrollments for the course
        List<Enrollment> enrollments = enrollmentService.getCourseEnrollments(courseId);
        
        // Map enrollments to person info with user details
        List<CoursePeopleResponse.PersonInfo> people = enrollments.stream()
                .map(enrollment -> {
                    User user = userRepository.findById(enrollment.getUserId())
                            .orElse(null);
                    
                    if (user == null) {
                        return null;
                    }
                    
                    return CoursePeopleResponse.PersonInfo.builder()
                            .enrollmentId(enrollment.getId())
                            .userId(user.getId())
                            .name(user.getName())
                            .email(user.getEmail())
                            .courseRole(enrollment.getCourseRole())
                            .status(enrollment.getStatus())
                            .build();
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
        
        return CoursePeopleResponse.builder()
                .people(people)
                .build();
    }
    
    /**
     * Enroll a student in a course. Only instructors/admins can enroll students.
     * 
     * @param courseId Course ID
     * @param userId User ID to enroll
     * @return Enrollment information
     */
    public Enrollment enrollStudent(String courseId, String userId) {
        User currentUser = authService.getCurrentUser();
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can enroll students", 403);
        }
        
        // Enroll the student
        return enrollmentService.enrollUser(courseId, userId, Enrollment.CourseRole.STUDENT);
    }
    
    /**
     * Self-enroll the current user in a course (for students).
     * 
     * @param courseId Course ID
     * @return Enrollment information
     */
    public Enrollment selfEnroll(String courseId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify course exists and is published
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found", 404));
        
        if (!course.getPublished()) {
            throw new ApiException("COURSE_NOT_PUBLISHED", 
                    "Course is not published and cannot be enrolled in", 403);
        }
        
        // Check if already enrolled
        if (enrollmentService.checkEnrollment(courseId, currentUser.getId())) {
            throw new ApiException("ALREADY_ENROLLED", 
                    "You are already enrolled in this course", 409);
        }
        
        // Enroll the user as a student
        return enrollmentService.enrollUser(courseId, currentUser.getId(), Enrollment.CourseRole.STUDENT);
    }
    
    /**
     * Enroll a user by email. Creates invitation if user doesn't exist.
     * Only instructors/admins can enroll users.
     * 
     * @param courseId Course ID
     * @param email User email
     * @param role Course role for the enrollment
     * @return Enrollment information
     */
    public Enrollment enrollByEmail(String courseId, String email, Enrollment.CourseRole role) {
        User currentUser = authService.getCurrentUser();
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can enroll users", 403);
        }
        
        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", 
                        "User with email " + email + " not found. User must sign up first.", 404));
        
        // Check if enrollment already exists
        if (enrollmentService.checkEnrollment(courseId, user.getId())) {
            throw new ApiException("ENROLLMENT_ALREADY_EXISTS", 
                    "User is already enrolled in this course", 409);
        }
        
        // Enroll the user
        return enrollmentService.enrollUser(courseId, user.getId(), role != null ? role : Enrollment.CourseRole.STUDENT);
    }
    
    /**
     * Update an enrollment (change role or remove).
     * Only instructors/admins can update enrollments.
     * 
     * @param courseId Course ID
     * @param enrollmentId Enrollment ID
     * @param request Update request
     * @return Updated enrollment
     */
    public Enrollment updateEnrollment(String courseId, String enrollmentId, 
                                       com.courseflow.courses.dto.UpdateEnrollmentRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can update enrollments", 403);
        }
        
        // Find enrollment
        Enrollment enrollment = enrollmentService.getCourseEnrollments(courseId).stream()
                .filter(e -> e.getId().equals(enrollmentId))
                .findFirst()
                .orElseThrow(() -> new ApiException("ENROLLMENT_NOT_FOUND", "Enrollment not found", 404));
        
        // Update role if provided
        if (request.getRole() != null) {
            enrollment.setCourseRole(request.getRole());
        }
        
        // Update status if provided
        if (request.getStatus() != null) {
            enrollment.setStatus(request.getStatus());
        }
        
        // Save updated enrollment
        return enrollmentService.updateEnrollment(enrollment);
    }
    
    /**
     * Delete a course. Only admin or course owner can delete.
     * 
     * @param courseId Course ID
     */
    public void deleteCourse(String courseId) {
        User currentUser = authService.getCurrentUser();
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found", 404));
        
        // Check permission: must be admin or course owner (createdBy)
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        boolean isOwner = course.getCreatedBy() != null && course.getCreatedBy().equals(currentUser.getId());
        
        if (!isAdmin && !isOwner) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only admins or course owners can delete courses", 403);
        }
        
        courseRepository.delete(course);
        log.info("Course deleted: {} by user {}", courseId, currentUser.getId());
    }
    
    /**
     * Map Course entity to CourseResponse DTO.
     */
    private CourseResponse mapToResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .code(course.getCode())
                .term(course.getTerm())
                .section(course.getSection())
                .description(course.getDescription())
                .coverImageUrl(course.getCoverImageUrl())
                .status(course.getStatus() != null ? 
                        CourseResponse.CourseStatus.valueOf(course.getStatus().name()) : 
                        CourseResponse.CourseStatus.DRAFT)
                .createdBy(course.getCreatedBy())
                .instructorIds(course.getInstructorIds())
                .published(course.getPublished())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}

