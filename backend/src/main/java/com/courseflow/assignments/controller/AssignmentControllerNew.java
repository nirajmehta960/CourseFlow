package com.courseflow.assignments.controller;

import com.courseflow.assignments.dto.AssignmentRequest;
import com.courseflow.assignments.dto.AssignmentResponse;
import com.courseflow.assignments.dto.GradeSubmissionRequest;
import com.courseflow.assignments.dto.SubmissionRequest;
import com.courseflow.assignments.dto.SubmissionResponse;
import com.courseflow.assignments.service.AssignmentService;
import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.security.RequireInstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for assignment endpoints (Canvas-like structure).
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Assignments", description = "Assignment management endpoints")
public class AssignmentControllerNew {
    
    private final AssignmentService assignmentService;
    
    @GetMapping("/courses/{courseId}/assignments")
    @Operation(summary = "Get assignments", description = "Get all assignments for a course. User must be enrolled in the course.")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAssignments(
            @PathVariable String courseId) {
        List<AssignmentResponse> assignments = assignmentService.getAssignments(courseId);
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }
    
    @PostMapping("/courses/{courseId}/assignments")
    @RequireInstructor
    @Operation(summary = "Create assignment", description = "Create a new assignment. Only instructors and TAs can create assignments.")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @PathVariable String courseId,
            @Valid @RequestBody AssignmentRequest request) {
        AssignmentResponse assignment = assignmentService.createAssignment(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(assignment, "Assignment created successfully"));
    }
    
    @GetMapping("/assignments/{assignmentId}")
    @Operation(summary = "Get assignment by ID", description = "Get assignment details. User must be enrolled in the course.")
    public ResponseEntity<ApiResponse<AssignmentResponse>> getAssignment(
            @PathVariable String assignmentId) {
        // We need to get courseId from assignment, so we'll need to update the service method
        AssignmentResponse assignment = assignmentService.getAssignmentById(assignmentId);
        return ResponseEntity.ok(ApiResponse.success(assignment));
    }
    
    @PatchMapping("/assignments/{assignmentId}")
    @RequireInstructor
    @Operation(summary = "Update assignment", description = "Update assignment details. Only instructors and TAs can update assignments.")
    public ResponseEntity<ApiResponse<AssignmentResponse>> updateAssignment(
            @PathVariable String assignmentId,
            @Valid @RequestBody AssignmentRequest request) {
        AssignmentResponse assignment = assignmentService.updateAssignmentById(assignmentId, request);
        return ResponseEntity.ok(ApiResponse.success(assignment, "Assignment updated successfully"));
    }
    
    @PostMapping("/assignments/{assignmentId}/submit")
    @Operation(summary = "Submit assignment", description = "Submit an assignment. Students can submit their work.")
    public ResponseEntity<ApiResponse<SubmissionResponse>> submitAssignment(
            @PathVariable String assignmentId,
            @Valid @RequestBody SubmissionRequest request) {
        SubmissionResponse submission = assignmentService.submitAssignmentById(assignmentId, request);
        return ResponseEntity.ok(ApiResponse.success(submission, "Assignment submitted successfully"));
    }
    
    @GetMapping("/assignments/{assignmentId}/submissions")
    @RequireInstructor
    @Operation(summary = "Get submissions", description = "Get all submissions for an assignment. Only instructors and TAs can view all submissions.")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getSubmissions(
            @PathVariable String assignmentId) {
        List<SubmissionResponse> submissions = assignmentService.getSubmissionsById(assignmentId);
        return ResponseEntity.ok(ApiResponse.success(submissions));
    }
    
    @GetMapping("/assignments/{assignmentId}/my-submission")
    @Operation(summary = "Get my submission", description = "Get student's own submission for an assignment.")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getMySubmission(
            @PathVariable String assignmentId) {
        SubmissionResponse submission = assignmentService.getMySubmissionById(assignmentId);
        if (submission == null) {
            return ResponseEntity.ok(ApiResponse.success(null, "No submission found"));
        }
        return ResponseEntity.ok(ApiResponse.success(submission));
    }
    
    @PatchMapping("/submissions/{submissionId}/grade")
    @RequireInstructor
    @Operation(summary = "Grade submission", description = "Grade a submission. Only instructors and TAs can grade submissions.")
    public ResponseEntity<ApiResponse<SubmissionResponse>> gradeSubmission(
            @PathVariable String submissionId,
            @Valid @RequestBody GradeSubmissionRequest request) {
        SubmissionResponse submission = assignmentService.gradeSubmissionById(submissionId, request);
        return ResponseEntity.ok(ApiResponse.success(submission, "Submission graded successfully"));
    }
}
