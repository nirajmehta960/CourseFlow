package com.courseflow.courses.service;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.courses.dto.CoursePeopleResponse;
import com.courseflow.courses.dto.CourseRequest;
import com.courseflow.courses.dto.CourseResponse;
import com.courseflow.courses.model.Course;
import com.courseflow.courses.repository.CourseRepository;
import com.courseflow.enrollments.model.Enrollment;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.users.model.User;
import com.courseflow.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
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
        if (currentUser.getRole() != User.UserRole.INSTRUCTOR && 
            currentUser.getRole() != User.UserRole.ADMIN) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can create courses", 403);
        }
        
        // Check for duplicate course (code, term, section combination)
        if (courseRepository.existsByCodeAndTermAndSection(
                request.getCode(), request.getTerm(), request.getSection())) {
            throw new ApiException("COURSE_ALREADY_EXISTS", 
                    "A course with this code, term, and section already exists", 409);
        }
        
        // Create course
        Course course = Course.builder()
                .title(request.getTitle())
                .code(request.getCode())
                .term(request.getTerm())
                .section(request.getSection())
                .published(request.getPublished() != null ? request.getPublished() : false)
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
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
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
        if (request.getPublished() != null) {
            course.setPublished(request.getPublished());
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
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can enroll students", 403);
        }
        
        // Enroll the student
        return enrollmentService.enrollUser(courseId, userId, Enrollment.CourseRole.STUDENT);
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
                .instructorIds(course.getInstructorIds())
                .published(course.getPublished())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}

