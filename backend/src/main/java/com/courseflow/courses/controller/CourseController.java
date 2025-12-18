package com.courseflow.courses.controller;

import com.courseflow.courses.dto.CoursePeopleResponse;
import com.courseflow.courses.dto.CourseRequest;
import com.courseflow.courses.dto.CourseResponse;
import com.courseflow.courses.dto.EnrollStudentRequest;
import com.courseflow.courses.service.CourseService;
import com.courseflow.common.dto.ApiResponse;
import com.courseflow.enrollments.model.Enrollment;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for course endpoints.
 */
@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Course management endpoints")
public class CourseController {
    
    private final CourseService courseService;
    
    @GetMapping
    @Operation(summary = "Get my courses", description = "Get all courses where the current user is enrolled")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getMyCourses() {
        List<CourseResponse> courses = courseService.getMyCourses();
        return ResponseEntity.ok(ApiResponse.success(courses));
    }
    
    @PostMapping
    @Operation(summary = "Create a course", description = "Create a new course. Only instructors and admins can create courses.")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseRequest request) {
        CourseResponse course = courseService.createCourse(request);
        return ResponseEntity.ok(ApiResponse.success(course, "Course created successfully"));
    }
    
    @GetMapping("/{courseId}")
    @Operation(summary = "Get course by ID", description = "Get course details. User must be enrolled in the course.")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(
            @PathVariable String courseId) {
        CourseResponse course = courseService.getCourseById(courseId);
        return ResponseEntity.ok(ApiResponse.success(course));
    }
    
    @PatchMapping("/{courseId}")
    @Operation(summary = "Update a course", description = "Update course details. Only instructors and admins can update courses.")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable String courseId,
            @Valid @RequestBody CourseRequest request) {
        CourseResponse course = courseService.updateCourse(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(course, "Course updated successfully"));
    }
    
    @GetMapping("/{courseId}/people")
    @Operation(summary = "Get course people", description = "Get all enrolled users for a course. User must be enrolled in the course.")
    public ResponseEntity<ApiResponse<CoursePeopleResponse>> getCoursePeople(
            @PathVariable String courseId) {
        CoursePeopleResponse people = courseService.getCoursePeople(courseId);
        return ResponseEntity.ok(ApiResponse.success(people));
    }
    
    @PostMapping("/{courseId}/enroll")
    @Operation(summary = "Enroll a student", description = "Enroll a student in a course. Only instructors and admins can enroll students.")
    public ResponseEntity<ApiResponse<Enrollment>> enrollStudent(
            @PathVariable String courseId,
            @Valid @RequestBody EnrollStudentRequest request) {
        Enrollment enrollment = courseService.enrollStudent(courseId, request.getUserId());
        return ResponseEntity.ok(ApiResponse.success(enrollment, "Student enrolled successfully"));
    }
}

