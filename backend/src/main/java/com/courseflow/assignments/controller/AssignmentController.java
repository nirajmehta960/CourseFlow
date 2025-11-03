package com.courseflow.assignments.controller;

import com.courseflow.assignments.dto.AssignmentRequest;
import com.courseflow.assignments.dto.AssignmentResponse;
import com.courseflow.assignments.dto.GradeSubmissionRequest;
import com.courseflow.assignments.dto.SubmissionRequest;
import com.courseflow.assignments.dto.SubmissionResponse;
import com.courseflow.assignments.service.AssignmentService;
import com.courseflow.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for assignment endpoints.
 */
@RestController
@RequestMapping("/courses/{courseId}/assignments")
@RequiredArgsConstructor
@Tag(name = "Assignments", description = "Assignment management endpoints")
public class AssignmentController {
    
    private final AssignmentService assignmentService;
    
    @GetMapping
    @Operation(summary = "Get assignments", description = "Get all assignments for a course. User must be enrolled in the course.")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAssignments(
            @PathVariable String courseId) {
        List<AssignmentResponse> assignments = assignmentService.getAssignments(courseId);
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }
    
    @PostMapping
    @Operation(summary = "Create assignment", description = "Create a new assignment. Only instructors and admins can create assignments.")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @PathVariable String courseId,
            @Valid @RequestBody AssignmentRequest request) {
        AssignmentResponse assignment = assignmentService.createAssignment(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(assignment, "Assignment created successfully"));
    }
    
    @GetMapping("/{assignmentId}")
    @Operation(summary = "Get assignment by ID", description = "Get assignment details. User must be enrolled in the course.")
    public ResponseEntity<ApiResponse<AssignmentResponse>> getAssignment(
            @PathVariable String courseId,
            @PathVariable String assignmentId) {
        AssignmentResponse assignment = assignmentService.getAssignment(courseId, assignmentId);
        return ResponseEntity.ok(ApiResponse.success(assignment));
    }
    
    @PatchMapping("/{assignmentId}")
    @Operation(summary = "Update assignment", description = "Update assignment details. Only instructors and admins can update assignments.")
    public ResponseEntity<ApiResponse<AssignmentResponse>> updateAssignment(
            @PathVariable String courseId,
            @PathVariable String assignmentId,
            @Valid @RequestBody AssignmentRequest request) {
        AssignmentResponse assignment = assignmentService.updateAssignment(courseId, assignmentId, request);
        return ResponseEntity.ok(ApiResponse.success(assignment, "Assignment updated successfully"));
    }
    
    @DeleteMapping("/{assignmentId}")
    @Operation(summary = "Delete assignment", description = "Delete an assignment. Only instructors and admins can delete assignments.")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(
            @PathVariable String courseId,
            @PathVariable String assignmentId) {
        assignmentService.deleteAssignment(courseId, assignmentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Assignment deleted successfully"));
    }
    
    @PostMapping("/{assignmentId}/submit")
    @Operation(summary = "Submit assignment", description = "Submit an assignment. Students can submit their work.")
    public ResponseEntity<ApiResponse<SubmissionResponse>> submitAssignment(
            @PathVariable String courseId,
            @PathVariable String assignmentId,
            @Valid @RequestBody SubmissionRequest request) {
        SubmissionResponse submission = assignmentService.submitAssignment(courseId, assignmentId, request);
        return ResponseEntity.ok(ApiResponse.success(submission, "Assignment submitted successfully"));
    }
    
    @GetMapping("/{assignmentId}/submissions")
    @Operation(summary = "Get submissions", description = "Get all submissions for an assignment. Only instructors and admins can view all submissions.")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getSubmissions(
            @PathVariable String courseId,
            @PathVariable String assignmentId) {
        List<SubmissionResponse> submissions = assignmentService.getSubmissions(courseId, assignmentId);
        return ResponseEntity.ok(ApiResponse.success(submissions));
    }
    
    @PatchMapping("/{assignmentId}/submissions/{submissionId}/grade")
    @Operation(summary = "Grade submission", description = "Grade a submission. Only instructors and admins can grade submissions.")
    public ResponseEntity<ApiResponse<SubmissionResponse>> gradeSubmission(
            @PathVariable String courseId,
            @PathVariable String assignmentId,
            @PathVariable String submissionId,
            @Valid @RequestBody GradeSubmissionRequest request) {
        SubmissionResponse submission = assignmentService.gradeSubmission(courseId, assignmentId, submissionId, request);
        return ResponseEntity.ok(ApiResponse.success(submission, "Submission graded successfully"));
    }
}

