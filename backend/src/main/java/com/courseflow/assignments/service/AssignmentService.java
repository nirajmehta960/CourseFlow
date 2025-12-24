package com.courseflow.assignments.service;

import com.courseflow.assignments.dto.AssignmentRequest;
import com.courseflow.assignments.dto.AssignmentResponse;
import com.courseflow.assignments.dto.GradeSubmissionRequest;
import com.courseflow.assignments.dto.SubmissionRequest;
import com.courseflow.assignments.dto.SubmissionResponse;
import com.courseflow.assignments.model.Assignment;
import com.courseflow.assignments.model.Submission;
import com.courseflow.assignments.repository.AssignmentRepository;
import com.courseflow.assignments.repository.SubmissionRepository;
import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.courses.repository.CourseRepository;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.grades.service.GradebookService;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling assignment operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentService {
    
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;
    private final AuthService authService;
    private final GradebookService gradebookService;
    
    /**
     * Get all assignments for a course.
     * 
     * @param courseId Course ID
     * @return List of assignment responses
     */
    public List<AssignmentResponse> getAssignments(String courseId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Get assignments for the course
        List<Assignment> assignments = assignmentRepository.findByCourseIdOrderByDueDateAsc(courseId);
        
        return assignments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Create an assignment. Only instructors/admins can create assignments.
     * 
     * @param courseId Course ID
     * @param request Assignment creation request
     * @return Created assignment response
     */
    public AssignmentResponse createAssignment(String courseId, AssignmentRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can create assignments", 403);
        }
        
        // Create assignment
        Assignment assignment = Assignment.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .points(request.getPoints())
                .published(request.getPublished() != null ? request.getPublished() : false)
                .createdBy(currentUser.getId())
                .build();
        
        assignment = assignmentRepository.save(assignment);
        log.info("Assignment created: {} by user {} in course {}", 
                assignment.getId(), currentUser.getId(), courseId);
        
        return mapToResponse(assignment);
    }
    
    /**
     * Get assignment by ID. Verifies user is enrolled in the course.
     * 
     * @param courseId Course ID
     * @param assignmentId Assignment ID
     * @return Assignment response
     */
    public AssignmentResponse getAssignment(String courseId, String assignmentId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Verify assignment exists and belongs to course
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));
        
        if (!assignment.getCourseId().equals(courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found in this course", 404);
        }
        
        return mapToResponse(assignment);
    }
    
    /**
     * Update an assignment. Only instructors/admins can update assignments.
     * 
     * @param courseId Course ID
     * @param assignmentId Assignment ID
     * @param request Assignment update request
     * @return Updated assignment response
     */
    public AssignmentResponse updateAssignment(String courseId, String assignmentId, AssignmentRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can update assignments", 403);
        }
        
        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));
        
        // Verify assignment belongs to course
        if (!assignment.getCourseId().equals(courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found in this course", 404);
        }
        
        // Update assignment fields
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(request.getDueDate());
        assignment.setPoints(request.getPoints());
        if (request.getPublished() != null) {
            assignment.setPublished(request.getPublished());
        }
        
        assignment = assignmentRepository.save(assignment);
        log.info("Assignment updated: {} by user {} in course {}", 
                assignmentId, currentUser.getId(), courseId);
        
        return mapToResponse(assignment);
    }
    
    /**
     * Delete an assignment. Only instructors/admins can delete assignments.
     * 
     * @param courseId Course ID
     * @param assignmentId Assignment ID
     */
    public void deleteAssignment(String courseId, String assignmentId) {
        User currentUser = authService.getCurrentUser();
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can delete assignments", 403);
        }
        
        // Verify assignment exists and belongs to course
        if (!assignmentRepository.existsByIdAndCourseId(assignmentId, courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404);
        }
        
        // Delete assignment (this will cascade delete submissions if configured)
        assignmentRepository.deleteById(assignmentId);
        log.info("Assignment deleted: {} by user {} in course {}", 
                assignmentId, currentUser.getId(), courseId);
    }
    
    /**
     * Submit an assignment. Students can submit their work.
     * 
     * @param courseId Course ID
     * @param assignmentId Assignment ID
     * @param request Submission request
     * @return Submission response
     */
    public SubmissionResponse submitAssignment(String courseId, String assignmentId, SubmissionRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment (student must be enrolled)
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Verify assignment exists and belongs to course
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));
        
        if (!assignment.getCourseId().equals(courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found in this course", 404);
        }
        
        // Check if submission already exists
        if (submissionRepository.existsByAssignmentIdAndStudentId(assignmentId, currentUser.getId())) {
            throw new ApiException("SUBMISSION_ALREADY_EXISTS", 
                    "You have already submitted this assignment", 409);
        }
        
        try {
            // Create submission
            Submission submission = Submission.builder()
                    .courseId(courseId)
                    .assignmentId(assignmentId)
                    .studentId(currentUser.getId())
                    .textAnswer(request.getTextAnswer())
                    .attachments(request.getAttachments() != null ? 
                            new java.util.ArrayList<>(request.getAttachments()) : new java.util.ArrayList<>())
                    .build();
            
            submission = submissionRepository.save(submission);
            log.info("Assignment submitted: assignment {} by student {} in course {}", 
                    assignmentId, currentUser.getId(), courseId);
            
            // Update gradebook on submission
            gradebookService.updateGradebookOnSubmission(courseId, currentUser.getId(), assignmentId, "SUBMITTED");
            
            return mapToSubmissionResponse(submission);
        } catch (DuplicateKeyException e) {
            throw new ApiException("SUBMISSION_ALREADY_EXISTS", 
                    "You have already submitted this assignment", 409);
        }
    }
    
    /**
     * Get all submissions for an assignment. Only instructors can view all submissions.
     * 
     * @param courseId Course ID
     * @param assignmentId Assignment ID
     * @return List of submission responses
     */
    public List<SubmissionResponse> getSubmissions(String courseId, String assignmentId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can view all submissions", 403);
        }
        
        // Verify assignment exists and belongs to course
        if (!assignmentRepository.existsByIdAndCourseId(assignmentId, courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404);
        }
        
        // Get all submissions for the assignment
        List<Submission> submissions = submissionRepository.findByAssignmentIdOrderBySubmittedAtDesc(assignmentId);
        
        return submissions.stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Grade a submission. Only instructors/admins can grade submissions.
     * 
     * @param courseId Course ID
     * @param assignmentId Assignment ID
     * @param submissionId Submission ID
     * @param request Grade request
     * @return Graded submission response
     */
    public SubmissionResponse gradeSubmission(String courseId, String assignmentId, String submissionId, 
                                             GradeSubmissionRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can grade submissions", 403);
        }
        
        // Verify assignment exists and belongs to course
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));
        
        if (!assignment.getCourseId().equals(courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found in this course", 404);
        }
        
        // Verify submission exists and belongs to assignment
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ApiException("SUBMISSION_NOT_FOUND", "Submission not found", 404));
        
        if (!submission.getAssignmentId().equals(assignmentId)) {
            throw new ApiException("SUBMISSION_NOT_FOUND", "Submission not found for this assignment", 404);
        }
        
        // Validate score doesn't exceed assignment points
        if (request.getScore() > assignment.getPoints()) {
            throw new ApiException("INVALID_SCORE", 
                    "Score cannot exceed assignment points (" + assignment.getPoints() + ")", 400);
        }
        
        // Grade the submission
        Submission.Grade grade = Submission.Grade.builder()
                .score(request.getScore())
                .feedback(request.getFeedback())
                .gradedBy(currentUser.getId())
                .gradedAt(Instant.now())
                .build();
        
        submission.setGrade(grade);
        submission = submissionRepository.save(submission);
        
        log.info("Submission graded: submission {} for assignment {} by user {} in course {}", 
                submissionId, assignmentId, currentUser.getId(), courseId);
        
        // Update gradebook on grade
        gradebookService.updateGradebookOnGrade(courseId, submission.getStudentId(), assignmentId, 
                request.getScore(), assignment.getPoints());
        
        return mapToSubmissionResponse(submission);
    }
    
    /**
     * Map Assignment entity to AssignmentResponse DTO.
     */
    private AssignmentResponse mapToResponse(Assignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .courseId(assignment.getCourseId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .dueDate(assignment.getDueDate())
                .points(assignment.getPoints())
                .published(assignment.getPublished())
                .createdBy(assignment.getCreatedBy())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .build();
    }
    
    /**
     * Map Submission entity to SubmissionResponse DTO.
     */
    private SubmissionResponse mapToSubmissionResponse(Submission submission) {
        SubmissionResponse.GradeInfo gradeInfo = null;
        if (submission.getGrade() != null) {
            gradeInfo = SubmissionResponse.GradeInfo.builder()
                    .score(submission.getGrade().getScore())
                    .feedback(submission.getGrade().getFeedback())
                    .gradedBy(submission.getGrade().getGradedBy())
                    .gradedAt(submission.getGrade().getGradedAt())
                    .build();
        }
        
        return SubmissionResponse.builder()
                .id(submission.getId())
                .courseId(submission.getCourseId())
                .assignmentId(submission.getAssignmentId())
                .studentId(submission.getStudentId())
                .textAnswer(submission.getTextAnswer())
                .attachments(submission.getAttachments() != null ? 
                        new java.util.ArrayList<>(submission.getAttachments()) : new java.util.ArrayList<>())
                .submittedAt(submission.getSubmittedAt())
                .grade(gradeInfo)
                .build();
    }
}

