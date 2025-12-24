package com.courseflow.grades.controller;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.error.ApiException;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.grades.dto.GradebookResponse;
import com.courseflow.grades.service.GradebookService;
import com.courseflow.users.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for grade endpoints.
 */
@RestController
@RequestMapping("/courses/{courseId}/grades")
@RequiredArgsConstructor
@Tag(name = "Grades", description = "Gradebook management endpoints")
public class GradeController {
    
    private final GradebookService gradebookService;
    private final AuthService authService;
    private final EnrollmentService enrollmentService;
    
    @GetMapping("/me")
    @Operation(summary = "Get my gradebook", description = "Get gradebook for the current student in a course.")
    public ResponseEntity<ApiResponse<GradebookResponse>> getMyGradebook(
            @PathVariable String courseId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        GradebookResponse gradebook = gradebookService.getStudentGradebook(courseId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(gradebook));
    }
    
    @GetMapping
    @Operation(summary = "Get all gradebooks", description = "Get all gradebooks for a course. Only instructors and admins can view all gradebooks.")
    public ResponseEntity<ApiResponse<List<GradebookResponse>>> getAllGradebooks(
            @PathVariable String courseId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can view all gradebooks", 403);
        }
        
        List<GradebookResponse> gradebooks = gradebookService.getAllGradebooks(courseId);
        return ResponseEntity.ok(ApiResponse.success(gradebooks));
    }
    
    @GetMapping("/{studentId}")
    @Operation(summary = "Get student gradebook", description = "Get gradebook for a specific student in a course. Only instructors and admins can view individual student gradebooks.")
    public ResponseEntity<ApiResponse<GradebookResponse>> getStudentGradebook(
            @PathVariable String courseId,
            @PathVariable String studentId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can view student gradebooks", 403);
        }
        
        // Verify target student is enrolled
        enrollmentService.verifyEnrollment(courseId, studentId);
        
        GradebookResponse gradebook = gradebookService.getStudentGradebook(courseId, studentId);
        return ResponseEntity.ok(ApiResponse.success(gradebook));
    }
}


